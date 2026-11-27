-- Index the tasks.user_id foreign key for user-scoped filtering and joins.
-- Safe to re-run if the index already exists in the hosted database.
create index if not exists tasks_user_id_idx on public.tasks (user_id);
