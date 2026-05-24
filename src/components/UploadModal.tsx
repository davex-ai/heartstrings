import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { uploadToCloudinary, getMediaType } from '../lib/cloudinary';
import { insertMedia } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { Album, MediaItem, UploadFile } from '../types';

interface UploadModalProps {
  albums: Album[];
  onClose: () => void;
  onItemUploaded: (item: MediaItem) => void; // called per item as it completes
}

const ACCEPTED = 'image/*,video/*,audio/*';

export default function UploadModal({ albums, onClose, onItemUploaded }: UploadModalProps) {
  const { user } = useAuth();
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [globalAlbum, setGlobalAlbum] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  function addFiles(raw: FileList | null) {
    if (!raw) return;
    const today = new Date().toISOString().split('T')[0];
    const newFiles: UploadFile[] = Array.from(raw).map((file) => ({
      file,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : '',
      title: file.name.replace(/\.[^.]+$/, ''),
      caption: '',
      taken_at: today,
      album_id: globalAlbum,
      tags: '',
      progress: 0,
      status: 'pending',
    }));
    setFiles((prev) => [...prev, ...newFiles]);
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  }

  function removeFile(idx: number) {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateFile(idx: number, patch: Partial<UploadFile>) {
    setFiles((prev) => prev.map((f, i) => (i === idx ? { ...f, ...patch } : f)));
  }

  // Apply global album to all pending files when it changes
  function handleGlobalAlbumChange(albumId: string) {
    setGlobalAlbum(albumId);
    setFiles((prev) =>
      prev.map((f) => (f.status === 'pending' ? { ...f, album_id: albumId } : f))
    );
  }

  async function startUpload() {
    if (!user || files.length === 0) return;
    setUploading(true);

    await Promise.allSettled(
      files.map(async (uf, idx) => {
        if (uf.status !== 'pending') return;
        try {
          updateFile(idx, { status: 'uploading' });
          const result = await uploadToCloudinary(uf.file, (pct) =>
            updateFile(idx, { progress: pct })
          );
          const inserted = await insertMedia({
            title: uf.title || uf.file.name,
            caption: uf.caption || undefined,
            media_type: getMediaType(uf.file),
            cloudinary_url: result.secure_url,
            cloudinary_public_id: result.public_id,
            thumbnail_url: result.thumbnail_url,
            taken_at: uf.taken_at,
            album_id: uf.album_id || undefined,
            uploaded_by: user.id,
            duration: result.duration,
            tags: uf.tags.split(',').map((t) => t.trim()).filter(Boolean),
          });
          updateFile(idx, { status: 'done', progress: 100 });
          // Push to gallery immediately — no reload needed
          onItemUploaded(inserted);
        } catch (e: any) {
          updateFile(idx, { status: 'error', error: e.message });
        }
      })
    );

    setUploading(false);
  }

  const pendingCount = files.filter((f) => f.status === 'pending').length;
  const doneCount = files.filter((f) => f.status === 'done').length;
  const allDone = files.length > 0 && files.every((f) => f.status === 'done' || f.status === 'error');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal upload-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Upload Memories</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Global album selector */}
        <div className="upload-global-album">
          <label>Add all to album</label>
          <select value={globalAlbum} onChange={(e) => handleGlobalAlbumChange(e.target.value)}>
            <option value="">— No album —</option>
            {albums.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>

        {/* Drop zone */}
        <div
          className={`drop-zone ${dragging ? 'dragging' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
        >
          <input ref={inputRef} type="file" multiple accept={ACCEPTED}
            onChange={(e: ChangeEvent<HTMLInputElement>) => addFiles(e.target.files)}
            style={{ display: 'none' }} />
          <span className="drop-icon">📁</span>
          <p>Drag & drop photos, videos, or audio here</p>
          <p className="drop-sub">or click to browse · bulk upload supported</p>
        </div>

        {/* File list */}
        {files.length > 0 && (
          <div className="upload-list">
            {files.map((uf, idx) => (
              <div key={idx} className={`upload-item status-${uf.status}`}>
                <div className="upload-item-thumb">
                  {uf.preview
                    ? <img src={uf.preview} alt="" />
                    : <span>{uf.file.type.startsWith('video/') ? '🎬' : '🎵'}</span>}
                </div>
                <div className="upload-item-fields">
                  <input
                    value={uf.title}
                    onChange={(e) => updateFile(idx, { title: e.target.value })}
                    placeholder="Title"
                    disabled={uf.status !== 'pending'}
                  />
                  <input
                    value={uf.caption}
                    onChange={(e) => updateFile(idx, { caption: e.target.value })}
                    placeholder="Caption (optional)"
                    disabled={uf.status !== 'pending'}
                  />
                  <div className="upload-item-row">
                    <input
                      type="date"
                      value={uf.taken_at}
                      onChange={(e) => updateFile(idx, { taken_at: e.target.value })}
                      disabled={uf.status !== 'pending'}
                    />
                    <select
                      value={uf.album_id}
                      onChange={(e) => updateFile(idx, { album_id: e.target.value })}
                      disabled={uf.status !== 'pending'}
                    >
                      <option value="">No album</option>
                      {albums.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                  </div>
                  <input
                    value={uf.tags}
                    onChange={(e) => updateFile(idx, { tags: e.target.value })}
                    placeholder="Tags: family, vacation, birthday…"
                    disabled={uf.status !== 'pending'}
                  />
                </div>
                <div className="upload-item-status">
                  {uf.status === 'uploading' && (
                    <div className="progress-wrap">
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${uf.progress}%` }} />
                      </div>
                      <span className="progress-pct">{uf.progress}%</span>
                    </div>
                  )}
                  {uf.status === 'done' && <span className="status-icon done">✓</span>}
                  {uf.status === 'error' && (
                    <span className="status-icon error" title={uf.error}>✗</span>
                  )}
                  {uf.status === 'pending' && (
                    <button className="remove-btn" onClick={() => removeFile(idx)}>✕</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="modal-footer">
          {allDone ? (
            <button className="btn-primary" onClick={onClose}>
              Done — {doneCount} uploaded ✓
            </button>
          ) : (
            <>
              <button className="btn-secondary" onClick={onClose} disabled={uploading}>
                {uploading ? 'Uploading…' : 'Cancel'}
              </button>
              <button
                className="btn-primary"
                onClick={startUpload}
                disabled={uploading || pendingCount === 0}
              >
                {uploading
                  ? `Uploading ${doneCount}/${files.length}…`
                  : `Upload ${pendingCount} file${pendingCount !== 1 ? 's' : ''}`}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
