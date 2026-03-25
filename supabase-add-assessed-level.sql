-- Add assessed_level column to assessments table
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New Query)

alter table assessments add column if not exists assessed_level text default null;
