-- Fix: Allow candidates to update their own assessments (for profile_visible toggle)
drop policy if exists "Candidates update own assessments" on assessments;

create policy "Candidates update own assessments"
  on assessments for update
  using (auth.uid() = candidate_id)
  with check (auth.uid() = candidate_id);
