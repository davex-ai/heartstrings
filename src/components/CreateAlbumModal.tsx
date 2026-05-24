import { useState, FormEvent } from 'react';
import { createAlbum } from '../lib/supabase';
import type { Album } from '../types';

interface CreateAlbumModalProps {
  onClose: () => void;
  onCreated: (album: Album) => void;
}

const EMOJI_OPTIONS = ['📁','🌟','🏖️','🎄','🎂','❤️','🏔️','🎓','💒','👶','🌸','✈️','🏠','🎵','⚽','🍽️'];

export default function CreateAlbumModal({ onClose, onCreated }: CreateAlbumModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [emoji, setEmoji] = useState('📁');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError('');
    try {
      const album = await createAlbum(`${emoji} ${name.trim()}`, description.trim() || undefined);
      onCreated(album);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal create-album-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>New Album</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="create-album-form">
          <div className="emoji-picker">
            <p className="field-label">Icon</p>
            <div className="emoji-grid">
              {EMOJI_OPTIONS.map((e) => (
                <button
                  type="button"
                  key={e}
                  className={`emoji-btn ${emoji === e ? 'selected' : ''}`}
                  onClick={() => setEmoji(e)}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <label htmlFor="album-name">Album Name</label>
            <input
              id="album-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Christmas 2024, Baby's First Year…"
              autoFocus
              required
            />
          </div>

          <div className="field">
            <label htmlFor="album-desc">Description <span className="optional">(optional)</span></label>
            <textarea
              id="album-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A short note about this album…"
              rows={3}
            />
          </div>

          {error && <p className="error-msg">{error}</p>}

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving || !name.trim()}>
              {saving ? 'Creating…' : 'Create Album'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
