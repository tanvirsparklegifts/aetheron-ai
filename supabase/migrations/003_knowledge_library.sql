-- AETHERON private knowledge library with account-scoped RLS.
create table if not exists public.knowledge_documents (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 title text not null check (char_length(title) between 1 and 180),
 source_name text not null default '',
 content text not null check (char_length(content) between 1 and 50000),
 is_active boolean not null default true,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists knowledge_documents_user_updated_idx on public.knowledge_documents(user_id,updated_at desc);
alter table public.knowledge_documents enable row level security;
drop policy if exists knowledge_documents_select_own on public.knowledge_documents;
create policy knowledge_documents_select_own on public.knowledge_documents for select to authenticated using ((select auth.uid())=user_id);
drop policy if exists knowledge_documents_insert_own on public.knowledge_documents;
create policy knowledge_documents_insert_own on public.knowledge_documents for insert to authenticated with check ((select auth.uid())=user_id);
drop policy if exists knowledge_documents_update_own on public.knowledge_documents;
create policy knowledge_documents_update_own on public.knowledge_documents for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
drop policy if exists knowledge_documents_delete_own on public.knowledge_documents;
create policy knowledge_documents_delete_own on public.knowledge_documents for delete to authenticated using ((select auth.uid())=user_id);
drop trigger if exists knowledge_documents_set_updated_at on public.knowledge_documents;
create trigger knowledge_documents_set_updated_at before update on public.knowledge_documents for each row execute procedure public.set_updated_at();
