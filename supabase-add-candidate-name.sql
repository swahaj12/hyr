-- Add candidate_name column to assessments table
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New Query)

alter table assessments add column if not exists candidate_name text default null;
