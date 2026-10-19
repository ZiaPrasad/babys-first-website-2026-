-- Wish Wall guestbook. Paste this into the Supabase SQL editor and run it once.
-- Visitors (using the public anon key) can read messages and add new ones. They cannot edit or delete anything.

create table if not exists public.guestbook (
  id bigint generated always as identity primary key,
  name text check (name is null or char_length(name) <= 40),
  message text not null check (char_length(message) between 2 and 140),
  created_at timestamptz not null default now()
);

alter table public.guestbook enable row level security;

drop policy if exists "anyone can read the wall" on public.guestbook;
create policy "anyone can read the wall" on public.guestbook
  for select using (true);

drop policy if exists "anyone can leave a star" on public.guestbook;
create policy "anyone can leave a star" on public.guestbook
  for insert with check (true);
