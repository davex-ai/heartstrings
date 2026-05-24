import { useState } from 'react';
import { signOut } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import type { ViewMode } from '../types';

interface NavbarProps {
  viewMode: ViewMode;
  setViewMode: (v: ViewMode) => void;
  onUploadClick: () => void;
  onNewAlbum: () => void;
  onSearch: (q: string) => void;
}

export default function Navbar({ viewMode, setViewMode, onUploadClick, onNewAlbum, onSearch }: NavbarProps) {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const [searchVal, setSearchVal] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  function handleSearch(val: string) {
    setSearchVal(val);
    onSearch(val);
  }

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <span className="navbar-logo">🎞️</span>
        <span className="navbar-title">Heartstrings</span>
      </div>

      <div className="navbar-search">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          placeholder="Search memories…"
          value={searchVal}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>

      <div className="navbar-views">
        {([
          { mode: 'grid', icon: '⊞', label: 'Grid' },
          { mode: 'timeline', icon: '≡', label: 'Timeline' },
          { mode: 'albums', icon: '🗂', label: 'Albums' },
        ] as { mode: ViewMode; icon: string; label: string }[]).map(({ mode, icon, label }) => (
          <button
            key={mode}
            className={`view-btn ${viewMode === mode ? 'active' : ''}`}
            onClick={() => setViewMode(mode)}
            title={label}
          >
            {icon}
          </button>
        ))}
      </div>

      <div className="navbar-actions">
        {viewMode === 'albums' && (
          <button className="btn-new-album" onClick={onNewAlbum} title="New Album">
            + Album
          </button>
        )}
        <button className="btn-upload" onClick={onUploadClick}>
          <span>＋</span> Upload
        </button>
        <button className="theme-toggle" onClick={toggleTheme} title="Toggle theme">
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
        <div className="user-menu-wrap">
          <button className="user-avatar" onClick={() => setMenuOpen(!menuOpen)}>
            {user?.email?.[0]?.toUpperCase() ?? '?'}
          </button>
          {menuOpen && (
            <div className="user-menu">
              <p className="user-email">{user?.email}</p>
              <button onClick={() => { setMenuOpen(false); signOut(); }}>Sign out</button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
