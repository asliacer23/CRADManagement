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
  SELECT user_id INTO admin_user_id
  FROM public.user_roles
  WHERE role::text = 'admin'
  ORDER BY created_at NULLS LAST, user_id
  LIMIT 1;

  SELECT user_id INTO staff_user_id
  FROM public.user_roles
  WHERE role::text = 'staff'
  ORDER BY created_at NULLS LAST, user_id
  LIMIT 1;

  SELECT user_id INTO adviser_user_id
  FROM public.user_roles
  WHERE role::text = 'adviser'
  ORDER BY created_at NULLS LAST, user_id
  LIMIT 1;

  SELECT user_id INTO student_one_user_id
  FROM public.user_roles
  WHERE role::text = 'student'
  ORDER BY created_at NULLS LAST, user_id
  LIMIT 1;

  SELECT user_id INTO student_two_user_id
  FROM public.user_roles
  WHERE role::text = 'student'
  ORDER BY created_at NULLS LAST, user_id
  OFFSET 1 LIMIT 1;

  SELECT user_id INTO student_three_user_id
  FROM public.user_roles
  WHERE role::text = 'student'
  ORDER BY created_at NULLS LAST, user_id
  OFFSET 2 LIMIT 1;

  IF admin_user_id IS NULL OR staff_user_id IS NULL OR adviser_user_id IS NULL OR student_one_user_id IS NULL OR student_two_user_id IS NULL THEN
    RAISE EXCEPTION 'Not enough existing users/roles to seed CRAD data';
  END IF;

  SELECT id INTO dept_it_id FROM public.departments WHERE code = 'IT' LIMIT 1;
  SELECT id INTO dept_cs_id FROM public.departments WHERE code = 'CS' LIMIT 1;
  SELECT id INTO thesis_category_id FROM public.research_categories WHERE name = 'Thesis' LIMIT 1;
  SELECT id INTO software_category_id FROM public.research_categories WHERE name = 'Software Development' LIMIT 1;
  SELECT id INTO current_academic_year_id FROM public.academic_years WHERE is_current = true ORDER BY created_at DESC LIMIT 1;

  INSERT INTO public.announcements (id, title, content, is_pinned, created_by, created_at, updated_at)
  VALUES
    ('30000000-0000-0000-0000-000000000101', 'CRAD Demo Workspace Ready', 'Operational demo data has been loaded for research, payments, defenses, approvals, and archive views.', true, admin_user_id, now() - interval '8 days', now() - interval '8 days'),
    ('30000000-0000-0000-0000-000000000102', 'Panel Scheduling Open', 'Staff can now review seeded defense schedules and approval queues from the coordination pages.', false, staff_user_id, now() - interval '3 days', now() - interval '3 days')
  ON CONFLICT (id) DO UPDATE
  SET title = EXCLUDED.title,
      content = EXCLUDED.content,
      is_pinned = EXCLUDED.is_pinned,
      created_by = EXCLUDED.created_by,
      updated_at = EXCLUDED.updated_at;

  INSERT INTO public.research (
    id, research_code, title, abstract, status, category_id, department_id, academic_year_id, submitted_by, created_at, updated_at
  )
  VALUES
    ('40000000-0000-0000-0000-000000000101', 'R-2026-101', 'Smart Inventory Tracking System for Campus Laboratories', 'A web-based inventory tracker that monitors issuance, return, and stock movement for laboratory equipment.', 'pending', software_category_id, dept_it_id, current_academic_year_id, student_one_user_id, now() - interval '40 days', now() - interval '4 days'),
    ('40000000-0000-0000-0000-000000000102', 'R-2026-102', 'Barangay Request Management Portal', 'A digital workflow portal that routes barangay concerns and tracks turnaround time.', 'approved', software_category_id, dept_it_id, current_academic_year_id, student_one_user_id, now() - interval '30 days', now() - interval '2 days'),
    ('40000000-0000-0000-0000-000000000103', 'R-2026-103', 'AI-Powered Attendance Analytics for Student Intervention', 'A thesis project that analyzes attendance behavior and surfaces early intervention signals.', 'pending_final_approval', thesis_category_id, dept_cs_id, current_academic_year_id, student_two_user_id, now() - interval '24 days', now() - interval '1 day'),
    ('40000000-0000-0000-0000-000000000104', 'R-2026-104', 'Community Research Repository and Archival Dashboard', 'A searchable repository for completed research papers with filters, tagging, and archival reporting.', 'archived', thesis_category_id, dept_it_id, current_academic_year_id, student_two_user_id, now() - interval '70 days', now() - interval '10 hours'),
    ('40000000-0000-0000-0000-000000000105', 'R-2026-105', 'Student Wellness Appointment Assistant', 'A scheduling assistant for campus wellness and counseling support requests.', 'review', software_category_id, dept_cs_id, current_academic_year_id, COALESCE(student_three_user_id, student_two_user_id), now() - interval '18 days', now() - interval '2 days')
  ON CONFLICT (id) DO UPDATE
  SET title = EXCLUDED.title,
      abstract = EXCLUDED.abstract,
      status = EXCLUDED.status,
      category_id = EXCLUDED.category_id,
      department_id = EXCLUDED.department_id,
      academic_year_id = EXCLUDED.academic_year_id,
      submitted_by = EXCLUDED.submitted_by,
      updated_at = EXCLUDED.updated_at;

  INSERT INTO public.research_members (id, research_id, user_id, member_name, is_leader, created_at)
  VALUES
    ('41000000-0000-0000-0000-000000000101', '40000000-0000-0000-0000-000000000101', student_one_user_id, COALESCE((SELECT full_name FROM public.profiles WHERE user_id = student_one_user_id), 'Student One'), true, now() - interval '40 days'),
    ('41000000-0000-0000-0000-000000000102', '40000000-0000-0000-0000-000000000101', null, 'Maria Lopez', false, now() - interval '40 days'),
    ('41000000-0000-0000-0000-000000000103', '40000000-0000-0000-0000-000000000102', student_one_user_id, COALESCE((SELECT full_name FROM public.profiles WHERE user_id = student_one_user_id), 'Student One'), true, now() - interval '30 days'),
    ('41000000-0000-0000-0000-000000000104', '40000000-0000-0000-0000-000000000102', null, 'Carlo Mendoza', false, now() - interval '30 days'),
    ('41000000-0000-0000-0000-000000000105', '40000000-0000-0000-0000-000000000103', student_two_user_id, COALESCE((SELECT full_name FROM public.profiles WHERE user_id = student_two_user_id), 'Student Two'), true, now() - interval '24 days'),
    ('41000000-0000-0000-0000-000000000106', '40000000-0000-0000-0000-000000000103', null, 'Paolo Ramos', false, now() - interval '24 days'),
    ('41000000-0000-0000-0000-000000000107', '40000000-0000-0000-0000-000000000104', student_two_user_id, COALESCE((SELECT full_name FROM public.profiles WHERE user_id = student_two_user_id), 'Student Two'), true, now() - interval '70 days'),
    ('41000000-0000-0000-0000-000000000108', '40000000-0000-0000-0000-000000000105', COALESCE(student_three_user_id, student_two_user_id), COALESCE((SELECT full_name FROM public.profiles WHERE user_id = COALESCE(student_three_user_id, student_two_user_id)), 'Student Three'), true, now() - interval '18 days')
  ON CONFLICT (id) DO UPDATE
  SET member_name = EXCLUDED.member_name,
      is_leader = EXCLUDED.is_leader;

  INSERT INTO public.adviser_assignments (id, research_id, adviser_id, assigned_by, assigned_at)
  VALUES
    ('42000000-0000-0000-0000-000000000101', '40000000-0000-0000-0000-000000000102', adviser_user_id, staff_user_id, now() - interval '25 days'),
    ('42000000-0000-0000-0000-000000000102', '40000000-0000-0000-0000-000000000103', adviser_user_id, staff_user_id, now() - interval '20 days'),
    ('42000000-0000-0000-0000-000000000103', '40000000-0000-0000-0000-000000000104', adviser_user_id, admin_user_id, now() - interval '60 days'),
    ('42000000-0000-0000-0000-000000000104', '40000000-0000-0000-0000-000000000105', adviser_user_id, staff_user_id, now() - interval '15 days')
  ON CONFLICT (id) DO UPDATE
  SET adviser_id = EXCLUDED.adviser_id,
      assigned_by = EXCLUDED.assigned_by,
      assigned_at = EXCLUDED.assigned_at;

  INSERT INTO public.manuscripts (id, research_id, version_number, file_url, file_name, version_notes, status, uploaded_by, reviewed_by, reviewed_at, created_at, updated_at)
  VALUES
    ('43000000-0000-0000-0000-000000000101', '40000000-0000-0000-0000-000000000102', 1, 'seed/barangay-portal-v1.pdf', 'barangay-portal-v1.pdf', 'Initial approved manuscript revision.', 'approved', student_one_user_id, adviser_user_id, now() - interval '9 days', now() - interval '12 days', now() - interval '9 days'),
    ('43000000-0000-0000-0000-000000000102', '40000000-0000-0000-0000-000000000103', 2, 'seed/attendance-analytics-v2.pdf', 'attendance-analytics-v2.pdf', 'Updated chapter 4 metrics and evaluation tables.', 'submitted', student_two_user_id, null, null, now() - interval '3 days', now() - interval '3 days'),
    ('43000000-0000-0000-0000-000000000103', '40000000-0000-0000-0000-000000000104', 3, 'seed/repository-dashboard-v3.pdf', 'repository-dashboard-v3.pdf', 'Final manuscript approved for archival.', 'approved', student_two_user_id, adviser_user_id, now() - interval '8 days', now() - interval '12 days', now() - interval '8 days'),
    ('43000000-0000-0000-0000-000000000104', '40000000-0000-0000-0000-000000000105', 1, 'seed/wellness-assistant-v1.pdf', 'wellness-assistant-v1.pdf', 'Awaiting adviser markup.', 'under_review', COALESCE(student_three_user_id, student_two_user_id), adviser_user_id, null, now() - interval '5 days', now() - interval '5 days')
  ON CONFLICT (id) DO UPDATE
  SET version_notes = EXCLUDED.version_notes,
      status = EXCLUDED.status,
      reviewed_by = EXCLUDED.reviewed_by,
      reviewed_at = EXCLUDED.reviewed_at,
      updated_at = EXCLUDED.updated_at;

  INSERT INTO public.payments (id, payment_code, research_id, amount, proof_url, proof_file_name, status, submitted_by, verified_by, verified_at, notes, created_at, updated_at)
  VALUES
    ('44000000-0000-0000-0000-000000000101', 'PAY-9101', '40000000-0000-0000-0000-000000000101', 2500, 'seed/payment-9101.png', 'payment-9101.png', 'submitted', student_one_user_id, null, null, 'Awaiting cashier verification.', now() - interval '4 days', now() - interval '4 days'),
    ('44000000-0000-0000-0000-000000000102', 'PAY-9102', '40000000-0000-0000-0000-000000000102', 2500, 'seed/payment-9102.png', 'payment-9102.png', 'verified', student_one_user_id, staff_user_id, now() - interval '15 days', 'Paid and cleared for manuscript review.', now() - interval '18 days', now() - interval '15 days'),
    ('44000000-0000-0000-0000-000000000103', 'PAY-9103', '40000000-0000-0000-0000-000000000103', 2500, 'seed/payment-9103.png', 'payment-9103.png', 'verified', student_two_user_id, staff_user_id, now() - interval '12 days', 'Cleared before final defense.', now() - interval '14 days', now() - interval '12 days'),
    ('44000000-0000-0000-0000-000000000104', 'PAY-9104', '40000000-0000-0000-0000-000000000105', 2500, 'seed/payment-9104.png', 'payment-9104.png', 'pending', COALESCE(student_three_user_id, student_two_user_id), null, null, 'New payment proof uploaded.', now() - interval '1 day', now() - interval '1 day')
  ON CONFLICT (id) DO UPDATE
  SET status = EXCLUDED.status,
      verified_by = EXCLUDED.verified_by,
      verified_at = EXCLUDED.verified_at,
      notes = EXCLUDED.notes,
      updated_at = EXCLUDED.updated_at;

  INSERT INTO public.defense_schedules (id, research_id, defense_date, defense_time, room, status, notes, created_by, created_at, updated_at)
  VALUES
    ('45000000-0000-0000-0000-000000000101', '40000000-0000-0000-0000-000000000102', current_date + 7, '09:00', 'Room 301', 'scheduled', 'Ready for panel presentation next week.', staff_user_id, now() - interval '2 days', now() - interval '2 days'),
    ('45000000-0000-0000-0000-000000000102', '40000000-0000-0000-0000-000000000103', current_date - 2, '13:00', 'Research Hall A', 'completed', 'Panel completed scoring; awaiting final approval.', staff_user_id, now() - interval '5 days', now() - interval '2 days'),
    ('45000000-0000-0000-0000-000000000103', '40000000-0000-0000-0000-000000000104', current_date - 15, '10:30', 'Research Hall B', 'completed', 'Defense closed and endorsed for archive.', admin_user_id, now() - interval '20 days', now() - interval '15 days')
  ON CONFLICT (id) DO UPDATE
  SET defense_date = EXCLUDED.defense_date,
      defense_time = EXCLUDED.defense_time,
      room = EXCLUDED.room,
      status = EXCLUDED.status,
      notes = EXCLUDED.notes,
      created_by = EXCLUDED.created_by,
      updated_at = EXCLUDED.updated_at;

  INSERT INTO public.defense_panel_members (id, defense_id, panelist_id, role)
  VALUES
    ('46000000-0000-0000-0000-000000000101', '45000000-0000-0000-0000-000000000101', adviser_user_id, 'leader'),
    ('46000000-0000-0000-0000-000000000102', '45000000-0000-0000-0000-000000000101', admin_user_id, 'panelist'),
    ('46000000-0000-0000-0000-000000000103', '45000000-0000-0000-0000-000000000102', adviser_user_id, 'leader'),
    ('46000000-0000-0000-0000-000000000104', '45000000-0000-0000-0000-000000000102', admin_user_id, 'panelist'),
    ('46000000-0000-0000-0000-000000000105', '45000000-0000-0000-0000-000000000103', adviser_user_id, 'leader')
  ON CONFLICT (id) DO UPDATE
  SET panelist_id = EXCLUDED.panelist_id,
      role = EXCLUDED.role;

  INSERT INTO public.defense_grades (id, defense_id, research_id, panelist_id, grade, remarks, created_at, updated_at)
  VALUES
    ('47000000-0000-0000-0000-000000000101', '45000000-0000-0000-0000-000000000102', '40000000-0000-0000-0000-000000000103', adviser_user_id, 91.50, 'Strong statistical treatment and clear intervention workflow.', now() - interval '2 days', now() - interval '2 days'),
    ('47000000-0000-0000-0000-000000000102', '45000000-0000-0000-0000-000000000102', '40000000-0000-0000-0000-000000000103', admin_user_id, 89.75, 'Needs minor polishing in deployment documentation.', now() - interval '2 days', now() - interval '2 days'),
    ('47000000-0000-0000-0000-000000000103', '45000000-0000-0000-0000-000000000103', '40000000-0000-0000-0000-000000000104', adviser_user_id, 94.25, 'Excellent archival readiness and documentation quality.', now() - interval '15 days', now() - interval '15 days')
  ON CONFLICT (id) DO UPDATE
  SET grade = EXCLUDED.grade,
      remarks = EXCLUDED.remarks,
      updated_at = EXCLUDED.updated_at;

  INSERT INTO public.final_approvals (id, research_id, status, approved_by, remarks, approved_at, created_at, updated_at)
  VALUES
    ('48000000-0000-0000-0000-000000000101', '40000000-0000-0000-0000-000000000103', 'pending', null, 'Waiting for staff sign-off after completed defense.', null, now() - interval '2 days', now() - interval '2 days'),
    ('48000000-0000-0000-0000-000000000102', '40000000-0000-0000-0000-000000000104', 'approved', admin_user_id, 'Approved for archive and publication listing.', now() - interval '14 days', now() - interval '14 days', now() - interval '14 days')
  ON CONFLICT (id) DO UPDATE
  SET status = EXCLUDED.status,
      approved_by = EXCLUDED.approved_by,
      remarks = EXCLUDED.remarks,
      approved_at = EXCLUDED.approved_at,
      updated_at = EXCLUDED.updated_at;

  INSERT INTO public.remarks (id, research_id, manuscript_id, author_id, message, created_at)
  VALUES
    ('49000000-0000-0000-0000-000000000101', '40000000-0000-0000-0000-000000000101', null, adviser_user_id, 'Please expand the inventory forecasting section before adviser endorsement.', now() - interval '3 days'),
    ('49000000-0000-0000-0000-000000000102', '40000000-0000-0000-0000-000000000103', '43000000-0000-0000-0000-000000000102', adviser_user_id, 'Good revision overall. Prepare the deployment notes for the final panel packet.', now() - interval '2 days')
  ON CONFLICT (id) DO UPDATE
  SET message = EXCLUDED.message;

  INSERT INTO public.notifications (id, user_id, type, title, message, is_read, reference_id, reference_type, created_at)
  VALUES
    ('50000000-0000-0000-0000-000000000101', student_one_user_id, 'payment', 'Payment awaiting verification', 'Your payment for Smart Inventory Tracking System is queued for review.', false, '44000000-0000-0000-0000-000000000101', 'payment', now() - interval '4 days'),
    ('50000000-0000-0000-0000-000000000102', student_two_user_id, 'defense', 'Final approval pending', 'Your defense is completed. CRAD staff will finalize the approval next.', false, '48000000-0000-0000-0000-000000000101', 'final_approval', now() - interval '2 days'),
    ('50000000-0000-0000-0000-000000000103', adviser_user_id, 'research', 'New research assigned', 'AI-Powered Attendance Analytics has been assigned to you for advising.', true, '40000000-0000-0000-0000-000000000103', 'research', now() - interval '20 days'),
    ('50000000-0000-0000-0000-000000000104', admin_user_id, 'announcement', 'Database demo data loaded', 'Seed records were inserted to populate dashboards, tables, and approval queues.', true, null, 'system', now() - interval '1 day')
  ON CONFLICT (id) DO UPDATE
  SET title = EXCLUDED.title,
      message = EXCLUDED.message,
      is_read = EXCLUDED.is_read,
      created_at = EXCLUDED.created_at;

  INSERT INTO public.audit_logs (id, user_id, action, details, entity_type, entity_id, created_at)
  VALUES
    ('51000000-0000-0000-0000-000000000101', staff_user_id, 'PAYMENT_VERIFIED', 'Verified payment PAY-9102 for Barangay Request Management Portal.', 'payments', '44000000-0000-0000-0000-000000000102', now() - interval '15 days'),
    ('51000000-0000-0000-0000-000000000102', staff_user_id, 'DEFENSE_COMPLETED', 'Completed defense workflow for AI-Powered Attendance Analytics.', 'defense_schedules', '45000000-0000-0000-0000-000000000102', now() - interval '2 days'),
    ('51000000-0000-0000-0000-000000000103', admin_user_id, 'RESEARCH_ARCHIVED', 'Archived Community Research Repository and Archival Dashboard after final approval.', 'research', '40000000-0000-0000-0000-000000000104', now() - interval '14 days')
  ON CONFLICT (id) DO UPDATE
  SET action = EXCLUDED.action,
      details = EXCLUDED.details,
      created_at = EXCLUDED.created_at;

  UPDATE public.system_settings
  SET updated_by = admin_user_id,
      updated_at = now()
  WHERE key IN ('institution_name', 'academic_year', 'research_fee', 'maintenance_mode');
END
$$;
