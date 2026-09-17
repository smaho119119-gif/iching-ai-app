-- Optional one-row marker used only by the authenticated daily keepalive.
-- Create the Supabase project in Northeast Asia (Tokyo), ap-northeast-1.
create table if not exists public.keepalive (
  id smallint primary key check (id = 1),
  checked_at timestamptz not null default now()
);

insert into public.keepalive (id) values (1) on conflict (id) do nothing;

alter table public.keepalive enable row level security;

-- Intentionally define no anon/authenticated policies. Only the service-role
-- key used by the server-side cron can access this table.
