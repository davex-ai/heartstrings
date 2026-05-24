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

export async function deleteMedia(id: string, cloudinaryPublicId: string, resourceType: 'image' | 'video' | 'audio'): Promise<void> {
  const { error } = await supabase.from('media').delete().eq('id', id);
  if (error) throw error;
  try {
    await supabase.functions.invoke('delete-cloudinary-asset', {
      body: { public_id: cloudinaryPublicId, resource_type: resourceType === 'audio' ? 'video' : resourceType },
    });
  } catch {
    console.warn('Cloudinary delete skipped (edge function not deployed)');
  }
}

export async function deleteManyMedia(ids: string[], items: MediaItem[]): Promise<void> {
  if (ids.length === 0) return;
  const { error } = await supabase.from('media').delete().in('id', ids);
  if (error) throw error;
  // Fire-and-forget Cloudinary deletes
  for (const id of ids) {
    const item = items.find((i) => i.id === id);
    if (!item) continue;
    try {
      await supabase.functions.invoke('delete-cloudinary-asset', {
        body: {
          public_id: item.cloudinary_public_id,
          resource_type: item.media_type === 'audio' ? 'video' : item.media_type,
        },
      });
    } catch { /* silent */ }
  }
}

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
  // Use update without .single() — may affect 0 rows which is fine
  const { error: unlinkError } = await supabase
    .from('media')
    .update({ album_id: null })
    .eq('album_id', id);
  if (unlinkError) throw unlinkError;

  const { error } = await supabase.from('albums').delete().eq('id', id);
  if (error) throw error;
}

export async function deleteManyAlbums(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  // Unlink media for all albums
  const { error: unlinkError } = await supabase
    .from('media')
    .update({ album_id: null })
    .in('album_id', ids);
  if (unlinkError) throw unlinkError;

  const { error } = await supabase.from('albums').delete().in('id', ids);
  if (error) throw error;
}
