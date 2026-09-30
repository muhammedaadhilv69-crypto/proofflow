begin;

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;
set search_path = public, extensions;

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  logo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role text not null default 'MEMBER' check (role in ('OWNER', 'MEMBER')),
  created_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 120),
  email text not null check (char_length(trim(email)) between 3 and 254),
  company text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, workspace_id)
);

create unique index if not exists clients_workspace_email_unique on public.clients (workspace_id, lower(email));

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  client_id uuid not null,
  name text not null check (char_length(trim(name)) between 1 and 160),
  description text,
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'COMPLETED', 'ARCHIVED')),
  due_date timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, workspace_id),
  foreign key (client_id, workspace_id) references public.clients(id, workspace_id) on delete restrict
);

create table if not exists public.deliverables (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null,
  name text not null check (char_length(trim(name)) between 1 and 160),
  description text,
  status text not null default 'DRAFT' check (status in ('DRAFT', 'IN_REVIEW', 'CHANGES_REQUESTED', 'APPROVED', 'ARCHIVED')),
  current_version_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, project_id, workspace_id),
  foreign key (project_id, workspace_id) references public.projects(id, workspace_id) on delete cascade
);

create table if not exists public.files (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete restrict,
  storage_path text not null unique,
  original_filename text not null,
  mime_type text not null check (mime_type in ('image/png', 'image/jpeg', 'image/webp', 'application/pdf', 'image/svg+xml')),
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 26214400),
  created_at timestamptz not null default now(),
  unique (id, workspace_id)
);

create table if not exists public.versions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete restrict,
  project_id uuid not null,
  deliverable_id uuid not null,
  version_number integer not null check (version_number > 0),
  file_id uuid not null,
  description text,
  uploaded_by uuid not null references public.users(id) on delete restrict,
  status text not null default 'IN_REVIEW' check (status in ('IN_REVIEW', 'APPROVED', 'LOCKED')),
  locked_at timestamptz,
  created_at timestamptz not null default now(),
  unique (deliverable_id, version_number),
  unique (deliverable_id, id),
  unique (id, workspace_id),
  unique (id, workspace_id, deliverable_id, project_id),
  foreign key (deliverable_id, project_id, workspace_id) references public.deliverables(id, project_id, workspace_id) on delete restrict,
  foreign key (file_id, workspace_id) references public.files(id, workspace_id) on delete restrict
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete restrict,
  version_id uuid not null,
  author_user_id uuid references public.users(id) on delete set null,
  author_type text not null check (author_type in ('AGENCY', 'CLIENT')),
  author_name text not null,
  author_email text not null,
  body text not null check (char_length(trim(body)) between 1 and 5000),
  comment_type text not null default 'COMMENT' check (comment_type in ('COMMENT', 'CHANGE_REQUEST')),
  created_at timestamptz not null default now(),
  foreign key (version_id, workspace_id) references public.versions(id, workspace_id) on delete restrict
);

create table if not exists public.approval_records (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete restrict,
  project_id uuid not null,
  deliverable_id uuid not null,
  version_id uuid not null unique,
  client_id uuid not null,
  client_name text not null,
  client_email text not null,
  approved_at timestamptz not null default now(),
  approval_number text not null unique,
  status text not null default 'APPROVED' check (status = 'APPROVED'),
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now(),
  foreign key (version_id, workspace_id, deliverable_id, project_id) references public.versions(id, workspace_id, deliverable_id, project_id) on delete restrict,
  foreign key (client_id, workspace_id) references public.clients(id, workspace_id) on delete restrict
);

create table if not exists public.review_tokens (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  version_id uuid not null,
  client_id uuid not null,
  client_name text not null,
  client_email text not null,
  token_hash text not null unique,
  expires_at timestamptz,
  revoked_at timestamptz,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  foreign key (version_id, workspace_id) references public.versions(id, workspace_id) on delete cascade,
  foreign key (client_id, workspace_id) references public.clients(id, workspace_id) on delete cascade
);

create table if not exists public.activity_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  deliverable_id uuid references public.deliverables(id) on delete cascade,
  version_id uuid references public.versions(id) on delete cascade,
  actor_type text not null check (actor_type in ('AGENCY', 'CLIENT')),
  actor_id uuid not null,
  event_type text not null check (event_type in ('PROJECT_CREATED', 'DELIVERABLE_CREATED', 'VERSION_UPLOADED', 'REVIEW_SENT', 'REVIEW_OPENED', 'COMMENT_CREATED', 'CHANGES_REQUESTED', 'APPROVAL_CREATED')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  type text not null,
  title text not null,
  message text not null,
  read boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists workspace_members_user_id_idx on public.workspace_members(user_id);
create index if not exists clients_workspace_id_idx on public.clients(workspace_id);
create index if not exists projects_workspace_id_idx on public.projects(workspace_id);
create index if not exists projects_client_id_idx on public.projects(client_id);
create index if not exists deliverables_workspace_id_idx on public.deliverables(workspace_id);
create index if not exists deliverables_project_id_idx on public.deliverables(project_id);
create index if not exists files_workspace_id_idx on public.files(workspace_id);
create index if not exists versions_workspace_id_idx on public.versions(workspace_id);
create index if not exists versions_deliverable_id_idx on public.versions(deliverable_id);
create index if not exists versions_file_id_idx on public.versions(file_id);
create index if not exists comments_workspace_id_idx on public.comments(workspace_id);
create index if not exists comments_version_id_idx on public.comments(version_id);
create index if not exists approval_records_workspace_id_idx on public.approval_records(workspace_id);
create index if not exists approval_records_version_id_idx on public.approval_records(version_id);
create index if not exists review_tokens_workspace_id_idx on public.review_tokens(workspace_id);
create index if not exists review_tokens_version_id_idx on public.review_tokens(version_id);
create index if not exists review_tokens_token_hash_idx on public.review_tokens(token_hash);
create index if not exists activity_events_workspace_id_idx on public.activity_events(workspace_id);
create index if not exists activity_events_project_id_idx on public.activity_events(project_id);
create index if not exists activity_events_deliverable_id_idx on public.activity_events(deliverable_id);
create index if not exists activity_events_version_id_idx on public.activity_events(version_id);
create index if not exists notifications_workspace_id_user_id_idx on public.notifications(workspace_id, user_id);
create index if not exists notifications_user_id_read_idx on public.notifications(user_id, read);

alter table public.deliverables
  add constraint deliverables_current_version_fk
  foreign key (id, current_version_id) references public.versions(deliverable_id, id) deferrable initially deferred;

commit;
