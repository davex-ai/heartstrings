import { useEffect, useCallback } from 'react';
import type { MediaItem } from '../types';
import { formatDuration } from '../lib/cloudinary';

interface LightboxProps {
  item: MediaItem;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
}

export default function Lightbox({ item, onClose, onPrev, onNext }: LightboxProps) {
  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'ArrowLeft') onPrev?.();
    if (e.key === 'ArrowRight') onNext?.();
  }, [onClose, onPrev, onNext]);

  useEffect(() => {
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [handleKey]);

  return (
    <div className="lightbox-overlay" onClick={onClose}>
      <div className="lightbox-container" onClick={(e) => e.stopPropagation()}>
        <button className="lightbox-close" onClick={onClose}>✕</button>

        {onPrev && (
          <button className="lightbox-nav lightbox-prev" onClick={onPrev}>‹</button>
        )}
        {onNext && (
          <button className="lightbox-nav lightbox-next" onClick={onNext}>›</button>
        )}

        <div className="lightbox-media">
          {item.media_type === 'image' && (
            <img src={item.cloudinary_url} alt={item.title} />
          )}
          {item.media_type === 'video' && (
            <video src={item.cloudinary_url} controls autoPlay />
          )}
          {item.media_type === 'audio' && (
            <div className="lightbox-audio">
              <div className="audio-artwork">🎵</div>
              <audio src={item.cloudinary_url} controls autoPlay />
            </div>
          )}
        </div>

        <div className="lightbox-info">
          <h2>{item.title}</h2>
          {item.caption && <p className="lb-caption">{item.caption}</p>}
          <div className="lb-meta">
            <span>
              📅 {new Date(item.taken_at).toLocaleDateString('en-US', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
              })}
            </span>
            {item.duration && (
              <span>⏱ {formatDuration(item.duration)}</span>
            )}
            {item.tags?.length ? (
              <div className="lb-tags">
                {item.tags.map((t) => <span key={t} className="tag">{t}</span>)}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
