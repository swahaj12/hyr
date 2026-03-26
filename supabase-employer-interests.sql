-- Employer interest / "Show Interest" tracking
create table if not exists employer_interests (
  id uuid primary key default gen_random_uuid(),
  employer_id uuid not null,
  employer_name text,
  employer_email text,
  candidate_id uuid not null,
  message text,
  created_at timestamptz default now()
);

alter table employer_interests enable row level security;

-- Employers can insert their own interests
create policy "Employers can insert interests"
  on employer_interests for insert
  with check (auth.uid() = employer_id);

-- Employers can read their own sent interests
create policy "Employers read own interests"
  on employer_interests for select
  using (auth.uid() = employer_id);

-- Candidates can read interests sent to them
create policy "Candidates read received interests"
  on employer_interests for select
  using (auth.uid() = candidate_id);

-- Profile views tracking
create table if not exists profile_views (
  id uuid primary key default gen_random_uuid(),
  viewer_id uuid,
  candidate_id uuid not null,
  viewer_role text,
  created_at timestamptz default now()
);

alter table profile_views enable row level security;

-- Anyone can insert a view (logged in)
create policy "Authenticated users can log views"
  on profile_views for insert
  with check (auth.uid() = viewer_id);

-- Candidates can read their own views
create policy "Candidates read own views"
  on profile_views for select
  using (auth.uid() = candidate_id);
