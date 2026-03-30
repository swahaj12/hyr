-- ============================================================
-- Candidate Profiles (passive + verified)
-- ============================================================
create table if not exists candidate_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id),
  name text not null,
  track text not null,
  experience text not null,
  skills text[] not null default '{}',
  headline text,
  linkedin_url text,
  resume_url text,
  verified boolean default false,
  profile_visible boolean default true,
  created_at timestamptz default now()
);

alter table candidate_profiles enable row level security;

create policy "Users read own profile"
  on candidate_profiles for select
  using (auth.uid() = user_id);

create policy "Users insert own profile"
  on candidate_profiles for insert
  with check (auth.uid() = user_id);

create policy "Users update own profile"
  on candidate_profiles for update
  using (auth.uid() = user_id);

create policy "Visible profiles readable by all authenticated"
  on candidate_profiles for select
  using (profile_visible = true);

create index if not exists idx_candidate_profiles_user on candidate_profiles(user_id);
create index if not exists idx_candidate_profiles_track on candidate_profiles(track);
create index if not exists idx_candidate_profiles_verified on candidate_profiles(verified);

-- ============================================================
-- Supabase Storage: Create a bucket called "resumes" manually
-- in Supabase Dashboard > Storage > New Bucket
-- Name: resumes
-- Public: false (private — accessed via signed URLs)
-- Allowed MIME types: application/pdf
-- Max file size: 5MB
-- ============================================================
