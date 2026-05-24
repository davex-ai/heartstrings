import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useMedia, useAlbums } from '../hooks/useMedia';
import LoginPage from './LoginPage';
import Navbar from './Navbar';
import Gallery from './Gallery';
import UploadModal from './UploadModal';
import AlbumModal from './AlbumModal';
import DeleteModal from './DeleteModal';
import type { Album, ViewMode } from '../types';

export default function App() {
  const { session, loading } = useAuth();
  const mediaState = useMedia();
  const albumState = useAlbums();

  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [albumModal, setAlbumModal] = useState<{ open: boolean; album?: Album }>({ open: false });
  const [searchQuery, setSearchQuery] = useState('');

  if (loading) return <div className="app-loading"><div className="spinner" /></div>;
  if (!session) return <LoginPage />;

  return (
    <div className="app">
      <Navbar
        viewMode={viewMode}
        setViewMode={setViewMode}
        onUploadClick={() => setUploadOpen(true)}
        onNewAlbum={() => setAlbumModal({ open: true })}
        onDeleteClick={() => setDeleteOpen(true)}
        onSearch={setSearchQuery}
      />
      <main className="app-main">
        <Gallery
          viewMode={viewMode}
          searchQuery={searchQuery}
          mediaState={mediaState}
          albumState={albumState}
          onNewAlbum={() => setAlbumModal({ open: true })}
          onEditAlbum={(album) => setAlbumModal({ open: true, album })}
        />
      </main>

      {uploadOpen && (
        <UploadModal
          albums={albumState.albums}
          onClose={() => setUploadOpen(false)}
          onItemUploaded={mediaState.addItem}
        />
      )}

      {albumModal.open && (
        <AlbumModal
          album={albumModal.album}
          onClose={() => setAlbumModal({ open: false })}
          onCreated={albumState.addAlbum}
          onUpdated={(id, patch) => albumState.patchAlbum(id, patch)}
          onDeleted={(id) => {
            albumState.removeAlbum(id);
            mediaState.items
              .filter((m) => m.album_id === id)
              .forEach((m) => mediaState.patchItem(m.id, { album_id: undefined }));
          }}
        />
      )}

      {deleteOpen && (
        <DeleteModal
          items={mediaState.items}
          albums={albumState.albums}
          onClose={() => setDeleteOpen(false)}
          onItemsDeleted={(ids) => ids.forEach((id) => mediaState.removeItem(id))}
          onAlbumsDeleted={(ids) => {
            ids.forEach((id) => {
              albumState.removeAlbum(id);
              mediaState.items
                .filter((m) => m.album_id === id)
                .forEach((m) => mediaState.patchItem(m.id, { album_id: undefined }));
            });
          }}
        />
      )}
    </div>
  );
}
