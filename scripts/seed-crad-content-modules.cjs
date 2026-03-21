const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

function loadEnv(envPath) {
  const envRaw = fs.readFileSync(envPath, "utf8");
  const env = {};

  for (const line of envRaw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;

    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    env[key] = value;
  }

  return env;
}

async function getDepartmentIds(client) {
  const res = await client.query(
    "select id, code from crad.departments where code in ('IT', 'CS') order by code"
  );

  const map = new Map(res.rows.map((row) => [row.code, row.id]));
  return {
    IT: map.get("IT") || null,
    CS: map.get("CS") || null,
  };
}

async function main() {
  const env = loadEnv(path.join(process.cwd(), ".env"));
  const connectionString = env.DATABASE_URL || env.SUPABASE_DB_URL;

  if (!connectionString) {
    throw new Error("Missing DATABASE_URL or SUPABASE_DB_URL in .env");
  }

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  const ids = {
    admin: "d50e8400-e29b-41d4-a716-446655440001",
    leader: "d50e8400-e29b-41d4-a716-446655440003",
    juan: "d50e8400-e29b-41d4-a716-446655440004",
    ana: "d50e8400-e29b-41d4-a716-446655440005",
    paolo: "d50e8400-e29b-41d4-a716-446655440006",

    researchPending: "50000000-0000-0000-0000-000000009951",
    researchCompleted: "50000000-0000-0000-0000-000000009952",
    researchArchived: "50000000-0000-0000-0000-000000009953",

    memberPendingA: "51000000-0000-0000-0000-000000009951",
    memberPendingB: "51000000-0000-0000-0000-000000009952",
    memberCompletedA: "51000000-0000-0000-0000-000000009953",
    memberCompletedB: "51000000-0000-0000-0000-000000009954",
    memberArchivedA: "51000000-0000-0000-0000-000000009955",
    memberArchivedB: "51000000-0000-0000-0000-000000009956",

    defensePending: "52000000-0000-0000-0000-000000009951",
    defenseCompleted: "52000000-0000-0000-0000-000000009952",
    defenseArchived: "52000000-0000-0000-0000-000000009953",

    panelPendingLeader: "53000000-0000-0000-0000-000000009951",
    panelPendingAdmin: "53000000-0000-0000-0000-000000009952",
    panelCompletedLeader: "53000000-0000-0000-0000-000000009953",
    panelCompletedAdmin: "53000000-0000-0000-0000-000000009954",
    panelArchivedLeader: "53000000-0000-0000-0000-000000009955",
    panelArchivedAdmin: "53000000-0000-0000-0000-000000009956",

    gradePendingLeader: "54000000-0000-0000-0000-000000009951",
    gradePendingAdmin: "54000000-0000-0000-0000-000000009952",
    gradeCompletedLeader: "54000000-0000-0000-0000-000000009953",
    gradeCompletedAdmin: "54000000-0000-0000-0000-000000009954",
    gradeArchivedLeader: "54000000-0000-0000-0000-000000009955",
    gradeArchivedAdmin: "54000000-0000-0000-0000-000000009956",

    finalPending: "55000000-0000-0000-0000-000000009951",
    finalCompleted: "55000000-0000-0000-0000-000000009952",
    finalArchived: "55000000-0000-0000-0000-000000009953",

    announcementOne: "56000000-0000-0000-0000-000000009951",
    announcementTwo: "56000000-0000-0000-0000-000000009952",
    announcementThree: "56000000-0000-0000-0000-000000009953",
  };

  await client.connect();

  try {
    await client.query("begin");

    const departments = await getDepartmentIds(client);

    await client.query(
      `
        insert into crad.profiles (user_id, full_name, email, department)
        values
          ($1, 'Temporary Admin', 'admin@crad.local', 'CRAD Administration'),
          ($2, 'Prof. Maria Santos', 'leader@crad.local', 'Research Panel'),
          ($3, 'Juan Dela Cruz', 'juan@student.local', 'Information Technology'),
          ($4, 'Ana Reyes', 'ana@student.local', 'Computer Science'),
          ($5, 'Paolo Ramos', 'paolo@student.local', 'Computer Science')
        on conflict (user_id) do update
        set full_name = excluded.full_name,
            email = excluded.email,
            department = excluded.department,
            updated_at = now()
      `,
      [ids.admin, ids.leader, ids.juan, ids.ana, ids.paolo]
    );

    await client.query(
      `
        insert into crad.research (id, research_code, title, abstract, status, department_id, submitted_by, created_at, updated_at)
        values
          ($1, 'R-2026-951', 'Adaptive Student Engagement Analytics for Final Review Workflow', 'Pending final approval seed for CRAD final approvals.', 'pending_final_approval', $4, $6, now() - interval '12 days', now() - interval '1 day'),
          ($2, 'R-2026-952', 'Campus Records Preservation and Review Dashboard', 'Completed seed for CRAD archive and approval detail panels.', 'completed', $5, $7, now() - interval '25 days', now() - interval '5 days'),
          ($3, 'R-2026-953', 'Scholarly Archive Classification and Search Assistant', 'Archived seed for CRAD archive listing.', 'archived', $5, $8, now() - interval '40 days', now() - interval '10 days')
        on conflict (id) do update
        set research_code = excluded.research_code,
            title = excluded.title,
            abstract = excluded.abstract,
            status = excluded.status,
            department_id = excluded.department_id,
            submitted_by = excluded.submitted_by,
            updated_at = now()
      `,
      [
        ids.researchPending,
        ids.researchCompleted,
        ids.researchArchived,
        departments.CS,
        departments.IT,
        ids.ana,
        ids.juan,
        ids.paolo,
      ]
    );

    await client.query(
      `
        insert into crad.research_members (id, research_id, user_id, member_name, is_leader, created_at)
        values
          ($1, $7, $10, 'Ana Reyes', true, now() - interval '12 days'),
          ($2, $7, $11, 'Paolo Ramos', false, now() - interval '12 days'),
          ($3, $8, $12, 'Juan Dela Cruz', true, now() - interval '25 days'),
          ($4, $8, $10, 'Ana Reyes', false, now() - interval '25 days'),
          ($5, $9, $11, 'Paolo Ramos', true, now() - interval '40 days'),
          ($6, $9, $12, 'Juan Dela Cruz', false, now() - interval '40 days')
        on conflict (id) do update
        set research_id = excluded.research_id,
            user_id = excluded.user_id,
            member_name = excluded.member_name,
            is_leader = excluded.is_leader
      `,
      [
        ids.memberPendingA,
        ids.memberPendingB,
        ids.memberCompletedA,
        ids.memberCompletedB,
        ids.memberArchivedA,
        ids.memberArchivedB,
        ids.researchPending,
        ids.researchCompleted,
        ids.researchArchived,
        ids.ana,
        ids.paolo,
        ids.juan,
      ]
    );

    await client.query(
      `
        insert into crad.defense_schedules (id, research_id, defense_date, defense_time, room, status, notes, created_by, created_at, updated_at)
        values
          ($1, $4, current_date - 2, '14:00:00', 'Research Hall C', 'completed', 'Pending final approval after defense scoring.', $7, now() - interval '6 days', now() - interval '1 day'),
          ($2, $5, current_date - 8, '10:00:00', 'Archive Room A', 'completed', 'Completed defense and endorsed for archive.', $7, now() - interval '12 days', now() - interval '5 days'),
          ($3, $6, current_date - 18, '09:30:00', 'Archive Room B', 'completed', 'Archived manuscript defense completed.', $7, now() - interval '22 days', now() - interval '10 days')
        on conflict (id) do update
        set research_id = excluded.research_id,
            defense_date = excluded.defense_date,
            defense_time = excluded.defense_time,
            room = excluded.room,
            status = excluded.status,
            notes = excluded.notes,
            created_by = excluded.created_by,
            updated_at = now()
      `,
      [
        ids.defensePending,
        ids.defenseCompleted,
        ids.defenseArchived,
        ids.researchPending,
        ids.researchCompleted,
        ids.researchArchived,
        ids.admin,
      ]
    );

    await client.query(
      `
        insert into crad.defense_panel_members (id, defense_id, panelist_id, role)
        values
          ($1, $7, $9, 'leader'),
          ($2, $7, $8, 'panelist'),
          ($3, $10, $9, 'leader'),
          ($4, $10, $8, 'panelist'),
          ($5, $11, $9, 'leader'),
          ($6, $11, $8, 'panelist')
        on conflict (id) do update
        set defense_id = excluded.defense_id,
            panelist_id = excluded.panelist_id,
            role = excluded.role
      `,
      [
        ids.panelPendingLeader,
        ids.panelPendingAdmin,
        ids.panelCompletedLeader,
        ids.panelCompletedAdmin,
        ids.panelArchivedLeader,
        ids.panelArchivedAdmin,
        ids.defensePending,
        ids.admin,
        ids.leader,
        ids.defenseCompleted,
        ids.defenseArchived,
      ]
    );

    await client.query(
      `
        insert into crad.defense_grades (id, defense_id, research_id, panelist_id, grade, remarks, created_at, updated_at)
        values
          ($1, $7, $10, $13, 92.50, 'Strong decision support logic and complete statistical explanation.', now() - interval '2 days', now() - interval '2 days'),
          ($2, $7, $10, $12, 90.25, 'Ready for final approval after minor wording refinement.', now() - interval '2 days', now() - interval '2 days'),
          ($3, $8, $11, $13, 95.00, 'Complete archive workflow and clear implementation evidence.', now() - interval '8 days', now() - interval '8 days'),
          ($4, $8, $11, $12, 93.50, 'Approved for completed archive listing.', now() - interval '8 days', now() - interval '8 days'),
          ($5, $9, $14, $13, 96.75, 'Strong archival metadata and retrieval design.', now() - interval '18 days', now() - interval '18 days'),
          ($6, $9, $14, $12, 94.10, 'Archived manuscript is production-ready.', now() - interval '18 days', now() - interval '18 days')
        on conflict (id) do update
        set defense_id = excluded.defense_id,
            research_id = excluded.research_id,
            panelist_id = excluded.panelist_id,
            grade = excluded.grade,
            remarks = excluded.remarks,
            updated_at = now()
      `,
      [
        ids.gradePendingLeader,
        ids.gradePendingAdmin,
        ids.gradeCompletedLeader,
        ids.gradeCompletedAdmin,
        ids.gradeArchivedLeader,
        ids.gradeArchivedAdmin,
        ids.defensePending,
        ids.defenseCompleted,
        ids.defenseArchived,
        ids.researchPending,
        ids.researchCompleted,
        ids.admin,
        ids.leader,
        ids.researchArchived,
      ]
    );

    await client.query(
      `
        insert into crad.final_approvals (id, research_id, status, approved_by, remarks, approved_at, created_at, updated_at)
        values
          ($1, $4, 'pending', null, 'Awaiting CRAD final decision after completed defense.', null, now() - interval '2 days', now() - interval '2 days'),
          ($2, $5, 'approved', $7, 'Approved and routed to archive after successful defense.', now() - interval '5 days', now() - interval '8 days', now() - interval '5 days'),
          ($3, $6, 'approved', $7, 'Archived sample research approved for historical repository.', now() - interval '10 days', now() - interval '18 days', now() - interval '10 days')
        on conflict (id) do update
        set research_id = excluded.research_id,
            status = excluded.status,
            approved_by = excluded.approved_by,
            remarks = excluded.remarks,
            approved_at = excluded.approved_at,
            updated_at = now()
      `,
      [
        ids.finalPending,
        ids.finalCompleted,
        ids.finalArchived,
        ids.researchPending,
        ids.researchCompleted,
        ids.researchArchived,
        ids.admin,
      ]
    );

    await client.query(
      `
        insert into crad.announcements (id, title, content, is_pinned, created_by, created_at, updated_at)
        values
          ($1, 'Final Approval Review Window Open', 'CRAD reviewers can now finalize completed defenses queued for final approval. Please review remarks and grade averages before approving.', true, $4, now() - interval '1 day', now() - interval '1 day'),
          ($2, 'Archive Batch Updated', 'Recently completed research records have been pushed into the archive module for validation and long-term storage review.', false, $4, now() - interval '4 days', now() - interval '4 days'),
          ($3, 'Panel Decision Templates Ready', 'Use the updated panel decision remarks templates when capturing approval and rejection notes for completed defenses.', false, $4, now() - interval '9 days', now() - interval '9 days')
        on conflict (id) do update
        set title = excluded.title,
            content = excluded.content,
            is_pinned = excluded.is_pinned,
            created_by = excluded.created_by,
            updated_at = now()
      `,
      [ids.announcementOne, ids.announcementTwo, ids.announcementThree, ids.admin]
    );

    const summary = {
      pendingFinalApprovals: await client.query(
        "select count(*)::int as count from crad.final_approvals where status = 'pending'"
      ),
      archivedResearch: await client.query(
        "select count(*)::int as count from crad.research where status in ('completed', 'archived')"
      ),
      announcements: await client.query(
        "select count(*)::int as count from crad.announcements"
      ),
    };

    await client.query("commit");

    console.log(
      JSON.stringify(
        {
          ok: true,
          counts: {
            pendingFinalApprovals: summary.pendingFinalApprovals.rows[0].count,
            archivedResearch: summary.archivedResearch.rows[0].count,
            announcements: summary.announcements.rows[0].count,
          },
        },
        null,
        2
      )
    );
  } catch (error) {
    await client.query("rollback").catch(() => {});
    throw error;
  } finally {
    await client.end().catch(() => {});
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
