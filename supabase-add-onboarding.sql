-- Add onboarding self-report columns to assessments
alter table assessments add column if not exists self_track text default null;
alter table assessments add column if not exists self_experience text default null;
alter table assessments add column if not exists self_strengths text[] default null;

-- Add profile visibility toggle for candidates
alter table assessments add column if not exists profile_visible boolean default true;
