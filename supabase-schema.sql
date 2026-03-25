-- Hyr — Supabase Database Schema
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor > New Query)

-- 1. Assessments table
create table if not exists assessments (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references auth.users(id) on delete cascade,
  total_score integer not null default 0,
  total_questions integer not null default 0,
  overall_level text not null default '',
  domain_scores jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz default now()
);

-- 2. Assessment answers table
create table if not exists assessment_answers (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references assessments(id) on delete cascade,
  question_id text not null,
  selected_option text not null default '',
  is_correct boolean not null default false,
  time_taken_ms integer not null default 0,
  domain text not null default '',
  difficulty text not null default ''
);

-- 3. Indexes for performance
create index if not exists idx_assessments_candidate on assessments(candidate_id);
create index if not exists idx_assessment_answers_assessment on assessment_answers(assessment_id);

-- 4. Row Level Security (RLS)

-- Enable RLS on both tables
alter table assessments enable row level security;
alter table assessment_answers enable row level security;

-- Assessments: candidates can insert and read their own rows; anyone can read (for shareable links)
create policy "Candidates can insert own assessments"
  on assessments for insert
  to authenticated
  with check (auth.uid() = candidate_id);

create policy "Anyone can view assessments"
  on assessments for select
  to authenticated, anon
  using (true);

-- Assessment answers: candidates can insert; only the candidate can view their answers
create policy "Candidates can insert own answers"
  on assessment_answers for insert
  to authenticated
  with check (
    assessment_id in (
      select id from assessments where candidate_id = auth.uid()
    )
  );

create policy "Candidates can view own answers"
  on assessment_answers for select
  to authenticated
  using (
    assessment_id in (
      select id from assessments where candidate_id = auth.uid()
    )
  );

-- Admin: allow full read access to all assessment answers (for admin dashboard)
-- This uses a simple approach: admins are users with specific emails
-- For production, use a roles table instead
create policy "Admins can view all answers"
  on assessment_answers for select
  to authenticated
  using (
    auth.jwt() ->> 'email' in ('admin@hyr.pk', 'chkk@hyr.pk')
  );
