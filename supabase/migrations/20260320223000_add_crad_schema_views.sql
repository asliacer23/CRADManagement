-- Department integration merge script.
-- Run clinic first, then any department scripts you need.
-- Department: CRAD

CREATE SCHEMA IF NOT EXISTS crad;
CREATE SCHEMA IF NOT EXISTS clinic;

SET search_path TO crad, clinic, public;

DO $$
DECLARE
  rel record;
BEGIN
  FOR rel IN
    SELECT c.relname, c.relkind
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'crad'
      AND c.relname = ANY (ARRAY[
        'department_flow_profiles',
        'department_clearance_records',
        'cashier_integration_events',
        'cashier_payment_links',
        'clinic_cashier_sync_logs',
        'clinic_cashier_audit_logs'
      ])
  LOOP
    IF rel.relkind = 'v' THEN
      EXECUTE format('DROP VIEW IF EXISTS crad.%I CASCADE', rel.relname);
    ELSIF rel.relkind = 'm' THEN
      EXECUTE format('DROP MATERIALIZED VIEW IF EXISTS crad.%I CASCADE', rel.relname);
    ELSE
      EXECUTE format('DROP TABLE IF EXISTS crad.%I CASCADE', rel.relname);
    END IF;
  END LOOP;
END
$$;

CREATE OR REPLACE VIEW crad.department_flow_profiles AS
SELECT *
FROM clinic.department_flow_profiles;

CREATE OR REPLACE VIEW crad.department_clearance_records AS
SELECT *
FROM clinic.department_clearance_records;

CREATE OR REPLACE VIEW crad.cashier_integration_events AS
SELECT *
FROM clinic.cashier_integration_events;

CREATE OR REPLACE VIEW crad.cashier_payment_links AS
SELECT *
FROM clinic.cashier_payment_links;

CREATE OR REPLACE VIEW crad.clinic_cashier_sync_logs AS
SELECT *
FROM clinic.clinic_cashier_sync_logs;

CREATE OR REPLACE VIEW crad.clinic_cashier_audit_logs AS
SELECT *
FROM clinic.clinic_cashier_audit_logs;

INSERT INTO clinic.department_flow_profiles (
  department_key,
  department_name,
  flow_order,
  clearance_stage_order,
  receives,
  sends,
  notes
)
VALUES (
  'crad',
  'CRAD',
  7,
  7,
  '["comlab"]'::jsonb,
  '["cashier"]'::jsonb,
  'Research and records validation.'
)
ON CONFLICT (department_key) DO UPDATE
SET
  department_name = EXCLUDED.department_name,
  flow_order = EXCLUDED.flow_order,
  clearance_stage_order = EXCLUDED.clearance_stage_order,
  receives = EXCLUDED.receives,
  sends = EXCLUDED.sends,
  notes = EXCLUDED.notes,
  updated_at = NOW();

SET search_path TO public;
