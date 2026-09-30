-- Run This file in supabase ;
begin;

set
  search_path = public,
  extensions;

/* ------------------------------------------------------------------------- *
 * Per-window bucket expiry
 *
 * 003 swept stale buckets on a flat `window_started_at < now() - interval
 * '1 hour'`, because at the time every bucket was either a 15 minute auth burst
 * or a 1 hour invitation — so a flat hour was the largest window in use and
 * deleting on it was safe.
 *
 * It stopped being safe once the per-account auth limit became reachable. That
 * bucket is a 24 hour window, and its `window_started_at` is only rewritten on
 * rollover, so it stayed pinned at its insert time and was deleted roughly an
 * hour in. The next attempt then took the plain INSERT path and started again
 * from 1, turning a 30-per-day ceiling into roughly 30-per-hour — silently
 * weakening the only control that survives address rotation.
 *
 * The window is now recorded per row and the sweep expires each row against its
 * own. 3600 is retained as the default so rows written before this migration
 * keep the behaviour they had.
 * ------------------------------------------------------------------------- */

alter table public.rate_limit_buckets
  add column if not exists window_seconds integer not null default 3600;

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

  insert into public.rate_limit_buckets as bucket (bucket_key, window_started_at, hit_count, window_seconds)
  values (p_key, now(), 1, p_window_seconds)
  on conflict (bucket_key) do update
  set hit_count = case
        when bucket.window_started_at <= now() - make_interval(secs => p_window_seconds) then 1
        else bucket.hit_count + 1
      end,
      window_started_at = case
        when bucket.window_started_at <= now() - make_interval(secs => p_window_seconds) then now()
        else bucket.window_started_at
      end,
      -- Recorded on insert and refreshed only on rollover, so a row always
      -- expires against the window it is actually counting.
      window_seconds = case
        when bucket.window_started_at <= now() - make_interval(secs => p_window_seconds) then p_window_seconds
        else bucket.window_seconds
      end
  returning
    bucket.hit_count,
    bucket.window_started_at into current_count, started_at;

  -- Stale buckets are unreachable once their window has rolled over. Sweep a
  -- bounded slice on window rollover only, so the cost is amortised to roughly
  -- one delete per key per window. skip locked keeps concurrent sweeps from
  -- queueing behind each other on the hot path. Each row is compared against
  -- its own window, not a flat hour.
  if started_at = now() then
    delete
      from public.rate_limit_buckets
      where bucket_key in (
        select
          bucket_key
          from public.rate_limit_buckets
          where window_started_at < now() - make_interval(secs => coalesce(window_seconds, 3600))
          limit 200
          for update skip locked
      );
  end if;

  return current_count <= p_limit;
end;
$$;

revoke all on function public.consume_rate_limit (text, integer, integer)
from
  public,
  anon,
  authenticated;

grant execute on function public.consume_rate_limit (text, integer, integer) to service_role;

commit;
