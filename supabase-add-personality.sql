-- Add personality type to assessments
alter table assessments add column if not exists personality_type text default null;
