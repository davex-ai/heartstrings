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
export async function fetchMedia(): Promise<MediaItem[]> {
  const { data, error } = await supabase
    .from('media')
    .select('*')
    .order('taken_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as MediaItem[];
}

export async function insertMedia(item: Omit<MediaItem, 'id' | 'created_at'>): Promise<MediaItem> {
  const { data, error } = await supabase.from('media').insert(item).select().single();
  if (error) throw error;
  return data as MediaItem;
}

export async function updateMedia(id: string, patch: Partial<Omit<MediaItem, 'id' | 'created_at'>>): Promise<MediaItem> {
  const { data, error } = await supabase.from('media').update(patch).eq('id', id).select().single();
  if (error) throw error;
  return data as MediaItem;
}

/**
 * Delete a media record from Supabase.
 * Also attempts to delete from Cloudinary via an Edge Function.
 * If the Edge Function isn't deployed yet, the DB record is still removed.
 */
export async function deleteMedia(id: string, cloudinaryPublicId: string, resourceType: 'image' | 'video' | 'audio'): Promise<void> {
  // 1. Remove from DB first so UI reflects instantly
  const { error } = await supabase.from('media').delete().eq('id', id);
  if (error) throw error;

  // 2. Fire-and-forget Cloudinary delete via Edge Function
  try {
    await supabase.functions.invoke('delete-cloudinary-asset', {
      body: { public_id: cloudinaryPublicId, resource_type: resourceType === 'audio' ? 'video' : resourceType },
    });
  } catch {
    // Edge function not deployed yet — that's fine, DB record is already gone
    console.warn('Cloudinary delete skipped (edge function not deployed)');
  }
}

/**
 * Called when an image URL 404s — removes the stale DB record silently.
 */
export async function removeStaleMedia(id: string): Promise<void> {
  await supabase.from('media').delete().eq('id', id);
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
  const { data, error } = await supabase.from('albums').insert({ name, description }).select().single();
  if (error) throw error;
  return data as Album;
}

export async function updateAlbum(id: string, patch: { name?: string; description?: string }): Promise<Album> {
  const { data, error } = await supabase.from('albums').update(patch).eq('id', id).select().single();
  if (error) throw error;
  return data as Album;
}

export async function deleteAlbum(id: string): Promise<void> {
  // Unlink media — ignore errors (RLS may block bulk update, media stays intact)
  try {
    await supabase.from('media').update({ album_id: null }).eq('album_id', id).select();
  } catch (_) {}
  const { error } = await supabase.from('albums').delete().eq('id', id);
  if (error) throw error;
}
