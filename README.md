# 🎞️ Heartstrings

A digital memory book for photos, videos, and audio — grouped by date and albums.

## Stack
- **Frontend**: React + TypeScript + Vite
- **Auth + DB**: Supabase (free tier)
- **Media storage**: Cloudinary (free tier)
- **Hosting**: Vercel (free)

## Setup (15 min)

### 1. Supabase
1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the contents of `supabase-schema.sql`
3. Go to **Settings > API** and copy your Project URL and anon key
4. Go to **Authentication > Users** and manually add family members

### 2. Cloudinary
1. Create a free account at [cloudinary.com](https://cloudinary.com)
2. Go to **Settings > Upload** and create an **Unsigned Upload Preset** named `heartstrings`
3. Copy your **Cloud name** from the dashboard

### 3. Local setup
```bash
cp .env.example .env
# Fill in your keys in .env

npm install
npm run dev
```

### 4. Deploy to Vercel
```bash
npm install -g vercel
vercel
# Add your env vars in the Vercel dashboard
```

## Features
- 🔐 Password-protected (Supabase Auth)
- 📸 Photos, 🎬 Videos, 🎵 Audio support
- ⬆️ Bulk upload with per-file metadata editing
- 🗂 Grid, Timeline (by month/year), and Albums views
- 🔍 Search by title, caption, or tags
- 🖼 Click-to-view lightbox with keyboard navigation
- 🌙 Light/dark mode
- 📱 Responsive
