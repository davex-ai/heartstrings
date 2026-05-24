import { useState, FormEvent } from 'react';
import { X } from 'lucide-react';
import { createAlbum, updateAlbum } from '../lib/supabase';
import type { Album } from '../types';

interface AlbumModalProps {
  album?: Album; // undefined = create mode
  onClose: () => void;
  onCreated: (album: Album) => void;
  onUpdated: (id: string, patch: Partial<Album>) => void;
}

export default function AlbumModal({ album, onClose, onCreated, onUpdated }: AlbumModalProps) {
  const isEdit = !!album;
  const [name, setName] = useState(album?.name ?? '');
  const [description, setDescription] = useState(album?.description ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError('');
    try {
      if (isEdit) {
        const patch = { name: name.trim(), description: description.trim() || undefined };
        await updateAlbum(album.id, patch);
        onUpdated(album.id, patch);
      } else {
        const created = await createAlbum(name.trim(), description.trim() || undefined);
        onCreated(created);
      }
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  // async function handleDelete() {
  //   if (!album) return;
  //   setDeleting(true);
  //   try {
  //     await deleteAlbum(album.id);
  //     onDeleted(album.id);
  //     onClose();
  //   } catch (err: any) {
  //     setError(err.message);
  //     setDeleting(false);
  //     setConfirmDelete(false);
  //   }
  // }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal album-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEdit ? 'Edit Album' : 'New Album'}</h2>
          <button className="modal-close" onClick={onClose}><X size={16} strokeWidth={1.5} /></button>
        </div>

        <form onSubmit={handleSubmit} className="album-form">
          <div className="field">
            <label htmlFor="alb-name">Name</label>
            <input
              id="alb-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Christmas 2024, Baby's First Year, The Lagos Trip…"
              autoFocus
              required
            />
          </div>
          <div className="field">
            <label htmlFor="alb-desc">Description <span className="optional">(optional)</span></label>
            <textarea
              id="alb-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A short note about this album…"
            />
          </div>

          {error && <p className="error-msg">{error}</p>}

          <div className="modal-footer">
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
              <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={saving || !name.trim()}>
                {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Album'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
