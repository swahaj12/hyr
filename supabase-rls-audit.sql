-- ============================================================
-- RLS Audit: Tighten policies for production
-- Run this in the Supabase SQL Editor
-- ============================================================

-- 1. ASSESSMENTS TABLE
-- Drop overly permissive policies if they exist
drop policy if exists "Users can read own assessments" on assessments;
drop policy if exists "Users can insert own assessments" on assessments;
drop policy if exists "Anyone can read assessments" on assessments;
drop policy if exists "Authenticated users can insert assessments" on assessments;
drop policy if exists "Enable read access for all users" on assessments;
drop policy if exists "Enable insert for authenticated users only" on assessments;

-- Candidates can read their own assessments
create policy "Candidates read own assessments"
  on assessments for select
  using (auth.uid() = candidate_id);

-- Candidates can insert their own assessments
create policy "Candidates insert own assessments"
  on assessments for insert
  with check (auth.uid() = candidate_id);

-- Public profiles: allow reading assessments where profile_visible is true (for employer browsing)
-- This allows the /profile/[id] and /employers pages to work without auth
create policy "Public visible assessments"
  on assessments for select
  using (profile_visible = true);

-- 2. ASSESSMENT_ANSWERS TABLE
drop policy if exists "Users can read own answers" on assessment_answers;
drop policy if exists "Users can insert answers" on assessment_answers;
drop policy if exists "Enable read access for all users" on assessment_answers;
drop policy if exists "Enable insert for authenticated users only" on assessment_answers;
drop policy if exists "Anyone can read answers" on assessment_answers;
drop policy if exists "Authenticated users can insert answers" on assessment_answers;

-- Only the assessment owner can read their answers
create policy "Candidates read own answers"
  on assessment_answers for select
  using (
    exists (
      select 1 from assessments
      where assessments.id = assessment_answers.assessment_id
      and assessments.candidate_id = auth.uid()
    )
  );

-- Authenticated users can insert answers (tied to their assessment)
create policy "Candidates insert own answers"
  on assessment_answers for insert
  with check (
    exists (
      select 1 from assessments
      where assessments.id = assessment_answers.assessment_id
      and assessments.candidate_id = auth.uid()
    )
  );

-- 3. WAITLIST TABLE (already has policies from creation, but let's ensure)
drop policy if exists "Anyone can join waitlist" on waitlist;
drop policy if exists "Only admins can read waitlist" on waitlist;

-- Anyone can insert (no auth needed to join waitlist)
create policy "Anyone can join waitlist"
  on waitlist for insert
  with check (true);

-- Nobody can read waitlist via client (admin reads via service role or dashboard)
create policy "No client reads on waitlist"
  on waitlist for select
  using (false);
