-- ============================================================
-- Employer Profiles (activation / paywall)
-- ============================================================
create table if not exists employer_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  company_name text not null,
  company_website text,
  hiring_tracks text[] default '{}',
  hiring_description text,
  status text not null default 'pending',  -- pending | active | rejected
  activated_at timestamptz,
  created_at timestamptz default now()
);

alter table employer_profiles enable row level security;

-- Employers can read their own profile
create policy "Employers read own profile"
  on employer_profiles for select
  using (auth.uid() = user_id);

-- Employers can insert their own profile
create policy "Employers insert own profile"
  on employer_profiles for insert
  with check (auth.uid() = user_id);

-- Employers can update their own profile (except status)
create policy "Employers update own profile"
  on employer_profiles for update
  using (auth.uid() = user_id);

-- Anyone authenticated can read active employer profiles (for "Companies Hiring" section)
create policy "Read active employer profiles"
  on employer_profiles for select
  using (status = 'active');

-- ============================================================
-- Conversations
-- ============================================================
create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  employer_id uuid not null,
  candidate_id uuid not null,
  created_at timestamptz default now(),
  unique(employer_id, candidate_id)
);

alter table conversations enable row level security;

-- Participants can read their own conversations
create policy "Read own conversations"
  on conversations for select
  using (auth.uid() = employer_id or auth.uid() = candidate_id);

-- Active employers can create conversations
create policy "Active employers create conversations"
  on conversations for insert
  with check (auth.uid() = employer_id);

-- ============================================================
-- Messages
-- ============================================================
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  sender_id uuid not null,
  content text not null,
  read boolean default false,
  created_at timestamptz default now()
);

alter table messages enable row level security;

-- Participants can read messages in their conversations
create policy "Read own messages"
  on messages for select
  using (
    exists (
      select 1 from conversations c
      where c.id = messages.conversation_id
      and (c.employer_id = auth.uid() or c.candidate_id = auth.uid())
    )
  );

-- Participants can insert messages in their conversations
create policy "Send messages in own conversations"
  on messages for insert
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from conversations c
      where c.id = messages.conversation_id
      and (c.employer_id = auth.uid() or c.candidate_id = auth.uid())
    )
  );

-- Participants can mark messages as read
create policy "Mark messages read"
  on messages for update
  using (
    exists (
      select 1 from conversations c
      where c.id = messages.conversation_id
      and (c.employer_id = auth.uid() or c.candidate_id = auth.uid())
    )
  );

-- ============================================================
-- Enable Realtime on messages table
-- ============================================================
alter publication supabase_realtime add table messages;
