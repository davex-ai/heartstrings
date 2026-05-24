import { useState, useMemo } from 'react';
import { FolderPlus, FolderOpen, Pencil } from 'lucide-react';
import { groupByDate } from '../hooks/useMedia';
import MediaCard from './MediaCard';
import Lightbox from './Lightbox';
import EditMediaModal from './EditMediaModal';
import type { Album, MediaItem, ViewMode } from '../types';

interface MediaState {
  items: MediaItem[];
  loading: boolean;
  error: string | null;
  removeItem: (id: string) => void;
  patchItem: (id: string, patch: Partial<MediaItem>) => void;
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
  onEditAlbum: (album: Album) => void;
}

export default function Gallery({ viewMode, searchQuery, mediaState, albumState, onNewAlbum, onEditAlbum }: GalleryProps) {
  const { items, loading, error, removeItem, patchItem } = mediaState;
  const { albums } = albumState;

  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [activeAlbum, setActiveAlbum] = useState<string | null>(null);
  const [openAlbumId, setOpenAlbumId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<MediaItem | null>(null);

  const filtered = useMemo(() => {
    let list = items;
    if (activeAlbum) list = list.filter((i) => i.album_id === activeAlbum);
    if (openAlbumId) list = list.filter((i) => i.album_id === openAlbumId);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (i) => i.title.toLowerCase().includes(q)
          || i.caption?.toLowerCase().includes(q)
          || i.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }
    return list;
  }, [items, activeAlbum, openAlbumId, searchQuery]);

  const dateGroups = useMemo(() => groupByDate(filtered), [filtered]);

  if (loading) return <div className="gallery-loading"><div className="spinner" /></div>;
  if (error) return <div className="gallery-error">Error: {error}</div>;

  const selectedItem = selectedIdx !== null ? filtered[selectedIdx] : null;
  const openAlbum = openAlbumId ? albums.find((a) => a.id === openAlbumId) : null;

  function renderGrid(list: MediaItem[]) {
    return (
      <div className="media-grid">
        {list.map((item) => {
          const idx = filtered.indexOf(item);
          return (
            <MediaCard
              key={item.id}
              item={item}
              onClick={() => setSelectedIdx(idx)}
              onStaleRemoved={removeItem}
            />
          );
        })}
      </div>
    );
  }

  // ── Album detail ────────────────────────────────────────────────
  if (viewMode === 'albums' && openAlbum) {
    return (
      <div className="gallery-wrapper">
        <div className="album-detail-header">
          <button className="back-btn" onClick={() => setOpenAlbumId(null)}>
            ← Albums
          </button>
          <div className="album-detail-title">
            <h2>{openAlbum.name}</h2>
            {openAlbum.description && <p>{openAlbum.description}</p>}
          </div>
          <button className="icon-btn" onClick={() => onEditAlbum(openAlbum)} title="Edit album">
            <Pencil size={15} strokeWidth={1.5} />
          </button>
          <span className="timeline-count">{filtered.length} item{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        {filtered.length === 0
          ? <div className="gallery-empty"><FolderOpen size={48} strokeWidth={1} /><p>This album is empty</p><p className="sub">Upload media and assign it to this album</p></div>
          : renderGrid(filtered)}

        {selectedItem && (
          <Lightbox item={selectedItem} albums={albums} onClose={() => setSelectedIdx(null)}
            onPrev={selectedIdx! > 0 ? () => setSelectedIdx(selectedIdx! - 1) : undefined}
            onNext={selectedIdx! < filtered.length - 1 ? () => setSelectedIdx(selectedIdx! + 1) : undefined}
            onEdit={(i) => { setSelectedIdx(null); setEditingItem(i); }}
            onDeleted={(id) => { removeItem(id); setSelectedIdx(null); }}
          />
        )}
        {editingItem && (
          <EditMediaModal item={editingItem} albums={albums}
            onClose={() => setEditingItem(null)}
            onUpdated={(id, patch) => { patchItem(id, patch); setEditingItem(null); }}
          />
        )}
      </div>
    );
  }

  // ── Albums grid ─────────────────────────────────────────────────
  if (viewMode === 'albums') {
    return (
      <div className="gallery-wrapper">
        {albums.length === 0 ? (
          <div className="gallery-empty">
            <FolderPlus size={48} strokeWidth={1} />
            <p>No albums yet</p>
            <p className="sub">Group memories by events, phases, or themes</p>
            <button className="btn-primary" style={{ marginTop: 16 }} onClick={onNewAlbum}>Create first album</button>
          </div>
        ) : (
          <div className="albums-grid">
            {albums.map((album) => {
              const albumItems = items.filter((i) => i.album_id === album.id);
              const cover = albumItems.find((i) => i.media_type === 'image') ?? albumItems[0];
              return (
                <div key={album.id} className="album-card" onClick={() => setOpenAlbumId(album.id)}
                  role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && setOpenAlbumId(album.id)}>
                  <div className="album-cover">
                    {cover?.media_type === 'image'
                      ? <img src={cover.thumbnail_url ?? cover.cloudinary_url} alt={album.name} />
                      : <div className="album-placeholder"><FolderOpen size={40} strokeWidth={1} /></div>}
                  </div>
                  <div className="album-info">
                    <div className="album-info-top">
                      <h4>{album.name}</h4>
                      <button className="icon-btn album-edit-btn"
                        onClick={(e) => { e.stopPropagation(); onEditAlbum(album); }}
                        title="Edit album">
                        <Pencil size={13} strokeWidth={1.5} />
                      </button>
                    </div>
                    <p className="album-count">{albumItems.length} item{albumItems.length !== 1 ? 's' : ''}</p>
                    {album.description && <p className="album-desc">{album.description}</p>}
                  </div>
                </div>
              );
            })}
            <div className="album-card album-card-new" onClick={onNewAlbum} role="button" tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && onNewAlbum()}>
              <div className="album-cover album-cover-new">
                <FolderPlus size={32} strokeWidth={1} />
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

  // ── Grid / Timeline ─────────────────────────────────────────────
  return (
    <div className="gallery-wrapper">
      <div className="album-strip">
        <button className={`album-chip ${!activeAlbum ? 'active' : ''}`} onClick={() => setActiveAlbum(null)}>All</button>
        {albums.map((a) => (
          <button key={a.id} className={`album-chip ${activeAlbum === a.id ? 'active' : ''}`}
            onClick={() => setActiveAlbum(activeAlbum === a.id ? null : a.id)}>
            {a.name}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="gallery-empty">
          <FolderOpen size={48} strokeWidth={1} />
          <p>No memories here yet</p>
          <p className="sub">Upload some photos, videos, or audio to get started</p>
        </div>
      )}

      {viewMode === 'grid' && filtered.length > 0 && renderGrid(filtered)}

      {viewMode === 'timeline' && dateGroups.length > 0 && (
        <div className="timeline">
          {dateGroups.map((group) => (
            <div key={`${group.year}-${group.month}`} className="timeline-group">
              <div className="timeline-header">
                <span className="timeline-dot" />
                <h3>{group.label}</h3>
                <span className="timeline-count">{group.items.length}</span>
              </div>
              {renderGrid(group.items)}
            </div>
          ))}
        </div>
      )}

      {selectedItem && (
        <Lightbox item={selectedItem} albums={albums} onClose={() => setSelectedIdx(null)}
          onPrev={selectedIdx! > 0 ? () => setSelectedIdx(selectedIdx! - 1) : undefined}
          onNext={selectedIdx! < filtered.length - 1 ? () => setSelectedIdx(selectedIdx! + 1) : undefined}
          onEdit={(i) => { setSelectedIdx(null); setEditingItem(i); }}
          onDeleted={(id) => { removeItem(id); setSelectedIdx(null); }}
        />
      )}
      {editingItem && (
        <EditMediaModal item={editingItem} albums={albums}
          onClose={() => setEditingItem(null)}
          onUpdated={(id, patch) => { patchItem(id, patch); setEditingItem(null); }}
        />
      )}
    </div>
  );
}
