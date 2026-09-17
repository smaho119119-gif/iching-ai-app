-- Optional one-row marker used only by the authenticated daily keepalive.
-- Create the Supabase project in Northeast Asia (Tokyo), ap-northeast-1.
create table if not exists public.iching_ai_app_keepalive (
  id smallint primary key check (id = 1),
  checked_at timestamptz not null default now()
);

insert into public.iching_ai_app_keepalive (id) values (1) on conflict (id) do nothing;

alter table public.iching_ai_app_keepalive enable row level security;

-- Intentionally define no anon/authenticated policies. Only the service-role
-- key used by the server-side cron can access this table.

-- Account and trial data. All names carry the app prefix so they never collide
-- with other projects sharing the same Supabase instance.
create table if not exists public.iching_ai_app_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  trial_started_at timestamptz not null,
  trial_ends_at timestamptz not null,
  created_at timestamptz not null default timezone('utc'::text, now()),
  constraint iching_ai_app_profiles_trial_window check (trial_ends_at = trial_started_at + interval '3 days')
);

alter table public.iching_ai_app_profiles enable row level security;

drop policy if exists "iching_ai_app_profiles_select_own" on public.iching_ai_app_profiles;
create policy "iching_ai_app_profiles_select_own"
  on public.iching_ai_app_profiles for select to authenticated
  using ((select auth.uid()) = id);

create or replace function public.iching_ai_app_create_profile()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.iching_ai_app_profiles (id, trial_started_at, trial_ends_at)
  values (new.id, timezone('utc'::text, now()), timezone('utc'::text, now()) + interval '3 days')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists iching_ai_app_on_auth_user_created on auth.users;
create trigger iching_ai_app_on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.iching_ai_app_create_profile();
