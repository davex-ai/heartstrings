import { useState } from 'react';
import { X, Trash2, FolderOpen, Image, CheckCircle, AlertCircle } from 'lucide-react';
import { deleteMedia, deleteAlbum } from '../lib/supabase';
import type { Album, MediaItem } from '../types';

type DeleteTarget = 'choose' | 'albums' | 'media';

interface DeleteModalProps {
  albums: Album[];
  media: MediaItem[];
  onClose: () => void;
  onAlbumDeleted: (id: string) => void;
  onMediaDeleted: (id: string) => void;
}

export default function DeleteModal({ albums, media, onClose, onAlbumDeleted, onMediaDeleted }: DeleteModalProps) {
  const [step, setStep] = useState<DeleteTarget>('choose');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirming, setConfirming] = useState(false);
  const [progress, setProgress] = useState<Record<string, 'pending' | 'done' | 'error'>>({});
  const [working, setWorking] = useState(false);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAll(ids: string[]) {
    if (ids.every((id) => selected.has(id))) {
      setSelected(new Set());
    } else {
      setSelected(new Set(ids));
    }
  }

  async function handleDelete() {
    setWorking(true);
    const ids = Array.from(selected);

    if (step === 'albums') {
      for (const id of ids) {
        try {
          await deleteAlbum(id);
          setProgress((p) => ({ ...p, [id]: 'done' }));
          onAlbumDeleted(id);
        } catch {
          setProgress((p) => ({ ...p, [id]: 'error' }));
        }
      }
    } else {
      const mediaMap = new Map(media.map((m) => [m.id, m]));
      for (const id of ids) {
        const item = mediaMap.get(id);
        if (!item) continue;
        try {
          await deleteMedia(id, item.cloudinary_public_id, item.media_type);
          setProgress((p) => ({ ...p, [id]: 'done' }));
          onMediaDeleted(id);
        } catch {
          setProgress((p) => ({ ...p, [id]: 'error' }));
        }
      }
    }

    setWorking(false);
    // Auto-close if everything succeeded
    const allDone = ids.every((id) => progress[id] === 'done' || progress[id] === 'error');
    if (allDone) setTimeout(onClose, 600);
  }

//   const isDone = Object.keys(progress).length > 0;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal delete-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Delete</h2>
          <button className="modal-close" onClick={onClose}><X size={16} strokeWidth={1.5} /></button>
        </div>

        {/* Step 1 — choose type */}
        {step === 'choose' && (
          <div className="delete-choose">
            <p className="delete-hint">What do you want to delete?</p>
            <div className="delete-options">
              <button className="delete-option-btn" onClick={() => setStep('albums')}>
                <FolderOpen size={28} strokeWidth={1} />
                <span>Albums</span>
                <small>{albums.length} album{albums.length !== 1 ? 's' : ''}</small>
              </button>
              <button className="delete-option-btn" onClick={() => setStep('media')}>
                <Image size={28} strokeWidth={1} />
                <span>Photos, Videos & Audio</span>
                <small>{media.length} item{media.length !== 1 ? 's' : ''}</small>
              </button>
            </div>
          </div>
        )}

        {/* Step 2 — pick albums */}
        {step === 'albums' && (
          <div className="delete-list-wrap">
            <div className="delete-list-header">
              <button className="back-btn" onClick={() => { setStep('choose'); setSelected(new Set()); }}>← Back</button>
              <span className="delete-hint">{selected.size} selected</span>
              <button className="select-all-btn" onClick={() => toggleAll(albums.map((a) => a.id))}>
                {albums.every((a) => selected.has(a.id)) ? 'Deselect all' : 'Select all'}
              </button>
            </div>
            <div className="delete-list">
              {albums.map((album) => {
                const state = progress[album.id];
                return (
                  <label key={album.id} className={`delete-list-item ${selected.has(album.id) ? 'selected' : ''} ${state ? `state-${state}` : ''}`}>
                    {state === 'done' ? <CheckCircle size={16} strokeWidth={1.5} className="state-icon done" /> :
                     state === 'error' ? <AlertCircle size={16} strokeWidth={1.5} className="state-icon error" /> :
                     <input type="checkbox" checked={selected.has(album.id)} onChange={() => toggle(album.id)} disabled={working} />}
                    <div className="delete-item-info">
                      <span>{album.name}</span>
                      {album.description && <small>{album.description}</small>}
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 2 — pick media */}
        {step === 'media' && (
          <div className="delete-list-wrap">
            <div className="delete-list-header">
              <button className="back-btn" onClick={() => { setStep('choose'); setSelected(new Set()); }}>← Back</button>
              <span className="delete-hint">{selected.size} selected</span>
              <button className="select-all-btn" onClick={() => toggleAll(media.map((m) => m.id))}>
                {media.every((m) => selected.has(m.id)) ? 'Deselect all' : 'Select all'}
              </button>
            </div>
            <div className="delete-list delete-media-list">
              {media.map((item) => {
                const state = progress[item.id];
                const thumb = item.thumbnail_url ?? (item.media_type === 'image' ? item.cloudinary_url : '');
                return (
                  <label key={item.id} className={`delete-list-item delete-media-item ${selected.has(item.id) ? 'selected' : ''} ${state ? `state-${state}` : ''}`}>
                    {state === 'done' ? <CheckCircle size={16} strokeWidth={1.5} className="state-icon done" /> :
                     state === 'error' ? <AlertCircle size={16} strokeWidth={1.5} className="state-icon error" /> :
                     <input type="checkbox" checked={selected.has(item.id)} onChange={() => toggle(item.id)} disabled={working} />}
                    {thumb
                      ? <img src={thumb} alt={item.title} className="delete-media-thumb" />
                      : <div className="delete-media-thumb delete-media-thumb-icon">
                          {item.media_type === 'video' ? '🎬' : '🎵'}
                        </div>}
                    <div className="delete-item-info">
                      <span>{item.title}</span>
                      <small>{new Date(item.taken_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</small>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        {step !== 'choose' && (
          <div className="modal-footer">
            {!confirming ? (
              <>
                <button className="btn-secondary" onClick={onClose} disabled={working}>Cancel</button>
                <button className="btn-danger-outline" onClick={() => setConfirming(true)}
                  disabled={selected.size === 0 || working}>
                  <Trash2 size={14} strokeWidth={1.5} />
                  Delete {selected.size > 0 ? `${selected.size} item${selected.size !== 1 ? 's' : ''}` : '…'}
                </button>
              </>
            ) : (
              <div className="inline-confirm" style={{ width: '100%', justifyContent: 'flex-end' }}>
                <span>This cannot be undone.</span>
                <button className="btn-danger-sm" onClick={handleDelete} disabled={working}>
                  {working ? 'Deleting…' : 'Confirm Delete'}
                </button>
                <button className="btn-ghost-sm" onClick={() => setConfirming(false)} disabled={working}>Cancel</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}