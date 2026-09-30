-- Run This file in supabase ;
begin;

set
  search_path = public,
  extensions;
/* ------------------------------------------------------------------------- *
 * Durable rate limiting
 *
 * The in-process Map used by the app resets on every cold start and is not
 * shared between instances, so it provides no real protection on serverless or
 * multi-instance deployments. These buckets live in Postgres so every instance
 * shares one counter and the limit survives restarts.
 * ------------------------------------------------------------------------- */

create table if not exists public.rate_limit_buckets (
  bucket_key text primary key,
  window_started_at timestamptz not null default now(),
  hit_count integer not null default 0 check (hit_count >= 0)
);

create index if not exists rate_limit_buckets_window_idx on public.rate_limit_buckets (window_started_at);

create or replace function public.consume_rate_limit (p_key text, p_limit integer, p_window_seconds integer) returns boolean language plpgsql volatile security definer
set
  search_path = public,
  extensions as $$
declare
  current_count integer;
  started_at timestamptz;
begin
  if p_limit is null or p_limit <= 0 or p_window_seconds is null or p_window_seconds <= 0 then
    raise exception 'Invalid rate limit configuration';
  end if;

  insert into public.rate_limit_buckets as bucket (bucket_key, window_started_at, hit_count)
  values (p_key, now(), 1)
  on conflict (bucket_key) do update
  set hit_count = case
        when bucket.window_started_at <= now() - make_interval(secs => p_window_seconds) then 1
        else bucket.hit_count + 1
      end,
      window_started_at = case
        when bucket.window_started_at <= now() - make_interval(secs => p_window_seconds) then now()
        else bucket.window_started_at
      end
  returning
    bucket.hit_count,
    bucket.window_started_at into current_count, started_at;

  -- Stale buckets are unreachable once their window has rolled over. Sweep a
  -- bounded slice on window rollover only, so the cost is amortised to roughly
  -- one delete per key per window. skip locked keeps concurrent sweeps from
  -- queueing behind each other on the hot path.
  if started_at = now() then
    delete
      from public.rate_limit_buckets
      where bucket_key in (
        select
          bucket_key
          from public.rate_limit_buckets
          where window_started_at < now() - interval '1 hour'
          limit 200
          for update skip locked
      );
  end if;

  return current_count <= p_limit;
end;
$$;

alter table public.rate_limit_buckets enable row level security;

revoke all on table public.rate_limit_buckets
from
  anon,
  authenticated;

revoke all on function public.consume_rate_limit (text, integer, integer)
from
  public,
  anon,
  authenticated;

grant all on table public.rate_limit_buckets to service_role;

grant execute on function public.consume_rate_limit (text, integer, integer) to service_role;

/* ------------------------------------------------------------------------- *
 * Workspace invitations
 *
 * Invitations can only ever grant the MEMBER role. OWNER is granted by an
 * existing owner promoting a member, which removes the privilege-escalation
 * path through a leaked invitation email entirely.
 * ------------------------------------------------------------------------- */

create table if not exists public.workspace_invitations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  email text not null check (char_length(trim(email)) between 3 and 254),
  role text not null default 'MEMBER' check (role = 'MEMBER'),
  token_hash text not null unique,
  invited_by uuid not null references public.users(id) on delete cascade,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  accepted_by uuid references public.users(id) on delete set null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists workspace_invitations_workspace_id_idx on public.workspace_invitations (workspace_id);
create index if not exists workspace_invitations_pending_idx on public.workspace_invitations (workspace_id, email) where accepted_at is null and revoked_at is null;
create index if not exists workspace_invitations_token_hash_idx on public.workspace_invitations (token_hash);
create index if not exists users_lower_email_idx on public.users (lower(email));

create or replace function public.create_workspace_invitation (p_workspace_id uuid, p_email text) returns jsonb language plpgsql security definer
set
  search_path = public,
  extensions as $$
declare
  normalized_email text;
  workspace_name text;
  raw_token text;
  invitation_id uuid;
  invitation_expiry timestamptz := now() + interval '7 days';
begin
  if auth.uid() is null then
    raise exception 'Unauthorized';
  end if;

  if not public.is_workspace_owner (p_workspace_id) then
    raise exception 'Only workspace owners can invite teammates';
  end if;

  normalized_email := lower(trim(coalesce(p_email, '')));
  if char_length(normalized_email) < 3 or position('@' in normalized_email) < 2 then
    raise exception 'Enter a valid email address';
  end if;

  if exists (
    select 1
    from public.users u
    join public.workspace_members wm on wm.user_id = u.id
    where wm.workspace_id = p_workspace_id and lower(u.email) = normalized_email
  ) then
    raise exception 'That person is already a member of this workspace';
  end if;

  select name into workspace_name from public.workspaces where id = p_workspace_id;
  if workspace_name is null then
    raise exception 'Workspace not found';
  end if;

  update public.workspace_invitations
  set revoked_at = now()
  where workspace_id = p_workspace_id and lower(email) = normalized_email and accepted_at is null and revoked_at is null;

  raw_token := encode(gen_random_bytes(32), 'hex');

  insert into public.workspace_invitations (workspace_id, email, role, token_hash, invited_by, expires_at)
  values (p_workspace_id, normalized_email, 'MEMBER', encode(digest(raw_token, 'sha256'), 'hex'), auth.uid(), invitation_expiry)
  returning id into invitation_id;

  insert into public.activity_events (workspace_id, actor_type, actor_id, event_type, metadata)
  values (p_workspace_id, 'AGENCY', auth.uid(), 'MEMBER_INVITED', jsonb_build_object('email', normalized_email));

  return jsonb_build_object('id', invitation_id, 'token', raw_token, 'email', normalized_email, 'workspace_name', workspace_name, 'expires_at', invitation_expiry);
end;
$$;

create or replace function public.accept_workspace_invitation (p_token text) returns jsonb language plpgsql security definer
set
  search_path = public,
  extensions as $$
declare
  invitation_row public.workspace_invitations%rowtype;
  caller_email text;
  workspace_name text;
  granted_role text;
begin
  if auth.uid() is null then
    raise exception 'Sign in to accept this invitation';
  end if;

  select * into invitation_row from public.workspace_invitations where token_hash = encode(digest(p_token, 'sha256'), 'hex');
  if invitation_row.id is null or invitation_row.revoked_at is not null or invitation_row.accepted_at is not null then
    raise exception 'This invitation is no longer valid';
  end if;

  if invitation_row.expires_at <= now() then
    raise exception 'This invitation has expired';
  end if;

  select lower(email) into caller_email from public.users where id = auth.uid();
  if caller_email is null or caller_email <> lower(invitation_row.email) then
    raise exception 'This invitation was sent to a different email address';
  end if;

  select name into workspace_name from public.workspaces where id = invitation_row.workspace_id;
  if workspace_name is null then
    raise exception 'Workspace no longer exists';
  end if;

  select role into granted_role from public.workspace_members where workspace_id = invitation_row.workspace_id and user_id = auth.uid();
  if granted_role is null then
    insert into public.workspace_members (workspace_id, user_id, role)
    values (invitation_row.workspace_id, auth.uid(), invitation_row.role);
    granted_role := invitation_row.role;

    insert into public.activity_events (workspace_id, actor_type, actor_id, event_type, metadata)
    values (invitation_row.workspace_id, 'AGENCY', auth.uid(), 'MEMBER_JOINED', jsonb_build_object('email', lower(invitation_row.email)));
  end if;

  update public.workspace_invitations
  set accepted_at = now(), accepted_by = auth.uid()
  where id = invitation_row.id;

  return jsonb_build_object('workspace_id', invitation_row.workspace_id, 'workspace_name', workspace_name, 'role', granted_role);
end;
$$;

create or replace function public.revoke_workspace_invitation (p_workspace_id uuid, p_invitation_id uuid) returns boolean language plpgsql security definer
set
  search_path = public,
  extensions as $$
begin
  if not public.is_workspace_owner (p_workspace_id) then
    raise exception 'Only workspace owners can revoke invitations';
  end if;

  update public.workspace_invitations
  set revoked_at = now()
  where id = p_invitation_id and workspace_id = p_workspace_id and accepted_at is null and revoked_at is null;

  if not found then
    raise exception 'Invitation not found';
  end if;

  return true;
end;
$$;

create or replace function public.update_workspace_member_role (p_workspace_id uuid, p_user_id uuid, p_role text) returns jsonb language plpgsql security definer
set
  search_path = public,
  extensions as $$
declare
  remaining_owners integer;
begin
  if not public.is_workspace_owner (p_workspace_id) then
    raise exception 'Only workspace owners can change roles';
  end if;

  if p_role not in ('OWNER', 'MEMBER') then
    raise exception 'Invalid role';
  end if;

  if p_user_id = auth.uid() and p_role <> 'OWNER' then
    raise exception 'You cannot remove your own owner access. Promote another owner first.';
  end if;

  if not exists (select 1 from public.workspace_members where workspace_id = p_workspace_id and user_id = p_user_id) then
    raise exception 'That person is not a member of this workspace';
  end if;

  if p_role = 'MEMBER' then
    select count(*) into remaining_owners from public.workspace_members where workspace_id = p_workspace_id and role = 'OWNER' and user_id <> p_user_id;
    if remaining_owners = 0 then
      raise exception 'A workspace must always keep at least one owner';
    end if;
  end if;

  update public.workspace_members
  set role = p_role
  where workspace_id = p_workspace_id and user_id = p_user_id;

  insert into public.activity_events (workspace_id, actor_type, actor_id, event_type, metadata)
  values (p_workspace_id, 'AGENCY', auth.uid(), 'MEMBER_ROLE_CHANGED', jsonb_build_object('member_id', p_user_id, 'role', p_role));

  return jsonb_build_object('user_id', p_user_id, 'role', p_role);
end;
$$;

create or replace function public.remove_workspace_member (p_workspace_id uuid, p_user_id uuid) returns boolean language plpgsql security definer
set
  search_path = public,
  extensions as $$
declare
  target_role text;
  remaining_owners integer;
begin
  if auth.uid() is null then
    raise exception 'Unauthorized';
  end if;

  if p_user_id <> auth.uid() and not public.is_workspace_owner (p_workspace_id) then
    raise exception 'Only workspace owners can remove other members';
  end if;

  select role into target_role from public.workspace_members where workspace_id = p_workspace_id and user_id = p_user_id;
  if target_role is null then
    raise exception 'That person is not a member of this workspace';
  end if;

  if target_role = 'OWNER' then
    select count(*) into remaining_owners from public.workspace_members where workspace_id = p_workspace_id and role = 'OWNER' and user_id <> p_user_id;
    if remaining_owners = 0 then
      raise exception 'A workspace must always keep at least one owner';
    end if;
  end if;

  delete from public.workspace_members where workspace_id = p_workspace_id and user_id = p_user_id;

  insert into public.activity_events (workspace_id, actor_type, actor_id, event_type, metadata)
  values (p_workspace_id, 'AGENCY', auth.uid(), p_user_id = auth.uid() ? 'MEMBER_LEFT' : 'MEMBER_REMOVED', jsonb_build_object('member_id', p_user_id));

  return true;
end;
$$;

alter table public.workspace_invitations enable row level security;

drop policy if exists workspace_invitations_owner_read on public.workspace_invitations;

create policy workspace_invitations_owner_read on public.workspace_invitations for
select
  to authenticated using (public.is_workspace_owner (workspace_id));

revoke all on table public.workspace_invitations
from
  anon;

revoke insert,
  update,
  delete on public.workspace_invitations
from
  authenticated;

grant select on public.workspace_invitations to authenticated;

grant all on table public.workspace_invitations to service_role;

revoke all on function public.create_workspace_invitation (uuid, text)
from
  public,
  anon;

grant execute on function public.create_workspace_invitation (uuid, text) to authenticated,
  service_role;

revoke all on function public.accept_workspace_invitation (text)
from
  public,
  anon;

grant execute on function public.accept_workspace_invitation (text) to authenticated,
  service_role;

revoke all on function public.revoke_workspace_invitation (uuid, uuid)
from
  public,
  anon;

grant execute on function public.revoke_workspace_invitation (uuid, uuid) to authenticated,
  service_role;

revoke all on function public.update_workspace_member_role (uuid, uuid, text)
from
  public,
  anon;

grant execute on function public.update_workspace_member_role (uuid, uuid, text) to authenticated,
  service_role;

revoke all on function public.remove_workspace_member (uuid, uuid)
from
  public,
  anon;

grant execute on function public.remove_workspace_member (uuid, uuid) to authenticated,
  service_role;

/* ------------------------------------------------------------------------- *
 * Review-open dedupe
 *
 * A public review link is a bearer token, so it is routinely opened many
 * times. Recording one activity row per render inflated the timeline and grew
 * activity_events without bound, so a client now only generates one event per
 * version per day.
 * ------------------------------------------------------------------------- */

-- 001 declared this list as an inline check, which Postgres auto-named
-- activity_events_event_type_check. Drop it first so the wider list can replace
-- it in place, and so re-running this migration is a no-op rather than an error.
drop constraint if exists activity_events_event_type_check on public.activity_events;

alter table public.activity_events
  add constraint activity_events_event_type_check
  check (
    event_type in (
      'PROJECT_CREATED',
      'DELIVERABLE_CREATED',
      'VERSION_UPLOADED',
      'REVIEW_SENT',
      'REVIEW_OPENED',
      'COMMENT_CREATED',
      'CHANGES_REQUESTED',
      'APPROVAL_CREATED',
      'MEMBER_INVITED',
      'MEMBER_JOINED',
      'MEMBER_REMOVED',
      'MEMBER_LEFT',
      'MEMBER_ROLE_CHANGED'
    )
  ) not valid;

alter table public.activity_events
  validate constraint activity_events_event_type_check;

create or replace function public.record_review_opened (p_version_id uuid, p_actor_id uuid) returns boolean language plpgsql volatile security definer
set
  search_path = public,
  extensions as $$
declare
  version_row public.versions%rowtype;
  already_recorded boolean;
begin
  select * into version_row from public.versions where id = p_version_id;
  if version_row.id is null then
    return false;
  end if;

  select exists (
    select 1
    from public.activity_events
    where version_id = p_version_id
      and actor_id = p_actor_id
      and event_type = 'REVIEW_OPENED'
      and created_at > now() - interval '24 hours'
  ) into already_recorded;

  if already_recorded then
    return false;
  end if;

  insert into public.activity_events (workspace_id, project_id, deliverable_id, version_id, actor_type, actor_id, event_type, metadata)
  values (version_row.workspace_id, version_row.project_id, version_row.deliverable_id, version_row.id, 'CLIENT', p_actor_id, 'REVIEW_OPENED', '{}'::jsonb);

  return true;
end;
$$;

revoke all on function public.record_review_opened (uuid, uuid)
from
  public,
  anon,
  authenticated;

grant execute on function public.record_review_opened (uuid, uuid) to service_role;

create index if not exists activity_events_version_actor_opened_idx on public.activity_events (version_id, actor_id, created_at desc)
where event_type = 'REVIEW_OPENED';

commit;
