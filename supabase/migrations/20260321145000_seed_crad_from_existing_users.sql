CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  admin_user_id uuid;
  staff_user_id uuid;
  adviser_user_id uuid;
  student_one_user_id uuid;
  student_two_user_id uuid;
  student_three_user_id uuid;
  dept_it_id uuid;
  dept_cs_id uuid;
  thesis_category_id uuid;
  software_category_id uuid;
  current_academic_year_id uuid;
BEGIN
  SELECT user_id INTO admin_user_id FROM crad.profiles ORDER BY created_at, user_id LIMIT 1;
  SELECT user_id INTO staff_user_id FROM crad.profiles ORDER BY created_at, user_id OFFSET 1 LIMIT 1;
  SELECT user_id INTO adviser_user_id FROM crad.profiles ORDER BY created_at, user_id OFFSET 2 LIMIT 1;
  SELECT user_id INTO student_one_user_id FROM crad.profiles ORDER BY created_at, user_id OFFSET 3 LIMIT 1;
  SELECT user_id INTO student_two_user_id FROM crad.profiles ORDER BY created_at, user_id OFFSET 4 LIMIT 1;
  SELECT user_id INTO student_three_user_id FROM crad.profiles ORDER BY created_at, user_id OFFSET 5 LIMIT 1;

  UPDATE crad.profiles SET full_name = 'CRAD Admin' WHERE user_id = admin_user_id;
  UPDATE crad.profiles SET full_name = 'CRAD Staff' WHERE user_id = staff_user_id;
  UPDATE crad.profiles SET full_name = 'Prof. Maria Santos' WHERE user_id = adviser_user_id;
  UPDATE crad.profiles SET full_name = 'Juan Dela Cruz' WHERE user_id = student_one_user_id;
  UPDATE crad.profiles SET full_name = 'Ana Reyes' WHERE user_id = student_two_user_id;
  UPDATE crad.profiles SET full_name = 'Paolo Ramos' WHERE user_id = student_three_user_id;

  DELETE FROM crad.user_roles
  WHERE user_id IN (admin_user_id, staff_user_id, adviser_user_id, student_one_user_id, student_two_user_id, student_three_user_id);

  INSERT INTO crad.user_roles (id, user_id, role)
  VALUES
    (gen_random_uuid(), admin_user_id, 'admin'),
    (gen_random_uuid(), staff_user_id, 'staff'),
    (gen_random_uuid(), adviser_user_id, 'adviser'),
    (gen_random_uuid(), student_one_user_id, 'student'),
    (gen_random_uuid(), student_two_user_id, 'student'),
    (gen_random_uuid(), student_three_user_id, 'student');

  SELECT id INTO dept_it_id FROM crad.departments WHERE code = 'IT' LIMIT 1;
  SELECT id INTO dept_cs_id FROM crad.departments WHERE code = 'CS' LIMIT 1;
  SELECT id INTO thesis_category_id FROM crad.research_categories WHERE name = 'Thesis' LIMIT 1;
  SELECT id INTO software_category_id FROM crad.research_categories WHERE name = 'Software Development' LIMIT 1;
  SELECT id INTO current_academic_year_id FROM crad.academic_years WHERE is_current = true ORDER BY created_at DESC LIMIT 1;

  INSERT INTO crad.announcements (id, title, content, is_pinned, created_by, created_at, updated_at)
  VALUES
    ('30000000-0000-0000-0000-000000000201', 'CRAD Demo Workspace Ready', 'Operational demo data has been loaded for research, payments, defenses, approvals, and archive views.', true, admin_user_id, now() - interval '8 days', now() - interval '8 days'),
    ('30000000-0000-0000-0000-000000000202', 'Panel Scheduling Open', 'Staff can now review seeded defense schedules and approval queues from the coordination pages.', false, staff_user_id, now() - interval '3 days', now() - interval '3 days')
  ON CONFLICT (id) DO UPDATE
  SET title = EXCLUDED.title,
      content = EXCLUDED.content,
      is_pinned = EXCLUDED.is_pinned,
      created_by = EXCLUDED.created_by,
      updated_at = EXCLUDED.updated_at;

  INSERT INTO crad.research (id, research_code, title, abstract, status, category_id, department_id, academic_year_id, submitted_by, created_at, updated_at)
  VALUES
    ('40000000-0000-0000-0000-000000000201', 'R-2026-201', 'Smart Inventory Tracking System for Campus Laboratories', 'A web-based inventory tracker that monitors issuance, return, and stock movement for laboratory equipment.', 'pending', software_category_id, dept_it_id, current_academic_year_id, student_one_user_id, now() - interval '40 days', now() - interval '4 days'),
    ('40000000-0000-0000-0000-000000000202', 'R-2026-202', 'Barangay Request Management Portal', 'A digital workflow portal that routes barangay concerns and tracks turnaround time.', 'approved', software_category_id, dept_it_id, current_academic_year_id, student_one_user_id, now() - interval '30 days', now() - interval '2 days'),
    ('40000000-0000-0000-0000-000000000203', 'R-2026-203', 'AI-Powered Attendance Analytics for Student Intervention', 'A thesis project that analyzes attendance behavior and surfaces early intervention signals.', 'pending_final_approval', thesis_category_id, dept_cs_id, current_academic_year_id, student_two_user_id, now() - interval '24 days', now() - interval '1 day'),
    ('40000000-0000-0000-0000-000000000204', 'R-2026-204', 'Community Research Repository and Archival Dashboard', 'A searchable repository for completed research papers with filters, tagging, and archival reporting.', 'archived', thesis_category_id, dept_it_id, current_academic_year_id, student_two_user_id, now() - interval '70 days', now() - interval '10 hours'),
    ('40000000-0000-0000-0000-000000000205', 'R-2026-205', 'Student Wellness Appointment Assistant', 'A scheduling assistant for campus wellness and counseling support requests.', 'review', software_category_id, dept_cs_id, current_academic_year_id, student_three_user_id, now() - interval '18 days', now() - interval '2 days')
  ON CONFLICT (id) DO UPDATE
  SET title = EXCLUDED.title,
      abstract = EXCLUDED.abstract,
      status = EXCLUDED.status,
      category_id = EXCLUDED.category_id,
      department_id = EXCLUDED.department_id,
      academic_year_id = EXCLUDED.academic_year_id,
      submitted_by = EXCLUDED.submitted_by,
      updated_at = EXCLUDED.updated_at;

  INSERT INTO crad.research_members (id, research_id, user_id, member_name, is_leader, created_at)
  VALUES
    ('41000000-0000-0000-0000-000000000201', '40000000-0000-0000-0000-000000000201', student_one_user_id, 'Juan Dela Cruz', true, now() - interval '40 days'),
    ('41000000-0000-0000-0000-000000000202', '40000000-0000-0000-0000-000000000201', null, 'Maria Lopez', false, now() - interval '40 days'),
    ('41000000-0000-0000-0000-000000000203', '40000000-0000-0000-0000-000000000202', student_one_user_id, 'Juan Dela Cruz', true, now() - interval '30 days'),
    ('41000000-0000-0000-0000-000000000204', '40000000-0000-0000-0000-000000000202', null, 'Carlo Mendoza', false, now() - interval '30 days'),
    ('41000000-0000-0000-0000-000000000205', '40000000-0000-0000-0000-000000000203', student_two_user_id, 'Ana Reyes', true, now() - interval '24 days'),
    ('41000000-0000-0000-0000-000000000206', '40000000-0000-0000-0000-000000000203', null, 'Paolo Ramos', false, now() - interval '24 days'),
    ('41000000-0000-0000-0000-000000000207', '40000000-0000-0000-0000-000000000204', student_two_user_id, 'Ana Reyes', true, now() - interval '70 days'),
    ('41000000-0000-0000-0000-000000000208', '40000000-0000-0000-0000-000000000205', student_three_user_id, 'Paolo Ramos', true, now() - interval '18 days')
  ON CONFLICT (id) DO UPDATE
  SET member_name = EXCLUDED.member_name,
      is_leader = EXCLUDED.is_leader;

  INSERT INTO crad.adviser_assignments (id, research_id, adviser_id, assigned_by, assigned_at)
  VALUES
    ('42000000-0000-0000-0000-000000000201', '40000000-0000-0000-0000-000000000202', adviser_user_id, staff_user_id, now() - interval '25 days'),
    ('42000000-0000-0000-0000-000000000202', '40000000-0000-0000-0000-000000000203', adviser_user_id, staff_user_id, now() - interval '20 days'),
    ('42000000-0000-0000-0000-000000000203', '40000000-0000-0000-0000-000000000204', adviser_user_id, admin_user_id, now() - interval '60 days'),
    ('42000000-0000-0000-0000-000000000204', '40000000-0000-0000-0000-000000000205', adviser_user_id, staff_user_id, now() - interval '15 days')
  ON CONFLICT (id) DO UPDATE
  SET adviser_id = EXCLUDED.adviser_id,
      assigned_by = EXCLUDED.assigned_by,
      assigned_at = EXCLUDED.assigned_at;

  INSERT INTO crad.manuscripts (id, research_id, version_number, file_url, file_name, version_notes, status, uploaded_by, reviewed_by, reviewed_at, created_at, updated_at)
  VALUES
    ('43000000-0000-0000-0000-000000000201', '40000000-0000-0000-0000-000000000202', 1, 'seed/barangay-portal-v1.pdf', 'barangay-portal-v1.pdf', 'Initial approved manuscript revision.', 'approved', student_one_user_id, adviser_user_id, now() - interval '9 days', now() - interval '12 days', now() - interval '9 days'),
    ('43000000-0000-0000-0000-000000000202', '40000000-0000-0000-0000-000000000203', 2, 'seed/attendance-analytics-v2.pdf', 'attendance-analytics-v2.pdf', 'Updated chapter 4 metrics and evaluation tables.', 'submitted', student_two_user_id, null, null, now() - interval '3 days', now() - interval '3 days'),
    ('43000000-0000-0000-0000-000000000203', '40000000-0000-0000-0000-000000000204', 3, 'seed/repository-dashboard-v3.pdf', 'repository-dashboard-v3.pdf', 'Final manuscript approved for archival.', 'approved', student_two_user_id, adviser_user_id, now() - interval '8 days', now() - interval '12 days', now() - interval '8 days'),
    ('43000000-0000-0000-0000-000000000204', '40000000-0000-0000-0000-000000000205', 1, 'seed/wellness-assistant-v1.pdf', 'wellness-assistant-v1.pdf', 'Awaiting adviser markup.', 'under_review', student_three_user_id, adviser_user_id, null, now() - interval '5 days', now() - interval '5 days')
  ON CONFLICT (id) DO UPDATE
  SET version_notes = EXCLUDED.version_notes,
      status = EXCLUDED.status,
      reviewed_by = EXCLUDED.reviewed_by,
      reviewed_at = EXCLUDED.reviewed_at,
      updated_at = EXCLUDED.updated_at;

  INSERT INTO crad.payments (id, payment_code, research_id, amount, proof_url, proof_file_name, status, submitted_by, verified_by, verified_at, notes, created_at, updated_at)
  VALUES
    ('44000000-0000-0000-0000-000000000201', 'PAY-9201', '40000000-0000-0000-0000-000000000201', 2500, 'seed/payment-9201.png', 'payment-9201.png', 'submitted', student_one_user_id, null, null, 'Awaiting cashier verification.', now() - interval '4 days', now() - interval '4 days'),
    ('44000000-0000-0000-0000-000000000202', 'PAY-9202', '40000000-0000-0000-0000-000000000202', 2500, 'seed/payment-9202.png', 'payment-9202.png', 'verified', student_one_user_id, staff_user_id, now() - interval '15 days', 'Paid and cleared for manuscript review.', now() - interval '18 days', now() - interval '15 days'),
    ('44000000-0000-0000-0000-000000000203', 'PAY-9203', '40000000-0000-0000-0000-000000000203', 2500, 'seed/payment-9203.png', 'payment-9203.png', 'verified', student_two_user_id, staff_user_id, now() - interval '12 days', 'Cleared before final defense.', now() - interval '14 days', now() - interval '12 days'),
    ('44000000-0000-0000-0000-000000000204', 'PAY-9204', '40000000-0000-0000-0000-000000000205', 2500, 'seed/payment-9204.png', 'payment-9204.png', 'pending', student_three_user_id, null, null, 'New payment proof uploaded.', now() - interval '1 day', now() - interval '1 day')
  ON CONFLICT (id) DO UPDATE
  SET status = EXCLUDED.status,
      verified_by = EXCLUDED.verified_by,
      verified_at = EXCLUDED.verified_at,
      notes = EXCLUDED.notes,
      updated_at = EXCLUDED.updated_at;

  INSERT INTO crad.defense_schedules (id, research_id, defense_date, defense_time, room, status, notes, created_by, created_at, updated_at)
  VALUES
    ('45000000-0000-0000-0000-000000000201', '40000000-0000-0000-0000-000000000202', current_date + 7, '09:00', 'Room 301', 'scheduled', 'Ready for panel presentation next week.', staff_user_id, now() - interval '2 days', now() - interval '2 days'),
    ('45000000-0000-0000-0000-000000000202', '40000000-0000-0000-0000-000000000203', current_date - 2, '13:00', 'Research Hall A', 'completed', 'Panel completed scoring; awaiting final approval.', staff_user_id, now() - interval '5 days', now() - interval '2 days'),
    ('45000000-0000-0000-0000-000000000203', '40000000-0000-0000-0000-000000000204', current_date - 15, '10:30', 'Research Hall B', 'completed', 'Defense closed and endorsed for archive.', admin_user_id, now() - interval '20 days', now() - interval '15 days')
  ON CONFLICT (id) DO UPDATE
  SET defense_date = EXCLUDED.defense_date,
      defense_time = EXCLUDED.defense_time,
      room = EXCLUDED.room,
      status = EXCLUDED.status,
      notes = EXCLUDED.notes,
      created_by = EXCLUDED.created_by,
      updated_at = EXCLUDED.updated_at;

  INSERT INTO crad.defense_panel_members (id, defense_id, panelist_id, role)
  VALUES
    ('46000000-0000-0000-0000-000000000201', '45000000-0000-0000-0000-000000000201', adviser_user_id, 'leader'),
    ('46000000-0000-0000-0000-000000000202', '45000000-0000-0000-0000-000000000201', admin_user_id, 'panelist'),
    ('46000000-0000-0000-0000-000000000203', '45000000-0000-0000-0000-000000000202', adviser_user_id, 'leader'),
    ('46000000-0000-0000-0000-000000000204', '45000000-0000-0000-0000-000000000202', admin_user_id, 'panelist'),
    ('46000000-0000-0000-0000-000000000205', '45000000-0000-0000-0000-000000000203', adviser_user_id, 'leader')
  ON CONFLICT (id) DO UPDATE
  SET panelist_id = EXCLUDED.panelist_id,
      role = EXCLUDED.role;

  INSERT INTO crad.defense_grades (id, defense_id, research_id, panelist_id, grade, remarks, created_at, updated_at)
  VALUES
    ('47000000-0000-0000-0000-000000000201', '45000000-0000-0000-0000-000000000202', '40000000-0000-0000-0000-000000000203', adviser_user_id, 91.50, 'Strong statistical treatment and clear intervention workflow.', now() - interval '2 days', now() - interval '2 days'),
    ('47000000-0000-0000-0000-000000000202', '45000000-0000-0000-0000-000000000202', '40000000-0000-0000-0000-000000000203', admin_user_id, 89.75, 'Needs minor polishing in deployment documentation.', now() - interval '2 days', now() - interval '2 days'),
    ('47000000-0000-0000-0000-000000000203', '45000000-0000-0000-0000-000000000203', '40000000-0000-0000-0000-000000000204', adviser_user_id, 94.25, 'Excellent archival readiness and documentation quality.', now() - interval '15 days', now() - interval '15 days')
  ON CONFLICT (id) DO UPDATE
  SET grade = EXCLUDED.grade,
      remarks = EXCLUDED.remarks,
      updated_at = EXCLUDED.updated_at;

  INSERT INTO crad.final_approvals (id, research_id, status, approved_by, remarks, approved_at, created_at, updated_at)
  VALUES
    ('48000000-0000-0000-0000-000000000201', '40000000-0000-0000-0000-000000000203', 'pending', null, 'Waiting for staff sign-off after completed defense.', null, now() - interval '2 days', now() - interval '2 days'),
    ('48000000-0000-0000-0000-000000000202', '40000000-0000-0000-0000-000000000204', 'approved', admin_user_id, 'Approved for archive and publication listing.', now() - interval '14 days', now() - interval '14 days', now() - interval '14 days')
  ON CONFLICT (id) DO UPDATE
  SET status = EXCLUDED.status,
      approved_by = EXCLUDED.approved_by,
      remarks = EXCLUDED.remarks,
      approved_at = EXCLUDED.approved_at,
      updated_at = EXCLUDED.updated_at;

  INSERT INTO crad.remarks (id, research_id, manuscript_id, author_id, message, created_at)
  VALUES
    ('49000000-0000-0000-0000-000000000201', '40000000-0000-0000-0000-000000000201', null, adviser_user_id, 'Please expand the inventory forecasting section before adviser endorsement.', now() - interval '3 days'),
    ('49000000-0000-0000-0000-000000000202', '40000000-0000-0000-0000-000000000203', '43000000-0000-0000-0000-000000000202', adviser_user_id, 'Good revision overall. Prepare the deployment notes for the final panel packet.', now() - interval '2 days')
  ON CONFLICT (id) DO UPDATE
  SET message = EXCLUDED.message;

  INSERT INTO crad.notifications (id, user_id, type, title, message, is_read, reference_id, reference_type, created_at)
  VALUES
    ('50000000-0000-0000-0000-000000000201', student_one_user_id, 'payment', 'Payment awaiting verification', 'Your payment for Smart Inventory Tracking System is queued for review.', false, '44000000-0000-0000-0000-000000000201', 'payment', now() - interval '4 days'),
    ('50000000-0000-0000-0000-000000000202', student_two_user_id, 'defense', 'Final approval pending', 'Your defense is completed. CRAD staff will finalize the approval next.', false, '48000000-0000-0000-0000-000000000201', 'final_approval', now() - interval '2 days'),
    ('50000000-0000-0000-0000-000000000203', adviser_user_id, 'research', 'New research assigned', 'AI-Powered Attendance Analytics has been assigned to you for advising.', true, '40000000-0000-0000-0000-000000000203', 'research', now() - interval '20 days'),
    ('50000000-0000-0000-0000-000000000204', admin_user_id, 'announcement', 'Database demo data loaded', 'Seed records were inserted to populate dashboards, tables, and approval queues.', true, null, 'system', now() - interval '1 day')
  ON CONFLICT (id) DO UPDATE
  SET title = EXCLUDED.title,
      message = EXCLUDED.message,
      is_read = EXCLUDED.is_read,
      created_at = EXCLUDED.created_at;

  INSERT INTO crad.audit_logs (id, user_id, action, details, entity_type, entity_id, created_at)
  VALUES
    ('51000000-0000-0000-0000-000000000201', staff_user_id, 'PAYMENT_VERIFIED', 'Verified payment PAY-9202 for Barangay Request Management Portal.', 'payments', '44000000-0000-0000-0000-000000000202', now() - interval '15 days'),
    ('51000000-0000-0000-0000-000000000202', staff_user_id, 'DEFENSE_COMPLETED', 'Completed defense workflow for AI-Powered Attendance Analytics.', 'defense_schedules', '45000000-0000-0000-0000-000000000202', now() - interval '2 days'),
    ('51000000-0000-0000-0000-000000000203', admin_user_id, 'RESEARCH_ARCHIVED', 'Archived Community Research Repository and Archival Dashboard after final approval.', 'research', '40000000-0000-0000-0000-000000000204', now() - interval '14 days')
  ON CONFLICT (id) DO UPDATE
  SET action = EXCLUDED.action,
      details = EXCLUDED.details,
      created_at = EXCLUDED.created_at;

  UPDATE crad.system_settings
  SET updated_by = admin_user_id,
      updated_at = now()
  WHERE key IN ('institution_name', 'academic_year', 'research_fee', 'maintenance_mode');
END
$$;
