-- CRAD → Comlab Computer Unit Request Integration
-- Shared table in public schema so both systems can access it.

CREATE TABLE IF NOT EXISTS public.crad_comlab_unit_requests (
  id                uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  request_reference text        NOT NULL UNIQUE,
  device_type       text        NOT NULL,
  quantity          int         NOT NULL DEFAULT 1 CHECK (quantity >= 1),
  specifications    text,
  purpose           text        NOT NULL,
  location_for_use  text,
  date_needed       date,
  requested_by      text        NOT NULL,
  requested_by_id   uuid,
  notes             text,
  status            text        NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'fulfilled', 'cancelled')),
  comlab_notes      text,
  reviewed_by_name  text,
  reviewed_at       timestamptz,
  fulfilled_at      timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- ── Indexes ──────────────────────────────────────────────────────────────────

-- Composite: covers ORDER BY status-priority + created_at DESC (list queries)
CREATE INDEX IF NOT EXISTS idx_ccur_status_created
  ON public.crad_comlab_unit_requests (status, created_at DESC);

-- Full-text search index over the columns users search against
CREATE INDEX IF NOT EXISTS idx_ccur_search
  ON public.crad_comlab_unit_requests
  USING gin (
    to_tsvector('simple',
      coalesce(request_reference, '') || ' ' ||
      coalesce(device_type,        '') || ' ' ||
      coalesce(requested_by,       '') || ' ' ||
      coalesce(purpose,            '')
    )
  );

-- ── auto-updated updated_at ───────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.ccur_set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ccur_updated_at ON public.crad_comlab_unit_requests;
CREATE TRIGGER trg_ccur_updated_at
  BEFORE UPDATE ON public.crad_comlab_unit_requests
  FOR EACH ROW EXECUTE FUNCTION public.ccur_set_updated_at();

-- ── RLS ───────────────────────────────────────────────────────────────────────
-- Pattern matches other integration tables in this project (e.g. hr_staff_requests):
-- single permissive policy for all roles so both the CRAD React app (anon/authenticated)
-- and the Comlab PHP backend (service_role) can read and write without auth barriers.

ALTER TABLE public.crad_comlab_unit_requests ENABLE ROW LEVEL SECURITY;

-- Drop old per-role policies so only the single open policy remains
DROP POLICY IF EXISTS "ccur_authenticated_insert"             ON public.crad_comlab_unit_requests;
DROP POLICY IF EXISTS "ccur_authenticated_select"             ON public.crad_comlab_unit_requests;
DROP POLICY IF EXISTS "ccur_service_all"                      ON public.crad_comlab_unit_requests;
DROP POLICY IF EXISTS "crad_comlab_unit_requests_insert"      ON public.crad_comlab_unit_requests;
DROP POLICY IF EXISTS "crad_comlab_unit_requests_select"      ON public.crad_comlab_unit_requests;
DROP POLICY IF EXISTS "crad_comlab_unit_requests_service_all" ON public.crad_comlab_unit_requests;
DROP POLICY IF EXISTS "allow_all_crad_comlab_unit_requests"   ON public.crad_comlab_unit_requests;

CREATE POLICY "allow_all_crad_comlab_unit_requests"
  ON public.crad_comlab_unit_requests
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- ── Summary RPC (single query replacing 5 COUNT round-trips) ─────────────────

CREATE OR REPLACE FUNCTION public.get_crad_comlab_unit_request_summary()
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT json_build_object(
    'total',     COUNT(*),
    'pending',   COUNT(*) FILTER (WHERE status = 'pending'),
    'approved',  COUNT(*) FILTER (WHERE status = 'approved'),
    'fulfilled', COUNT(*) FILTER (WHERE status = 'fulfilled'),
    'rejected',  COUNT(*) FILTER (WHERE status = 'rejected'),
    'cancelled', COUNT(*) FILTER (WHERE status = 'cancelled')
  )
  FROM public.crad_comlab_unit_requests;
$$;

COMMENT ON TABLE public.crad_comlab_unit_requests IS
  'Computer unit requests submitted by CRAD to the Computer Laboratory (Comlab).';
COMMENT ON COLUMN public.crad_comlab_unit_requests.status IS
  'pending → approved/rejected by Comlab admin → fulfilled once unit is delivered';
COMMENT ON FUNCTION public.get_crad_comlab_unit_request_summary() IS
  'Returns all status counts in a single aggregation query. Use via supabase.rpc().';
