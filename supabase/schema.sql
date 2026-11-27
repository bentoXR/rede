-- Run this in your free Supabase project's SQL Editor to enable PC <-> Mobile sync.

create table if not exists public.hcia_user_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  progress jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.hcia_user_progress enable row level security;

create policy "Users can view their own HCIA progress"
  on public.hcia_user_progress
  for select
  using (auth.uid() = user_id);

create policy "Users can insert their own HCIA progress"
  on public.hcia_user_progress
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own HCIA progress"
  on public.hcia_user_progress
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
