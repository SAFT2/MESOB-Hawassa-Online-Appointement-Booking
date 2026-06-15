Support Chat — setup & local testing
=================================

This document explains how to enable the Support Chat feature added to this repository. It contains two parts:

- Instructions for an admin who has access to the project's Supabase instance (recommended). These steps must be completed before admins use the feature in production.
- Instructions to test the feature locally if you do not have access to the remote Supabase instance.

1) Admin: apply the migration to the Supabase project
--------------------------------------------------

File to run: `supabase/migrations/20260615000000_add_chat_tables.sql`

- Open the Supabase dashboard for your project -> SQL Editor.
- Copy & paste the complete SQL from the file above and run it.
- Confirm the tables `chat_conversations` and `chat_messages` exist and that RLS policies were created.

Notes:
- The RLS policies assume you have a `user_roles` table and `profiles` table matching the project's schema. If your schema differs, adapt the SQL accordingly.
- This migration enables realtime notifications and adds an index used to compute unread counts.

2) Local testing without remote Supabase access
----------------------------------------------

If you do not have access to the hosted Supabase project you can still do a local smoke test. There are two approaches listed below.

Option A — Quick SQL-only test (no realtime)
- Start a local Postgres instance (Docker recommended).

  PowerShell commands:

  docker run --name mesob-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=postgres -p 5432:5432 -d postgres:15
  docker cp supabase/migrations/20260615000000_add_chat_tables.sql mesob-postgres:/tmp/migration.sql
  docker exec -it mesob-postgres psql -U postgres -d postgres -f /tmp/migration.sql

- You can then inspect the tables using `psql` or a GUI. This validates the SQL but does NOT provide Supabase auth/realtime behavior.

Option B — Full local Supabase (recommended for feature testing)
- Install the Supabase CLI following the official docs: https://supabase.com/docs/guides/cli
- From the project root run:

  supabase init
  supabase start

- Use the Supabase local dashboard or `supabase` CLI to apply the migration. With the CLI you can copy the SQL into the local project's `supabase/migrations/` and run migrate commands as per Supabase docs.

3) Local app configuration and testing steps
-------------------------------------------

- Create a new Git branch for local testing:

  git checkout -b feature/support-chat-local

- Install dependencies (if not already):

  npm install

- Create a `.env` or set the environment variables used by your app so the Supabase client can connect. Example env vars (adjust values for local Supabase):

  VITE_SUPABASE_URL=http://localhost:54321
  VITE_SUPABASE_PUBLISHABLE_KEY=some_public_anon_key

- Start the dev server:

  npm run dev

- Manual test flow:
  - Open the app in a browser and sign up as a citizen (or create a profile in the local DB). Click the floating "Support" button and send a message.
  - In another browser/incognito, sign in as an admin/agent and open `/admin/chats`. The new conversation should appear and replies should be sent/received in realtime (if using full Supabase local with realtime enabled).

4) If you can't run realtime locally
-----------------------------------

- The UI will still allow message insertion and conversation creation; however, realtime updates (server push) require Supabase Realtime — either the hosted Supabase project or the local Supabase CLI environment.

5) After you've verified locally
--------------------------------

- Commit and push your branch, open a PR, and request that a project admin run the SQL in production before merging/launching. Add a note in the PR description pointing to `supabase/migrations/20260615000000_add_chat_tables.sql` and this README.

6) Optional: testing helper (manual SQL)
---------------------------------------

If you prefer to create a conversation and a message manually via SQL for testing, you can run:

  INSERT INTO public.chat_conversations (user_id) VALUES ('<citizen-uuid>');
  INSERT INTO public.chat_messages (conversation_id, sender, sender_id, content) VALUES ('<conversation-uuid>', 'citizen', '<citizen-uuid>', 'Hello from test');

Replace `<citizen-uuid>`/`<conversation-uuid>` with real UUIDs from your test data.

Questions or want me to run the dev server here to smoke-test the frontend UI?
