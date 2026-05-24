import { useState, useMemo } from 'react';
import { groupByDate } from '../hooks/useMedia';
import MediaCard from './MediaCard';
import Lightbox from './Lightbox';
import type { MediaItem, Album, ViewMode } from '../types';

interface MediaState {
  items: MediaItem[];
  loading: boolean;
  error: string | null;
}

interface AlbumState {
  albums: Album[];
  loading: boolean;
}

interface GalleryProps {
  viewMode: ViewMode;
  searchQuery: string;
  mediaState: MediaState;
  albumState: AlbumState;
  onNewAlbum: () => void;
}

export default function Gallery({ viewMode, searchQuery, mediaState, albumState, onNewAlbum }: GalleryProps) {
  const { items, loading, error } = mediaState;
  const { albums } = albumState;

  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [activeAlbum, setActiveAlbum] = useState<string | null>(null);
  // When in albums view, clicking an album opens a detail view
  const [openAlbumId, setOpenAlbumId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = items;
    // Album filter from chip strip
    if (activeAlbum) list = list.filter((i) => i.album_id === activeAlbum);
    // Album detail drill-down
    if (openAlbumId) list = list.filter((i) => i.album_id === openAlbumId);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.caption?.toLowerCase().includes(q) ||
          i.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }
    return list;
  }, [items, activeAlbum, openAlbumId, searchQuery]);

  const dateGroups = useMemo(() => groupByDate(filtered), [filtered]);

  if (loading) return <div className="gallery-loading"><div className="spinner" /></div>;
  if (error) return <div className="gallery-error">Error: {error}</div>;

  const selectedItem = selectedIdx !== null ? filtered[selectedIdx] : null;
  const openAlbum = openAlbumId ? albums.find((a) => a.id === openAlbumId) : null;

  // ── Album detail view ───────────────────────────────────────────
  if (viewMode === 'albums' && openAlbum) {
    return (
      <div className="gallery-wrapper">
        <div className="album-detail-header">
          <button className="back-btn" onClick={() => setOpenAlbumId(null)}>← Albums</button>
          <div className="album-detail-title">
            <h2>{openAlbum.name}</h2>
            {openAlbum.description && <p>{openAlbum.description}</p>}
          </div>
          <span className="timeline-count">{filtered.length} item{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        {filtered.length === 0 ? (
          <div className="gallery-empty">
            <span>📭</span>
            <p>This album is empty</p>
            <p className="sub">Upload media and assign it to this album</p>
          </div>
        ) : (
          <div className="media-grid">
            {filtered.map((item, idx) => (
              <MediaCard key={item.id} item={item} onClick={() => setSelectedIdx(idx)} />
            ))}
          </div>
        )}

        {selectedItem && (
          <Lightbox
            item={selectedItem}
            onClose={() => setSelectedIdx(null)}
            onPrev={selectedIdx! > 0 ? () => setSelectedIdx(selectedIdx! - 1) : undefined}
            onNext={selectedIdx! < filtered.length - 1 ? () => setSelectedIdx(selectedIdx! + 1) : undefined}
          />
        )}
      </div>
    );
  }

  // ── Albums grid view ────────────────────────────────────────────
  if (viewMode === 'albums') {
    return (
      <div className="gallery-wrapper">
        {albums.length === 0 ? (
          <div className="gallery-empty">
            <span>🗂</span>
            <p>No albums yet</p>
            <p className="sub">Albums help group memories by events, phases, or themes</p>
            <button className="btn-primary" style={{ marginTop: 16 }} onClick={onNewAlbum}>
              Create your first album
            </button>
          </div>
        ) : (
          <div className="albums-grid">
            {albums.map((album) => {
              const albumItems = items.filter((i) => i.album_id === album.id);
              const coverItem = albumItems.find((i) => i.media_type === 'image') ?? albumItems[0];
              return (
                <div
                  key={album.id}
                  className="album-card"
                  onClick={() => setOpenAlbumId(album.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && setOpenAlbumId(album.id)}
                >
                  <div className="album-cover">
                    {coverItem?.media_type === 'image' ? (
                      <img src={coverItem.thumbnail_url ?? coverItem.cloudinary_url} alt={album.name} />
                    ) : (
                      <span className="album-placeholder">
                        {album.name.split(' ')[0]}
                      </span>
                    )}
                  </div>
                  <div className="album-info">
                    <h4>{album.name}</h4>
                    <p className="album-count">
                      {albumItems.length} item{albumItems.length !== 1 ? 's' : ''}
                    </p>
                    {album.description && <p className="album-desc">{album.description}</p>}
                  </div>
                </div>
              );
            })}
            {/* Create album card */}
            <div className="album-card album-card-new" onClick={onNewAlbum} role="button" tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && onNewAlbum()}>
              <div className="album-cover album-cover-new">
                <span>＋</span>
              </div>
              <div className="album-info">
                <h4>New Album</h4>
                <p className="album-count">Create a group</p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Grid / Timeline views ───────────────────────────────────────
  return (
    <div className="gallery-wrapper">
      {/* Album filter chips */}
      <div className="album-strip">
        <button
          className={`album-chip ${!activeAlbum ? 'active' : ''}`}
          onClick={() => setActiveAlbum(null)}
        >
          All
        </button>
        {albums.map((a) => (
          <button
            key={a.id}
            className={`album-chip ${activeAlbum === a.id ? 'active' : ''}`}
            onClick={() => setActiveAlbum(activeAlbum === a.id ? null : a.id)}
          >
            {a.name}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="gallery-empty">
          <span>📷</span>
          <p>No memories here yet</p>
          <p className="sub">Upload some photos, videos, or audio to get started</p>
        </div>
      )}

      {/* Grid view */}
      {viewMode === 'grid' && filtered.length > 0 && (
        <div className="media-grid">
          {filtered.map((item, idx) => (
            <MediaCard key={item.id} item={item} onClick={() => setSelectedIdx(idx)} />
          ))}
        </div>
      )}

      {/* Timeline view */}
      {viewMode === 'timeline' && dateGroups.length > 0 && (
        <div className="timeline">
          {dateGroups.map((group) => (
            <div key={`${group.year}-${group.month}`} className="timeline-group">
              <div className="timeline-header">
                <span className="timeline-dot" />
                <h3>{group.label}</h3>
                <span className="timeline-count">{group.items.length}</span>
              </div>
              <div className="media-grid">
                {group.items.map((item) => {
                  const idx = filtered.indexOf(item);
                  return (
                    <MediaCard key={item.id} item={item} onClick={() => setSelectedIdx(idx)} />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedItem && (
        <Lightbox
          item={selectedItem}
          onClose={() => setSelectedIdx(null)}
          onPrev={selectedIdx! > 0 ? () => setSelectedIdx(selectedIdx! - 1) : undefined}
          onNext={selectedIdx! < filtered.length - 1 ? () => setSelectedIdx(selectedIdx! + 1) : undefined}
        />
      )}
    </div>
  );
}
