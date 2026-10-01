# Draftr

A sleek, minimal notes app with a liquid glass interface.

## Features

- Home masonry of notes (lists, thoughts, photos, audio, files)
- Tabs: All Notes, To-Do, Images, Imported
- Create text, to-do, image, audio, and file notes
- Toggle checklist items
- Edit and delete notes
- Email / password and Google buttons (demo mode until Supabase is connected)
- Works in the browser via `localStorage`

## Local

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Cloud sync (optional)

1. Create a free Supabase project.
2. Run `supabase/schema.sql` in the SQL editor.
3. Enable Email and Google providers under Authentication.
4. Copy `.env.example` to `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Until those keys exist, Draftr stays in demo mode so every screen works immediately.

## Stack

Next.js 15 · App Router · Tailwind CSS 4 · TypeScript
