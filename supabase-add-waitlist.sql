-- Waitlist for upcoming assessment tracks
create table if not exists waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  domain text not null,
  created_at timestamptz default now()
);

-- Allow anonymous inserts (no auth required to join waitlist)
alter table waitlist enable row level security;
create policy "Anyone can join waitlist" on waitlist for insert with check (true);
create policy "Only admins can read waitlist" on waitlist for select using (false);
