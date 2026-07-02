-- Run this in Supabase → SQL Editor → New Query

create table trinkets (
  id uuid default gen_random_uuid() primary key,
  session_id text not null,
  name text not null,
  place text,
  country text,
  region text,
  date text,
  emotion text,
  acquisition text,
  material text,
  material_type text,
  era text,
  era_rank integer default 5,
  rarity text,
  note text,
  inferred_links integer default 1,
  created_at timestamp with time zone default now()
);

-- Allow public read/write (no auth needed for prototype)
alter table trinkets enable row level security;

create policy "allow all" on trinkets for all using (true) with check (true);
