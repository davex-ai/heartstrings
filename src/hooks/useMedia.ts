import { useState, useEffect, useCallback } from 'react';
import { fetchMedia, fetchAlbums } from '../lib/supabase';
import type { MediaItem, Album, DateGroup } from '../types';

export function useMedia() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchMedia();
      setItems(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const addItem = useCallback((item: MediaItem) => {
    setItems((prev) => [item, ...prev]);
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const patchItem = useCallback((id: string, patch: Partial<MediaItem>) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }, []);

  return { items, loading, error, refetch: load, addItem, removeItem, patchItem };
}

export function useAlbums() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchAlbums();
      setAlbums(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const addAlbum = useCallback((album: Album) => {
    setAlbums((prev) => [album, ...prev]);
  }, []);

  const removeAlbum = useCallback((id: string) => {
    setAlbums((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const patchAlbum = useCallback((id: string, patch: Partial<Album>) => {
    setAlbums((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  }, []);

  return { albums, loading, refetch: load, addAlbum, removeAlbum, patchAlbum };
}

export function groupByDate(items: MediaItem[]): DateGroup[] {
  const map = new Map<string, DateGroup>();
  items.forEach((item) => {
    const d = new Date(item.taken_at);
    const year = d.getFullYear();
    const month = d.getMonth();
    const key = `${year}-${month}`;
    if (!map.has(key)) {
      map.set(key, {
        label: d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        year, month, items: [],
      });
    }
    map.get(key)!.items.push(item);
  });
  return Array.from(map.values()).sort((a, b) => b.year - a.year || b.month - a.month);
}
