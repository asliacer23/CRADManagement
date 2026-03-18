
-- Fix overly permissive INSERT policies on notifications and audit_logs
DROP POLICY IF EXISTS "System inserts notifications" ON public.notifications;
CREATE POLICY "Authenticated users insert notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "System inserts audit logs" ON public.audit_logs;
CREATE POLICY "Authenticated users insert audit logs" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
