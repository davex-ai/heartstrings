import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useMedia, useAlbums } from '../hooks/useMedia';
import LoginPage from './LoginPage';
import Navbar from './Navbar';
import Gallery from './Gallery';
import UploadModal from './UploadModal';
import CreateAlbumModal from './CreateAlbumModal';
import type { ViewMode } from '../types';

export default function App() {
  const { session, loading } = useAuth();
  const mediaState = useMedia();
  const albumState = useAlbums();

  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [albumModalOpen, setAlbumModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  if (loading) {
    return (
      <div className="app-loading">
        <div className="spinner" />
      </div>
    );
  }

  if (!session) return <LoginPage />;

  return (
    <div className="app">
      <Navbar
        viewMode={viewMode}
        setViewMode={setViewMode}
        onUploadClick={() => setUploadOpen(true)}
        onNewAlbum={() => setAlbumModalOpen(true)}
        onSearch={setSearchQuery}
      />
      <main className="app-main">
        <Gallery
          viewMode={viewMode}
          searchQuery={searchQuery}
          mediaState={mediaState}
          albumState={albumState}
          onNewAlbum={() => setAlbumModalOpen(true)}
        />
      </main>

      {uploadOpen && (
        <UploadModal
          albums={albumState.albums}
          onClose={() => setUploadOpen(false)}
          onItemUploaded={mediaState.addItem}
        />
      )}

      {albumModalOpen && (
        <CreateAlbumModal
          onClose={() => setAlbumModalOpen(false)}
          onCreated={albumState.addAlbum}
        />
      )}
    </div>
  );
}
