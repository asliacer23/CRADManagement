
-- ============================================================
-- CRAD Management System - Normalized Database Schema (1NF-4NF)
-- ============================================================

-- ENUMS
CREATE TYPE public.app_role AS ENUM ('student', 'adviser', 'staff', 'admin');
CREATE TYPE public.research_status AS ENUM ('draft', 'pending', 'review', 'revision', 'approved', 'rejected', 'archived', 'completed');
CREATE TYPE public.manuscript_status AS ENUM ('draft', 'submitted', 'under_review', 'revision_needed', 'approved', 'rejected');
CREATE TYPE public.payment_status AS ENUM ('pending', 'submitted', 'verified', 'rejected');
CREATE TYPE public.defense_status AS ENUM ('scheduled', 'completed', 'cancelled', 'postponed');
CREATE TYPE public.notification_type AS ENUM ('research', 'manuscript', 'payment', 'defense', 'system', 'announcement');

-- UTILITY: updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 1. PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  department TEXT,
  student_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles viewable by authenticated users" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. USER_ROLES (4NF)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role); $$;

CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1; $$;

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Auto-assign role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER AS $$
DECLARE _role app_role;
BEGIN
  _role := COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'student');
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, _role);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
CREATE TRIGGER on_auth_user_created_role AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();

-- 3. DEPARTMENTS
CREATE TABLE public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Departments viewable by all authenticated" ON public.departments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage departments" ON public.departments FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
INSERT INTO public.departments (name, code) VALUES ('Information Technology', 'IT'), ('Computer Science', 'CS'), ('Engineering', 'ENG'), ('Business Administration', 'BA'), ('Education', 'EDU');

-- 4. ACADEMIC_YEARS
CREATE TABLE public.academic_years (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year_label TEXT NOT NULL UNIQUE,
  semester TEXT NOT NULL DEFAULT '1st',
  is_current BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.academic_years ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Academic years viewable by all" ON public.academic_years FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage academic years" ON public.academic_years FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
INSERT INTO public.academic_years (year_label, semester, is_current) VALUES ('2025-2026', '2nd', true);

-- 5. RESEARCH_CATEGORIES
CREATE TABLE public.research_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.research_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Categories viewable by all" ON public.research_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage categories" ON public.research_categories FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
INSERT INTO public.research_categories (name) VALUES ('Capstone Project'), ('Thesis'), ('Feasibility Study'), ('Software Development'), ('Hardware Development');

-- 6. RESEARCH
CREATE TABLE public.research (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  research_code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  abstract TEXT,
  status research_status NOT NULL DEFAULT 'draft',
  category_id UUID REFERENCES public.research_categories(id) ON DELETE SET NULL,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  academic_year_id UUID REFERENCES public.academic_years(id) ON DELETE SET NULL,
  submitted_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.research ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Research viewable by authenticated" ON public.research FOR SELECT TO authenticated USING (true);
CREATE POLICY "Students can insert research" ON public.research FOR INSERT TO authenticated WITH CHECK (auth.uid() = submitted_by);
CREATE POLICY "Authorized users update research" ON public.research FOR UPDATE TO authenticated USING (submitted_by = auth.uid() OR public.has_role(auth.uid(), 'adviser') OR public.has_role(auth.uid(), 'staff') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete research" ON public.research FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_research_updated_at BEFORE UPDATE ON public.research FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-generate research code
CREATE OR REPLACE FUNCTION public.generate_research_code()
RETURNS TRIGGER AS $$
DECLARE next_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(research_code FROM 'R-\d{4}-(\d+)') AS INTEGER)), 0) + 1 INTO next_num FROM public.research;
  NEW.research_code := 'R-' || to_char(now(), 'YYYY') || '-' || lpad(next_num::text, 3, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;
CREATE TRIGGER set_research_code BEFORE INSERT ON public.research FOR EACH ROW WHEN (NEW.research_code IS NULL OR NEW.research_code = '') EXECUTE FUNCTION public.generate_research_code();

-- 7. RESEARCH_MEMBERS (4NF)
CREATE TABLE public.research_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  research_id UUID NOT NULL REFERENCES public.research(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  member_name TEXT NOT NULL,
  is_leader BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (research_id, member_name)
);
ALTER TABLE public.research_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members viewable by authenticated" ON public.research_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Research owner manages members" ON public.research_members FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.research WHERE id = research_id AND submitted_by = auth.uid()));
CREATE POLICY "Research owner updates members" ON public.research_members FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.research WHERE id = research_id AND submitted_by = auth.uid()));
CREATE POLICY "Research owner deletes members" ON public.research_members FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.research WHERE id = research_id AND submitted_by = auth.uid()));

-- 8. ADVISER_ASSIGNMENTS (4NF)
CREATE TABLE public.adviser_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  research_id UUID NOT NULL REFERENCES public.research(id) ON DELETE CASCADE,
  adviser_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (research_id, adviser_id)
);
ALTER TABLE public.adviser_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Assignments viewable by authenticated" ON public.adviser_assignments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff/admin can assign" ON public.adviser_assignments FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'staff') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Staff/admin can update" ON public.adviser_assignments FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'staff') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Staff/admin can delete" ON public.adviser_assignments FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'staff') OR public.has_role(auth.uid(), 'admin'));

-- 9. MANUSCRIPTS
CREATE TABLE public.manuscripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  research_id UUID NOT NULL REFERENCES public.research(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL DEFAULT 1,
  file_url TEXT,
  file_name TEXT,
  version_notes TEXT,
  status manuscript_status NOT NULL DEFAULT 'draft',
  uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (research_id, version_number)
);
ALTER TABLE public.manuscripts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Manuscripts viewable by authenticated" ON public.manuscripts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Students upload manuscripts" ON public.manuscripts FOR INSERT TO authenticated WITH CHECK (auth.uid() = uploaded_by);
CREATE POLICY "Authorized users update manuscripts" ON public.manuscripts FOR UPDATE TO authenticated USING (uploaded_by = auth.uid() OR public.has_role(auth.uid(), 'adviser') OR public.has_role(auth.uid(), 'staff') OR public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_manuscripts_updated_at BEFORE UPDATE ON public.manuscripts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 10. PAYMENTS
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_code TEXT NOT NULL UNIQUE,
  research_id UUID NOT NULL REFERENCES public.research(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL DEFAULT 2500.00,
  proof_url TEXT,
  proof_file_name TEXT,
  status payment_status NOT NULL DEFAULT 'pending',
  submitted_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Payments viewable" ON public.payments FOR SELECT TO authenticated USING (submitted_by = auth.uid() OR public.has_role(auth.uid(), 'staff') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Students submit payments" ON public.payments FOR INSERT TO authenticated WITH CHECK (auth.uid() = submitted_by);
CREATE POLICY "Authorized update payments" ON public.payments FOR UPDATE TO authenticated USING (submitted_by = auth.uid() OR public.has_role(auth.uid(), 'staff') OR public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-generate payment code
CREATE OR REPLACE FUNCTION public.generate_payment_code()
RETURNS TRIGGER AS $$
DECLARE next_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(payment_code FROM 'PAY-(\d+)') AS INTEGER)), 0) + 1 INTO next_num FROM public.payments;
  NEW.payment_code := 'PAY-' || lpad(next_num::text, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;
CREATE TRIGGER set_payment_code BEFORE INSERT ON public.payments FOR EACH ROW WHEN (NEW.payment_code IS NULL OR NEW.payment_code = '') EXECUTE FUNCTION public.generate_payment_code();

-- 11. DEFENSE_SCHEDULES
CREATE TABLE public.defense_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  research_id UUID NOT NULL REFERENCES public.research(id) ON DELETE CASCADE,
  defense_date DATE NOT NULL,
  defense_time TIME NOT NULL,
  room TEXT NOT NULL,
  status defense_status NOT NULL DEFAULT 'scheduled',
  notes TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.defense_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Defense schedules viewable by all" ON public.defense_schedules FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff/admin manage defenses" ON public.defense_schedules FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'staff') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Staff/admin update defenses" ON public.defense_schedules FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'staff') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Staff/admin delete defenses" ON public.defense_schedules FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'staff') OR public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_defense_updated_at BEFORE UPDATE ON public.defense_schedules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 12. DEFENSE_PANEL_MEMBERS (4NF)
CREATE TABLE public.defense_panel_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  defense_id UUID NOT NULL REFERENCES public.defense_schedules(id) ON DELETE CASCADE,
  panelist_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'panelist',
  UNIQUE (defense_id, panelist_id)
);
ALTER TABLE public.defense_panel_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Panel members viewable" ON public.defense_panel_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff/admin manage panels" ON public.defense_panel_members FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'staff') OR public.has_role(auth.uid(), 'admin'));

-- 13. NOTIFICATIONS
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type notification_type NOT NULL DEFAULT 'system',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  reference_id UUID,
  reference_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own notifications" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "System inserts notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own notifications" ON public.notifications FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX idx_notifications_user ON public.notifications(user_id, is_read, created_at DESC);

-- 14. ANNOUNCEMENTS
CREATE TABLE public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Announcements viewable by all" ON public.announcements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff/admin create announcements" ON public.announcements FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'staff') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Staff/admin update announcements" ON public.announcements FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'staff') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Staff/admin delete announcements" ON public.announcements FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'staff') OR public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON public.announcements FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 15. REMARKS
CREATE TABLE public.remarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  research_id UUID NOT NULL REFERENCES public.research(id) ON DELETE CASCADE,
  manuscript_id UUID REFERENCES public.manuscripts(id) ON DELETE SET NULL,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.remarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Remarks viewable by authenticated" ON public.remarks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Advisers create remarks" ON public.remarks FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors update remarks" ON public.remarks FOR UPDATE TO authenticated USING (auth.uid() = author_id);
CREATE POLICY "Authors delete remarks" ON public.remarks FOR DELETE TO authenticated USING (auth.uid() = author_id);

-- 16. AUDIT_LOGS
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details TEXT,
  ip_address TEXT,
  entity_type TEXT,
  entity_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view audit logs" ON public.audit_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "System inserts audit logs" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (true);
CREATE INDEX idx_audit_logs_created ON public.audit_logs(created_at DESC);

-- 17. SYSTEM_SETTINGS
CREATE TABLE public.system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Settings viewable by authenticated" ON public.system_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage settings" ON public.system_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
INSERT INTO public.system_settings (key, value, description) VALUES
  ('institution_name', 'Bestlink College of the Philippines', 'Name of the institution'),
  ('academic_year', '2025-2026', 'Current academic year'),
  ('research_fee', '2500', 'Research fee in PHP'),
  ('maintenance_mode', 'false', 'Enable/disable maintenance mode');

-- STORAGE BUCKETS
INSERT INTO storage.buckets (id, name, public) VALUES ('manuscripts', 'manuscripts', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('payment-proofs', 'payment-proofs', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- Storage policies: manuscripts
CREATE POLICY "Auth users upload manuscripts" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'manuscripts' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Auth users view manuscripts" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'manuscripts');
CREATE POLICY "Auth users update own manuscripts" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'manuscripts' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies: payment-proofs
CREATE POLICY "Auth users upload payment proofs" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'payment-proofs' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users/staff view payment proofs" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'payment-proofs');

-- Storage policies: avatars
CREATE POLICY "Anyone can view avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Auth users upload avatars" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Auth users update own avatars" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Helper function for audit logging
CREATE OR REPLACE FUNCTION public.create_audit_log(_action TEXT, _details TEXT DEFAULT NULL, _entity_type TEXT DEFAULT NULL, _entity_id UUID DEFAULT NULL)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$ BEGIN INSERT INTO public.audit_logs (user_id, action, details, entity_type, entity_id) VALUES (auth.uid(), _action, _details, _entity_type, _entity_id); END; $$;

-- Auto audit on research status change
CREATE OR REPLACE FUNCTION public.audit_research_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    PERFORM public.create_audit_log('RESEARCH_STATUS_CHANGE', 'Research ' || NEW.research_code || ' changed from ' || OLD.status || ' to ' || NEW.status, 'research', NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
CREATE TRIGGER audit_research_status AFTER UPDATE ON public.research FOR EACH ROW EXECUTE FUNCTION public.audit_research_status_change();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.research;
ALTER PUBLICATION supabase_realtime ADD TABLE public.announcements;
