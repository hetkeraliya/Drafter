-- Run this in the Supabase SQL editor when you connect a project.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text
);

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body text default '',
  type text not null check (type in ('text','todo','images','audio','file')),
  tint text default 'sky',
  pinned boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.checklist_items (
  id uuid primary key default gen_random_uuid(),
  note_id uuid not null references public.notes(id) on delete cascade,
  label text not null,
  checked boolean default false,
  sort_order int default 0
);

create table if not exists public.attachments (
  id uuid primary key default gen_random_uuid(),
  note_id uuid not null references public.notes(id) on delete cascade,
  kind text not null check (kind in ('image','audio','file')),
  url text,
  filename text,
  mime text
);

alter table public.profiles enable row level security;
alter table public.notes enable row level security;
alter table public.checklist_items enable row level security;
alter table public.attachments enable row level security;

create policy "own profile" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "own notes" on public.notes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own items" on public.checklist_items
  for all using (
    exists (select 1 from public.notes n where n.id = note_id and n.user_id = auth.uid())
  );

create policy "own attachments" on public.attachments
  for all using (
    exists (select 1 from public.notes n where n.id = note_id and n.user_id = auth.uid())
  );
