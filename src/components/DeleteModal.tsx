import { useState, useMemo } from 'react';
import { X, Trash2, Image, Film, Music, FolderOpen, ChevronRight, ChevronLeft } from 'lucide-react';
import { deleteManyMedia, deleteManyAlbums } from '../lib/supabase';
import type { Album, MediaItem } from '../types';

type DeleteTarget = 'choose' | 'albums' | 'files';

interface DeleteModalProps {
  items: MediaItem[];
  albums: Album[];
  onClose: () => void;
  onItemsDeleted: (ids: string[]) => void;
  onAlbumsDeleted: (ids: string[]) => void;
}

function MediaTypeIcon({ type }: { type: MediaItem['media_type'] }) {
  if (type === 'video') return <Film size={14} strokeWidth={1.5} />;
  if (type === 'audio') return <Music size={14} strokeWidth={1.5} />;
  return <Image size={14} strokeWidth={1.5} />;
}

export default function DeleteModal({ items, albums, onClose, onItemsDeleted, onAlbumsDeleted }: DeleteModalProps) {
  const [step, setStep] = useState<DeleteTarget>('choose');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [mediaFilter, setMediaFilter] = useState<'all' | 'image' | 'video' | 'audio'>('all');

  const filteredItems = useMemo(() => {
    if (mediaFilter === 'all') return items;
    return items.filter((i) => i.media_type === mediaFilter);
  }, [items, mediaFilter]);

  function toggle(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAll(list: { id: string }[]) {
    const allSelected = list.every((i) => selectedIds.has(i.id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) list.forEach((i) => next.delete(i.id));
      else list.forEach((i) => next.add(i.id));
      return next;
    });
  }

  async function confirmDelete() {
    if (selectedIds.size === 0) return;
    setDeleting(true);
    setError('');
    try {
      const ids = Array.from(selectedIds);
      if (step === 'files') {
        await deleteManyMedia(ids, items);
        onItemsDeleted(ids);
      } else {
        await deleteManyAlbums(ids);
        onAlbumsDeleted(ids);
      }
      onClose();
    } catch (e: any) {
      setError(e.message);
      setDeleting(false);
    }
  }

  const n = selectedIds.size;

  // ── Step: choose ────────────────────────────────────────────────
  if (step === 'choose') {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal delete-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Delete</h2>
            <button className="modal-close" onClick={onClose}><X size={16} strokeWidth={1.5} /></button>
          </div>
          <div className="delete-choose">
            <p className="delete-choose-label">What do you want to delete?</p>
            <button className="delete-choice-btn" onClick={() => { setStep('files'); setSelectedIds(new Set()); }}>
              <div className="delete-choice-icon"><Image size={22} strokeWidth={1.5} /></div>
              <div className="delete-choice-text">
                <span>Files</span>
                <small>Photos, videos, or audio ({items.length} total)</small>
              </div>
              <ChevronRight size={18} strokeWidth={1.5} className="delete-choice-arrow" />
            </button>
            <button className="delete-choice-btn" onClick={() => { setStep('albums'); setSelectedIds(new Set()); }}>
              <div className="delete-choice-icon"><FolderOpen size={22} strokeWidth={1.5} /></div>
              <div className="delete-choice-text">
                <span>Albums</span>
                <small>Groups & collections ({albums.length} total)</small>
              </div>
              <ChevronRight size={18} strokeWidth={1.5} className="delete-choice-arrow" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Step: select files ──────────────────────────────────────────
  if (step === 'files') {
    const allSelected = filteredItems.length > 0 && filteredItems.every((i) => selectedIds.has(i.id));
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal delete-modal delete-modal-wide" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <button className="back-btn-sm" onClick={() => { setStep('choose'); setSelectedIds(new Set()); }}>
              <ChevronLeft size={15} strokeWidth={1.5} /> Back
            </button>
            <h2>Select Files to Delete</h2>
            <button className="modal-close" onClick={onClose}><X size={16} strokeWidth={1.5} /></button>
          </div>

          {/* Filter tabs */}
          <div className="delete-filter-tabs">
            {(['all', 'image', 'video', 'audio'] as const).map((f) => (
              <button key={f} className={`filter-tab ${mediaFilter === f ? 'active' : ''}`}
                onClick={() => setMediaFilter(f)}>
                {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1) + 's'}
              </button>
            ))}
            <label className="select-all-check">
              <input type="checkbox" checked={allSelected}
                onChange={() => toggleAll(filteredItems)} />
              Select all
            </label>
          </div>

          <div className="delete-file-list">
            {filteredItems.length === 0 && (
              <p className="delete-empty">No files of this type</p>
            )}
            {filteredItems.map((item) => (
              <label key={item.id} className={`delete-file-row ${selectedIds.has(item.id) ? 'selected' : ''}`}>
                <input type="checkbox" checked={selectedIds.has(item.id)} onChange={() => toggle(item.id)} />
                <div className="delete-file-thumb">
                  {item.media_type === 'image'
                    ? <img src={item.thumbnail_url ?? item.cloudinary_url} alt={item.title} />
                    : item.media_type === 'video'
                      ? <div className="delete-thumb-icon"><Film size={20} strokeWidth={1.5} /></div>
                      : <div className="delete-thumb-icon"><Music size={20} strokeWidth={1.5} /></div>}
                </div>
                <div className="delete-file-info">
                  <span className="delete-file-title">{item.title}</span>
                  <span className="delete-file-meta">
                    <MediaTypeIcon type={item.media_type} />
                    {new Date(item.taken_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              </label>
            ))}
          </div>

          {error && <p className="error-msg" style={{ margin: '0 24px' }}>{error}</p>}

          <div className="modal-footer">
            <button className="btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn-danger" onClick={confirmDelete}
              disabled={deleting || n === 0}>
              <Trash2 size={15} strokeWidth={1.5} />
              {deleting ? 'Deleting…' : `Delete ${n > 0 ? n : ''} file${n !== 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Step: select albums ─────────────────────────────────────────
  const allAlbumsSelected = albums.length > 0 && albums.every((a) => selectedIds.has(a.id));
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal delete-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <button className="back-btn-sm" onClick={() => { setStep('choose'); setSelectedIds(new Set()); }}>
            <ChevronLeft size={15} strokeWidth={1.5} /> Back
          </button>
          <h2>Select Albums to Delete</h2>
          <button className="modal-close" onClick={onClose}><X size={16} strokeWidth={1.5} /></button>
        </div>

        <div className="delete-filter-tabs">
          <label className="select-all-check">
            <input type="checkbox" checked={allAlbumsSelected}
              onChange={() => toggleAll(albums)} />
            Select all
          </label>
        </div>

        <div className="delete-file-list">
          {albums.length === 0 && <p className="delete-empty">No albums yet</p>}
          {albums.map((album) => {
            const count = items.filter((i) => i.album_id === album.id).length;
            const cover = items.find((i) => i.album_id === album.id && i.media_type === 'image');
            return (
              <label key={album.id} className={`delete-file-row ${selectedIds.has(album.id) ? 'selected' : ''}`}>
                <input type="checkbox" checked={selectedIds.has(album.id)} onChange={() => toggle(album.id)} />
                <div className="delete-file-thumb">
                  {cover
                    ? <img src={cover.thumbnail_url ?? cover.cloudinary_url} alt={album.name} />
                    : <div className="delete-thumb-icon"><FolderOpen size={20} strokeWidth={1.5} /></div>}
                </div>
                <div className="delete-file-info">
                  <span className="delete-file-title">{album.name}</span>
                  <span className="delete-file-meta">
                    <FolderOpen size={12} strokeWidth={1.5} />
                    {count} item{count !== 1 ? 's' : ''} · media will be kept, just unlinked
                  </span>
                </div>
              </label>
            );
          })}
        </div>

        {error && <p className="error-msg" style={{ margin: '0 24px' }}>{error}</p>}

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-danger" onClick={confirmDelete}
            disabled={deleting || n === 0}>
            <Trash2 size={15} strokeWidth={1.5} />
            {deleting ? 'Deleting…' : `Delete ${n > 0 ? n : ''} album${n !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
}
