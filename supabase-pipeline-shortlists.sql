-- Employer hiring pipeline entries
-- Run this in the Supabase SQL Editor

CREATE TABLE IF NOT EXISTS pipeline_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  candidate_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hiring_need_id uuid REFERENCES hiring_needs(id) ON DELETE SET NULL,
  stage text NOT NULL DEFAULT 'discovered',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT valid_stage CHECK (stage IN ('discovered', 'contacted', 'interviewing', 'offered', 'hired', 'rejected'))
);

-- Unique per employer+candidate+hiring_need
CREATE UNIQUE INDEX IF NOT EXISTS idx_pipeline_unique 
  ON pipeline_entries(employer_id, candidate_id, hiring_need_id);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_pipeline_employer ON pipeline_entries(employer_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_stage ON pipeline_entries(stage);
CREATE INDEX IF NOT EXISTS idx_pipeline_updated ON pipeline_entries(updated_at DESC);

-- RLS
ALTER TABLE pipeline_entries ENABLE ROW LEVEL SECURITY;

-- Employers can manage their own pipeline
CREATE POLICY "Employers manage own pipeline"
  ON pipeline_entries FOR ALL
  TO authenticated
  USING (auth.uid() = employer_id)
  WITH CHECK (auth.uid() = employer_id);

-- Shortlists table for saving candidates
CREATE TABLE IF NOT EXISTS shortlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  candidate_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hiring_need_id uuid REFERENCES hiring_needs(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_shortlist_unique
  ON shortlists(employer_id, candidate_id);

CREATE INDEX IF NOT EXISTS idx_shortlist_employer ON shortlists(employer_id);

ALTER TABLE shortlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employers manage own shortlists"
  ON shortlists FOR ALL
  TO authenticated
  USING (auth.uid() = employer_id)
  WITH CHECK (auth.uid() = employer_id);
