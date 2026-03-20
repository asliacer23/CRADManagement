CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  admin_user_id uuid := '10000000-0000-0000-0000-000000000001';
  staff_user_id uuid := '10000000-0000-0000-0000-000000000002';
  adviser_user_id uuid := '10000000-0000-0000-0000-000000000003';
  student_one_user_id uuid := '10000000-0000-0000-0000-000000000004';
  student_two_user_id uuid := '10000000-0000-0000-0000-000000000005';

  dept_it_id uuid;
  thesis_category_id uuid;
  software_category_id uuid;
  current_academic_year_id uuid;
BEGIN
  SELECT id INTO dept_it_id
  FROM public.departments
  WHERE code = 'IT';

  SELECT id INTO thesis_category_id
  FROM public.research_categories
  WHERE name = 'Thesis';

  SELECT id INTO software_category_id
  FROM public.research_categories
  WHERE name = 'Software Development';

  SELECT id INTO current_academic_year_id
  FROM public.academic_years
  WHERE is_current = true
  ORDER BY created_at DESC
  LIMIT 1;

  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    confirmed_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    is_sso_user,
    is_anonymous
  )
  VALUES
    (
      '00000000-0000-0000-0000-000000000000',
      admin_user_id,
      'authenticated',
      'authenticated',
      'admin.seed@crad.local',
      crypt('Password123!', gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"CRAD Admin","role":"admin"}'::jsonb,
      now(),
      now(),
      false,
      false
    ),
    (
      '00000000-0000-0000-0000-000000000000',
      staff_user_id,
      'authenticated',
      'authenticated',
      'staff.seed@crad.local',
      crypt('Password123!', gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"CRAD Staff","role":"staff"}'::jsonb,
      now(),
      now(),
      false,
      false
    ),
    (
      '00000000-0000-0000-0000-000000000000',
      adviser_user_id,
      'authenticated',
      'authenticated',
      'adviser.seed@crad.local',
      crypt('Password123!', gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Prof. Maria Santos","role":"adviser"}'::jsonb,
      now(),
      now(),
      false,
      false
    ),
    (
      '00000000-0000-0000-0000-000000000000',
      student_one_user_id,
      'authenticated',
      'authenticated',
      'student.one@crad.local',
      crypt('Password123!', gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Juan Dela Cruz","role":"student"}'::jsonb,
      now(),
      now(),
      false,
      false
    ),
    (
      '00000000-0000-0000-0000-000000000000',
      student_two_user_id,
      'authenticated',
      'authenticated',
      'student.two@crad.local',
      crypt('Password123!', gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Ana Reyes","role":"student"}'::jsonb,
      now(),
      now(),
      false,
      false
    )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    raw_user_meta_data = EXCLUDED.raw_user_meta_data,
    updated_at = now();

  INSERT INTO public.profiles (
    user_id,
    full_name,
    email,
    department,
    student_id,
    created_at,
    updated_at
  )
  VALUES
    (admin_user_id, 'CRAD Admin', 'admin.seed@crad.local', 'CRAD', null, now(), now()),
    (staff_user_id, 'CRAD Staff', 'staff.seed@crad.local', 'CRAD', null, now(), now()),
    (adviser_user_id, 'Prof. Maria Santos', 'adviser.seed@crad.local', 'Information Technology', null, now(), now()),
    (student_one_user_id, 'Juan Dela Cruz', 'student.one@crad.local', 'Information Technology', '2025-0001', now(), now()),
    (student_two_user_id, 'Ana Reyes', 'student.two@crad.local', 'Information Technology', '2025-0002', now(), now())
  ON CONFLICT (user_id) DO UPDATE
  SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    department = EXCLUDED.department,
    student_id = EXCLUDED.student_id,
    updated_at = now();

  DELETE FROM public.user_roles
  WHERE user_id IN (
    admin_user_id,
    staff_user_id,
    adviser_user_id,
    student_one_user_id,
    student_two_user_id
  );

  INSERT INTO public.user_roles (id, user_id, role)
  VALUES
    ('20000000-0000-0000-0000-000000000001', admin_user_id, 'admin'),
    ('20000000-0000-0000-0000-000000000002', staff_user_id, 'staff'),
    ('20000000-0000-0000-0000-000000000003', adviser_user_id, 'adviser'),
    ('20000000-0000-0000-0000-000000000004', student_one_user_id, 'student'),
    ('20000000-0000-0000-0000-000000000005', student_two_user_id, 'student');

  INSERT INTO public.announcements (
    id,
    title,
    content,
    is_pinned,
    created_by,
    created_at,
    updated_at
  )
  VALUES
    (
      '30000000-0000-0000-0000-000000000001',
      'Research Week Submission Window',
      'Students can now upload manuscripts, submit payments, and monitor defense schedules from the dashboard.',
      true,
      admin_user_id,
      now() - interval '12 days',
      now() - interval '12 days'
    ),
    (
      '30000000-0000-0000-0000-000000000002',
      'Panel Availability Posted',
      'CRAD staff has published the latest panel availability for the March defense cycle.',
      false,
      staff_user_id,
      now() - interval '5 days',
      now() - interval '5 days'
    )
  ON CONFLICT (id) DO UPDATE
  SET
    title = EXCLUDED.title,
    content = EXCLUDED.content,
    is_pinned = EXCLUDED.is_pinned,
    created_by = EXCLUDED.created_by,
    updated_at = now();

  INSERT INTO public.research (
    id,
    research_code,
    title,
    abstract,
    status,
    category_id,
    department_id,
    academic_year_id,
    submitted_by,
    created_at,
    updated_at
  )
  VALUES
    (
      '40000000-0000-0000-0000-000000000001',
      'R-2026-001',
      'Smart Inventory Tracking System for Campus Laboratories',
      'A web-based inventory tracker that monitors issuance, return, and stock movement for laboratory equipment.',
      'pending',
      software_category_id,
      dept_it_id,
      current_academic_year_id,
      student_one_user_id,
      now() - interval '45 days',
      now() - interval '3 days'
    ),
    (
      '40000000-0000-0000-0000-000000000002',
      'R-2026-002',
      'Barangay Request Management Portal',
      'A service request portal that routes barangay concerns and tracks turnaround time through a digital workflow.',
      'approved',
      software_category_id,
      dept_it_id,
      current_academic_year_id,
      student_one_user_id,
      now() - interval '35 days',
      now() - interval '2 days'
    ),
    (
      '40000000-0000-0000-0000-000000000003',
      'R-2026-003',
      'AI-Powered Attendance Analytics for Student Intervention',
      'A thesis project that analyzes attendance patterns and flags students who may need early intervention.',
      'pending_final_approval',
      thesis_category_id,
      dept_it_id,
      current_academic_year_id,
      student_two_user_id,
      now() - interval '25 days',
      now() - interval '1 day'
    ),
    (
      '40000000-0000-0000-0000-000000000004',
      'R-2026-004',
      'Community Research Repository and Archival Dashboard',
      'A searchable repository for completed research papers with tagging, filtering, and archive reporting features.',
      'archived',
      thesis_category_id,
      dept_it_id,
      current_academic_year_id,
      student_two_user_id,
      now() - interval '70 days',
      now() - interval '6 hours'
    )
  ON CONFLICT (id) DO UPDATE
  SET
    title = EXCLUDED.title,
    abstract = EXCLUDED.abstract,
    status = EXCLUDED.status,
    category_id = EXCLUDED.category_id,
    department_id = EXCLUDED.department_id,
    academic_year_id = EXCLUDED.academic_year_id,
    submitted_by = EXCLUDED.submitted_by,
    updated_at = EXCLUDED.updated_at;

  INSERT INTO public.research_members (
    id,
    research_id,
    user_id,
    member_name,
    is_leader,
    created_at
  )
  VALUES
    ('41000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', student_one_user_id, 'Juan Dela Cruz', true, now() - interval '45 days'),
    ('41000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000001', null, 'Maria Lopez', false, now() - interval '45 days'),
    ('41000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000002', student_one_user_id, 'Juan Dela Cruz', true, now() - interval '35 days'),
    ('41000000-0000-0000-0000-000000000004', '40000000-0000-0000-0000-000000000002', null, 'Carlo Mendoza', false, now() - interval '35 days'),
    ('41000000-0000-0000-0000-000000000005', '40000000-0000-0000-0000-000000000003', student_two_user_id, 'Ana Reyes', true, now() - interval '25 days'),
    ('41000000-0000-0000-0000-000000000006', '40000000-0000-0000-0000-000000000003', null, 'Paolo Ramos', false, now() - interval '25 days'),
    ('41000000-0000-0000-0000-000000000007', '40000000-0000-0000-0000-000000000004', student_two_user_id, 'Ana Reyes', true, now() - interval '70 days')
  ON CONFLICT (id) DO UPDATE
  SET
    member_name = EXCLUDED.member_name,
    is_leader = EXCLUDED.is_leader;

  INSERT INTO public.adviser_assignments (
    id,
    research_id,
    adviser_id,
    assigned_by,
    assigned_at
  )
  VALUES
    ('42000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000002', adviser_user_id, staff_user_id, now() - interval '30 days'),
    ('42000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000003', adviser_user_id, staff_user_id, now() - interval '20 days'),
    ('42000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000004', adviser_user_id, admin_user_id, now() - interval '60 days')
  ON CONFLICT (id) DO UPDATE
  SET
    adviser_id = EXCLUDED.adviser_id,
    assigned_by = EXCLUDED.assigned_by,
    assigned_at = EXCLUDED.assigned_at;

  INSERT INTO public.manuscripts (
    id,
    research_id,
    version_number,
    file_url,
    file_name,
    version_notes,
    status,
    uploaded_by,
    reviewed_by,
    reviewed_at,
    created_at,
    updated_at
  )
  VALUES
    (
      '43000000-0000-0000-0000-000000000001',
      '40000000-0000-0000-0000-000000000002',
      1,
      '10000000-0000-0000-0000-000000000004/40000000-0000-0000-0000-000000000002/v1_barangay-portal.pdf',
      'barangay-portal-v1.pdf',
      'Initial approved manuscript revision.',
      'approved',
      student_one_user_id,
      adviser_user_id,
      now() - interval '10 days',
      now() - interval '14 days',
      now() - interval '10 days'
    ),
    (
      '43000000-0000-0000-0000-000000000002',
      '40000000-0000-0000-0000-000000000003',
      2,
      '10000000-0000-0000-0000-000000000005/40000000-0000-0000-0000-000000000003/v2_attendance-analytics.pdf',
      'attendance-analytics-v2.pdf',
      'Updated chapter 4 metrics and evaluation tables.',
      'submitted',
      student_two_user_id,
      null,
      null,
      now() - interval '3 days',
      now() - interval '3 days'
    ),
    (
      '43000000-0000-0000-0000-000000000003',
      '40000000-0000-0000-0000-000000000004',
      3,
      '10000000-0000-0000-0000-000000000005/40000000-0000-0000-0000-000000000004/v3_repository-dashboard.pdf',
      'repository-dashboard-v3.pdf',
      'Final manuscript approved for archival.',
      'approved',
      student_two_user_id,
      adviser_user_id,
      now() - interval '8 days',
      now() - interval '12 days',
      now() - interval '8 days'
    )
  ON CONFLICT (id) DO UPDATE
  SET
    version_notes = EXCLUDED.version_notes,
    status = EXCLUDED.status,
    reviewed_by = EXCLUDED.reviewed_by,
    reviewed_at = EXCLUDED.reviewed_at,
    updated_at = EXCLUDED.updated_at;

  INSERT INTO public.payments (
    id,
    payment_code,
    research_id,
    amount,
    proof_url,
    proof_file_name,
    status,
    submitted_by,
    verified_by,
    verified_at,
    notes,
    created_at,
    updated_at
  )
  VALUES
    (
      '44000000-0000-0000-0000-000000000001',
      'PAY-9001',
      '40000000-0000-0000-0000-000000000001',
      2500,
      '10000000-0000-0000-0000-000000000004/payment-9001.png',
      'payment-9001.png',
      'submitted',
      student_one_user_id,
      null,
      null,
      'Awaiting cashier verification.',
      now() - interval '4 days',
      now() - interval '4 days'
    ),
    (
      '44000000-0000-0000-0000-000000000002',
      'PAY-9002',
      '40000000-0000-0000-0000-000000000002',
      2500,
      '10000000-0000-0000-0000-000000000004/payment-9002.png',
      'payment-9002.png',
      'verified',
      student_one_user_id,
      staff_user_id,
      now() - interval '16 days',
      'Paid and cleared for manuscript review.',
      now() - interval '18 days',
      now() - interval '16 days'
    ),
    (
      '44000000-0000-0000-0000-000000000003',
      'PAY-9003',
      '40000000-0000-0000-0000-000000000003',
      2500,
      '10000000-0000-0000-0000-000000000005/payment-9003.png',
      'payment-9003.png',
      'verified',
      student_two_user_id,
      staff_user_id,
      now() - interval '14 days',
      'Cleared before final defense.',
      now() - interval '17 days',
      now() - interval '14 days'
    )
  ON CONFLICT (id) DO UPDATE
  SET
    status = EXCLUDED.status,
    verified_by = EXCLUDED.verified_by,
    verified_at = EXCLUDED.verified_at,
    notes = EXCLUDED.notes,
    updated_at = EXCLUDED.updated_at;

  INSERT INTO public.defense_schedules (
    id,
    research_id,
    defense_date,
    defense_time,
    room,
    status,
    notes,
    created_by,
    created_at,
    updated_at
  )
  VALUES
    (
      '45000000-0000-0000-0000-000000000001',
      '40000000-0000-0000-0000-000000000002',
      current_date + 7,
      '09:00',
      'Room 301',
      'scheduled',
      'Ready for panel presentation next week.',
      staff_user_id,
      now() - interval '2 days',
      now() - interval '2 days'
    ),
    (
      '45000000-0000-0000-0000-000000000002',
      '40000000-0000-0000-0000-000000000003',
      current_date - 2,
      '13:00',
      'Research Hall A',
      'completed',
      'Panel completed scoring; awaiting final approval.',
      staff_user_id,
      now() - interval '5 days',
      now() - interval '2 days'
    ),
    (
      '45000000-0000-0000-0000-000000000003',
      '40000000-0000-0000-0000-000000000004',
      current_date - 15,
      '10:30',
      'Research Hall B',
      'completed',
      'Defense closed and endorsed for archive.',
      admin_user_id,
      now() - interval '20 days',
      now() - interval '15 days'
    )
  ON CONFLICT (id) DO UPDATE
  SET
    defense_date = EXCLUDED.defense_date,
    defense_time = EXCLUDED.defense_time,
    room = EXCLUDED.room,
    status = EXCLUDED.status,
    notes = EXCLUDED.notes,
    created_by = EXCLUDED.created_by,
    updated_at = EXCLUDED.updated_at;

  INSERT INTO public.defense_panel_members (
    id,
    defense_id,
    panelist_id,
    role
  )
  VALUES
    ('46000000-0000-0000-0000-000000000001', '45000000-0000-0000-0000-000000000001', adviser_user_id, 'Lead Panelist'),
    ('46000000-0000-0000-0000-000000000002', '45000000-0000-0000-0000-000000000001', admin_user_id, 'Panel Member'),
    ('46000000-0000-0000-0000-000000000003', '45000000-0000-0000-0000-000000000002', adviser_user_id, 'Lead Panelist'),
    ('46000000-0000-0000-0000-000000000004', '45000000-0000-0000-0000-000000000002', admin_user_id, 'Panel Member'),
    ('46000000-0000-0000-0000-000000000005', '45000000-0000-0000-0000-000000000003', adviser_user_id, 'Lead Panelist')
  ON CONFLICT (id) DO UPDATE
  SET
    panelist_id = EXCLUDED.panelist_id,
    role = EXCLUDED.role;

  INSERT INTO public.defense_grades (
    id,
    defense_id,
    research_id,
    panelist_id,
    grade,
    remarks,
    created_at,
    updated_at
  )
  VALUES
    (
      '47000000-0000-0000-0000-000000000001',
      '45000000-0000-0000-0000-000000000002',
      '40000000-0000-0000-0000-000000000003',
      adviser_user_id,
      91.50,
      'Strong statistical treatment and clear intervention workflow.',
      now() - interval '2 days',
      now() - interval '2 days'
    ),
    (
      '47000000-0000-0000-0000-000000000002',
      '45000000-0000-0000-0000-000000000002',
      '40000000-0000-0000-0000-000000000003',
      admin_user_id,
      89.75,
      'Needs minor polishing in deployment documentation.',
      now() - interval '2 days',
      now() - interval '2 days'
    ),
    (
      '47000000-0000-0000-0000-000000000003',
      '45000000-0000-0000-0000-000000000003',
      '40000000-0000-0000-0000-000000000004',
      adviser_user_id,
      94.25,
      'Excellent archival readiness and documentation quality.',
      now() - interval '15 days',
      now() - interval '15 days'
    )
  ON CONFLICT (id) DO UPDATE
  SET
    grade = EXCLUDED.grade,
    remarks = EXCLUDED.remarks,
    updated_at = EXCLUDED.updated_at;

  INSERT INTO public.final_approvals (
    id,
    research_id,
    status,
    approved_by,
    remarks,
    approved_at,
    created_at,
    updated_at
  )
  VALUES
    (
      '48000000-0000-0000-0000-000000000001',
      '40000000-0000-0000-0000-000000000003',
      'pending',
      null,
      'Waiting for staff sign-off after completed defense.',
      null,
      now() - interval '2 days',
      now() - interval '2 days'
    ),
    (
      '48000000-0000-0000-0000-000000000002',
      '40000000-0000-0000-0000-000000000004',
      'approved',
      admin_user_id,
      'Approved for archive and publication listing.',
      now() - interval '14 days',
      now() - interval '14 days',
      now() - interval '14 days'
    )
  ON CONFLICT (id) DO UPDATE
  SET
    status = EXCLUDED.status,
    approved_by = EXCLUDED.approved_by,
    remarks = EXCLUDED.remarks,
    approved_at = EXCLUDED.approved_at,
    updated_at = EXCLUDED.updated_at;

  INSERT INTO public.remarks (
    id,
    research_id,
    manuscript_id,
    author_id,
    message,
    created_at
  )
  VALUES
    (
      '49000000-0000-0000-0000-000000000001',
      '40000000-0000-0000-0000-000000000001',
      null,
      adviser_user_id,
      'Please expand the inventory forecasting section before adviser endorsement.',
      now() - interval '3 days'
    ),
    (
      '49000000-0000-0000-0000-000000000002',
      '40000000-0000-0000-0000-000000000003',
      '43000000-0000-0000-0000-000000000002',
      adviser_user_id,
      'Good revision overall. Prepare the deployment notes for the final panel packet.',
      now() - interval '2 days'
    )
  ON CONFLICT (id) DO UPDATE
  SET
    message = EXCLUDED.message;

  INSERT INTO public.notifications (
    id,
    user_id,
    type,
    title,
    message,
    is_read,
    reference_id,
    reference_type,
    created_at
  )
  VALUES
    (
      '50000000-0000-0000-0000-000000000001',
      student_one_user_id,
      'payment',
      'Payment awaiting verification',
      'Your payment for Smart Inventory Tracking System is queued for review.',
      false,
      '44000000-0000-0000-0000-000000000001',
      'payment',
      now() - interval '4 days'
    ),
    (
      '50000000-0000-0000-0000-000000000002',
      student_two_user_id,
      'defense',
      'Final approval pending',
      'Your defense is completed. CRAD staff will finalize the approval next.',
      false,
      '48000000-0000-0000-0000-000000000001',
      'final_approval',
      now() - interval '2 days'
    ),
    (
      '50000000-0000-0000-0000-000000000003',
      adviser_user_id,
      'research',
      'New research assigned',
      'AI-Powered Attendance Analytics has been assigned to you for advising.',
      true,
      '40000000-0000-0000-0000-000000000003',
      'research',
      now() - interval '20 days'
    ),
    (
      '50000000-0000-0000-0000-000000000004',
      admin_user_id,
      'announcement',
      'Seeded demo environment',
      'Demo records were inserted to populate dashboards, tables, and approval queues.',
      true,
      null,
      'system',
      now() - interval '1 day'
    )
  ON CONFLICT (id) DO UPDATE
  SET
    title = EXCLUDED.title,
    message = EXCLUDED.message,
    is_read = EXCLUDED.is_read,
    created_at = EXCLUDED.created_at;

  INSERT INTO public.audit_logs (
    id,
    user_id,
    action,
    details,
    entity_type,
    entity_id,
    created_at
  )
  VALUES
    (
      '51000000-0000-0000-0000-000000000001',
      staff_user_id,
      'PAYMENT_VERIFIED',
      'Verified payment PAY-9002 for Barangay Request Management Portal.',
      'payments',
      '44000000-0000-0000-0000-000000000002',
      now() - interval '16 days'
    ),
    (
      '51000000-0000-0000-0000-000000000002',
      staff_user_id,
      'DEFENSE_COMPLETED',
      'Completed defense workflow for AI-Powered Attendance Analytics for Student Intervention.',
      'defense_schedules',
      '45000000-0000-0000-0000-000000000002',
      now() - interval '2 days'
    ),
    (
      '51000000-0000-0000-0000-000000000003',
      admin_user_id,
      'RESEARCH_ARCHIVED',
      'Archived Community Research Repository and Archival Dashboard after final approval.',
      'research',
      '40000000-0000-0000-0000-000000000004',
      now() - interval '14 days'
    )
  ON CONFLICT (id) DO UPDATE
  SET
    action = EXCLUDED.action,
    details = EXCLUDED.details,
    created_at = EXCLUDED.created_at;

  UPDATE public.system_settings
  SET
    updated_by = admin_user_id,
    updated_at = now()
  WHERE key IN ('institution_name', 'academic_year', 'research_fee', 'maintenance_mode');
END
$$;
