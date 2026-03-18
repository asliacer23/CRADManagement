
-- Ensure profiles.user_id is unique (needed for FK references)
ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_id_unique UNIQUE (user_id);

-- Add foreign keys from all tables referencing user IDs to profiles.user_id
ALTER TABLE public.adviser_assignments 
  ADD CONSTRAINT adviser_assignments_adviser_id_profiles_fkey 
  FOREIGN KEY (adviser_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

ALTER TABLE public.adviser_assignments 
  ADD CONSTRAINT adviser_assignments_assigned_by_profiles_fkey 
  FOREIGN KEY (assigned_by) REFERENCES public.profiles(user_id) ON DELETE SET NULL;

ALTER TABLE public.research 
  ADD CONSTRAINT research_submitted_by_profiles_fkey 
  FOREIGN KEY (submitted_by) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

ALTER TABLE public.manuscripts 
  ADD CONSTRAINT manuscripts_uploaded_by_profiles_fkey 
  FOREIGN KEY (uploaded_by) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

ALTER TABLE public.manuscripts 
  ADD CONSTRAINT manuscripts_reviewed_by_profiles_fkey 
  FOREIGN KEY (reviewed_by) REFERENCES public.profiles(user_id) ON DELETE SET NULL;

ALTER TABLE public.payments 
  ADD CONSTRAINT payments_submitted_by_profiles_fkey 
  FOREIGN KEY (submitted_by) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

ALTER TABLE public.payments 
  ADD CONSTRAINT payments_verified_by_profiles_fkey 
  FOREIGN KEY (verified_by) REFERENCES public.profiles(user_id) ON DELETE SET NULL;

ALTER TABLE public.announcements 
  ADD CONSTRAINT announcements_created_by_profiles_fkey 
  FOREIGN KEY (created_by) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

ALTER TABLE public.audit_logs 
  ADD CONSTRAINT audit_logs_user_id_profiles_fkey 
  FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE SET NULL;

ALTER TABLE public.defense_panel_members 
  ADD CONSTRAINT defense_panel_members_panelist_id_profiles_fkey 
  FOREIGN KEY (panelist_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

ALTER TABLE public.defense_schedules 
  ADD CONSTRAINT defense_schedules_created_by_profiles_fkey 
  FOREIGN KEY (created_by) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

ALTER TABLE public.remarks 
  ADD CONSTRAINT remarks_author_id_profiles_fkey 
  FOREIGN KEY (author_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

ALTER TABLE public.notifications 
  ADD CONSTRAINT notifications_user_id_profiles_fkey 
  FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;
