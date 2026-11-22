-- DEMO SEED — optional sample data for local exploration after migrations.
-- Only run intentionally. Marked clearly so it is never confused with production data.
-- Usage: paste into Supabase SQL editor after creating at least one real admin, OR
--        leave SEED_DEMO_DATA unset and use the in-app demo fixtures instead.

-- This seed assumes departments from the migration already exist.
-- Replace employee names as needed. Does NOT create auth users.

do $$
declare
  dept_product uuid;
  dept_dev uuid;
  dept_design uuid;
  emp1 uuid;
  emp2 uuid;
  emp3 uuid;
  mission1 uuid;
begin
  select id into dept_product from public.departments where slug = 'product';
  select id into dept_dev from public.departments where slug = 'development';
  select id into dept_design from public.departments where slug = 'design';

  insert into public.employees (full_name, department_id, job_title, status)
  values
    ('Sara Alharbi', dept_product, 'Product Manager', 'active'),
    ('Omar Alqahtani', dept_dev, 'Engineer', 'active'),
    ('Noura Almutairi', dept_design, 'Designer', 'active')
  returning id into emp1;

  select id into emp1 from public.employees where full_name = 'Sara Alharbi' limit 1;
  select id into emp2 from public.employees where full_name = 'Omar Alqahtani' limit 1;
  select id into emp3 from public.employees where full_name = 'Noura Almutairi' limit 1;

  insert into public.testing_missions (
    title, description, feature_module, instructions,
    start_date, end_date, scope, status, points_available, completion_criteria
  )
  values (
    'Test registration & OTP',
    'Walk through signup and OTP verification.',
    'Registration',
    'Create account, request OTP, verify, then log out/in.',
    current_date - 2,
    current_date + 3,
    'all',
    'active',
    10,
    'OTP verified successfully'
  )
  returning id into mission1;

  insert into public.feedback (
    title, description, employee_id, department_id, feature_module,
    category, severity, status, validated, validated_at, points_awarded
  )
  values (
    'OTP fails on slow network',
    'Registration OTP times out after 30s on 3G.',
    emp2,
    dept_dev,
    'Registration',
    'bug',
    'critical',
    'in_progress',
    true,
    timezone('utc', now()),
    false
  );

  insert into public.testing_sessions (employee_id, session_date, notes, feature_module, validated, points_awarded)
  values (emp1, current_date, 'Walked through Jadwal invite flow', 'Jadwal', true, false);

  raise notice 'Demo seed inserted. Validate feedback/sessions in the dashboard to award points.';
end $$;
