import { useState } from 'react';
import {
  Film, Search, LayoutGrid, AlignJustify, FolderOpen,
  Upload, Sun, Moon, LogOut, User, FolderPlus, Trash2,
} from 'lucide-react';
import { signOut } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import type { ViewMode } from '../types';

interface NavbarProps {
  viewMode: ViewMode;
  setViewMode: (v: ViewMode) => void;
  onUploadClick: () => void;
  onNewAlbum: () => void;
  onDeleteClick: () => void;
  onSearch: (q: string) => void;
}

export default function Navbar({ viewMode, setViewMode, onUploadClick, onNewAlbum, onDeleteClick, onSearch }: NavbarProps) {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const [searchVal, setSearchVal] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Film size={20} strokeWidth={1.5} className="brand-icon" />
        <span className="navbar-title">Heartstrings</span>
      </div>

      <div className="navbar-search">
        <Search size={14} className="search-icon-svg" />
        <input
          type="text"
          placeholder="Search memories…"
          value={searchVal}
          onChange={(e) => { setSearchVal(e.target.value); onSearch(e.target.value); }}
        />
      </div>

      <div className="navbar-views">
        {([
          { mode: 'grid' as ViewMode, Icon: LayoutGrid, label: 'Grid' },
          { mode: 'timeline' as ViewMode, Icon: AlignJustify, label: 'Timeline' },
          { mode: 'albums' as ViewMode, Icon: FolderOpen, label: 'Albums' },
        ]).map(({ mode, Icon, label }) => (
          <button key={mode} className={`view-btn ${viewMode === mode ? 'active' : ''}`}
            onClick={() => setViewMode(mode)} title={label}>
            <Icon size={18} strokeWidth={1.5} />
          </button>
        ))}
      </div>

      <div className="navbar-actions">
        {viewMode === 'albums' && (
          <button className="btn-new-album" onClick={onNewAlbum}>
            <FolderPlus size={15} strokeWidth={1.5} />
            <span>New Album</span>
          </button>
        )}
        <button className="btn-upload" onClick={onUploadClick}>
          <Upload size={15} strokeWidth={1.5} />
          <span>Upload</span>
        </button>
        <button className="btn-delete-nav" onClick={onDeleteClick} title="Delete items">
          <Trash2 size={16} strokeWidth={1.5} />
        </button>
        <button className="btn-theme-toggle" onClick={toggleTheme} title={theme === 'dark' ? 'Light mode' : 'Dark mode'}>
          {theme === 'dark'
            ? <Sun size={18} strokeWidth={1.5} />
            : <Moon size={18} strokeWidth={1.5} />}
        </button>
        <div className="user-menu-wrap">
          <button className="user-avatar" onClick={() => setMenuOpen(!menuOpen)}>
            <User size={16} strokeWidth={1.5} />
          </button>
          {menuOpen && (
            <div className="user-menu">
              <p className="user-email">{user?.email}</p>
              <button className="user-menu-item" onClick={() => { setMenuOpen(false); signOut(); }}>
                <LogOut size={14} strokeWidth={1.5} />
                <span>Sign out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
