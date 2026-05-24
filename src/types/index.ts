export type MediaType = 'image' | 'video' | 'audio';

export interface MediaItem {
  id: string;
  title: string;
  caption?: string;
  media_type: MediaType;
  cloudinary_url: string;
  cloudinary_public_id: string;
  thumbnail_url?: string;
  taken_at: string;
  album_id?: string;
  uploaded_by: string;
  created_at: string;
  duration?: number;
  tags?: string[];
}

export interface Album {
  id: string;
  name: string;
  description?: string;
  cover_url?: string;
  created_at: string;
  media_count?: number;
}

export interface User {
  id: string;
  email: string;
  display_name?: string;
}

export interface UploadFile {
  file: File;
  preview: string;
  title: string;
  caption: string;
  taken_at: string;
  album_id: string;
  tags: string;
  progress: number;
  status: 'pending' | 'uploading' | 'done' | 'error';
  error?: string;
}

export type ViewMode = 'grid' | 'timeline' | 'albums';
export type Theme = 'light' | 'dark';

export interface DateGroup {
  label: string;
  year: number;
  month: number;
  items: MediaItem[];
}
