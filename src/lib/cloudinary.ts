export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  resource_type: 'image' | 'video' | 'raw';
  duration?: number;
  thumbnail_url?: string;
  format: string;
}

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string;

export async function uploadToCloudinary(
  file: File,
  onProgress?: (pct: number) => void
): Promise<CloudinaryUploadResult> {
  const resourceType = file.type.startsWith('video/')
    ? 'video'
    : file.type.startsWith('audio/')
    ? 'video' // Cloudinary uses 'video' resource_type for audio too
    : 'image';

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('folder', 'heartstrings');

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        const res = JSON.parse(xhr.responseText);
        // Generate a thumbnail for videos
        const thumbnail_url =
          resourceType === 'video'
            ? `https://res.cloudinary.com/${CLOUD_NAME}/video/upload/so_0,w_400,h_300,c_fill,f_jpg/${res.public_id}.jpg`
            : undefined;

        resolve({
          public_id: res.public_id,
          secure_url: res.secure_url,
          resource_type: resourceType,
          duration: res.duration,
          thumbnail_url,
          format: res.format,
        });
      } else {
        reject(new Error(`Upload failed: ${xhr.statusText}`));
      }
    });

    xhr.addEventListener('error', () => reject(new Error('Upload failed')));

    xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`);
    xhr.send(formData);
  });
}

export function getMediaType(file: File): 'image' | 'video' | 'audio' {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('video/')) return 'video';
  if (file.type.startsWith('audio/')) return 'audio';
  throw new Error(`Unsupported file type: ${file.type}`);
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
