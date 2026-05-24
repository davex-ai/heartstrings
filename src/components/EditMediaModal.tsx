import { useState, FormEvent } from 'react';
import { X } from 'lucide-react';
import { updateMedia } from '../lib/supabase';
import type { Album, MediaItem } from '../types';

interface EditMediaModalProps {
  item: MediaItem;
  albums: Album[];
  onClose: () => void;
  onUpdated: (id: string, patch: Partial<MediaItem>) => void;
}

export default function EditMediaModal({ item, albums, onClose, onUpdated }: EditMediaModalProps) {
  const [title, setTitle] = useState(item.title);
  const [caption, setCaption] = useState(item.caption ?? '');
  const [takenAt, setTakenAt] = useState(item.taken_at.split('T')[0]);
  const [albumId, setAlbumId] = useState(item.album_id ?? '');
  const [tags, setTags] = useState((item.tags ?? []).join(', '));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const patch = {
        title: title.trim(),
        caption: caption.trim() || undefined,
        taken_at: takenAt,
        album_id: albumId || undefined,
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      };
      await updateMedia(item.id, patch);
      onUpdated(item.id, patch);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal edit-media-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit Memory</h2>
          <button className="modal-close" onClick={onClose}><X size={16} strokeWidth={1.5} /></button>
        </div>
        <form onSubmit={handleSubmit} className="edit-media-form">
          <div className="field">
            <label htmlFor="em-title">Title</label>
            <input id="em-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor="em-caption">Caption <span className="optional">(optional)</span></label>
            <textarea id="em-caption" rows={3} value={caption} onChange={(e) => setCaption(e.target.value)}
              placeholder="What's the story here?" />
          </div>
          <div className="field-row">
            <div className="field">
              <label htmlFor="em-date">Date</label>
              <input id="em-date" type="date" value={takenAt} onChange={(e) => setTakenAt(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="em-album">Album</label>
              <select id="em-album" value={albumId} onChange={(e) => setAlbumId(e.target.value)}>
                <option value="">— None —</option>
                {albums.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
          </div>
          <div className="field">
            <label htmlFor="em-tags">Tags <span className="optional">(comma-separated)</span></label>
            <input id="em-tags" value={tags} onChange={(e) => setTags(e.target.value)}
              placeholder="family, vacation, christmas…" />
          </div>
          {error && <p className="error-msg">{error}</p>}
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving || !title.trim()}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
