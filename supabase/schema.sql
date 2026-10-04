-- Draftr cloud schema. Run once in the Supabase SQL editor (safe to re-run).
-- Uses its own table name so it never collides with other apps in the same project.

create table if not exists public.draftr_notes (
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  id          text not null,
  title       text not null default '',
  body        text not null default '',
  type        text not null default 'text',
  tint        text not null default 'sky',
  pinned      boolean not null default false,
  tags        text[] not null default '{}',
  items       jsonb not null default '[]'::jsonb,
  attachments jsonb not null default '[]'::jsonb,
  remind_at   timestamptz,
  deleted_at  timestamptz,
  parent_id   text,
  position    double precision,
  canvas_x    double precision,
  canvas_y    double precision,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  primary key (user_id, id)
);

create index if not exists draftr_notes_user_updated_idx
  on public.draftr_notes (user_id, updated_at desc);

alter table public.draftr_notes enable row level security;

drop policy if exists "draftr notes: own rows" on public.draftr_notes;
create policy "draftr notes: own rows" on public.draftr_notes
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Folders and manual order (safe to re-run on an existing table).
alter table public.draftr_notes add column if not exists parent_id text;
alter table public.draftr_notes add column if not exists position double precision;
alter table public.draftr_notes add column if not exists canvas_x double precision;
alter table public.draftr_notes add column if not exists canvas_y double precision;
