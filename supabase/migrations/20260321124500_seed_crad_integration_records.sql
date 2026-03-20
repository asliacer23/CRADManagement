-- Seed CRAD integration-facing clinic records so the crad schema views return data.
-- The crad schema exposes views over clinic tables, so inserts must target clinic.*

CREATE SCHEMA IF NOT EXISTS clinic;
CREATE SCHEMA IF NOT EXISTS crad;

SET search_path TO clinic, crad, public;

DELETE FROM clinic.department_clearance_records
WHERE department_key = 'crad'
  AND clearance_reference IN (
    'CRAD-CL-2026-001',
    'CRAD-CL-2026-002',
    'CRAD-CL-2026-003',
    'CRAD-CL-2026-004',
    'CRAD-CL-2026-005'
  );

INSERT INTO clinic.department_clearance_records (
  department_key,
  department_name,
  clearance_reference,
  external_reference,
  patient_id,
  patient_code,
  patient_name,
  patient_type,
  requested_by,
  approver_name,
  approver_role,
  stage_order,
  status,
  remarks,
  decided_at,
  metadata
)
VALUES
  (
    'crad',
    'CRAD',
    'CRAD-CL-2026-001',
    'REG-2026-0401',
    '2026-0001',
    'STU-0001',
    'Alyssa Mendoza',
    'student',
    'Registrar Office',
    'Prof. Elaine Ramos',
    'CRAD Coordinator',
    7,
    'approved',
    'Research clearance validated and endorsed for cashier processing.',
    NOW() - INTERVAL '5 days',
    jsonb_build_object(
      'research_title', 'AI-Assisted Crop Disease Detection',
      'program', 'BS Information Technology',
      'campus', 'Main Campus'
    )
  ),
  (
    'crad',
    'CRAD',
    'CRAD-CL-2026-002',
    'REG-2026-0402',
    '2026-0002',
    'STU-0002',
    'Bryan Santos',
    'student',
    'Registrar Office',
    'Prof. Elaine Ramos',
    'CRAD Coordinator',
    7,
    'pending',
    'Awaiting manuscript validation before final release.',
    NULL,
    jsonb_build_object(
      'research_title', 'Smart Attendance Monitoring',
      'program', 'BS Computer Science',
      'campus', 'North Campus'
    )
  ),
  (
    'crad',
    'CRAD',
    'CRAD-CL-2026-003',
    'REG-2026-0403',
    '2026-0003',
    'STU-0003',
    'Camille Rivera',
    'student',
    'Registrar Office',
    'Dr. Noel Garcia',
    'Research Archivist',
    7,
    'approved',
    'Archived copy and research metadata verified.',
    NOW() - INTERVAL '2 days',
    jsonb_build_object(
      'research_title', 'Community Waste Segregation Analytics',
      'program', 'BS Information Systems',
      'campus', 'Main Campus'
    )
  ),
  (
    'crad',
    'CRAD',
    'CRAD-CL-2026-004',
    'REG-2026-0404',
    '2026-0004',
    'STU-0004',
    'Daniel Villanueva',
    'student',
    'Registrar Office',
    'Prof. Elaine Ramos',
    'CRAD Coordinator',
    7,
    'revision_requested',
    'Please complete missing panel remarks before endorsement.',
    NOW() - INTERVAL '1 day',
    jsonb_build_object(
      'research_title', 'Barangay Incident Reporting Portal',
      'program', 'BS Information Technology',
      'campus', 'South Campus'
    )
  ),
  (
    'crad',
    'CRAD',
    'CRAD-CL-2026-005',
    'REG-2026-0405',
    '2026-0005',
    'STU-0005',
    'Erika Bautista',
    'student',
    'Registrar Office',
    'Dr. Noel Garcia',
    'Research Archivist',
    7,
    'approved',
    'Clearance approved and released to the cashier queue.',
    NOW() - INTERVAL '12 hours',
    jsonb_build_object(
      'research_title', 'Telehealth Follow-Up Scheduler',
      'program', 'BS Information Systems',
      'campus', 'Main Campus'
    )
  );

SET search_path TO public;
