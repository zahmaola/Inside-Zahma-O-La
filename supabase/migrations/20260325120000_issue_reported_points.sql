-- Award 5 points to the reporter when an issue is submitted.
-- Adds a separate source type so the submission award and the validation award
-- for the same feedback row don't collide on points_transactions_source_unique.

alter table public.points_transactions
  drop constraint if exists points_transactions_source_type_check;

alter table public.points_transactions
  add constraint points_transactions_source_type_check
  check (source_type in ('feedback', 'feedback_report', 'mission', 'session', 'manual', 'adjustment'));

-- Add the new rule to the saved point rules (keeps any values already edited by admin).
update public.settings
set value = jsonb_set(value, '{issue_reported}', '5'::jsonb, true),
    updated_at = now()
where key = 'point_rules'
  and not (value ? 'issue_reported');
