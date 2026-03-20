-- Seed integration-specific streams so Integration Hub pages have live rows to display.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

SET search_path TO clinic, crad, public;

DELETE FROM clinic.cashier_payment_links
WHERE source_module = 'crad'
  AND source_key IN ('PAY-9201', 'PAY-9202', 'PAY-9203', 'PAY-9204');

INSERT INTO clinic.cashier_payment_links (
  source_module,
  source_key,
  cashier_billing_id,
  cashier_reference,
  invoice_number,
  amount_due,
  amount_paid,
  balance_due,
  payment_status,
  latest_payment_method,
  official_receipt,
  paid_at,
  cashier_verified_at,
  cashier_can_proceed,
  metadata
)
VALUES
  (
    'crad',
    'PAY-9201',
    9201,
    'CASH-CRAD-9201',
    'INV-CRAD-9201',
    2500,
    0,
    2500,
    'pending',
    NULL,
    NULL,
    NULL,
    NULL,
    0,
    jsonb_build_object('student_name', 'Juan Dela Cruz', 'research_code', 'R-2026-201')
  ),
  (
    'crad',
    'PAY-9202',
    9202,
    'CASH-CRAD-9202',
    'INV-CRAD-9202',
    2500,
    2500,
    0,
    'paid',
    'over_the_counter',
    'OR-9202',
    now() - interval '15 days',
    now() - interval '15 days',
    1,
    jsonb_build_object('student_name', 'Juan Dela Cruz', 'research_code', 'R-2026-202')
  ),
  (
    'crad',
    'PAY-9203',
    9203,
    'CASH-CRAD-9203',
    'INV-CRAD-9203',
    2500,
    2500,
    0,
    'paid',
    'gcash',
    'OR-9203',
    now() - interval '12 days',
    now() - interval '12 days',
    1,
    jsonb_build_object('student_name', 'Ana Reyes', 'research_code', 'R-2026-203')
  ),
  (
    'crad',
    'PAY-9204',
    9204,
    'CASH-CRAD-9204',
    'INV-CRAD-9204',
    2500,
    1000,
    1500,
    'partial',
    'online_transfer',
    NULL,
    now() - interval '1 day',
    now() - interval '1 day',
    0,
    jsonb_build_object('student_name', 'Paolo Ramos', 'research_code', 'R-2026-205')
  );

DELETE FROM clinic.cashier_integration_events
WHERE source_module = 'crad'
  AND source_key IN ('PAY-9201', 'PAY-9202', 'PAY-9203', 'PAY-9204');

INSERT INTO clinic.cashier_integration_events (
  source_module,
  source_key,
  source_entity,
  event_key,
  reference_no,
  patient_name,
  patient_type,
  amount_due,
  currency_code,
  payment_status,
  sync_status,
  synced_at,
  last_error,
  payload
)
VALUES
  (
    'crad',
    'PAY-9201',
    'payment',
    'CRAD_PAYMENT_SUBMITTED_PAY9201',
    'CASH-CRAD-9201',
    'Juan Dela Cruz',
    'student',
    2500,
    'PHP',
    'pending',
    'queued',
    NULL,
    NULL,
    jsonb_build_object('payment_code', 'PAY-9201', 'notes', 'Queued for cashier verification.')
  ),
  (
    'crad',
    'PAY-9202',
    'payment',
    'CRAD_PAYMENT_VERIFIED_PAY9202',
    'CASH-CRAD-9202',
    'Juan Dela Cruz',
    'student',
    2500,
    'PHP',
    'paid',
    'synced',
    now() - interval '15 days',
    NULL,
    jsonb_build_object('payment_code', 'PAY-9202', 'notes', 'Payment cleared and synced to cashier.')
  ),
  (
    'crad',
    'PAY-9203',
    'payment',
    'CRAD_PAYMENT_VERIFIED_PAY9203',
    'CASH-CRAD-9203',
    'Ana Reyes',
    'student',
    2500,
    'PHP',
    'paid',
    'synced',
    now() - interval '12 days',
    NULL,
    jsonb_build_object('payment_code', 'PAY-9203', 'notes', 'Verified before final defense.')
  ),
  (
    'crad',
    'PAY-9204',
    'payment',
    'CRAD_PAYMENT_PARTIAL_PAY9204',
    'CASH-CRAD-9204',
    'Paolo Ramos',
    'student',
    2500,
    'PHP',
    'partial',
    'error',
    now() - interval '1 day',
    'Remaining balance must be settled before clearance release.',
    jsonb_build_object('payment_code', 'PAY-9204', 'notes', 'Partial payment recorded.')
  );

DELETE FROM crad.audit_logs
WHERE id IN (
  '52000000-0000-0000-0000-000000000201',
  '52000000-0000-0000-0000-000000000202',
  '52000000-0000-0000-0000-000000000203',
  '52000000-0000-0000-0000-000000000204'
);

INSERT INTO crad.audit_logs (id, user_id, action, details, entity_type, entity_id, created_at)
SELECT
  '52000000-0000-0000-0000-000000000201',
  staff_user.user_id,
  'REGISTRAR_STUDENT_LIST_RECEIVED',
  '{"summary":{"source":"Registrar","sent_at":"2026-03-20T09:00:00Z","student_count":3},"students":[{"student_no":"2026-0001","student_name":"Juan Dela Cruz","program":"BSIT","year_level":"4"},{"student_no":"2026-0002","student_name":"Ana Reyes","program":"BSCS","year_level":"4"},{"student_no":"2026-0003","student_name":"Paolo Ramos","program":"BSIS","year_level":"3"}]}',
  'registrar_student_list',
  NULL,
  now() - interval '1 day'
FROM (SELECT user_id FROM crad.user_roles WHERE role = 'staff' ORDER BY user_id LIMIT 1) AS staff_user;

INSERT INTO crad.audit_logs (id, user_id, action, details, entity_type, entity_id, created_at)
SELECT
  '52000000-0000-0000-0000-000000000202',
  staff_user.user_id,
  'REGISTRAR_STUDENT_LIST_RECEIVED',
  '{"summary":{"source":"Registrar","sent_at":"2026-03-21T02:15:00Z","student_count":2},"students":[{"student_no":"2026-0004","student_name":"Alyssa Mendoza","program":"BSIT","year_level":"4"},{"student_no":"2026-0005","student_name":"Bryan Santos","program":"BSCS","year_level":"3"}]}',
  'registrar_student_list',
  NULL,
  now() - interval '4 hours'
FROM (SELECT user_id FROM crad.user_roles WHERE role = 'staff' ORDER BY user_id LIMIT 1) AS staff_user;

INSERT INTO crad.audit_logs (id, user_id, action, details, entity_type, entity_id, created_at)
SELECT
  '52000000-0000-0000-0000-000000000203',
  adviser_user.user_id,
  'STUDENT_RECOMMENDATION_RECEIVED',
  '{"student_id":"2026-0002","student_name":"Ana Reyes","recommendation_type":"Program Endorsement","guidance_status":"endorsed","summary":"Recommended for final defense scheduling after counseling clearance.","recommended_by":"Guidance Office","notes":"No pending guidance holds.","reference_no":"GUIDE-2026-014"}',
  'student_recommendation',
  NULL,
  now() - interval '2 days'
FROM (SELECT user_id FROM crad.user_roles WHERE role = 'adviser' ORDER BY user_id LIMIT 1) AS adviser_user;

INSERT INTO crad.audit_logs (id, user_id, action, details, entity_type, entity_id, created_at)
SELECT
  '52000000-0000-0000-0000-000000000204',
  adviser_user.user_id,
  'STUDENT_RECOMMENDATION_RECEIVED',
  '{"student_id":"2026-0005","student_name":"Bryan Santos","recommendation_type":"Wellness Follow-Up","guidance_status":"for-review","summary":"Guidance recommends follow-up before endorsement.","recommended_by":"Guidance Office","notes":"Needs one more counseling session.","reference_no":"GUIDE-2026-015"}',
  'student_recommendation',
  NULL,
  now() - interval '6 hours'
FROM (SELECT user_id FROM crad.user_roles WHERE role = 'adviser' ORDER BY user_id LIMIT 1) AS adviser_user;

SET search_path TO public;
