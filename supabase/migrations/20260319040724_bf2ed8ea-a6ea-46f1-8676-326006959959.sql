
-- 1. Add new research statuses for the post-defense flow
-- Current statuses: draft, pending, review, revision, approved, rejected, archived, completed
-- We need: 'pending_final_approval' status
ALTER TYPE public.research_status ADD VALUE IF NOT EXISTS 'pending_final_approval' AFTER 'completed';

-- 2. Create defense_grades table for panelist grade submissions
CREATE TABLE public.defense_grades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  defense_id uuid NOT NULL REFERENCES public.defense_schedules(id) ON DELETE CASCADE,
  research_id uuid NOT NULL REFERENCES public.research(id) ON DELETE CASCADE,
  panelist_id uuid NOT NULL,
  grade numeric(5,2) NOT NULL CHECK (grade >= 0 AND grade <= 100),
  remarks text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (defense_id, panelist_id)
);

-- Add FK to profiles
ALTER TABLE public.defense_grades
  ADD CONSTRAINT defense_grades_panelist_id_profiles_fkey
  FOREIGN KEY (panelist_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- 3. Create final_approvals table for staff approval workflow
CREATE TABLE public.final_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  research_id uuid NOT NULL REFERENCES public.research(id) ON DELETE CASCADE UNIQUE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'revision_requested')),
  approved_by uuid,
  remarks text,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.final_approvals
  ADD CONSTRAINT final_approvals_approved_by_profiles_fkey
  FOREIGN KEY (approved_by) REFERENCES public.profiles(user_id) ON DELETE SET NULL;

-- 4. Updated_at triggers
CREATE TRIGGER set_defense_grades_updated_at
  BEFORE UPDATE ON public.defense_grades
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_final_approvals_updated_at
  BEFORE UPDATE ON public.final_approvals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Enable RLS
ALTER TABLE public.defense_grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.final_approvals ENABLE ROW LEVEL SECURITY;

-- 6. RLS for defense_grades
CREATE POLICY "Defense grades viewable by authenticated"
  ON public.defense_grades FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Panelists submit grades"
  ON public.defense_grades FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = panelist_id);

CREATE POLICY "Panelists update own grades"
  ON public.defense_grades FOR UPDATE TO authenticated
  USING (auth.uid() = panelist_id);

CREATE POLICY "Staff/admin delete grades"
  ON public.defense_grades FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'staff'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- 7. RLS for final_approvals
CREATE POLICY "Final approvals viewable by authenticated"
  ON public.final_approvals FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "System creates final approvals"
  ON public.final_approvals FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Staff/admin update final approvals"
  ON public.final_approvals FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'staff'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Staff/admin delete final approvals"
  ON public.final_approvals FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'staff'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- 8. Function: When defense is marked 'completed', auto-create a final_approval record
CREATE OR REPLACE FUNCTION public.handle_defense_completed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') THEN
    -- Create final approval record
    INSERT INTO public.final_approvals (research_id)
    VALUES (NEW.research_id)
    ON CONFLICT (research_id) DO NOTHING;
    
    -- Update research status to pending_final_approval
    UPDATE public.research SET status = 'pending_final_approval' WHERE id = NEW.research_id;
    
    -- Audit log
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

CREATE TRIGGER on_defense_completed
  AFTER UPDATE ON public.defense_schedules
  FOR EACH ROW EXECUTE FUNCTION public.handle_defense_completed();

-- 9. Function: When final_approval is approved, archive the research
CREATE OR REPLACE FUNCTION public.handle_final_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM 'approved') THEN
    NEW.approved_at := now();
    
    -- Move research to archived
    UPDATE public.research SET status = 'archived' WHERE id = NEW.research_id;
    
    -- Audit log
    PERFORM public.create_audit_log(
      'RESEARCH_ARCHIVED',
      'Research approved and archived by staff',
      'research',
      NEW.research_id
    );
  ELSIF NEW.status = 'revision_requested' AND (OLD.status IS DISTINCT FROM 'revision_requested') THEN
    UPDATE public.research SET status = 'revision' WHERE id = NEW.research_id;
    
    PERFORM public.create_audit_log(
      'RESEARCH_REVISION_REQUESTED',
      'Staff requested revision after final defense',
      'research',
      NEW.research_id
    );
  ELSIF NEW.status = 'rejected' AND (OLD.status IS DISTINCT FROM 'rejected') THEN
    UPDATE public.research SET status = 'rejected' WHERE id = NEW.research_id;
    
    PERFORM public.create_audit_log(
      'RESEARCH_REJECTED',
      'Research rejected after final defense',
      'research',
      NEW.research_id
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_final_approval_update
  BEFORE UPDATE ON public.final_approvals
  FOR EACH ROW EXECUTE FUNCTION public.handle_final_approval();

-- 10. Enable realtime for defense_grades and final_approvals
ALTER PUBLICATION supabase_realtime ADD TABLE public.defense_grades;
ALTER PUBLICATION supabase_realtime ADD TABLE public.final_approvals;
