CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  admin_user_id uuid := '10000000-0000-0000-0000-000000000001';
  staff_user_id uuid := '10000000-0000-0000-0000-000000000002';
  adviser_user_id uuid := '10000000-0000-0000-0000-000000000003';
  student_one_user_id uuid := '10000000-0000-0000-0000-000000000004';
  student_two_user_id uuid := '10000000-0000-0000-0000-000000000005';

  staff_two_user_id uuid := '10000000-0000-0000-0000-000000000006';
  adviser_two_user_id uuid := '10000000-0000-0000-0000-000000000007';
  student_three_user_id uuid := '10000000-0000-0000-0000-000000000008';
  student_four_user_id uuid := '10000000-0000-0000-0000-000000000009';
  student_five_user_id uuid := '10000000-0000-0000-0000-000000000010';

  dept_it_id uuid;
  dept_cs_id uuid;
  dept_eng_id uuid;
  thesis_category_id uuid;
  software_category_id uuid;
  hardware_category_id uuid;
  feasibility_category_id uuid;
  current_academic_year_id uuid;
BEGIN
  SELECT id INTO dept_it_id FROM public.departments WHERE code = 'IT' LIMIT 1;
  SELECT id INTO dept_cs_id FROM public.departments WHERE code = 'CS' LIMIT 1;
  SELECT id INTO dept_eng_id FROM public.departments WHERE code = 'ENG' LIMIT 1;

  SELECT id INTO thesis_category_id FROM public.research_categories WHERE name = 'Thesis' LIMIT 1;
  SELECT id INTO software_category_id FROM public.research_categories WHERE name = 'Software Development' LIMIT 1;
  SELECT id INTO hardware_category_id FROM public.research_categories WHERE name = 'Hardware Development' LIMIT 1;
  SELECT id INTO feasibility_category_id FROM public.research_categories WHERE name = 'Feasibility Study' LIMIT 1;

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
      staff_two_user_id,
      'authenticated',
      'authenticated',
      'staff.ops@crad.local',
      crypt('Password123!', gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Operations Staff","role":"staff"}'::jsonb,
      now(),
      now(),
      false,
      false
    ),
    (
      '00000000-0000-0000-0000-000000000000',
      adviser_two_user_id,
      'authenticated',
      'authenticated',
      'adviser.two@crad.local',
      crypt('Password123!', gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Prof. Elena Cruz","role":"adviser"}'::jsonb,
      now(),
      now(),
      false,
      false
    ),
    (
      '00000000-0000-0000-0000-000000000000',
      student_three_user_id,
      'authenticated',
      'authenticated',
      'student.three@crad.local',
      crypt('Password123!', gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Liam Torres","role":"student"}'::jsonb,
      now(),
      now(),
      false,
      false
    ),
    (
      '00000000-0000-0000-0000-000000000000',
      student_four_user_id,
      'authenticated',
      'authenticated',
      'student.four@crad.local',
      crypt('Password123!', gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Mika Fernandez","role":"student"}'::jsonb,
      now(),
      now(),
      false,
      false
    ),
    (
      '00000000-0000-0000-0000-000000000000',
      student_five_user_id,
      'authenticated',
      'authenticated',
      'student.five@crad.local',
      crypt('Password123!', gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Noah Castillo","role":"student"}'::jsonb,
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
    (staff_two_user_id, 'Operations Staff', 'staff.ops@crad.local', 'CRAD', null, now(), now()),
    (adviser_two_user_id, 'Prof. Elena Cruz', 'adviser.two@crad.local', 'Computer Science', null, now(), now()),
    (student_three_user_id, 'Liam Torres', 'student.three@crad.local', 'Computer Science', '2025-0003', now(), now()),
    (student_four_user_id, 'Mika Fernandez', 'student.four@crad.local', 'Engineering', '2025-0004', now(), now()),
    (student_five_user_id, 'Noah Castillo', 'student.five@crad.local', 'Information Technology', '2025-0005', now(), now())
  ON CONFLICT (user_id) DO UPDATE
  SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    department = EXCLUDED.department,
    student_id = EXCLUDED.student_id,
    updated_at = now();

  DELETE FROM public.user_roles
  WHERE user_id IN (
    staff_two_user_id,
    adviser_two_user_id,
    student_three_user_id,
    student_four_user_id,
    student_five_user_id
  );

  INSERT INTO public.user_roles (id, user_id, role)
  VALUES
    ('20000000-0000-0000-0000-000000000006', staff_two_user_id, 'staff'),
    ('20000000-0000-0000-0000-000000000007', adviser_two_user_id, 'adviser'),
    ('20000000-0000-0000-0000-000000000008', student_three_user_id, 'student'),
    ('20000000-0000-0000-0000-000000000009', student_four_user_id, 'student'),
    ('20000000-0000-0000-0000-000000000010', student_five_user_id, 'student');

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
      '30000000-0000-0000-0000-000000000003',
      'Dashboard Analytics Enabled',
      'The dashboard now aggregates dynamic counts from research, defenses, approvals, payments, and logs.',
      true,
      staff_two_user_id,
      now() - interval '3 days',
      now() - interval '3 days'
    ),
    (
      '30000000-0000-0000-0000-000000000004',
      'Cross-Department Review Cycle',
      'Computer Science and Engineering submissions are now included in the review and archival queues.',
      false,
      admin_user_id,
      now() - interval '18 hours',
      now() - interval '18 hours'
    )
  ON CONFLICT (id) DO UPDATE
  SET
    title = EXCLUDED.title,
    content = EXCLUDED.content,
    is_pinned = EXCLUDED.is_pinned,
    updated_at = EXCLUDED.updated_at;

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
      '40000000-0000-0000-0000-000000000005',
      'R-2026-005',
      'Student Services Ticketing and Escalation Portal',
      'A service desk portal for student support issues with SLA tracking and analytics.',
      'review',
      software_category_id,
      dept_cs_id,
      current_academic_year_id,
      student_three_user_id,
      now() - interval '21 days',
      now() - interval '4 days'
    ),
    (
      '40000000-0000-0000-0000-000000000006',
      'R-2026-006',
      'Solar-Powered IoT Flood Alert Kit',
      'A hardware-based flood alert kit with GSM notification and battery resilience testing.',
      'revision',
      hardware_category_id,
      dept_eng_id,
      current_academic_year_id,
      student_four_user_id,
      now() - interval '28 days',
      now() - interval '2 days'
    ),
    (
      '40000000-0000-0000-0000-000000000007',
      'R-2026-007',
      'Alumni Tracer and Employability Dashboard',
      'A tracer study platform with survey analytics, employer mapping, and longitudinal reporting.',
      'completed',
      feasibility_category_id,
      dept_it_id,
      current_academic_year_id,
      student_five_user_id,
      now() - interval '62 days',
      now() - interval '9 days'
    ),
    (
      '40000000-0000-0000-0000-000000000008',
      'R-2026-008',
      'Mobile Campus Navigation with Accessibility Routing',
      'A mobile campus guide that prioritizes accessible routes and indoor wayfinding.',
      'rejected',
      thesis_category_id,
      dept_cs_id,
      current_academic_year_id,
      student_three_user_id,
      now() - interval '54 days',
      now() - interval '11 days'
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
    ('41000000-0000-0000-0000-000000000008', '40000000-0000-0000-0000-000000000005', student_three_user_id, 'Liam Torres', true, now() - interval '21 days'),
    ('41000000-0000-0000-0000-000000000009', '40000000-0000-0000-0000-000000000005', null, 'Alyssa Gomez', false, now() - interval '21 days'),
    ('41000000-0000-0000-0000-000000000010', '40000000-0000-0000-0000-000000000006', student_four_user_id, 'Mika Fernandez', true, now() - interval '28 days'),
    ('41000000-0000-0000-0000-000000000011', '40000000-0000-0000-0000-000000000006', null, 'Jared Lim', false, now() - interval '28 days'),
    ('41000000-0000-0000-0000-000000000012', '40000000-0000-0000-0000-000000000007', student_five_user_id, 'Noah Castillo', true, now() - interval '62 days'),
    ('41000000-0000-0000-0000-000000000013', '40000000-0000-0000-0000-000000000007', null, 'Claire Santos', false, now() - interval '62 days'),
    ('41000000-0000-0000-0000-000000000014', '40000000-0000-0000-0000-000000000008', student_three_user_id, 'Liam Torres', true, now() - interval '54 days')
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
    ('42000000-0000-0000-0000-000000000004', '40000000-0000-0000-0000-000000000005', adviser_two_user_id, staff_two_user_id, now() - interval '18 days'),
    ('42000000-0000-0000-0000-000000000005', '40000000-0000-0000-0000-000000000006', adviser_user_id, staff_user_id, now() - interval '25 days'),
    ('42000000-0000-0000-0000-000000000006', '40000000-0000-0000-0000-000000000007', adviser_two_user_id, admin_user_id, now() - interval '58 days'),
    ('42000000-0000-0000-0000-000000000007', '40000000-0000-0000-0000-000000000008', adviser_two_user_id, staff_two_user_id, now() - interval '50 days')
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
      '43000000-0000-0000-0000-000000000004',
      '40000000-0000-0000-0000-000000000005',
      1,
      '10000000-0000-0000-0000-000000000008/40000000-0000-0000-0000-000000000005/v1_student-services-portal.pdf',
      'student-services-portal-v1.pdf',
      'Queued for adviser review.',
      'under_review',
      student_three_user_id,
      adviser_two_user_id,
      now() - interval '4 days',
      now() - interval '7 days',
      now() - interval '4 days'
    ),
    (
      '43000000-0000-0000-0000-000000000005',
      '40000000-0000-0000-0000-000000000006',
      2,
      '10000000-0000-0000-0000-000000000009/40000000-0000-0000-0000-000000000006/v2_flood-alert-kit.pdf',
      'flood-alert-kit-v2.pdf',
      'Revision requested on the hardware reliability test section.',
      'revision_needed',
      student_four_user_id,
      adviser_user_id,
      now() - interval '2 days',
      now() - interval '8 days',
      now() - interval '2 days'
    ),
    (
      '43000000-0000-0000-0000-000000000006',
      '40000000-0000-0000-0000-000000000007',
      3,
      '10000000-0000-0000-0000-000000000010/40000000-0000-0000-0000-000000000007/v3_alumni-tracer.pdf',
      'alumni-tracer-v3.pdf',
      'Final manuscript accepted after panel defense.',
      'approved',
      student_five_user_id,
      adviser_two_user_id,
      now() - interval '12 days',
      now() - interval '16 days',
      now() - interval '12 days'
    ),
    (
      '43000000-0000-0000-0000-000000000007',
      '40000000-0000-0000-0000-000000000008',
      1,
      '10000000-0000-0000-0000-000000000008/40000000-0000-0000-0000-000000000008/v1_accessibility-routing.pdf',
      'accessibility-routing-v1.pdf',
      'Initial manuscript rejected during concept review.',
      'rejected',
      student_three_user_id,
      adviser_two_user_id,
      now() - interval '11 days',
      now() - interval '14 days',
      now() - interval '11 days'
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
      '44000000-0000-0000-0000-000000000004',
      'PAY-9004',
      '40000000-0000-0000-0000-000000000005',
      2500,
      '10000000-0000-0000-0000-000000000008/payment-9004.png',
      'payment-9004.png',
      'pending',
      student_three_user_id,
      null,
      null,
      'Waiting for cashier acknowledgement.',
      now() - interval '5 days',
      now() - interval '5 days'
    ),
    (
      '44000000-0000-0000-0000-000000000005',
      'PAY-9005',
      '40000000-0000-0000-0000-000000000006',
      2500,
      '10000000-0000-0000-0000-000000000009/payment-9005.png',
      'payment-9005.png',
      'rejected',
      student_four_user_id,
      staff_two_user_id,
      now() - interval '3 days',
      'Receipt image was unreadable. Please re-upload a clearer proof.',
      now() - interval '7 days',
      now() - interval '3 days'
    ),
    (
      '44000000-0000-0000-0000-000000000006',
      'PAY-9006',
      '40000000-0000-0000-0000-000000000007',
      3000,
      '10000000-0000-0000-0000-000000000010/payment-9006.png',
      'payment-9006.png',
      'verified',
      student_five_user_id,
      staff_user_id,
      now() - interval '22 days',
      'Extended service fee cleared for final publication.',
      now() - interval '24 days',
      now() - interval '22 days'
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
      '45000000-0000-0000-0000-000000000004',
      '40000000-0000-0000-0000-000000000005',
      current_date + 4,
      '14:00',
      'Room 204',
      'scheduled',
      'Ready for cross-department panel review.',
      staff_two_user_id,
      now() - interval '1 day',
      now() - interval '1 day'
    ),
    (
      '45000000-0000-0000-0000-000000000005',
      '40000000-0000-0000-0000-000000000006',
      current_date + 10,
      '10:00',
      'Engineering Lab',
      'postponed',
      'Moved due to prototype calibration delays.',
      staff_user_id,
      now() - interval '3 days',
      now() - interval '1 day'
    ),
    (
      '45000000-0000-0000-0000-000000000006',
      '40000000-0000-0000-0000-000000000007',
      current_date - 12,
      '08:30',
      'AVR 2',
      'completed',
      'Panel endorsed the study for closing requirements.',
      admin_user_id,
      now() - interval '18 days',
      now() - interval '12 days'
    ),
    (
      '45000000-0000-0000-0000-000000000007',
      '40000000-0000-0000-0000-000000000008',
      current_date - 20,
      '15:00',
      'Room 112',
      'cancelled',
      'Cancelled after concept rejection.',
      staff_two_user_id,
      now() - interval '24 days',
      now() - interval '20 days'
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
    ('46000000-0000-0000-0000-000000000006', '45000000-0000-0000-0000-000000000004', adviser_two_user_id, 'leader'),
    ('46000000-0000-0000-0000-000000000007', '45000000-0000-0000-0000-000000000004', admin_user_id, 'member'),
    ('46000000-0000-0000-0000-000000000008', '45000000-0000-0000-0000-000000000005', adviser_user_id, 'leader'),
    ('46000000-0000-0000-0000-000000000009', '45000000-0000-0000-0000-000000000006', adviser_two_user_id, 'leader'),
    ('46000000-0000-0000-0000-000000000010', '45000000-0000-0000-0000-000000000006', staff_user_id, 'member')
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
      '47000000-0000-0000-0000-000000000004',
      '45000000-0000-0000-0000-000000000006',
      '40000000-0000-0000-0000-000000000007',
      adviser_two_user_id,
      92.40,
      'Strong survey analysis and polished dashboard output.',
      now() - interval '12 days',
      now() - interval '12 days'
    ),
    (
      '47000000-0000-0000-0000-000000000005',
      '45000000-0000-0000-0000-000000000006',
      '40000000-0000-0000-0000-000000000007',
      staff_user_id,
      90.10,
      'Clear presentation and complete deployment documentation.',
      now() - interval '12 days',
      now() - interval '12 days'
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
      '48000000-0000-0000-0000-000000000003',
      '40000000-0000-0000-0000-000000000007',
      'approved',
      admin_user_id,
      'Approved for completion and publication.',
      now() - interval '10 days',
      now() - interval '12 days',
      now() - interval '10 days'
    ),
    (
      '48000000-0000-0000-0000-000000000004',
      '40000000-0000-0000-0000-000000000008',
      'rejected',
      staff_two_user_id,
      'Concept did not meet accessibility testing scope.',
      now() - interval '18 days',
      now() - interval '20 days',
      now() - interval '18 days'
    ),
    (
      '48000000-0000-0000-0000-000000000005',
      '40000000-0000-0000-0000-000000000006',
      'revision_requested',
      staff_user_id,
      'Revise hardware methodology before rescheduling the defense.',
      now() - interval '1 day',
      now() - interval '1 day',
      now() - interval '1 day'
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
      '49000000-0000-0000-0000-000000000003',
      '40000000-0000-0000-0000-000000000005',
      '43000000-0000-0000-0000-000000000004',
      adviser_two_user_id,
      'Please tighten the escalation matrix and clarify ticket priority weights.',
      now() - interval '4 days'
    ),
    (
      '49000000-0000-0000-0000-000000000004',
      '40000000-0000-0000-0000-000000000006',
      '43000000-0000-0000-0000-000000000005',
      adviser_user_id,
      'Prototype readings are promising, but the calibration test needs another run.',
      now() - interval '2 days'
    ),
    (
      '49000000-0000-0000-0000-000000000005',
      '40000000-0000-0000-0000-000000000007',
      null,
      admin_user_id,
      'Research has cleared final documentation review and can move to closure.',
      now() - interval '10 days'
    )
  ON CONFLICT (id) DO UPDATE
  SET
    message = EXCLUDED.message,
    created_at = EXCLUDED.created_at;

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
      '50000000-0000-0000-0000-000000000005',
      student_three_user_id,
      'manuscript',
      'Manuscript now under review',
      'Your Student Services Ticketing manuscript is being reviewed by your adviser.',
      false,
      '43000000-0000-0000-0000-000000000004',
      'manuscript',
      now() - interval '4 days'
    ),
    (
      '50000000-0000-0000-0000-000000000006',
      student_four_user_id,
      'payment',
      'Payment proof rejected',
      'Please upload a clearer payment proof for the Solar-Powered IoT Flood Alert Kit.',
      false,
      '44000000-0000-0000-0000-000000000005',
      'payment',
      now() - interval '3 days'
    ),
    (
      '50000000-0000-0000-0000-000000000007',
      student_five_user_id,
      'defense',
      'Final approval completed',
      'Your Alumni Tracer research has been approved and marked complete.',
      true,
      '48000000-0000-0000-0000-000000000003',
      'final_approval',
      now() - interval '10 days'
    ),
    (
      '50000000-0000-0000-0000-000000000008',
      adviser_two_user_id,
      'research',
      'New research assignment',
      'You have been assigned to review the Student Services Ticketing and Escalation Portal.',
      false,
      '40000000-0000-0000-0000-000000000005',
      'research',
      now() - interval '18 days'
    ),
    (
      '50000000-0000-0000-0000-000000000009',
      staff_two_user_id,
      'system',
      'Expanded seed data loaded',
      'Additional records were seeded for dashboards, approval queues, archive tables, and analytics.',
      true,
      null,
      'system',
      now() - interval '2 hours'
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
      '51000000-0000-0000-0000-000000000004',
      staff_two_user_id,
      'MANUSCRIPT_REVIEW_STARTED',
      'Started adviser review for Student Services Ticketing and Escalation Portal.',
      'manuscripts',
      '43000000-0000-0000-0000-000000000004',
      now() - interval '4 days'
    ),
    (
      '51000000-0000-0000-0000-000000000005',
      staff_two_user_id,
      'PAYMENT_REJECTED',
      'Rejected payment PAY-9005 due to unreadable receipt attachment.',
      'payments',
      '44000000-0000-0000-0000-000000000005',
      now() - interval '3 days'
    ),
    (
      '51000000-0000-0000-0000-000000000006',
      admin_user_id,
      'FINAL_APPROVAL_APPROVED',
      'Approved Alumni Tracer and Employability Dashboard for closure.',
      'final_approvals',
      '48000000-0000-0000-0000-000000000003',
      now() - interval '10 days'
    ),
    (
      '51000000-0000-0000-0000-000000000007',
      staff_user_id,
      'FINAL_APPROVAL_REVISION_REQUESTED',
      'Requested revision for Solar-Powered IoT Flood Alert Kit prior to rescheduled defense.',
      'final_approvals',
      '48000000-0000-0000-0000-000000000005',
      now() - interval '1 day'
    )
  ON CONFLICT (id) DO UPDATE
  SET
    action = EXCLUDED.action,
    details = EXCLUDED.details,
    created_at = EXCLUDED.created_at;

  INSERT INTO public.system_settings (id, key, value, description, updated_by, updated_at)
  VALUES
    ('52000000-0000-0000-0000-000000000001', 'dashboard_refresh_seconds', '30', 'Refresh interval for dashboard widgets and analytics.', admin_user_id, now()),
    ('52000000-0000-0000-0000-000000000002', 'default_defense_room', 'Room 301', 'Default room suggestion for new defense schedules.', staff_user_id, now())
  ON CONFLICT (key) DO UPDATE
  SET
    value = EXCLUDED.value,
    description = EXCLUDED.description,
    updated_by = EXCLUDED.updated_by,
    updated_at = EXCLUDED.updated_at;
END
$$;
