-- ============================================================
-- Hiring Needs (Employer Job Requirements)
-- ============================================================
create table if not exists hiring_needs (
  id uuid primary key default gen_random_uuid(),
  employer_id uuid not null,
  company_name text not null,
  title text not null,
  track text not null,
  required_skills text[] not null default '{}',
  preferred_skills text[] default '{}',
  min_level text not null default 'junior',
  urgency text not null default '2weeks',
  description text,
  status text not null default 'active',
  matches_count integer default 0,
  near_matches_count integer default 0,
  notified_count integer default 0,
  created_at timestamptz default now(),
  expires_at timestamptz default (now() + interval '30 days')
);

alter table hiring_needs enable row level security;

create policy "Employers read own hiring needs"
  on hiring_needs for select
  using (auth.uid() = employer_id);

create policy "Employers insert own hiring needs"
  on hiring_needs for insert
  with check (auth.uid() = employer_id);

create policy "Employers update own hiring needs"
  on hiring_needs for update
  using (auth.uid() = employer_id);

create policy "Active hiring needs visible to candidates"
  on hiring_needs for select
  using (status = 'active');

-- ============================================================
-- Candidate Notifications (Opportunity Alerts)
-- ============================================================
create table if not exists candidate_notifications (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null,
  hiring_need_id uuid references hiring_needs(id) on delete cascade,
  type text not null default 'opportunity',
  title text not null,
  message text not null,
  skill_gaps text[] default '{}',
  match_pct integer default 0,
  read boolean default false,
  created_at timestamptz default now()
);

alter table candidate_notifications enable row level security;

create policy "Candidates read own notifications"
  on candidate_notifications for select
  using (auth.uid() = candidate_id);

create policy "Candidates update own notifications"
  on candidate_notifications for update
  using (auth.uid() = candidate_id);

-- Service role inserts notifications (from matching engine)
-- No insert policy for regular users — only server/service role creates these

-- ============================================================
-- Indexes for performance
-- ============================================================
create index if not exists idx_hiring_needs_employer on hiring_needs(employer_id);
create index if not exists idx_hiring_needs_status on hiring_needs(status);
create index if not exists idx_hiring_needs_track on hiring_needs(track);
create index if not exists idx_notifications_candidate on candidate_notifications(candidate_id);
create index if not exists idx_notifications_read on candidate_notifications(candidate_id, read);
create index if not exists idx_notifications_hiring_need on candidate_notifications(hiring_need_id);
