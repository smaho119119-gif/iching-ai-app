-- Optional one-row marker used only by the authenticated daily keepalive.
-- Create the Supabase project in Northeast Asia (Tokyo), ap-northeast-1.
create table if not exists public.iching_ai_app_keepalive (
  id smallint primary key check (id = 1),
  checked_at timestamptz not null default now()
);

insert into public.iching_ai_app_keepalive (id) values (1) on conflict (id) do nothing;

alter table public.iching_ai_app_keepalive enable row level security;

create or replace function public.iching_ai_app_touch_keepalive()
returns void
language sql security definer set search_path = public
as $$
  update public.iching_ai_app_keepalive set checked_at = now() where id = 1;
$$;

revoke all on function public.iching_ai_app_touch_keepalive() from public, authenticated;
grant execute on function public.iching_ai_app_touch_keepalive() to anon, service_role;

-- Isolated email/password accounts for this app. This intentionally does not
-- alter the shared Supabase Auth configuration used by other applications.
create extension if not exists pgcrypto with schema extensions;

create table if not exists public.iching_ai_app_accounts (
  id uuid primary key default extensions.gen_random_uuid(),
  email text not null,
  password_hash text not null,
  trial_started_at timestamptz not null default timezone('utc'::text, now()),
  trial_ends_at timestamptz not null default (timezone('utc'::text, now()) + interval '3 days'),
  created_at timestamptz not null default timezone('utc'::text, now()),
  constraint iching_ai_app_accounts_trial_window check (trial_ends_at = trial_started_at + interval '3 days')
);

create unique index if not exists iching_ai_app_accounts_email_unique
  on public.iching_ai_app_accounts (lower(email));
alter table public.iching_ai_app_accounts enable row level security;

create or replace function public.iching_ai_app_register(account_email text, account_password text)
returns table(id uuid, email text, trial_ends_at timestamptz)
language plpgsql security definer set search_path = public, extensions
as $$
begin
  if account_email !~ '^[^[:space:]@]+@[^[:space:]@]+\\.[^[:space:]@]+$' or length(account_password) < 8 or length(account_password) > 72 then
    raise exception 'Invalid credentials';
  end if;
  return query insert into public.iching_ai_app_accounts (email, password_hash)
  values (lower(trim(account_email)), extensions.crypt(account_password, extensions.gen_salt('bf', 12)))
  returning iching_ai_app_accounts.id, iching_ai_app_accounts.email, iching_ai_app_accounts.trial_ends_at;
exception when unique_violation then
  raise exception 'Email already registered';
end;
$$;

create or replace function public.iching_ai_app_authenticate(account_email text, account_password text)
returns table(id uuid, email text, trial_ends_at timestamptz)
language sql security definer set search_path = public, extensions
as $$
  select accounts.id, accounts.email, accounts.trial_ends_at
  from public.iching_ai_app_accounts as accounts
  where accounts.email = lower(trim(account_email))
    and accounts.password_hash = extensions.crypt(account_password, accounts.password_hash)
$$;

revoke all on function public.iching_ai_app_register(text, text) from public, authenticated;
revoke all on function public.iching_ai_app_authenticate(text, text) from public, authenticated;
grant execute on function public.iching_ai_app_register(text, text) to anon, service_role;
grant execute on function public.iching_ai_app_authenticate(text, text) to anon, service_role;
