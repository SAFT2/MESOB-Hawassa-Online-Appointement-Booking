-- Create chat tables and RLS policies for support chat
-- Run this migration in your Supabase project

-- Conversations table
create table if not exists public.chat_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  issue_type text null,
  language text null,
  status text not null default 'open',
  created_at timestamptz not null default now()
);

-- Messages table
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.chat_conversations(id) on delete cascade,
  sender text not null, -- 'citizen' or 'admin'/'agent'
  sender_id uuid null,
  content text not null,
  read_by_admin boolean not null default false,
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.chat_conversations enable row level security;
alter table public.chat_messages enable row level security;

-- Helper: staff check
-- assumes there is a user_roles table with columns (user_id, role)

-- Conversations: citizens can select/insert their own conversations
create policy "citizen_select_own_conversations" on public.chat_conversations
  for select using ( auth.uid() = user_id );

create policy "citizen_insert_own_conversations" on public.chat_conversations
  for insert with check ( auth.uid() = user_id );

-- Staff (admin/agent) can select and manage all conversations
create policy "staff_manage_conversations" on public.chat_conversations
  for all using (
    exists (
      select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.role in ('admin','agent')
    )
  ) with check (
    exists (
      select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.role in ('admin','agent')
    )
  );

-- Messages: citizens can insert messages into their own conversations and select them
create policy "citizen_select_messages" on public.chat_messages
  for select using (
    exists (
      select 1 from public.chat_conversations c where c.id = conversation_id and c.user_id = auth.uid()
    )
  );

create policy "citizen_insert_messages" on public.chat_messages
  for insert with check (
    sender = 'citizen' and exists (
      select 1 from public.chat_conversations c where c.id = conversation_id and c.user_id = auth.uid()
    )
  );

-- Staff can select/insert/update messages
create policy "staff_manage_messages" on public.chat_messages
  for all using (
    exists (
      select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.role in ('admin','agent')
    )
  ) with check (
    exists (
      select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.role in ('admin','agent')
    )
  );

-- Index for fast unread count
create index if not exists idx_chat_messages_read_by_admin on public.chat_messages (read_by_admin);
