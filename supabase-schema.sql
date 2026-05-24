-- Run this in your Supabase SQL editor

-- Albums table
create table if not exists public.albums (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  cover_url text,
  created_at timestamptz default now()
);

-- Media table
create table if not exists public.media (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  caption text,
  media_type text not null check (media_type in ('image', 'video', 'audio')),
  cloudinary_url text not null,
  cloudinary_public_id text not null,
  thumbnail_url text,
  taken_at date not null,
  album_id uuid references public.albums(id) on delete set null,
  uploaded_by uuid references auth.users(id) on delete set null,
  duration numeric,
  tags text[],
  created_at timestamptz default now()
);

-- Row-Level Security: only authenticated users can read/write
alter table public.albums enable row level security;
alter table public.media enable row level security;

create policy "Authenticated users can read albums"
  on public.albums for select to authenticated using (true);

create policy "Authenticated users can insert albums"
  on public.albums for insert to authenticated with check (true);

create policy "Authenticated users can read media"
  on public.media for select to authenticated using (true);

create policy "Authenticated users can insert media"
  on public.media for insert to authenticated with check (true);

create policy "Users can delete their own media"
  on public.media for delete to authenticated using (uploaded_by = auth.uid());

-- Index for date-based queries
create index if not exists media_taken_at_idx on public.media (taken_at desc);
create index if not exists media_album_id_idx on public.media (album_id);
