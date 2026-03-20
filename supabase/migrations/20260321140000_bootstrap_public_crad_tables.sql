CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE n.nspname = 'public' AND t.typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('student', 'adviser', 'staff', 'admin');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE n.nspname = 'public' AND t.typname = 'research_status') THEN
    CREATE TYPE public.research_status AS ENUM ('draft', 'pending', 'review', 'revision', 'approved', 'rejected', 'archived', 'completed');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE n.nspname = 'public' AND t.typname = 'manuscript_status') THEN
    CREATE TYPE public.manuscript_status AS ENUM ('draft', 'submitted', 'under_review', 'revision_needed', 'approved', 'rejected');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE n.nspname = 'public' AND t.typname = 'payment_status') THEN
    CREATE TYPE public.payment_status AS ENUM ('pending', 'submitted', 'verified', 'rejected');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE n.nspname = 'public' AND t.typname = 'defense_status') THEN
    CREATE TYPE public.defense_status AS ENUM ('scheduled', 'completed', 'cancelled', 'postponed');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE n.nspname = 'public' AND t.typname = 'notification_type') THEN
    CREATE TYPE public.notification_type AS ENUM ('research', 'manuscript', 'payment', 'defense', 'system', 'announcement');
  END IF;
END
$$;

ALTER TYPE public.research_status ADD VALUE IF NOT EXISTS 'pending_final_approval';

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role TEXT)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role::text = _role); $$;

CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT role::text FROM public.user_roles WHERE user_id = _user_id LIMIT 1; $$;

CREATE TABLE IF NOT EXISTS public.academic_years (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year_label TEXT NOT NULL UNIQUE,
  semester TEXT NOT NULL DEFAULT '1st',
  is_current BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.research_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  department_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.research (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  research_code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  abstract TEXT,
  status public.research_status NOT NULL DEFAULT 'draft',
  category_id UUID REFERENCES public.research_categories(id) ON DELETE SET NULL,
  department_id UUID,
  academic_year_id UUID REFERENCES public.academic_years(id) ON DELETE SET NULL,
  submitted_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.research_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  research_id UUID NOT NULL REFERENCES public.research(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  member_name TEXT NOT NULL,
  is_leader BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (research_id, member_name)
);

CREATE TABLE IF NOT EXISTS public.adviser_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  research_id UUID NOT NULL REFERENCES public.research(id) ON DELETE CASCADE,
  adviser_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (research_id, adviser_id)
);

CREATE TABLE IF NOT EXISTS public.manuscripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  research_id UUID NOT NULL REFERENCES public.research(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL DEFAULT 1,
  file_url TEXT,
  file_name TEXT,
  version_notes TEXT,
  status public.manuscript_status NOT NULL DEFAULT 'draft',
  uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (research_id, version_number)
);

CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_code TEXT NOT NULL UNIQUE,
  research_id UUID NOT NULL REFERENCES public.research(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL DEFAULT 2500.00,
  proof_url TEXT,
  proof_file_name TEXT,
  status public.payment_status NOT NULL DEFAULT 'pending',
  submitted_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.defense_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  research_id UUID NOT NULL REFERENCES public.research(id) ON DELETE CASCADE,
  defense_date DATE NOT NULL,
  defense_time TIME NOT NULL,
  room TEXT NOT NULL,
  status public.defense_status NOT NULL DEFAULT 'scheduled',
  notes TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.defense_panel_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  defense_id UUID NOT NULL REFERENCES public.defense_schedules(id) ON DELETE CASCADE,
  panelist_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'panelist',
  UNIQUE (defense_id, panelist_id)
);

CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.remarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  research_id UUID NOT NULL REFERENCES public.research(id) ON DELETE CASCADE,
  manuscript_id UUID REFERENCES public.manuscripts(id) ON DELETE SET NULL,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.defense_grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  defense_id UUID NOT NULL REFERENCES public.defense_schedules(id) ON DELETE CASCADE,
  research_id UUID NOT NULL REFERENCES public.research(id) ON DELETE CASCADE,
  panelist_id UUID NOT NULL,
  grade NUMERIC(5,2) NOT NULL CHECK (grade >= 0 AND grade <= 100),
  remarks TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (defense_id, panelist_id)
);

CREATE TABLE IF NOT EXISTS public.final_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  research_id UUID NOT NULL REFERENCES public.research(id) ON DELETE CASCADE UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'revision_requested')),
  approved_by UUID,
  remarks TEXT,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.generate_research_code()
RETURNS TRIGGER AS $$
DECLARE next_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(research_code FROM 'R-\d{4}-(\d+)') AS INTEGER)), 0) + 1 INTO next_num FROM public.research;
  NEW.research_code := 'R-' || to_char(now(), 'YYYY') || '-' || lpad(next_num::text, 3, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION public.generate_payment_code()
RETURNS TRIGGER AS $$
DECLARE next_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(payment_code FROM 'PAY-(\d+)') AS INTEGER)), 0) + 1 INTO next_num FROM public.payments;
  NEW.payment_code := 'PAY-' || lpad(next_num::text, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION public.create_audit_log(_action TEXT, _details TEXT DEFAULT NULL, _entity_type TEXT DEFAULT NULL, _entity_id UUID DEFAULT NULL)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.audit_logs (user_id, action, details, entity_type, entity_id)
  VALUES (auth.uid(), _action, _details, _entity_type, _entity_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_defense_completed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') THEN
    INSERT INTO public.final_approvals (research_id)
    VALUES (NEW.research_id)
    ON CONFLICT (research_id) DO NOTHING;

    UPDATE public.research
    SET status = 'pending_final_approval'
    WHERE id = NEW.research_id;

    PERFORM public.create_audit_log(
      'DEFENSE_COMPLETED',
      'Defense completed for research ' || NEW.research_id::text,
      'defense_schedules',
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_final_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM 'approved') THEN
    NEW.approved_at := now();
    UPDATE public.research SET status = 'archived' WHERE id = NEW.research_id;
  ELSIF NEW.status = 'revision_requested' AND (OLD.status IS DISTINCT FROM 'revision_requested') THEN
    UPDATE public.research SET status = 'revision' WHERE id = NEW.research_id;
  ELSIF NEW.status = 'rejected' AND (OLD.status IS DISTINCT FROM 'rejected') THEN
    UPDATE public.research SET status = 'rejected' WHERE id = NEW.research_id;
  END IF;
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_research_updated_at') THEN
    CREATE TRIGGER update_research_updated_at BEFORE UPDATE ON public.research FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_manuscripts_updated_at') THEN
    CREATE TRIGGER update_manuscripts_updated_at BEFORE UPDATE ON public.manuscripts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_payments_updated_at') THEN
    CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_defense_updated_at') THEN
    CREATE TRIGGER update_defense_updated_at BEFORE UPDATE ON public.defense_schedules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_announcements_updated_at') THEN
    CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON public.announcements FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_defense_grades_updated_at') THEN
    CREATE TRIGGER set_defense_grades_updated_at BEFORE UPDATE ON public.defense_grades FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_final_approvals_updated_at') THEN
    CREATE TRIGGER set_final_approvals_updated_at BEFORE UPDATE ON public.final_approvals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_research_code') THEN
    CREATE TRIGGER set_research_code BEFORE INSERT ON public.research FOR EACH ROW WHEN (NEW.research_code IS NULL OR NEW.research_code = '') EXECUTE FUNCTION public.generate_research_code();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_payment_code') THEN
    CREATE TRIGGER set_payment_code BEFORE INSERT ON public.payments FOR EACH ROW WHEN (NEW.payment_code IS NULL OR NEW.payment_code = '') EXECUTE FUNCTION public.generate_payment_code();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_defense_completed') THEN
    CREATE TRIGGER on_defense_completed AFTER UPDATE ON public.defense_schedules FOR EACH ROW EXECUTE FUNCTION public.handle_defense_completed();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_final_approval_update') THEN
    CREATE TRIGGER on_final_approval_update BEFORE UPDATE ON public.final_approvals FOR EACH ROW EXECUTE FUNCTION public.handle_final_approval();
  END IF;
END
$$;

INSERT INTO public.academic_years (year_label, semester, is_current)
VALUES ('2025-2026', '2nd', true)
ON CONFLICT (year_label) DO UPDATE SET semester = EXCLUDED.semester, is_current = EXCLUDED.is_current;

INSERT INTO public.research_categories (name)
VALUES ('Capstone Project'), ('Thesis'), ('Feasibility Study'), ('Software Development'), ('Hardware Development')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.system_settings (key, value, description)
VALUES
  ('institution_name', 'Bestlink College of the Philippines', 'Name of the institution'),
  ('academic_year', '2025-2026', 'Current academic year'),
  ('research_fee', '2500', 'Research fee in PHP'),
  ('maintenance_mode', 'false', 'Enable/disable maintenance mode')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, description = EXCLUDED.description;
