DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE n.nspname = 'crad' AND t.typname = 'research_status') THEN
    RAISE EXCEPTION 'crad.research_status type is missing';
  END IF;
END
$$;

ALTER TYPE crad.research_status ADD VALUE IF NOT EXISTS 'pending_final_approval';

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TABLE IF NOT EXISTS crad.defense_grades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  defense_id uuid NOT NULL REFERENCES crad.defense_schedules(id) ON DELETE CASCADE,
  research_id uuid NOT NULL REFERENCES crad.research(id) ON DELETE CASCADE,
  panelist_id uuid NOT NULL,
  grade numeric(5,2) NOT NULL CHECK (grade >= 0 AND grade <= 100),
  remarks text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (defense_id, panelist_id)
);

CREATE TABLE IF NOT EXISTS crad.final_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  research_id uuid NOT NULL REFERENCES crad.research(id) ON DELETE CASCADE UNIQUE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'revision_requested')),
  approved_by uuid,
  remarks text,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'crad_defense_grades_updated_at') THEN
    CREATE TRIGGER crad_defense_grades_updated_at
      BEFORE UPDATE ON crad.defense_grades
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'crad_final_approvals_updated_at') THEN
    CREATE TRIGGER crad_final_approvals_updated_at
      BEFORE UPDATE ON crad.final_approvals
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END
$$;
