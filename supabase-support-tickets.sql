-- ============================================================
-- Support Tickets (user -> admin communication)
-- ============================================================
create table if not exists support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  user_email text not null,
  user_role text not null default 'candidate',
  subject text not null,
  status text not null default 'open',
  created_at timestamptz default now(),
  resolved_at timestamptz
);

alter table support_tickets enable row level security;

create policy "Users read own tickets"
  on support_tickets for select
  using (auth.uid() = user_id);

create policy "Users create own tickets"
  on support_tickets for insert
  with check (auth.uid() = user_id);

-- ============================================================
-- Support Messages (threaded replies on tickets)
-- ============================================================
create table if not exists support_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references support_tickets(id) on delete cascade,
  sender_id uuid not null,
  is_admin boolean default false,
  content text not null,
  created_at timestamptz default now()
);

alter table support_messages enable row level security;

create policy "Users read own ticket messages"
  on support_messages for select
  using (
    exists (
      select 1 from support_tickets t
      where t.id = support_messages.ticket_id
      and t.user_id = auth.uid()
    )
  );

create policy "Users send own ticket messages"
  on support_messages for insert
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from support_tickets t
      where t.id = support_messages.ticket_id
      and t.user_id = auth.uid()
    )
  );
