import { createClient } from '@supabase/supabase-js';
import type { MediaItem, Album } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ── Auth ──────────────────────────────────────────────────────────
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

// ── Media ─────────────────────────────────────────────────────────
export async function fetchMedia(filters?: {
  album_id?: string;
  year?: number;
  month?: number;
}): Promise<MediaItem[]> {
  let query = supabase
    .from('media')
    .select('*')
    .order('taken_at', { ascending: false });

  if (filters?.album_id) query = query.eq('album_id', filters.album_id);
  if (filters?.year) {
    const start = `${filters.year}-01-01`;
    const end = `${filters.year}-12-31`;
    query = query.gte('taken_at', start).lte('taken_at', end);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as MediaItem[];
}

export async function insertMedia(item: Omit<MediaItem, 'id' | 'created_at'>): Promise<MediaItem> {
  const { data, error } = await supabase.from('media').insert(item).select().single();
  if (error) throw error;
  return data as MediaItem;
}

export async function deleteMedia(id: string) {
  const { error } = await supabase.from('media').delete().eq('id', id);
  if (error) throw error;
}

// ── Albums ────────────────────────────────────────────────────────
export async function fetchAlbums(): Promise<Album[]> {
  const { data, error } = await supabase
    .from('albums')
    .select('*, media(count)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((a: any) => ({ ...a, media_count: a.media?.[0]?.count ?? 0 }));
}

export async function createAlbum(name: string, description?: string): Promise<Album> {
  const { data, error } = await supabase
    .from('albums')
    .insert({ name, description })
    .select()
    .single();
  if (error) throw error;
  return data as Album;
}
