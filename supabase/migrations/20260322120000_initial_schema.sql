-- INSIDE ZAHMA — initial schema
-- Single-admin internal testing dashboard

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table public.departments (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.admins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  display_name text not null,
  email text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- Enforce single admin row
create unique index admins_singleton on public.admins ((true));

-- Must be created AFTER public.admins exists (SQL functions resolve relations at create time)
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admins a where a.user_id = auth.uid()
  );
$$;

create table public.employees (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  department_id uuid references public.departments (id) on delete set null,
  job_title text,
  avatar_url text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  date_added date not null default current_date,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index employees_department_idx on public.employees (department_id);
create index employees_status_idx on public.employees (status);
create index employees_name_idx on public.employees (full_name);

create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  employee_id uuid references public.employees (id) on delete set null,
  department_id uuid references public.departments (id) on delete set null,
  feature_module text,
  category text not null check (category in ('bug', 'ui_ux', 'feature_suggestion', 'performance', 'usability', 'other')),
  severity text not null default 'medium' check (severity in ('critical', 'high', 'medium', 'low')),
  status text not null default 'new' check (status in ('new', 'under_review', 'in_progress', 'resolved', 'rejected')),
  reported_at timestamptz not null default timezone('utc', now()),
  admin_notes text,
  validated boolean not null default false,
  validated_at timestamptz,
  is_duplicate boolean not null default false,
  points_awarded boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index feedback_employee_idx on public.feedback (employee_id);
create index feedback_department_idx on public.feedback (department_id);
create index feedback_category_idx on public.feedback (category);
create index feedback_severity_idx on public.feedback (severity);
create index feedback_status_idx on public.feedback (status);
create index feedback_reported_at_idx on public.feedback (reported_at desc);

create table public.feedback_attachments (
  id uuid primary key default gen_random_uuid(),
  feedback_id uuid not null references public.feedback (id) on delete cascade,
  storage_path text not null,
  file_name text,
  mime_type text,
  size_bytes bigint,
  created_at timestamptz not null default timezone('utc', now())
);

create index feedback_attachments_feedback_idx on public.feedback_attachments (feedback_id);

create table public.testing_missions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  feature_module text,
  instructions text,
  start_date date not null,
  end_date date not null,
  scope text not null default 'all' check (scope in ('all', 'department')),
  department_id uuid references public.departments (id) on delete set null,
  status text not null default 'draft' check (status in ('draft', 'upcoming', 'active', 'completed', 'cancelled')),
  points_available integer not null default 10,
  completion_criteria text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (end_date >= start_date)
);

create index missions_status_idx on public.testing_missions (status);
create index missions_dates_idx on public.testing_missions (start_date, end_date);

create table public.mission_participation (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid not null references public.testing_missions (id) on delete cascade,
  employee_id uuid not null references public.employees (id) on delete cascade,
  completed_at timestamptz not null default timezone('utc', now()),
  validated boolean not null default false,
  validated_at timestamptz,
  points_awarded boolean not null default false,
  admin_notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (mission_id, employee_id)
);

create index mission_participation_employee_idx on public.mission_participation (employee_id);

create table public.testing_sessions (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees (id) on delete cascade,
  session_date date not null default current_date,
  notes text,
  feature_module text,
  validated boolean not null default true,
  points_awarded boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index testing_sessions_employee_idx on public.testing_sessions (employee_id);
create index testing_sessions_date_idx on public.testing_sessions (session_date desc);

create table public.points_transactions (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees (id) on delete cascade,
  amount integer not null,
  reason text not null,
  source_type text not null check (source_type in ('feedback', 'mission', 'session', 'manual', 'adjustment')),
  source_id uuid,
  created_by uuid references public.admins (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now())
);

-- Prevent double-awarding for the same contribution (null source_id allowed for manual/adjustment)
create unique index points_transactions_source_unique
  on public.points_transactions (source_type, source_id)
  where source_id is not null;

create index points_transactions_employee_idx on public.points_transactions (employee_id);
create index points_transactions_created_at_idx on public.points_transactions (created_at desc);

create table public.weekly_reports (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  period_start date not null,
  period_end date not null,
  payload jsonb not null default '{}'::jsonb,
  next_week_priorities text,
  created_by uuid references public.admins (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index weekly_reports_period_idx on public.weekly_reports (period_start desc, period_end desc);

create table public.settings (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.admins (id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index audit_log_created_at_idx on public.audit_log (created_at desc);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'departments', 'admins', 'employees', 'feedback', 'testing_missions',
    'mission_participation', 'testing_sessions', 'weekly_reports', 'settings'
  ]
  loop
    execute format(
      'create trigger set_%I_updated_at before update on public.%I
       for each row execute function public.set_updated_at()',
      t, t
    );
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Seed defaults
-- ---------------------------------------------------------------------------
insert into public.departments (name, slug) values
  ('Product', 'product'),
  ('Development', 'development'),
  ('Design', 'design'),
  ('Marketing', 'marketing'),
  ('Operations', 'operations'),
  ('Management', 'management'),
  ('Other', 'other');

insert into public.settings (key, value) values
  ('campaign_name', '"INSIDE ZAHMA Testing Campaign"'::jsonb),
  ('point_rules', '{
    "validated_bug": 20,
    "high_priority_bug": 30,
    "critical_bug": 50,
    "useful_suggestion": 15,
    "completed_mission": 10,
    "documented_session": 5,
    "duplicate_or_invalid": 0
  }'::jsonb),
  ('leaderboard', '{"default_view": "weekly", "show_podium": true}'::jsonb),
  ('week_config', '{"starts_on": "sunday", "ends_on": "thursday", "meeting_day": "thursday"}'::jsonb),
  ('feedback_categories', '["bug","ui_ux","feature_suggestion","performance","usability","other"]'::jsonb),
  ('severity_levels', '["critical","high","medium","low"]'::jsonb),
  ('mission_categories', '["registration","profile","timeline","events","invitations","chat","media","performance"]'::jsonb);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.departments enable row level security;
alter table public.admins enable row level security;
alter table public.employees enable row level security;
alter table public.feedback enable row level security;
alter table public.feedback_attachments enable row level security;
alter table public.testing_missions enable row level security;
alter table public.mission_participation enable row level security;
alter table public.testing_sessions enable row level security;
alter table public.points_transactions enable row level security;
alter table public.weekly_reports enable row level security;
alter table public.settings enable row level security;
alter table public.audit_log enable row level security;

create policy "admins_read_self" on public.admins
  for select to authenticated
  using (user_id = auth.uid());

create policy "admins_update_self" on public.admins
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Generic admin-only policies for operational tables
do $$
declare
  t text;
begin
  foreach t in array array[
    'departments', 'employees', 'feedback', 'feedback_attachments',
    'testing_missions', 'mission_participation', 'testing_sessions',
    'points_transactions', 'weekly_reports', 'settings', 'audit_log'
  ]
  loop
    execute format(
      'create policy "%s_admin_all" on public.%I
         for all to authenticated
         using (public.is_admin())
         with check (public.is_admin())',
      t, t
    );
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Storage
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('feedback-attachments', 'feedback-attachments', false)
on conflict (id) do nothing;

create policy "feedback_attachments_admin_select"
  on storage.objects for select to authenticated
  using (bucket_id = 'feedback-attachments' and public.is_admin());

create policy "feedback_attachments_admin_insert"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'feedback-attachments' and public.is_admin());

create policy "feedback_attachments_admin_update"
  on storage.objects for update to authenticated
  using (bucket_id = 'feedback-attachments' and public.is_admin())
  with check (bucket_id = 'feedback-attachments' and public.is_admin());

create policy "feedback_attachments_admin_delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'feedback-attachments' and public.is_admin());
