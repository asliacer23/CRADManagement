-- Public wrapper views for CRAD cashier integration data.
-- The underlying data lives in the clinic schema; these views expose it
-- via the public schema (the only schema PostgREST exposes by default)
-- so the CRAD React app can query them without schema() calls.

CREATE OR REPLACE VIEW public.crad_department_flow_profiles AS
  SELECT department_key, department_name, flow_order, clearance_stage_order,
         receives, sends, notes, created_at, updated_at
  FROM clinic.department_flow_profiles;

CREATE OR REPLACE VIEW public.crad_cashier_clearance_records AS
  SELECT id, clearance_reference, patient_id, patient_code, patient_name,
         patient_type, department_key, department_name, stage_order, status,
         remarks, approver_name, approver_role, external_reference,
         requested_by, decided_at, metadata, created_at, updated_at
  FROM clinic.department_clearance_records;

CREATE OR REPLACE VIEW public.crad_cashier_payment_links AS
  SELECT id, source_module, source_key, cashier_reference, cashier_billing_id,
         invoice_number, official_receipt, amount_due, amount_paid, balance_due,
         payment_status, latest_payment_method, cashier_can_proceed,
         cashier_verified_at, paid_at, metadata, created_at, updated_at
  FROM clinic.cashier_payment_links;

CREATE OR REPLACE VIEW public.crad_cashier_sync_events AS
  SELECT id, event_key, source_module, source_entity, source_key, patient_name,
         patient_type, reference_no, amount_due, currency_code, payment_status,
         sync_status, last_error, synced_at, payload, created_at, updated_at
  FROM clinic.cashier_integration_events;

GRANT SELECT ON public.crad_department_flow_profiles    TO anon, authenticated;
GRANT SELECT ON public.crad_cashier_clearance_records   TO anon, authenticated;
GRANT SELECT ON public.crad_cashier_payment_links       TO anon, authenticated;
GRANT SELECT ON public.crad_cashier_sync_events         TO anon, authenticated;
