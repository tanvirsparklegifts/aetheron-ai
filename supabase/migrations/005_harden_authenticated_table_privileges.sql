-- AETHERON least-privilege grants for private workspace tables.
-- RLS policies continue to restrict authenticated CRUD to each user's own rows.
grant select, insert, update, delete on table public.projects, public.tasks, public.knowledge_documents to authenticated;
revoke all privileges on table public.projects, public.tasks, public.knowledge_documents from anon;
revoke truncate, references, trigger on table public.projects, public.tasks, public.knowledge_documents from authenticated;
-- Remove privileges for operations with no corresponding application policy/feature.
revoke delete on table public.profiles from authenticated;
revoke update on table public.messages from authenticated;
