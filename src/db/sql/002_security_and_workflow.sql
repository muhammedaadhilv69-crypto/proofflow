begin;

set
  search_path = public,
  extensions;

alter table public.users
add column if not exists email text;

alter table public.users
add column if not exists full_name text;

alter table public.users
add column if not exists created_at timestamptz not null default now();

alter table public.users
add column if not exists updated_at timestamptz not null default now();

alter table public.workspace_members
add column if not exists role text not null default 'MEMBER';

alter table public.workspace_members
add column if not exists created_at timestamptz not null default now();

alter table public.clients
add column if not exists workspace_id uuid;

alter table public.clients
add column if not exists created_at timestamptz not null default now();

alter table public.clients
add column if not exists updated_at timestamptz not null default now();

alter table public.projects
add column if not exists workspace_id uuid;

alter table public.projects
add column if not exists created_at timestamptz not null default now();

alter table public.projects
add column if not exists updated_at timestamptz not null default now();

alter table public.deliverables
add column if not exists workspace_id uuid;

alter table public.deliverables
add column if not exists current_version_id uuid;

alter table public.deliverables
add column if not exists created_at timestamptz not null default now();

alter table public.deliverables
add column if not exists updated_at timestamptz not null default now();

alter table public.files
add column if not exists workspace_id uuid;

alter table public.files
add column if not exists created_at timestamptz not null default now();

alter table public.versions
add column if not exists workspace_id uuid;

alter table public.versions
add column if not exists project_id uuid;

alter table public.versions
add column if not exists status text not null default 'IN_REVIEW';

alter table public.versions
add column if not exists locked_at timestamptz;

alter table public.versions
add column if not exists created_at timestamptz not null default now();

alter table public.comments
add column if not exists workspace_id uuid;

alter table public.comments
add column if not exists comment_type text not null default 'COMMENT';

alter table public.comments
add column if not exists created_at timestamptz not null default now();

alter table public.approval_records
add column if not exists workspace_id uuid;

alter table public.approval_records
add column if not exists project_id uuid;

alter table public.approval_records
add column if not exists deliverable_id uuid;

alter table public.approval_records
add column if not exists approval_number text;

alter table public.approval_records
add column if not exists status text not null default 'APPROVED';

alter table public.approval_records
add column if not exists ip_address text;

alter table public.approval_records
add column if not exists user_agent text;

alter table public.approval_records
add column if not exists created_at timestamptz not null default now();

alter table public.approval_records
add column if not exists approval_token text;

alter table public.approval_records
alter column approval_token
drop not null;

alter table public.review_tokens
add column if not exists workspace_id uuid;

alter table public.review_tokens
add column if not exists client_id uuid;

alter table public.review_tokens
add column if not exists client_name text;

alter table public.review_tokens
add column if not exists client_email text;

alter table public.review_tokens
add column if not exists token text;

alter table public.review_tokens
alter column token
drop not null;

alter table public.review_tokens
add column if not exists token_hash text;

alter table public.review_tokens
add column if not exists expires_at timestamptz;

alter table public.review_tokens
add column if not exists revoked_at timestamptz;

alter table public.review_tokens
add column if not exists created_by uuid;

alter table public.review_tokens
add column if not exists created_at timestamptz not null default now();

alter table public.activity_events
add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table public.activity_events
add column if not exists created_at timestamptz not null default now();

alter table public.notifications
add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table public.notifications
add column if not exists created_at timestamptz not null default now();

update public.clients c
set
  workspace_id = p.workspace_id
from
  public.projects p
where
  c.id = p.client_id
  and c.workspace_id is null;

update public.projects p
set
  workspace_id = c.workspace_id
from
  public.clients c
where
  p.client_id = c.id
  and p.workspace_id is null;

update public.deliverables d
set
  workspace_id = p.workspace_id
from
  public.projects p
where
  d.project_id = p.id
  and d.workspace_id is null;

update public.versions v
set
  workspace_id = d.workspace_id,
  project_id = d.project_id
from
  public.deliverables d
where
  v.deliverable_id = d.id
  and (
    v.workspace_id is null
    or v.project_id is null
  );

update public.files f
set
  workspace_id = v.workspace_id
from
  public.versions v
where
  f.id = v.file_id
  and f.workspace_id is null;

update public.comments c
set
  workspace_id = v.workspace_id
from
  public.versions v
where
  c.version_id = v.id
  and c.workspace_id is null;

update public.approval_records a
set
  workspace_id = v.workspace_id,
  project_id = v.project_id,
  deliverable_id = v.deliverable_id
from
  public.versions v
where
  a.version_id = v.id
  and (
    a.workspace_id is null
    or a.project_id is null
    or a.deliverable_id is null
  );

update public.review_tokens r
set
  workspace_id = v.workspace_id,
  client_id = p.client_id
from
  public.versions v
  join public.deliverables d on d.id = v.deliverable_id
  join public.projects p on p.id = d.project_id
where
  r.version_id = v.id
  and (
    r.workspace_id is null
    or r.client_id is null
  );

insert into
  public.users (id, email, full_name)
select
  id,
  email,
  coalesce(raw_user_meta_data ->> 'full_name', email)
from
  auth.users
on conflict (id) do update
set
  email = excluded.email,
  full_name = excluded.full_name;

update public.review_tokens r
set
  client_name = c.name,
  client_email = c.email
from
  public.clients c
where
  r.client_id = c.id
  and (
    r.client_name is null
    or r.client_email is null
  );

update public.review_tokens
set
  token_hash = encode(digest (token, 'sha256'), 'hex')
where
  token is not null
  and token_hash is null;

update public.review_tokens
set
  token = null
where
  token is not null;

update public.approval_records
set
  approval_number = 'APR-' || upper(substr(replace(id::text, '-', ''), 1, 16))
where
  approval_number is null;

do $$
begin
  if exists (select 1 from public.approval_records where approval_number is null) then
    raise exception 'approval_number backfill failed';
  end if;
end;
$$;

do $$
begin
  if exists (select 1 from public.clients where workspace_id is null) then raise exception 'client workspace backfill failed'; end if;
  if exists (select 1 from public.projects where workspace_id is null) then raise exception 'project workspace backfill failed'; end if;
  if exists (select 1 from public.deliverables where workspace_id is null) then raise exception 'deliverable workspace backfill failed'; end if;
  if exists (select 1 from public.files where workspace_id is null) then raise exception 'file workspace backfill failed'; end if;
  if exists (select 1 from public.versions where workspace_id is null or project_id is null) then raise exception 'version workspace backfill failed'; end if;
  if exists (select 1 from public.comments where workspace_id is null) then raise exception 'comment workspace backfill failed'; end if;
  if exists (select 1 from public.approval_records where workspace_id is null or project_id is null or deliverable_id is null) then raise exception 'approval workspace backfill failed'; end if;
  if exists (select 1 from public.review_tokens where workspace_id is null or client_id is null) then raise exception 'review token backfill failed'; end if;
  if exists (select 1 from public.review_tokens where client_name is null or client_email is null) then raise exception 'review token client snapshot backfill failed'; end if;
  if exists (select 1 from public.review_tokens where token_hash is null) then raise exception 'review token secret backfill failed'; end if;
  alter table public.review_tokens alter column client_name set not null;
  alter table public.review_tokens alter column client_email set not null;
  alter table public.review_tokens alter column token_hash set not null;
  alter table public.clients alter column workspace_id set not null;
  alter table public.projects alter column workspace_id set not null;
  alter table public.deliverables alter column workspace_id set not null;
  alter table public.files alter column workspace_id set not null;
  alter table public.versions alter column workspace_id set not null;
  alter table public.versions alter column project_id set not null;
  alter table public.comments alter column workspace_id set not null;
  alter table public.approval_records alter column workspace_id set not null;
  alter table public.approval_records alter column project_id set not null;
  alter table public.approval_records alter column deliverable_id set not null;
  alter table public.review_tokens alter column workspace_id set not null;
  alter table public.review_tokens alter column client_id set not null;
end;
$$;

alter table public.approval_records
drop column if exists approval_token;

alter table public.review_tokens
drop column if exists token;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'clients_id_workspace_id_key') then
    alter table public.clients add constraint clients_id_workspace_id_key unique (id, workspace_id);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'projects_id_workspace_id_key') then
    alter table public.projects add constraint projects_id_workspace_id_key unique (id, workspace_id);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'deliverables_id_project_workspace_key') then
    alter table public.deliverables add constraint deliverables_id_project_workspace_key unique (id, project_id, workspace_id);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'files_id_workspace_id_key') then
    alter table public.files add constraint files_id_workspace_id_key unique (id, workspace_id);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'versions_deliverable_id_id_key') then
    alter table public.versions add constraint versions_deliverable_id_id_key unique (deliverable_id, id);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'versions_id_workspace_key') then
    alter table public.versions add constraint versions_id_workspace_key unique (id, workspace_id);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'versions_id_workspace_deliverable_project_key') then
    alter table public.versions add constraint versions_id_workspace_deliverable_project_key unique (id, workspace_id, deliverable_id, project_id);
  end if;
end;
$$;

alter table public.projects
drop constraint if exists projects_client_id_fkey;

alter table public.versions
drop constraint if exists versions_deliverable_id_fkey;

alter table public.versions
drop constraint if exists versions_file_id_fkey;

alter table public.comments
drop constraint if exists comments_version_id_fkey;

alter table public.approval_records
drop constraint if exists approval_records_version_id_fkey;

alter table public.approval_records
drop constraint if exists approval_records_client_id_fkey;

alter table public.approval_records
drop constraint if exists approval_records_workspace_id_fkey;

alter table public.clients
drop constraint if exists clients_workspace_id_fkey;

alter table public.projects
drop constraint if exists projects_workspace_id_fkey;

alter table public.deliverables
drop constraint if exists deliverables_workspace_id_fkey;

alter table public.deliverables
drop constraint if exists deliverables_project_id_fkey;

alter table public.files
drop constraint if exists files_workspace_id_fkey;

alter table public.versions
drop constraint if exists versions_workspace_id_fkey;

alter table public.comments
drop constraint if exists comments_workspace_id_fkey;

alter table public.review_tokens
drop constraint if exists review_tokens_workspace_id_fkey;

alter table public.review_tokens
drop constraint if exists review_tokens_version_id_fkey;

alter table public.review_tokens
drop constraint if exists review_tokens_version_id_key;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'clients_workspace_fk') then
    alter table public.clients add constraint clients_workspace_fk foreign key (workspace_id) references public.workspaces(id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'projects_workspace_fk') then
    alter table public.projects add constraint projects_workspace_fk foreign key (workspace_id) references public.workspaces(id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'deliverables_workspace_fk') then
    alter table public.deliverables add constraint deliverables_workspace_fk foreign key (workspace_id) references public.workspaces(id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'files_workspace_fk') then
    alter table public.files add constraint files_workspace_fk foreign key (workspace_id) references public.workspaces(id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'versions_workspace_fk') then
    alter table public.versions add constraint versions_workspace_fk foreign key (workspace_id) references public.workspaces(id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'comments_workspace_fk') then
    alter table public.comments add constraint comments_workspace_fk foreign key (workspace_id) references public.workspaces(id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'review_tokens_workspace_fk') then
    alter table public.review_tokens add constraint review_tokens_workspace_fk foreign key (workspace_id) references public.workspaces(id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'workspace_members_user_fk') then
    alter table public.workspace_members add constraint workspace_members_user_fk foreign key (user_id) references public.users(id) on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'projects_client_workspace_fk') then
    alter table public.projects add constraint projects_client_workspace_fk foreign key (client_id, workspace_id) references public.clients(id, workspace_id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'deliverables_project_workspace_fk') then
    alter table public.deliverables add constraint deliverables_project_workspace_fk foreign key (project_id, workspace_id) references public.projects(id, workspace_id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'versions_deliverable_workspace_fk') then
    alter table public.versions add constraint versions_deliverable_workspace_fk foreign key (deliverable_id, project_id, workspace_id) references public.deliverables(id, project_id, workspace_id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'versions_file_workspace_fk') then
    alter table public.versions add constraint versions_file_workspace_fk foreign key (file_id, workspace_id) references public.files(id, workspace_id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'comments_version_workspace_fk') then
    alter table public.comments add constraint comments_version_workspace_fk foreign key (version_id, workspace_id) references public.versions(id, workspace_id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'approval_records_version_workspace_fk') then
    alter table public.approval_records add constraint approval_records_version_workspace_fk foreign key (version_id, workspace_id, deliverable_id, project_id) references public.versions(id, workspace_id, deliverable_id, project_id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'approval_records_client_workspace_fk') then
    alter table public.approval_records add constraint approval_records_client_workspace_fk foreign key (client_id, workspace_id) references public.clients(id, workspace_id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'approval_records_workspace_fk') then
    alter table public.approval_records add constraint approval_records_workspace_fk foreign key (workspace_id) references public.workspaces(id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'review_tokens_version_workspace_fk') then
    alter table public.review_tokens add constraint review_tokens_version_workspace_fk foreign key (version_id, workspace_id) references public.versions(id, workspace_id) on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'review_tokens_client_workspace_fk') then
    alter table public.review_tokens add constraint review_tokens_client_workspace_fk foreign key (client_id, workspace_id) references public.clients(id, workspace_id) on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'deliverables_current_version_fk') then
    alter table public.deliverables add constraint deliverables_current_version_fk foreign key (id, current_version_id) references public.versions(deliverable_id, id) deferrable initially deferred;
  end if;
end;
$$;

create or replace function public.set_updated_at () returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.handle_new_user () returns trigger language plpgsql security definer
set
  search_path = public,
  extensions as $$
begin
  insert into public.users (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do update set email = excluded.email, full_name = excluded.full_name, updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert
or
update of email,
raw_user_meta_data on auth.users for each row
execute function public.handle_new_user ();

create or replace function public.is_workspace_member (target_workspace_id uuid) returns boolean language sql stable security definer
set
  search_path = public,
  extensions as $$
  select exists (
    select 1 from public.workspace_members
    where workspace_id = target_workspace_id and user_id = auth.uid()
  );
$$;

create or replace function public.is_workspace_owner (target_workspace_id uuid) returns boolean language sql stable security definer
set
  search_path = public,
  extensions as $$
  select exists (
    select 1 from public.workspace_members
    where workspace_id = target_workspace_id and user_id = auth.uid() and role = 'OWNER'
  );
$$;

create or replace function public.prevent_approval_mutation () returns trigger language plpgsql as $$
begin
  raise exception 'Approval records are immutable';
end;
$$;

create or replace function public.prevent_version_mutation () returns trigger language plpgsql security definer
set
  search_path = public,
  extensions as $$
begin
  if tg_op = 'UPDATE' and old.status = 'IN_REVIEW' and new.locked_at is not null and (to_jsonb(new) - 'status' - 'locked_at') = (to_jsonb(old) - 'status' - 'locked_at') then
    if new.status = 'APPROVED' and exists (select 1 from public.approval_records where version_id = old.id) then
      return new;
    end if;
    if new.status = 'LOCKED' and exists (select 1 from public.deliverables where current_version_id = old.id) then
      return new;
    end if;
  end if;
  raise exception 'Versions are immutable';
end;
$$;

create or replace function public.prevent_comment_mutation () returns trigger language plpgsql as $$
begin
  raise exception 'Comments are immutable';
end;
$$;

create or replace function public.prevent_file_mutation () returns trigger language plpgsql as $$
begin
  raise exception 'Files are immutable';
end;
$$;

create or replace function public.prevent_project_identity_mutation () returns trigger language plpgsql as $$
begin
  if old.workspace_id is distinct from new.workspace_id or old.client_id is distinct from new.client_id then
    raise exception 'Project workspace and client are immutable';
  end if;
  return new;
end;
$$;

drop trigger if exists approval_records_immutable on public.approval_records;

create trigger approval_records_immutable before
update
or delete on public.approval_records for each row
execute function public.prevent_approval_mutation ();

drop trigger if exists versions_immutable on public.versions;

create trigger versions_immutable before
update
or delete on public.versions for each row
execute function public.prevent_version_mutation ();

drop trigger if exists comments_immutable on public.comments;

create trigger comments_immutable before
update
or delete on public.comments for each row
execute function public.prevent_comment_mutation ();

drop trigger if exists files_immutable on public.files;

create trigger files_immutable before
update
or delete on public.files for each row
execute function public.prevent_file_mutation ();

drop trigger if exists projects_identity_immutable on public.projects;

create trigger projects_identity_immutable before
update on public.projects for each row
execute function public.prevent_project_identity_mutation ();

create or replace function public.prevent_archived_deliverable () returns trigger language plpgsql as $$
begin
  if exists (select 1 from public.projects where id = new.project_id and workspace_id = new.workspace_id and status = 'ARCHIVED') then
    raise exception 'Archived projects cannot receive new deliverables';
  end if;
  return new;
end;
$$;

drop trigger if exists deliverables_archived_guard on public.deliverables;

create trigger deliverables_archived_guard before insert on public.deliverables for each row
execute function public.prevent_archived_deliverable ();

do $$
declare
  table_name text;
begin
  foreach table_name in array array['users', 'workspaces', 'clients', 'projects', 'deliverables'] loop
    if not exists (select 1 from pg_trigger where tgname = table_name || '_updated_at') then
      execute format('create trigger %I_updated_at before update on public.%I for each row execute function public.set_updated_at()', table_name, table_name);
    end if;
  end loop;
end;
$$;

create or replace function public.ensure_workspace_for_user (p_user_id uuid, p_workspace_name text) returns jsonb language plpgsql security definer
set
  search_path = public,
  extensions as $$
declare
  existing_workspace uuid;
  new_workspace uuid;
  base_slug text;
  candidate_slug text;
  suffix integer := 0;
  workspace_name text;
  workspace_slug text;
  user_email text;
  user_full_name text;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));
  select wm.workspace_id into existing_workspace
  from public.workspace_members wm
  where wm.user_id = p_user_id
  order by wm.created_at
  limit 1;

  if existing_workspace is not null then
    select name, slug into workspace_name, workspace_slug from public.workspaces where id = existing_workspace;
    return jsonb_build_object('id', existing_workspace, 'name', workspace_name, 'slug', workspace_slug);
  end if;

  select email, full_name into user_email, user_full_name from public.users where id = p_user_id;
  if user_email is null then
    select email, coalesce(raw_user_meta_data ->> 'full_name', email) into user_email, user_full_name from auth.users where id = p_user_id;
    insert into public.users (id, email, full_name) values (p_user_id, user_email, user_full_name)
    on conflict (id) do update set email = excluded.email, full_name = excluded.full_name;
  end if;

  base_slug := trim(both '-' from regexp_replace(lower(coalesce(nullif(p_workspace_name, ''), 'workspace')), '[^a-z0-9]+', '-', 'g'));
  if base_slug = '' then base_slug := 'workspace'; end if;

  loop
    candidate_slug := base_slug || case when suffix = 0 then '' else '-' || suffix::text end;
    exit when not exists (select 1 from public.workspaces where slug = candidate_slug);
    suffix := suffix + 1;
  end loop;

  insert into public.workspaces (name, slug) values (left(coalesce(nullif(p_workspace_name, ''), 'Workspace'), 120), candidate_slug) returning id into new_workspace;
  insert into public.workspace_members (workspace_id, user_id, role) values (new_workspace, p_user_id, 'OWNER');
  select name, slug into workspace_name, workspace_slug from public.workspaces where id = new_workspace;
  return jsonb_build_object('id', new_workspace, 'name', workspace_name, 'slug', workspace_slug);
end;
$$;

create or replace function public.create_version (
  p_workspace_id uuid,
  p_project_id uuid,
  p_deliverable_id uuid,
  p_version_id uuid,
  p_file_id uuid,
  p_storage_path text,
  p_original_filename text,
  p_mime_type text,
  p_size_bytes bigint,
  p_description text,
  p_uploaded_by uuid
) returns jsonb language plpgsql security definer
set
  search_path = public,
  extensions as $$
declare
  locked_project_id uuid;
  locked_current_version uuid;
  locked_status text;
  locked_project_status text;
  next_number integer;
  expected_prefix text;
begin
  if p_mime_type not in ('image/png', 'image/jpeg', 'image/webp', 'application/pdf', 'image/svg+xml') or p_size_bytes <= 0 or p_size_bytes > 26214400 then
    raise exception 'Unsupported file';
  end if;

  if not exists (select 1 from public.workspace_members where workspace_id = p_workspace_id and user_id = p_uploaded_by) then
    raise exception 'Unauthorized';
  end if;

  select d.project_id, d.current_version_id, d.status
  into locked_project_id, locked_current_version, locked_status
  from public.deliverables d
  where d.id = p_deliverable_id and d.project_id = p_project_id and d.workspace_id = p_workspace_id
  for update;
  if locked_current_version is not null then
    perform 1 from public.versions where id = locked_current_version for update;
  end if;
  select p.status into locked_project_status
  from public.projects p
  where p.id = p_project_id and p.workspace_id = p_workspace_id
  for update;

  if locked_project_id is null then raise exception 'Deliverable not found'; end if;
  if locked_project_status is null then raise exception 'Project not found'; end if;
  if locked_status = 'ARCHIVED' or locked_project_status = 'ARCHIVED' then raise exception 'Project or deliverable is archived'; end if;

  expected_prefix := 'workspace/' || p_workspace_id::text || '/project/' || p_project_id::text || '/deliverable/' || p_deliverable_id::text || '/version/' || p_version_id::text || '/';
  if (p_storage_path like expected_prefix || '%') = false then raise exception 'Invalid storage path'; end if;
  if p_storage_path like '%..%' then raise exception 'Invalid storage path'; end if;

  if locked_current_version is not null then
    update public.versions
    set status = 'LOCKED', locked_at = now()
    where id = locked_current_version and status = 'IN_REVIEW';
    update public.review_tokens set revoked_at = now() where version_id = locked_current_version and revoked_at is null;
  end if;

  select coalesce(max(version_number), 0) + 1 into next_number from public.versions where deliverable_id = p_deliverable_id;

  insert into public.files (id, workspace_id, storage_path, original_filename, mime_type, size_bytes)
  values (p_file_id, p_workspace_id, p_storage_path, left(p_original_filename, 255), p_mime_type, p_size_bytes);

  insert into public.versions (id, workspace_id, project_id, deliverable_id, version_number, file_id, description, uploaded_by, status)
  values (p_version_id, p_workspace_id, p_project_id, p_deliverable_id, next_number, p_file_id, nullif(left(p_description, 2000), ''), p_uploaded_by, 'IN_REVIEW');

  update public.deliverables
  set current_version_id = p_version_id, status = 'IN_REVIEW'
  where id = p_deliverable_id;

  insert into public.activity_events (workspace_id, project_id, deliverable_id, version_id, actor_type, actor_id, event_type, metadata)
  values (p_workspace_id, p_project_id, p_deliverable_id, p_version_id, 'AGENCY', p_uploaded_by, 'VERSION_UPLOADED', jsonb_build_object('version_number', next_number));

  return jsonb_build_object('id', p_version_id, 'version_number', next_number, 'file_id', p_file_id, 'status', 'IN_REVIEW');
end;
$$;

create or replace function public.create_review_token (
  p_workspace_id uuid,
  p_version_id uuid,
  p_created_by uuid
) returns jsonb language plpgsql security definer
set
  search_path = public,
  extensions as $$
declare
  version_row public.versions%rowtype;
  deliverable_row public.deliverables%rowtype;
  version_client_id uuid;
  version_project_status text;
  version_client_name text;
  version_client_email text;
  raw_token text;
begin
  if not exists (select 1 from public.workspace_members where workspace_id = p_workspace_id and user_id = p_created_by) then
    raise exception 'Unauthorized';
  end if;

  select * into version_row from public.versions where id = p_version_id and workspace_id = p_workspace_id;
  if version_row.id is null then raise exception 'Version not found'; end if;

  select * into deliverable_row from public.deliverables where id = version_row.deliverable_id and workspace_id = p_workspace_id for update;
  if deliverable_row.id is null then raise exception 'Deliverable not found'; end if;
  select * into version_row from public.versions where id = p_version_id and workspace_id = p_workspace_id for update;

  if version_row.status <> 'IN_REVIEW' or deliverable_row.current_version_id <> p_version_id then raise exception 'Only the current review version can be sent'; end if;
  select p.status, p.client_id, c.name, c.email into version_project_status, version_client_id, version_client_name, version_client_email
  from public.projects p
  join public.clients c on c.id = p.client_id and c.workspace_id = p.workspace_id
  where p.id = version_row.project_id and p.workspace_id = p_workspace_id
  for update of p;
  if version_client_id is null then raise exception 'Project client not found'; end if;
  if version_project_status = 'ARCHIVED' then raise exception 'Project is archived'; end if;

  raw_token := encode(gen_random_bytes(32), 'hex');
  update public.review_tokens set revoked_at = now() where version_id = p_version_id and revoked_at is null;
  insert into public.review_tokens (workspace_id, version_id, client_id, client_name, client_email, token_hash, expires_at, created_by)
  values (p_workspace_id, p_version_id, version_client_id, version_client_name, version_client_email, encode(digest(raw_token, 'sha256'), 'hex'), now() + interval '30 days', p_created_by);

  insert into public.activity_events (workspace_id, project_id, deliverable_id, version_id, actor_type, actor_id, event_type, metadata)
  values (p_workspace_id, version_row.project_id, version_row.deliverable_id, p_version_id, 'AGENCY', p_created_by, 'REVIEW_SENT', '{}'::jsonb);

  return jsonb_build_object('token', raw_token, 'expires_at', now() + interval '30 days');
end;
$$;

create or replace function public.add_review_comment (
  p_token text,
  p_body text,
  p_change_request boolean default false,
  p_ip_address text default null,
  p_user_agent text default null
) returns jsonb language plpgsql security definer
set
  search_path = public,
  extensions as $$
declare
  token_row public.review_tokens%rowtype;
  version_row public.versions%rowtype;
  deliverable_row public.deliverables%rowtype;
  client_row public.clients%rowtype;
  version_deliverable_id uuid;
  project_status text;
  comment_id uuid;
begin
  if char_length(trim(coalesce(p_body, ''))) <
     (case when p_change_request then 10 else 1 end)
   or char_length(p_body) > 5000 then
  raise exception 'Comment is invalid';
end if;

  select * into token_row from public.review_tokens where token_hash = encode(digest(p_token, 'sha256'), 'hex');
  if token_row.id is null or token_row.revoked_at is not null or (token_row.expires_at is not null and token_row.expires_at <= now()) then
    raise exception 'Review link is invalid or expired';
  end if;

  select deliverable_id into version_deliverable_id from public.versions where id = token_row.version_id;
  if version_deliverable_id is null then raise exception 'Version is no longer available'; end if;
  select * into deliverable_row from public.deliverables where id = version_deliverable_id for update;
  select * into version_row from public.versions where id = token_row.version_id for update;
  select status into project_status from public.projects where id = version_row.project_id and workspace_id = version_row.workspace_id for update;
  if project_status = 'ARCHIVED' then raise exception 'Project is archived'; end if;
  select * into token_row from public.review_tokens where id = token_row.id for update;
  if token_row.revoked_at is not null or (token_row.expires_at is not null and token_row.expires_at <= now()) then
    raise exception 'Review link is invalid or expired';
  end if;
  select * into client_row from public.clients where id = token_row.client_id;
  if version_row.status <> 'IN_REVIEW' or deliverable_row.current_version_id <> version_row.id or deliverable_row.status <> 'IN_REVIEW' then
    raise exception 'This version is no longer available for review';
  end if;

  insert into public.comments (workspace_id, version_id, author_type, author_name, author_email, body, comment_type)
  values (version_row.workspace_id, version_row.id, 'CLIENT', token_row.client_name, token_row.client_email, trim(p_body), case when p_change_request then 'CHANGE_REQUEST' else 'COMMENT' end)
  returning id into comment_id;

  if p_change_request then
    update public.deliverables set status = 'CHANGES_REQUESTED' where id = deliverable_row.id;
  end if;

  insert into public.activity_events (workspace_id, project_id, deliverable_id, version_id, actor_type, actor_id, event_type, metadata)
  values (version_row.workspace_id, version_row.project_id, version_row.deliverable_id, version_row.id, 'CLIENT', client_row.id, case when p_change_request then 'CHANGES_REQUESTED' else 'COMMENT_CREATED' end, jsonb_build_object('comment_id', comment_id));

  insert into public.notifications (workspace_id, user_id, type, title, message, metadata)
  select version_row.workspace_id, wm.user_id,
    case when p_change_request then 'CHANGES_REQUESTED' else 'CLIENT_COMMENT' end,
    case when p_change_request then 'Changes requested' else 'New client comment' end,
    case when p_change_request then token_row.client_name || ' requested changes' else token_row.client_name || ' commented' end,
    jsonb_build_object('project_id', version_row.project_id, 'deliverable_id', version_row.deliverable_id, 'version_id', version_row.id)
  from public.workspace_members wm
  where wm.workspace_id = version_row.workspace_id;

  return jsonb_build_object('id', comment_id, 'version_id', version_row.id, 'status', case when p_change_request then 'CHANGES_REQUESTED' else version_row.status end);
end;
$$;

create or replace function public.approve_version (
  p_token text,
  p_ip_address text default null,
  p_user_agent text default null
) returns jsonb language plpgsql security definer
set
  search_path = public,
  extensions as $$
declare
  token_row public.review_tokens%rowtype;
  version_row public.versions%rowtype;
  deliverable_row public.deliverables%rowtype;
  client_row public.clients%rowtype;
  version_deliverable_id uuid;
  project_status text;
  approval_id uuid;
  approval_number text;
begin
  select * into token_row from public.review_tokens where token_hash = encode(digest(p_token, 'sha256'), 'hex');
  if token_row.id is null or token_row.revoked_at is not null or (token_row.expires_at is not null and token_row.expires_at <= now()) then
    raise exception 'Review link is invalid or expired';
  end if;

  select deliverable_id into version_deliverable_id from public.versions where id = token_row.version_id;
  if version_deliverable_id is null then raise exception 'Version is no longer available'; end if;
  select * into deliverable_row from public.deliverables where id = version_deliverable_id for update;
  select * into version_row from public.versions where id = token_row.version_id for update;
  select status into project_status from public.projects where id = version_row.project_id and workspace_id = version_row.workspace_id for update;
  if project_status = 'ARCHIVED' then raise exception 'Project is archived'; end if;
  select * into token_row from public.review_tokens where id = token_row.id for update;
  if token_row.revoked_at is not null or (token_row.expires_at is not null and token_row.expires_at <= now()) then
    raise exception 'Review link is invalid or expired';
  end if;
  select * into client_row from public.clients where id = token_row.client_id;

  if exists (select 1 from public.approval_records where version_id = version_row.id) then
    raise exception 'This version has already been approved';
  end if;
  if version_row.status <> 'IN_REVIEW' or deliverable_row.current_version_id <> version_row.id or deliverable_row.status <> 'IN_REVIEW' then
    raise exception 'This version is no longer available for approval';
  end if;

  approval_id := gen_random_uuid();
  approval_number := 'APR-' || upper(substr(replace(approval_id::text, '-', ''), 1, 16));

  insert into public.approval_records (id, workspace_id, project_id, deliverable_id, version_id, client_id, client_name, client_email, approval_number, ip_address, user_agent)
  values (approval_id, version_row.workspace_id, version_row.project_id, version_row.deliverable_id, version_row.id, client_row.id, token_row.client_name, token_row.client_email, approval_number, left(p_ip_address, 128), left(p_user_agent, 512));

  update public.versions set status = 'APPROVED', locked_at = now() where id = version_row.id;
  update public.deliverables set status = 'APPROVED' where id = deliverable_row.id;

  insert into public.activity_events (workspace_id, project_id, deliverable_id, version_id, actor_type, actor_id, event_type, metadata)
  values (version_row.workspace_id, version_row.project_id, version_row.deliverable_id, version_row.id, 'CLIENT', client_row.id, 'APPROVAL_CREATED', jsonb_build_object('approval_id', approval_id, 'approval_number', approval_number));

  insert into public.notifications (workspace_id, user_id, type, title, message, metadata)
  select version_row.workspace_id, wm.user_id, 'APPROVAL_CREATED', 'Client approved a version', token_row.client_name || ' approved ' || version_row.version_number::text,
    jsonb_build_object('project_id', version_row.project_id, 'deliverable_id', version_row.deliverable_id, 'version_id', version_row.id, 'approval_id', approval_id)
  from public.workspace_members wm
  where wm.workspace_id = version_row.workspace_id;

  return jsonb_build_object('id', approval_id, 'approval_number', approval_number, 'version_id', version_row.id, 'version_number', version_row.version_number, 'status', 'APPROVED');
end;
$$;

create or replace function public.add_agency_comment (
  p_workspace_id uuid,
  p_version_id uuid,
  p_user_id uuid,
  p_body text
) returns jsonb language plpgsql security definer
set
  search_path = public,
  extensions as $$
declare
  version_row public.versions%rowtype;
  comment_id uuid;
begin
  if char_length(trim(coalesce(p_body, ''))) < 1 or char_length(p_body) > 5000 then raise exception 'Comment is invalid'; end if;
  if not exists (select 1 from public.workspace_members where workspace_id = p_workspace_id and user_id = p_user_id) then raise exception 'Unauthorized'; end if;
  select * into version_row from public.versions where id = p_version_id and workspace_id = p_workspace_id for update;
  if version_row.id is null then raise exception 'Version not found'; end if;
  if version_row.status <> 'IN_REVIEW' then raise exception 'This version is locked'; end if;
  if exists (select 1 from public.projects where id = version_row.project_id and workspace_id = version_row.workspace_id and status = 'ARCHIVED') then raise exception 'Project is archived'; end if;
  insert into public.comments (workspace_id, version_id, author_user_id, author_type, author_name, author_email, body)
  values (p_workspace_id, p_version_id, p_user_id, 'AGENCY', coalesce((select full_name from public.users where id = p_user_id), 'Agency member'), coalesce((select email from public.users where id = p_user_id), ''), trim(p_body))
  returning id into comment_id;
  insert into public.activity_events (workspace_id, project_id, deliverable_id, version_id, actor_type, actor_id, event_type, metadata)
  values (version_row.workspace_id, version_row.project_id, version_row.deliverable_id, version_row.id, 'AGENCY', p_user_id, 'COMMENT_CREATED', jsonb_build_object('comment_id', comment_id));
  return jsonb_build_object('id', comment_id);
end;
$$;

alter table public.users enable row level security;

alter table public.workspaces enable row level security;

alter table public.workspace_members enable row level security;

alter table public.clients enable row level security;

alter table public.projects enable row level security;

alter table public.deliverables enable row level security;

alter table public.files enable row level security;

alter table public.versions enable row level security;

alter table public.comments enable row level security;

alter table public.approval_records enable row level security;

alter table public.review_tokens enable row level security;

alter table public.activity_events enable row level security;

alter table public.notifications enable row level security;

drop policy if exists workspace_member_access on public.workspaces;

drop policy if exists workspace_members_access on public.workspace_members;

drop policy if exists clients_workspace_access on public.clients;

drop policy if exists projects_workspace_access on public.projects;

drop policy if exists deliverables_workspace_access on public.deliverables;

drop policy if exists files_workspace_access on public.files;

drop policy if exists versions_workspace_access on public.versions;

drop policy if exists comments_workspace_access on public.comments;

drop policy if exists approval_records_workspace_access on public.approval_records;

drop policy if exists activity_events_workspace_access on public.activity_events;

drop policy if exists review_tokens_public_read on public.review_tokens;

drop policy if exists notifications_user_access on public.notifications;

drop policy if exists users_self_read on public.users;

create policy users_self_read on public.users for
select
  to authenticated using (id = auth.uid ());

drop policy if exists workspaces_member_read on public.workspaces;

create policy workspaces_member_read on public.workspaces for
select
  to authenticated using (public.is_workspace_member (id));

drop policy if exists workspaces_owner_update on public.workspaces;

create policy workspaces_owner_update on public.workspaces
for update
  to authenticated using (public.is_workspace_owner (id))
with
  check (public.is_workspace_owner (id));

drop policy if exists workspace_members_member_read on public.workspace_members;

create policy workspace_members_member_read on public.workspace_members for
select
  to authenticated using (public.is_workspace_member (workspace_id));

drop policy if exists workspace_members_owner_update on public.workspace_members;

create policy workspace_members_owner_update on public.workspace_members
for update
  to authenticated using (public.is_workspace_owner (workspace_id))
with
  check (public.is_workspace_owner (workspace_id));

drop policy if exists clients_member_read on public.clients;

create policy clients_member_read on public.clients for
select
  to authenticated using (public.is_workspace_member (workspace_id));

drop policy if exists clients_member_insert on public.clients;

create policy clients_member_insert on public.clients for insert to authenticated
with
  check (public.is_workspace_member (workspace_id));

drop policy if exists clients_member_update on public.clients;

create policy clients_member_update on public.clients
for update
  to authenticated using (public.is_workspace_member (workspace_id))
with
  check (public.is_workspace_member (workspace_id));

drop policy if exists projects_member_read on public.projects;

create policy projects_member_read on public.projects for
select
  to authenticated using (public.is_workspace_member (workspace_id));

drop policy if exists projects_member_insert on public.projects;

create policy projects_member_insert on public.projects for insert to authenticated
with
  check (public.is_workspace_member (workspace_id));

drop policy if exists projects_member_update on public.projects;

create policy projects_member_update on public.projects
for update
  to authenticated using (public.is_workspace_member (workspace_id))
with
  check (public.is_workspace_member (workspace_id));

drop policy if exists deliverables_member_read on public.deliverables;

create policy deliverables_member_read on public.deliverables for
select
  to authenticated using (public.is_workspace_member (workspace_id));

drop policy if exists deliverables_member_insert on public.deliverables;

create policy deliverables_member_insert on public.deliverables for insert to authenticated
with
  check (public.is_workspace_member (workspace_id));

drop policy if exists deliverables_member_update on public.deliverables;

drop policy if exists files_member_read on public.files;

create policy files_member_read on public.files for
select
  to authenticated using (public.is_workspace_member (workspace_id));

drop policy if exists versions_member_read on public.versions;

create policy versions_member_read on public.versions for
select
  to authenticated using (public.is_workspace_member (workspace_id));

drop policy if exists comments_member_read on public.comments;

create policy comments_member_read on public.comments for
select
  to authenticated using (public.is_workspace_member (workspace_id));

drop policy if exists approval_records_member_read on public.approval_records;

create policy approval_records_member_read on public.approval_records for
select
  to authenticated using (public.is_workspace_member (workspace_id));

drop policy if exists review_tokens_member_read on public.review_tokens;

create policy review_tokens_member_read on public.review_tokens for
select
  to authenticated using (public.is_workspace_member (workspace_id));

drop policy if exists activity_events_member_read on public.activity_events;

create policy activity_events_member_read on public.activity_events for
select
  to authenticated using (public.is_workspace_member (workspace_id));

drop policy if exists notifications_self_read on public.notifications;

create policy notifications_self_read on public.notifications for
select
  to authenticated using (
    user_id = auth.uid ()
    and public.is_workspace_member (workspace_id)
  );

drop policy if exists notifications_self_update on public.notifications;

create policy notifications_self_update on public.notifications
for update
  to authenticated using (user_id = auth.uid ())
with
  check (user_id = auth.uid ());

revoke all on all tables in schema public
from
  anon;

revoke insert,
update,
delete on public.users,
public.workspace_members,
public.files,
public.versions,
public.comments,
public.approval_records,
public.review_tokens,
public.activity_events
from
  authenticated;

revoke insert,
delete on public.workspaces,
public.projects,
public.clients,
public.deliverables
from
  authenticated;

revoke
update,
delete on public.deliverables
from
  authenticated;

revoke insert,
delete on public.notifications
from
  authenticated;

grant
select
  on public.users,
  public.workspaces,
  public.workspace_members,
  public.clients,
  public.projects,
  public.deliverables,
  public.files,
  public.versions,
  public.comments,
  public.approval_records,
  public.review_tokens,
  public.activity_events,
  public.notifications to authenticated;

grant
update on public.workspaces to authenticated;

grant insert,
update on public.clients,
public.projects to authenticated;

grant insert on public.deliverables to authenticated;

grant
update on public.notifications to authenticated;

grant all on all tables in schema public to service_role;

grant usage,
select
  on all sequences in schema public to service_role;

revoke all on function public.is_workspace_member (uuid)
from
  public,
  anon,
  authenticated;

revoke all on function public.is_workspace_owner (uuid)
from
  public,
  anon,
  authenticated;

grant
execute on function public.is_workspace_member (uuid) to authenticated,
service_role;

grant
execute on function public.is_workspace_owner (uuid) to authenticated,
service_role;

revoke all on function public.ensure_workspace_for_user (uuid, text)
from
  public,
  anon,
  authenticated;

grant
execute on function public.ensure_workspace_for_user (uuid, text) to service_role;

revoke all on function public.create_version (
  uuid,
  uuid,
  uuid,
  uuid,
  uuid,
  text,
  text,
  text,
  bigint,
  text,
  uuid
)
from
  public,
  anon,
  authenticated;

grant
execute on function public.create_version (
  uuid,
  uuid,
  uuid,
  uuid,
  uuid,
  text,
  text,
  text,
  bigint,
  text,
  uuid
) to service_role;

revoke all on function public.create_review_token (uuid, uuid, uuid)
from
  public,
  anon,
  authenticated;

grant
execute on function public.create_review_token (uuid, uuid, uuid) to service_role;

revoke all on function public.add_review_comment (text, text, boolean, text, text)
from
  public,
  anon,
  authenticated;

grant
execute on function public.add_review_comment (text, text, boolean, text, text) to service_role;

revoke all on function public.approve_version (text, text, text)
from
  public,
  anon,
  authenticated;

grant
execute on function public.approve_version (text, text, text) to service_role;

revoke all on function public.add_agency_comment (uuid, uuid, uuid, text)
from
  public,
  anon,
  authenticated;

grant
execute on function public.add_agency_comment (uuid, uuid, uuid, text) to service_role;

insert into
  storage.buckets (
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types
  )
values
  (
    'proofflow-files',
    'proofflow-files',
    false,
    26214400,
    array[
      'image/png',
      'image/jpeg',
      'image/webp',
      'application/pdf',
      'image/svg+xml'
    ]
  )
on conflict (id) do update
set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Allow public read access" on storage.objects;

drop policy if exists "Allow public upload" on storage.objects;

drop policy if exists "Allow public select" on storage.objects;

drop policy if exists proofflow_storage_read on storage.objects;

create policy proofflow_storage_read on storage.objects for
select
  to authenticated using (
    bucket_id = 'proofflow-files'
    and name ~ '^workspace/[0-9a-f-]{36}/project/[0-9a-f-]{36}/deliverable/[0-9a-f-]{36}/version/[0-9a-f-]{36}/[A-Za-z0-9._-]+$'
    and public.is_workspace_member (((storage.foldername (name)) [2])::uuid)
  );

drop policy if exists proofflow_storage_insert on storage.objects;

create policy proofflow_storage_insert on storage.objects for insert to authenticated
with
  check (
    bucket_id = 'proofflow-files'
    and name ~ '^workspace/[0-9a-f-]{36}/project/[0-9a-f-]{36}/deliverable/[0-9a-f-]{36}/version/[0-9a-f-]{36}/[A-Za-z0-9._-]+$'
    and public.is_workspace_member (((storage.foldername (name)) [2])::uuid)
    and owner_id = (
      select
        auth.uid()::text
    )
  );

commit;
