import { useEffect, useCallback, useState } from 'react';
import { X, ChevronLeft, ChevronRight, Calendar, Clock, Tag, Pencil, Trash2, Music } from 'lucide-react';
import type { MediaItem, Album } from '../types';
import { formatDuration } from '../lib/cloudinary';
import { deleteMedia } from '../lib/supabase';

interface LightboxProps {
  item: MediaItem;
  albums: Album[];
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  onEdit: (item: MediaItem) => void;
  onDeleted: (id: string) => void;
}

export default function Lightbox({ item, albums, onClose, onPrev, onNext, onEdit, onDeleted }: LightboxProps) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') { if (confirming) setConfirming(false); else onClose(); }
    if (e.key === 'ArrowLeft' && !confirming) onPrev?.();
    if (e.key === 'ArrowRight' && !confirming) onNext?.();
  }, [onClose, onPrev, onNext, confirming]);

  useEffect(() => {
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', handleKey); document.body.style.overflow = ''; };
  }, [handleKey]);

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteMedia(item.id, item.cloudinary_public_id, item.media_type);
      onDeleted(item.id);
      onClose();
    } catch (e: any) {
      alert('Delete failed: ' + e.message);
    } finally {
      setDeleting(false);
      setConfirming(false);
    }
  }

  const albumName = item.album_id ? albums.find((a) => a.id === item.album_id)?.name : null;

  return (
    <div className="lightbox-overlay" onClick={onClose}>
      <div className="lightbox-container" onClick={(e) => e.stopPropagation()}>

        {/* Top bar */}
        <div className="lightbox-topbar">
          <div className="lightbox-topbar-actions">
            <button className="lb-icon-btn" onClick={() => onEdit(item)} title="Edit">
              <Pencil size={16} strokeWidth={1.5} />
            </button>
            {!confirming ? (
              <button className="lb-icon-btn lb-delete-btn" onClick={() => setConfirming(true)} title="Delete">
                <Trash2 size={16} strokeWidth={1.5} />
              </button>
            ) : (
              <div className="lb-confirm">
                <span>Delete this?</span>
                <button className="btn-danger-sm" onClick={handleDelete} disabled={deleting}>
                  {deleting ? '…' : 'Yes'}
                </button>
                <button className="btn-ghost-sm" onClick={() => setConfirming(false)}>No</button>
              </div>
            )}
          </div>
          <button className="lightbox-close" onClick={onClose}><X size={18} strokeWidth={1.5} /></button>
        </div>

        {/* Nav */}
        {onPrev && (
          <button className="lightbox-nav lightbox-prev" onClick={onPrev}>
            <ChevronLeft size={24} strokeWidth={1.5} />
          </button>
        )}
        {onNext && (
          <button className="lightbox-nav lightbox-next" onClick={onNext}>
            <ChevronRight size={24} strokeWidth={1.5} />
          </button>
        )}

        {/* Media */}
        <div className="lightbox-media">
          {item.media_type === 'image' && <img src={item.cloudinary_url} alt={item.title} />}
          {item.media_type === 'video' && <video src={item.cloudinary_url} controls autoPlay />}
          {item.media_type === 'audio' && (
            <div className="lightbox-audio">
              <div className="audio-artwork"><Music size={52} strokeWidth={1} /></div>
              <audio src={item.cloudinary_url} controls autoPlay />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="lightbox-info">
          <h2>{item.title}</h2>
          {item.caption && <p className="lb-caption">{item.caption}</p>}
          <div className="lb-meta">
            <span className="lb-meta-item">
              <Calendar size={13} strokeWidth={1.5} />
              {new Date(item.taken_at).toLocaleDateString('en-US', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
              })}
            </span>
            {item.duration && (
              <span className="lb-meta-item">
                <Clock size={13} strokeWidth={1.5} />
                {formatDuration(item.duration)}
              </span>
            )}
            {albumName && (
              <span className="lb-meta-item">
                <Music size={13} strokeWidth={1.5} />
                {albumName}
              </span>
            )}
            {item.tags?.length ? (
              <div className="lb-tags">
                <Tag size={12} strokeWidth={1.5} />
                {item.tags.map((t) => <span key={t} className="tag">{t}</span>)}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
