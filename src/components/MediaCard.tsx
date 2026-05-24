import { useState } from 'react';
import { Play, Music, ImageOff } from 'lucide-react';
import type { MediaItem } from '../types';
import { formatDuration } from '../lib/cloudinary';
import { removeStaleMedia } from '../lib/supabase';

interface MediaCardProps {
  item: MediaItem;
  onClick: () => void;
  onStaleRemoved?: (id: string) => void;
}

export default function MediaCard({ item, onClick, onStaleRemoved }: MediaCardProps) {
  const [imgError, setImgError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const thumb = item.thumbnail_url ?? item.cloudinary_url;
  const isAudio = item.media_type === 'audio';
  const isVideo = item.media_type === 'video';

  async function handleImgError() {
    setImgError(true);
    // Auto-clean stale record from DB + notify parent to remove from UI
    try {
      await removeStaleMedia(item.id);
      onStaleRemoved?.(item.id);
    } catch {
      // silent — DB cleanup is best-effort
    }
  }

  if (imgError && !isAudio) {
    // Render a ghost card briefly before parent removes it
    return (
      <div className="media-card media-card-ghost">
        <div className="media-card-thumb">
          <div className="thumb-error">
            <ImageOff size={28} strokeWidth={1.5} />
            <span>Removed</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="media-card" onClick={onClick} role="button" tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}>
      <div className="media-card-thumb">
        {isAudio ? (
          <div className="audio-thumb">
            <Music size={36} strokeWidth={1} />
          </div>
        ) : (
          <>
            {!loaded && <div className="thumb-skeleton" />}
            <img
              src={thumb}
              alt={item.title}
              onLoad={() => setLoaded(true)}
              onError={handleImgError}
              style={{ opacity: loaded ? 1 : 0 }}
            />
          </>
        )}
        {isVideo && (
          <div className="play-badge">
            <Play size={10} fill="white" strokeWidth={0} />
            {item.duration && <span>{formatDuration(item.duration)}</span>}
          </div>
        )}
        {isAudio && item.duration && (
          <div className="duration-badge">{formatDuration(item.duration)}</div>
        )}
      </div>
      <div className="media-card-info">
        <p className="media-card-title">{item.title}</p>
        {item.caption && <p className="media-card-caption">{item.caption}</p>}
        <p className="media-card-date">
          {new Date(item.taken_at).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
          })}
        </p>
      </div>
    </div>
  );
}
