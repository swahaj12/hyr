-- Add tab_switches column to assessments table
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New Query)

alter table assessments add column if not exists tab_switches integer default 0;
