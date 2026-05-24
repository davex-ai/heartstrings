import { useState } from 'react';
import type { MediaItem } from '../types';
import { formatDuration } from '../lib/cloudinary';

interface MediaCardProps {
  item: MediaItem;
  onClick: () => void;
}

export default function MediaCard({ item, onClick }: MediaCardProps) {
  const [imgError, setImgError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const thumb = item.thumbnail_url ?? item.cloudinary_url;
  const isAudio = item.media_type === 'audio';
  const isVideo = item.media_type === 'video';

  return (
    <div className="media-card" onClick={onClick} role="button" tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}>
      <div className="media-card-thumb">
        {isAudio ? (
          <div className="audio-thumb">
            <span className="audio-icon">🎵</span>
          </div>
        ) : (
          <>
            {!loaded && <div className="thumb-skeleton" />}
            <img
              src={thumb}
              alt={item.title}
              onLoad={() => setLoaded(true)}
              onError={() => setImgError(true)}
              style={{ opacity: loaded ? 1 : 0 }}
            />
            {imgError && (
              <div className="thumb-error">
                <span>{isVideo ? '🎬' : '🖼️'}</span>
              </div>
            )}
          </>
        )}
        {isVideo && (
          <div className="play-badge">
            ▶
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
