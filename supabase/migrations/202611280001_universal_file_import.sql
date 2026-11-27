-- AETHERON Universal File Import: private binary storage and metadata.
-- Apply only after review. This migration is not applied to production by this commit.
-- Files are never executed. Extraction is a separate, sandboxed processing stage.

create table if not exists public.knowledge_files (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 180),
  source_name text not null check (char_length(source_name) between 1 and 255),
  storage_path text not null unique,
  mime_type text not null default 'application/octet-stream',
  extension text not null default '',
  file_size bigint not null check (file_size > 0 and file_size <= 52428800),
  processing_status text not null default 'stored'
    check (processing_status in ('stored', 'queued', 'processing', 'ready', 'unsupported', 'quarantined', 'failed')),
  extracted_text text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists knowledge_files_user_updated_idx
  on public.knowledge_files (user_id, updated_at desc);

alter table public.knowledge_files enable row level security;

drop policy if exists "knowledge_files_select_own" on public.knowledge_files;
create policy "knowledge_files_select_own" on public.knowledge_files
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "knowledge_files_insert_own" on public.knowledge_files;
create policy "knowledge_files_insert_own" on public.knowledge_files
  for insert to authenticated with check (
    (select auth.uid()) = user_id
    and storage_path like (select auth.uid())::text || '/%'
  );

drop policy if exists "knowledge_files_update_own" on public.knowledge_files;
create policy "knowledge_files_update_own" on public.knowledge_files
  for update to authenticated using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and storage_path like (select auth.uid())::text || '/%'
  );

drop policy if exists "knowledge_files_delete_own" on public.knowledge_files;
create policy "knowledge_files_delete_own" on public.knowledge_files
  for delete to authenticated using ((select auth.uid()) = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('aetheron-private-files', 'aetheron-private-files', false, 52428800, null)
on conflict (id) do update set
  public = false,
  file_size_limit = 52428800,
  allowed_mime_types = null;

drop policy if exists "aetheron_private_files_read_own" on storage.objects;
create policy "aetheron_private_files_read_own" on storage.objects
  for select to authenticated using (
    bucket_id = 'aetheron-private-files'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "aetheron_private_files_insert_own" on storage.objects;
create policy "aetheron_private_files_insert_own" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'aetheron-private-files'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "aetheron_private_files_update_own" on storage.objects;
create policy "aetheron_private_files_update_own" on storage.objects
  for update to authenticated using (
    bucket_id = 'aetheron-private-files'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  ) with check (
    bucket_id = 'aetheron-private-files'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "aetheron_private_files_delete_own" on storage.objects;
create policy "aetheron_private_files_delete_own" on storage.objects
  for delete to authenticated using (
    bucket_id = 'aetheron-private-files'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop trigger if exists knowledge_files_set_updated_at on public.knowledge_files;
create trigger knowledge_files_set_updated_at before update on public.knowledge_files
  for each row execute procedure public.set_updated_at();
