import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { Client } from "pg";
import { randomUUID } from "crypto";

function sendJson(res: any, statusCode: number, payload: unknown) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(payload));
}

function readJsonBody(req: any) {
  return new Promise<any>((resolve, reject) => {
    let raw = "";

    req.on("data", (chunk: Buffer | string) => {
      raw += chunk.toString();
    });

    req.on("end", () => {
      if (!raw.trim()) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(error);
      }
    });

    req.on("error", reject);
  });
}

async function loadDefenseSchedulesPayload(client: Client, defenseId?: string) {
  const defenseResult = await client.query(
    `
      select
        d.id,
        d.defense_date,
        d.defense_time,
        d.room,
        d.status,
        d.notes,
        d.research_id,
        r.title,
        r.research_code,
        r.submitted_by,
        dept.code as department_code,
        dept.name as department_name
      from crad.defense_schedules d
      join crad.research r on r.id = d.research_id
      left join crad.departments dept on dept.id = r.department_id
      where ($1::uuid is null or d.id = $1::uuid)
      order by d.defense_date asc, d.defense_time asc, r.research_code asc
    `,
    [defenseId || null]
  );

  const schedules = defenseResult.rows;
  const defenseIds = schedules.map((row) => row.id);
  const researchIds = schedules.map((row) => row.research_id);

  let panelMembers: any[] = [];
  let researchMembers: any[] = [];

  if (defenseIds.length) {
    const panelMemberResult = await client.query(
      `
        select
          pm.defense_id,
          pm.panelist_id,
          pm.role,
          p.full_name
        from crad.defense_panel_members pm
        left join crad.profiles p on p.user_id = pm.panelist_id
        where pm.defense_id = any($1::uuid[])
        order by pm.role asc, p.full_name asc nulls last
      `,
      [defenseIds]
    );

    panelMembers = panelMemberResult.rows;
  }

  if (researchIds.length) {
    const researchMemberResult = await client.query(
      `
        select
          rm.research_id,
          rm.member_name,
          rm.is_leader
        from crad.research_members rm
        where rm.research_id = any($1::uuid[])
        order by rm.is_leader desc, rm.member_name asc
      `,
      [researchIds]
    );

    researchMembers = researchMemberResult.rows;
  }

  const panelMembersByDefense = new Map<string, any[]>();
  panelMembers.forEach((row) => {
    const list = panelMembersByDefense.get(row.defense_id) || [];
    list.push({
      panelist_id: row.panelist_id,
      role: row.role,
      profiles: { full_name: row.full_name || "Unknown" },
    });
    panelMembersByDefense.set(row.defense_id, list);
  });

  const researchMembersByResearch = new Map<string, any[]>();
  researchMembers.forEach((row) => {
    const list = researchMembersByResearch.get(row.research_id) || [];
    list.push({
      member_name: row.member_name,
      is_leader: row.is_leader,
    });
    researchMembersByResearch.set(row.research_id, list);
  });

  return schedules.map((row) => ({
    id: row.id,
    defense_date: row.defense_date,
    defense_time: row.defense_time,
    room: row.room,
    status: row.status,
    notes: row.notes,
    research_id: row.research_id,
    defense_panel_members: panelMembersByDefense.get(row.id) || [],
    research: {
      id: row.research_id,
      title: row.title,
      research_code: row.research_code,
      submitted_by: row.submitted_by,
      departments: {
        code: row.department_code,
        name: row.department_name,
      },
      research_members: researchMembersByResearch.get(row.research_id) || [],
    },
  }));
}

async function loadSchedulableResearchPayload(client: Client) {
  const researchResult = await client.query(
    `
      select
        r.id,
        r.title,
        r.research_code,
        r.submitted_by,
        dept.code as department_code,
        dept.name as department_name
      from crad.research r
      left join crad.departments dept on dept.id = r.department_id
      where r.status = 'approved'
        and not exists (
          select 1
          from crad.defense_schedules d
          where d.research_id = r.id
            and d.status in ('scheduled', 'completed', 'postponed')
        )
      order by r.updated_at desc nulls last, r.created_at desc
    `
  );

  const researchRows = researchResult.rows;
  const researchIds = researchRows.map((row) => row.id);

  let members: any[] = [];

  if (researchIds.length) {
    const memberResult = await client.query(
      `
        select
          rm.research_id,
          rm.member_name,
          rm.is_leader
        from crad.research_members rm
        where rm.research_id = any($1::uuid[])
        order by rm.is_leader desc, rm.member_name asc
      `,
      [researchIds]
    );

    members = memberResult.rows;
  }

  const membersByResearch = new Map<string, any[]>();
  members.forEach((row) => {
    const list = membersByResearch.get(row.research_id) || [];
    list.push({
      member_name: row.member_name,
      is_leader: row.is_leader,
    });
    membersByResearch.set(row.research_id, list);
  });

  return researchRows.map((row) => ({
    id: row.id,
    title: row.title,
    research_code: row.research_code,
    submitted_by: row.submitted_by,
    departments: {
      code: row.department_code,
      name: row.department_name,
    },
    research_members: membersByResearch.get(row.id) || [],
  }));
}

async function ensurePmedReportTables(client: Client) {
  await client.query(`
    create table if not exists public.pmed_crad_activity_report_batches (
      batch_id text primary key,
      source text not null default 'CRADManagement',
      office text not null default 'PMED',
      report_type text not null default 'Program Activity Report',
      generated_at timestamptz not null default now(),
      overview jsonb not null default '{}'::jsonb,
      row_count integer not null default 0,
      metadata jsonb not null default '{}'::jsonb
    );

    create table if not exists public.pmed_crad_activity_report_rows (
      id bigserial primary key,
      batch_id text not null references public.pmed_crad_activity_report_batches(batch_id) on delete cascade,
      section text not null,
      row_index integer not null default 0,
      reference_code text,
      title text,
      status text,
      owner_name text,
      event_date timestamptz,
      payload jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now()
    );

    create index if not exists pmed_crad_activity_report_batches_generated_idx
      on public.pmed_crad_activity_report_batches (generated_at desc);

    create index if not exists pmed_crad_activity_report_rows_batch_idx
      on public.pmed_crad_activity_report_rows (batch_id, section, row_index);
  `);
}

async function ensureRegistrarStudentFeedTable(client: Client) {
  await client.query(`
    create table if not exists public.crad_registrar_student_list_feed (
      id bigserial primary key,
      batch_id text not null,
      source text not null default 'Registrar',
      target_key text,
      target_label text,
      row_index integer not null default 0,
      student_no text,
      student_name text,
      program text,
      year_level text,
      status text,
      payload jsonb not null default '{}'::jsonb,
      sent_at timestamptz not null default now(),
      created_at timestamptz not null default now()
    );

    alter table public.crad_registrar_student_list_feed add column if not exists batch_id text;
    alter table public.crad_registrar_student_list_feed add column if not exists source text;
    alter table public.crad_registrar_student_list_feed add column if not exists target_key text;
    alter table public.crad_registrar_student_list_feed add column if not exists target_label text;
    alter table public.crad_registrar_student_list_feed add column if not exists row_index integer;
    alter table public.crad_registrar_student_list_feed add column if not exists student_no text;
    alter table public.crad_registrar_student_list_feed add column if not exists student_name text;
    alter table public.crad_registrar_student_list_feed add column if not exists program text;
    alter table public.crad_registrar_student_list_feed add column if not exists year_level text;
    alter table public.crad_registrar_student_list_feed add column if not exists status text;
    alter table public.crad_registrar_student_list_feed add column if not exists payload jsonb;
    alter table public.crad_registrar_student_list_feed add column if not exists sent_at timestamptz;
    alter table public.crad_registrar_student_list_feed add column if not exists created_at timestamptz;

    create index if not exists crad_registrar_student_list_feed_sent_idx
      on public.crad_registrar_student_list_feed (sent_at desc, row_index asc);

    create unique index if not exists crad_registrar_student_list_feed_batch_row_idx
      on public.crad_registrar_student_list_feed (batch_id, row_index);
  `);

  await client.query(`
    update public.crad_registrar_student_list_feed
    set
      source = coalesce(nullif(source, ''), 'Registrar'),
      target_key = coalesce(target_key, 'crad'),
      target_label = coalesce(target_label, 'CRAD'),
      row_index = coalesce(row_index, 0),
      payload = coalesce(payload, '{}'::jsonb),
      sent_at = coalesce(sent_at, created_at, now()),
      created_at = coalesce(created_at, sent_at, now())
    where
      source is null
      or target_key is null
      or target_label is null
      or row_index is null
      or payload is null
      or sent_at is null
      or created_at is null
  `);
}

async function backfillRegistrarStudentFeedFromAuditLogs(client: Client) {
  await ensureRegistrarStudentFeedTable(client);

  const existingResult = await client.query(
    `select count(*)::int as count from public.crad_registrar_student_list_feed`
  );

  if ((existingResult.rows[0]?.count ?? 0) > 0) {
    return;
  }

  const auditResult = await client.query(`
    select id, action, details, created_at
    from crad.audit_logs
    where entity_type = 'registrar_student_list'
    order by created_at desc
    limit 25
  `);

  for (const auditRow of auditResult.rows) {
    let details: any = auditRow.details ?? {};

    if (typeof details === "string") {
      try {
        details = JSON.parse(details);
      } catch {
        details = {};
      }
    }

    const summary = details?.summary ?? {};
    const students = Array.isArray(details?.students) ? details.students : [];
    const batchId = String(summary.batch_id ?? `AUDIT-${auditRow.id}`);
    const source = String(summary.source ?? "Registrar");
    const targetKey = "crad";
    const targetLabel = "CRAD";
    const sentAt = summary.sent_at ?? auditRow.created_at ?? new Date().toISOString();

    for (let index = 0; index < students.length; index += 1) {
      const student = students[index] ?? {};

      await client.query(
        `
          insert into public.crad_registrar_student_list_feed (
            batch_id,
            source,
            target_key,
            target_label,
            row_index,
            student_no,
            student_name,
            program,
            year_level,
            status,
            payload,
            sent_at,
            created_at
          )
          values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, $12, $13)
          on conflict (batch_id, row_index) do nothing
        `,
        [
          batchId,
          source,
          targetKey,
          targetLabel,
          index + 1,
          student.student_no ?? null,
          student.student_name ?? null,
          student.program ?? null,
          student.year_level ?? null,
          student.status ?? null,
          JSON.stringify(student),
          sentAt,
          auditRow.created_at ?? sentAt,
        ]
      );
    }
  }
}

async function loadRegistrarStudentFeedPayload(client: Client, limit = 250) {
  await ensureRegistrarStudentFeedTable(client);
  await backfillRegistrarStudentFeedFromAuditLogs(client);

  const result = await client.query(
    `
      select
        id,
        batch_id,
        source,
        target_key,
        target_label,
        row_index,
        student_no,
        student_name,
        program,
        year_level,
        status,
        payload,
        sent_at,
        created_at
      from public.crad_registrar_student_list_feed
      order by sent_at desc, row_index asc
      limit $1
    `,
    [limit]
  );

  return result.rows.map((row) => ({
    ...row,
    payload: row.payload ?? {},
  }));
}

async function buildPmedReportPayload(client: Client) {
  await ensurePmedReportTables(client);

  const [
    researchCountResult,
    manuscriptCountResult,
    paymentCountResult,
    defenseCountResult,
    announcementCountResult,
    finalApprovalCountResult,
    auditSignalCountResult,
    researchRowsResult,
    manuscriptRowsResult,
    paymentRowsResult,
    defenseRowsResult,
    announcementRowsResult,
    auditRowsResult,
  ] = await Promise.all([
    client.query(`select count(*)::int as count from crad.research`),
    client.query(`select count(*)::int as count from crad.manuscripts`),
    client.query(`select count(*)::int as count from crad.payments`),
    client.query(`select count(*)::int as count from crad.defense_schedules`),
    client.query(`select count(*)::int as count from crad.announcements`),
    client.query(`select count(*)::int as count from crad.final_approvals`),
    client.query(`select count(*)::int as count from crad.audit_logs`),
    client.query(`
      select
        r.research_code as reference_code,
        r.title,
        r.status,
        coalesce(p.full_name, 'Unknown') as owner_name,
        r.created_at as event_date,
        jsonb_build_object(
          'research_id', r.id,
          'department', d.code,
          'status', r.status
        ) as payload
      from crad.research r
      left join crad.profiles p on p.user_id = r.submitted_by
      left join crad.departments d on d.id = r.department_id
      order by r.created_at desc
      limit 8
    `),
    client.query(`
      select
        concat('Version ', m.version_number) as reference_code,
        coalesce(r.title, 'Research manuscript') as title,
        m.status,
        coalesce(p.full_name, 'Unknown') as owner_name,
        m.created_at as event_date,
        jsonb_build_object(
          'manuscript_id', m.id,
          'research_code', r.research_code,
          'file_name', m.file_name,
          'version_number', m.version_number
        ) as payload
      from crad.manuscripts m
      left join crad.research r on r.id = m.research_id
      left join crad.profiles p on p.user_id = m.uploaded_by
      order by m.created_at desc
      limit 6
    `),
    client.query(`
      select
        pay.payment_code as reference_code,
        coalesce(r.title, 'Research payment') as title,
        pay.status,
        coalesce(p.full_name, 'Unknown') as owner_name,
        pay.created_at as event_date,
        jsonb_build_object(
          'payment_id', pay.id,
          'research_code', r.research_code,
          'amount', pay.amount
        ) as payload
      from crad.payments pay
      left join crad.research r on r.id = pay.research_id
      left join crad.profiles p on p.user_id = pay.submitted_by
      order by pay.created_at desc
      limit 6
    `),
    client.query(`
      select
        r.research_code as reference_code,
        r.title,
        ds.status,
        ds.room as owner_name,
        ds.defense_date + ds.defense_time as event_date,
        jsonb_build_object(
          'defense_id', ds.id,
          'room', ds.room,
          'defense_time', ds.defense_time
        ) as payload
      from crad.defense_schedules ds
      left join crad.research r on r.id = ds.research_id
      order by ds.defense_date desc, ds.defense_time desc
      limit 6
    `),
    client.query(`
      select
        concat('Announcement ', row_number() over (order by a.created_at desc)) as reference_code,
        a.title,
        case when a.is_pinned then 'pinned' else 'published' end as status,
        coalesce(p.full_name, 'Unknown') as owner_name,
        a.created_at as event_date,
        jsonb_build_object(
          'announcement_id', a.id,
          'is_pinned', a.is_pinned,
          'content', a.content
        ) as payload
      from crad.announcements a
      left join crad.profiles p on p.user_id = a.created_by
      order by a.created_at desc
      limit 6
    `),
    client.query(`
      select
        coalesce(al.entity_type, 'audit') as reference_code,
        al.action as title,
        'logged' as status,
        coalesce(p.full_name, 'System') as owner_name,
        al.created_at as event_date,
        jsonb_build_object(
          'audit_id', al.id,
          'entity_type', al.entity_type,
          'details', al.details
        ) as payload
      from crad.audit_logs al
      left join crad.profiles p on p.user_id = al.user_id
      order by al.created_at desc
      limit 6
    `),
  ]);

  const overview = {
    total_research: researchCountResult.rows[0]?.count ?? 0,
    total_manuscripts: manuscriptCountResult.rows[0]?.count ?? 0,
    total_payments: paymentCountResult.rows[0]?.count ?? 0,
    total_defense_schedules: defenseCountResult.rows[0]?.count ?? 0,
    total_announcements: announcementCountResult.rows[0]?.count ?? 0,
    total_final_approvals: finalApprovalCountResult.rows[0]?.count ?? 0,
    total_audit_signals: auditSignalCountResult.rows[0]?.count ?? 0,
  };

  const rowSections = [
    { section: "research", rows: researchRowsResult.rows },
    { section: "manuscripts", rows: manuscriptRowsResult.rows },
    { section: "payments", rows: paymentRowsResult.rows },
    { section: "defenses", rows: defenseRowsResult.rows },
    { section: "announcements", rows: announcementRowsResult.rows },
    { section: "audit-signals", rows: auditRowsResult.rows },
  ];

  const flatRows = rowSections.flatMap((group) =>
    group.rows.map((row, index) => ({
      section: group.section,
      row_index: index + 1,
      reference_code: row.reference_code,
      title: row.title,
      status: row.status,
      owner_name: row.owner_name,
      event_date: row.event_date,
      payload: row.payload ?? {},
    }))
  );

  const metadata = {
    section_counts: rowSections.reduce<Record<string, number>>((acc, group) => {
      acc[group.section] = group.rows.length;
      return acc;
    }, {}),
  };

  const batchId = `PMED-${new Date().toISOString().slice(0, 10)}-${randomUUID().slice(0, 8).toUpperCase()}`;

  await client.query("begin");

  try {
    await client.query(
      `
        insert into public.pmed_crad_activity_report_batches (
          batch_id,
          source,
          office,
          report_type,
          generated_at,
          overview,
          row_count,
          metadata
        )
        values ($1, 'CRADManagement', 'PMED', 'Program Activity Report', now(), $2::jsonb, $3, $4::jsonb)
      `,
      [batchId, JSON.stringify(overview), flatRows.length, JSON.stringify(metadata)]
    );

    for (const row of flatRows) {
      await client.query(
        `
          insert into public.pmed_crad_activity_report_rows (
            batch_id,
            section,
            row_index,
            reference_code,
            title,
            status,
            owner_name,
            event_date,
            payload
          )
          values ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb)
        `,
        [
          batchId,
          row.section,
          row.row_index,
          row.reference_code,
          row.title,
          row.status,
          row.owner_name,
          row.event_date,
          JSON.stringify(row.payload ?? {}),
        ]
      );
    }

    await client.query("commit");
  } catch (error) {
    await client.query("rollback");
    throw error;
  }

  return {
    batch_id: batchId,
    source: "CRADManagement",
    office: "PMED",
    report_type: "Program Activity Report",
    generated_at: new Date().toISOString(),
    overview,
    row_count: flatRows.length,
    metadata,
    rows: flatRows,
  };
}

async function loadLatestPmedReport(client: Client) {
  await ensurePmedReportTables(client);

  const batchResult = await client.query(
    `
      select batch_id, source, office, report_type, generated_at, overview, row_count, metadata
      from public.pmed_crad_activity_report_batches
      order by generated_at desc
      limit 1
    `
  );

  const latestBatch = batchResult.rows[0];

  if (!latestBatch) {
    return null;
  }

  const rowsResult = await client.query(
    `
      select
        id,
        batch_id,
        section,
        row_index,
        reference_code,
        title,
        status,
        owner_name,
        event_date,
        payload,
        created_at
      from public.pmed_crad_activity_report_rows
      where batch_id = $1
      order by
        case section
          when 'research' then 1
          when 'manuscripts' then 2
          when 'payments' then 3
          when 'defenses' then 4
          when 'announcements' then 5
          when 'audit-signals' then 6
          else 99
        end,
        row_index asc
    `,
    [latestBatch.batch_id]
  );

  return {
    batch_id: latestBatch.batch_id,
    source: latestBatch.source,
    office: latestBatch.office,
    report_type: latestBatch.report_type,
    generated_at: latestBatch.generated_at,
    overview: latestBatch.overview ?? {},
    row_count: latestBatch.row_count ?? 0,
    metadata: latestBatch.metadata ?? {},
    rows: rowsResult.rows.map((row) => ({
      ...row,
      payload: row.payload ?? {},
    })),
  };
}

function defenseSchedulesApiPlugin(databaseUrl?: string) {
  return {
    name: "defense-schedules-api",
    configureServer(server: any) {
      server.middlewares.use("/api/defense-schedules", async (req: any, res: any) => {
        if (!databaseUrl) {
          sendJson(res, 500, { ok: false, error: "DATABASE_URL is not configured." });
          return;
        }

        const requestUrl = new URL(req.url || "", "http://localhost");
        const pathname = requestUrl.pathname || "/";
        const client = new Client({
          connectionString: databaseUrl,
          ssl: { rejectUnauthorized: false },
        });

        try {
          await client.connect();

          if (req.method === "GET" && pathname === "/options") {
            const payload = await loadSchedulableResearchPayload(client);
            sendJson(res, 200, { ok: true, data: payload });
            return;
          }

          if (req.method === "GET") {
            const payload = await loadDefenseSchedulesPayload(client);
            sendJson(res, 200, { ok: true, data: payload });
            return;
          }

          if (req.method === "POST") {
            const body = await readJsonBody(req);
            const researchId = body?.researchId;
            const defenseDate = body?.date;
            const defenseTime = body?.time;
            const room = body?.room?.trim();
            const createdBy = body?.createdBy || null;
            const status = body?.status || "scheduled";
            const panelistIds = Array.isArray(body?.panelistIds) ? body.panelistIds : [];

            if (!researchId || !defenseDate || !defenseTime || !room) {
              sendJson(res, 400, { ok: false, error: "Research, date, time, and room are required." });
              return;
            }

            const duplicateResult = await client.query(
              `
                select id
                from crad.defense_schedules
                where research_id = $1
                  and status in ('scheduled', 'completed', 'postponed')
                limit 1
              `,
              [researchId]
            );

            if (duplicateResult.rows.length) {
              sendJson(res, 409, { ok: false, error: "This research already has an active defense schedule." });
              return;
            }

            const insertResult = await client.query(
              `
                insert into crad.defense_schedules (research_id, defense_date, defense_time, room, status, created_by)
                values ($1, $2, $3, $4, $5, $6)
                returning id
              `,
              [researchId, defenseDate, defenseTime, room, status, createdBy]
            );

            const defenseId = insertResult.rows[0]?.id;

            if (defenseId && panelistIds.length) {
              await client.query(
                `
                  insert into crad.defense_panel_members (defense_id, panelist_id, role)
                  select $1, unnest($2::uuid[]), 'panelist'
                `,
                [defenseId, panelistIds]
              );
            }

            const payload = await loadDefenseSchedulesPayload(client, defenseId);
            sendJson(res, 200, { ok: true, data: payload[0] || null });
            return;
          }

          if (req.method === "PATCH") {
            const body = await readJsonBody(req);
            const defenseId = body?.defenseId;

            if (!defenseId) {
              sendJson(res, 400, { ok: false, error: "Defense id is required." });
              return;
            }

            const updates: string[] = [];
            const values: any[] = [];

            if (body.defense_date !== undefined) {
              values.push(body.defense_date);
              updates.push(`defense_date = $${values.length}`);
            }

            if (body.defense_time !== undefined) {
              values.push(body.defense_time);
              updates.push(`defense_time = $${values.length}`);
            }

            if (body.room !== undefined) {
              values.push(String(body.room).trim());
              updates.push(`room = $${values.length}`);
            }

            if (body.status !== undefined) {
              values.push(body.status);
              updates.push(`status = $${values.length}`);
            }

            if (!updates.length) {
              sendJson(res, 400, { ok: false, error: "No schedule fields were provided for update." });
              return;
            }

            values.push(defenseId);

            await client.query(
              `
                update crad.defense_schedules
                set ${updates.join(", ")}, updated_at = now()
                where id = $${values.length}
              `,
              values
            );

            const payload = await loadDefenseSchedulesPayload(client, defenseId);
            sendJson(res, 200, { ok: true, data: payload[0] || null });
            return;
          }

          sendJson(res, 405, { ok: false, error: "Method not allowed." });
        } catch (error: any) {
          sendJson(res, 500, { ok: false, error: error?.message || "Failed to process defense schedule request." });
        } finally {
          await client.end().catch(() => {});
        }
      });
    },
  };
}

function panelApprovalsApiPlugin(databaseUrl?: string) {
  return {
    name: "panel-approvals-api",
    configureServer(server: any) {
      server.middlewares.use("/api/panel-approvals", async (req: any, res: any) => {
        if (!databaseUrl) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ ok: false, error: "DATABASE_URL is not configured." }));
          return;
        }

        const requestUrl = new URL(req.url || "", "http://localhost");
        const panelistId = requestUrl.searchParams.get("panelistId");
        const role = requestUrl.searchParams.get("role");

        if (!panelistId && role !== "admin") {
          res.statusCode = 400;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ ok: false, error: "panelistId is required for non-admin requests." }));
          return;
        }

        const client = new Client({
          connectionString: databaseUrl,
          ssl: { rejectUnauthorized: false },
        });

        try {
          await client.connect();

          const defenseResult = await client.query(
            `
              select
                d.id,
                d.defense_date,
                d.defense_time,
                d.room,
                d.status,
                d.notes,
                pm.role as my_role,
                r.id as research_id,
                r.title,
                r.research_code,
                r.submitted_by,
                leader.full_name as leader_name
              from crad.defense_schedules d
              join crad.research r on r.id = d.research_id
              left join crad.profiles leader on leader.user_id = r.submitted_by
              left join crad.defense_panel_members pm on pm.defense_id = d.id and pm.panelist_id = $1
              where d.status = 'completed'
                and ($2::text = 'admin' or pm.panelist_id is not null)
              order by d.defense_date desc
            `,
            [panelistId, role || ""]
          );

          const defenses = defenseResult.rows;
          const defenseIds = defenses.map((row) => row.id);
          const researchIds = defenses.map((row) => row.research_id);

          let panelMembers: any[] = [];
          let researchMembers: any[] = [];
          let grades: any[] = [];

          if (defenseIds.length) {
            const [panelMembersResult, gradesResult] = await Promise.all([
              client.query(
                `
                  select
                    pm.defense_id,
                    pm.panelist_id,
                    pm.role,
                    p.full_name
                  from crad.defense_panel_members pm
                  left join crad.profiles p on p.user_id = pm.panelist_id
                  where pm.defense_id = any($1::uuid[])
                `,
                [defenseIds]
              ),
              client.query(
                `
                  select
                    g.id,
                    g.defense_id,
                    g.panelist_id,
                    g.grade,
                    g.remarks,
                    p.full_name
                  from crad.defense_grades g
                  left join crad.profiles p on p.user_id = g.panelist_id
                  where g.defense_id = any($1::uuid[])
                `,
                [defenseIds]
              ),
            ]);

            panelMembers = panelMembersResult.rows;
            grades = gradesResult.rows;
          }

          if (researchIds.length) {
            const researchMembersResult = await client.query(
              `
                select
                  rm.research_id,
                  rm.member_name,
                  rm.is_leader
                from crad.research_members rm
                where rm.research_id = any($1::uuid[])
              `,
              [researchIds]
            );
            researchMembers = researchMembersResult.rows;
          }

          const panelMembersByDefense = new Map<string, any[]>();
          panelMembers.forEach((row) => {
            const list = panelMembersByDefense.get(row.defense_id) || [];
            list.push({
              panelist_id: row.panelist_id,
              role: row.role,
              profiles: { full_name: row.full_name || "Unknown" },
            });
            panelMembersByDefense.set(row.defense_id, list);
          });

          const gradesByDefense = new Map<string, any[]>();
          grades.forEach((row) => {
            const list = gradesByDefense.get(row.defense_id) || [];
            list.push({
              id: row.id,
              panelist_id: row.panelist_id,
              grade: Number(row.grade),
              remarks: row.remarks,
              profiles: { full_name: row.full_name || "Unknown" },
            });
            gradesByDefense.set(row.defense_id, list);
          });

          const membersByResearch = new Map<string, any[]>();
          researchMembers.forEach((row) => {
            const list = membersByResearch.get(row.research_id) || [];
            list.push({
              member_name: row.member_name,
              is_leader: row.is_leader,
            });
            membersByResearch.set(row.research_id, list);
          });

          const payload = defenses.map((row) => ({
            id: row.id,
            defense_date: row.defense_date,
            defense_time: row.defense_time,
            room: row.room,
            status: row.status,
            notes: row.notes,
            research_id: row.research_id,
            my_role: row.my_role,
            defense_panel_members: panelMembersByDefense.get(row.id) || [],
            grades: gradesByDefense.get(row.id) || [],
            research: {
              id: row.research_id,
              title: row.title,
              research_code: row.research_code,
              submitted_by: row.submitted_by,
              profiles: { full_name: row.leader_name || "Unknown" },
              research_members: membersByResearch.get(row.research_id) || [],
            },
          }));

          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ ok: true, data: payload }));
        } catch (error: any) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ ok: false, error: error?.message || "Failed to load panel approvals." }));
        } finally {
          await client.end().catch(() => {});
        }
      });
    },
  };
}

function pmedReportsApiPlugin(databaseUrl?: string) {
  return {
    name: "pmed-reports-api",
    configureServer(server: any) {
      server.middlewares.use("/api/pmed-reports", async (req: any, res: any) => {
        if (!databaseUrl) {
          sendJson(res, 500, { ok: false, error: "DATABASE_URL is not configured." });
          return;
        }

        const client = new Client({
          connectionString: databaseUrl,
          ssl: { rejectUnauthorized: false },
        });

        try {
          await client.connect();

          if (req.method === "GET") {
            const payload = await loadLatestPmedReport(client);
            sendJson(res, 200, { ok: true, data: payload });
            return;
          }

          if (req.method === "POST") {
            const payload = await buildPmedReportPayload(client);
            sendJson(res, 200, { ok: true, data: payload });
            return;
          }

          sendJson(res, 405, { ok: false, error: "Method not allowed." });
        } catch (error: any) {
          sendJson(res, 500, { ok: false, error: error?.message || "Failed to process PMED report request." });
        } finally {
          await client.end().catch(() => {});
        }
      });
    },
  };
}

function registrarStudentFeedApiPlugin(databaseUrl?: string) {
  return {
    name: "registrar-student-feed-api",
    configureServer(server: any) {
      server.middlewares.use("/api/registrar-student-feed", async (req: any, res: any) => {
        if (!databaseUrl) {
          sendJson(res, 500, { ok: false, error: "DATABASE_URL is not configured." });
          return;
        }

        if (req.method !== "GET") {
          sendJson(res, 405, { ok: false, error: "Method not allowed." });
          return;
        }

        const requestUrl = new URL(req.url || "", "http://localhost");
        const limit = Number(requestUrl.searchParams.get("limit") || 250);

        const client = new Client({
          connectionString: databaseUrl,
          ssl: { rejectUnauthorized: false },
        });

        try {
          await client.connect();
          const payload = await loadRegistrarStudentFeedPayload(client, Number.isFinite(limit) ? limit : 250);
          sendJson(res, 200, { ok: true, data: payload });
        } catch (error: any) {
          sendJson(res, 500, { ok: false, error: error?.message || "Failed to load registrar student feed." });
        } finally {
          await client.end().catch(() => {});
        }
      });
    },
  };
}

// ---------------------------------------------------------------------------
// Cashier student billing status — reads cashier tables directly from Supabase.
// Exposes GET /api/cashier-student-billing
// Returns billing/payment status for every student indexed by student_no so
// CRAD can show whether a student paid (full / downpayment / partial / unpaid)
// without needing the cashier local API server running.
// ---------------------------------------------------------------------------
function cashierStudentBillingApiPlugin(databaseUrl?: string) {
  return {
    name: "cashier-student-billing-api",
    configureServer(server: any) {
      server.middlewares.use("/api/cashier-student-billing", async (req: any, res: any) => {
        if (!databaseUrl) {
          sendJson(res, 500, { ok: false, error: "DATABASE_URL is not configured." });
          return;
        }

        if (req.method !== "GET") {
          sendJson(res, 405, { ok: false, error: "Method not allowed." });
          return;
        }

        const client = new Client({
          connectionString: databaseUrl,
          ssl: { rejectUnauthorized: false },
        });

        try {
          await client.connect();

          const result = await client.query(`
            SELECT
              s.student_no,
              s.full_name                          AS student_name,
              s.course,
              s.year_level,
              b.id                                 AS billing_id,
              b.billing_code,
              b.billing_status,
              b.total_amount,
              b.paid_amount                        AS billing_paid_amount,
              b.balance_amount,
              b.created_at                         AS billing_created_at,
              COALESCE(f.downpayment_amount, 0)    AS downpayment_required,
              COALESCE(f.semester, b.semester)     AS semester,
              COALESCE(f.academic_year, b.school_year) AS school_year,
              COALESCE(SUM(pt.amount_paid) FILTER (WHERE pt.payment_status = 'paid'), 0) AS total_paid,
              COUNT(pt.id) FILTER (WHERE pt.payment_status = 'paid')                     AS paid_tx_count,
              MAX(pt.payment_date) FILTER (WHERE pt.payment_status = 'paid')             AS last_payment_date,
              STRING_AGG(DISTINCT pt.payment_method, ', ')
                FILTER (WHERE pt.payment_status = 'paid')                                AS payment_methods,
              STRING_AGG(DISTINCT rr.receipt_number, ', ')
                FILTER (WHERE rr.receipt_number IS NOT NULL)                             AS receipt_numbers
            FROM public.students s
            INNER JOIN public.billing_records b ON b.student_id = s.id
            LEFT JOIN public.cashier_registrar_student_enrollment_feed f
                   ON LOWER(TRIM(f.student_no)) = LOWER(TRIM(s.student_no))
            LEFT JOIN public.payment_transactions pt ON pt.billing_id = b.id
            LEFT JOIN public.receipt_records rr      ON rr.payment_id = pt.id
            GROUP BY
              s.student_no, s.full_name, s.course, s.year_level,
              b.id, b.billing_code, b.billing_status,
              b.total_amount, b.paid_amount, b.balance_amount, b.created_at,
              f.downpayment_amount, f.semester, f.academic_year
            ORDER BY s.student_no, b.id DESC
          `);

          // Build by-student-no map — keep the record with the highest paid amount
          const byStudentNo: Record<string, any> = {};

          for (const row of result.rows) {
            const studentNo    = String(row.student_no || "").trim();
            if (!studentNo) continue;

            const totalPaid      = Number(row.total_paid    || 0);
            const billingPaid    = Number(row.billing_paid_amount || 0);
            const effectivePaid  = totalPaid > 0 ? totalPaid : billingPaid;
            const balance        = Number(row.balance_amount || 0);
            const totalAmount    = Number(row.total_amount   || 0);
            const downpayReq     = Number(row.downpayment_required || 0);
            const billingStatus  = String(row.billing_status || "unpaid");

            let paymentType: string;
            if (billingStatus === "paid" || (effectivePaid > 0 && balance <= 0)) {
              paymentType = "full_paid";
            } else if (effectivePaid > 0 && downpayReq > 0 && effectivePaid >= downpayReq) {
              paymentType = "downpayment";
            } else if (effectivePaid > 0 || billingStatus === "partial") {
              paymentType = "partial";
            } else {
              paymentType = "unpaid";
            }

            const fmt = (n: number) => `₱${Number(n).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

            const entry = {
              studentNo,
              studentName:                  String(row.student_name || ""),
              course:                       String(row.course       || ""),
              yearLevel:                    String(row.year_level   || ""),
              billingId:                    Number(row.billing_id   || 0),
              billingCode:                  String(row.billing_code || ""),
              semester:                     String(row.semester     || ""),
              schoolYear:                   String(row.school_year  || ""),
              billingStatus,
              totalAmount,
              totalAmountFormatted:         fmt(totalAmount),
              paidAmount:                   effectivePaid,
              paidAmountFormatted:          fmt(effectivePaid),
              balanceAmount:                balance,
              balanceAmountFormatted:       fmt(balance),
              downpaymentRequired:          downpayReq,
              downpaymentRequiredFormatted: fmt(downpayReq),
              paymentType,
              isPaid:        paymentType === "full_paid",
              isDownpayment: paymentType === "downpayment",
              isPartial:     paymentType === "partial",
              paymentMethods:  String(row.payment_methods  || ""),
              receiptNumbers:  String(row.receipt_numbers  || ""),
              lastPaymentDate: row.last_payment_date ? new Date(row.last_payment_date).toISOString() : null,
              billingCreatedAt: row.billing_created_at ? new Date(row.billing_created_at).toISOString() : null,
            };

            const existing = byStudentNo[studentNo];
            if (!existing || entry.paidAmount > existing.paidAmount) {
              byStudentNo[studentNo] = entry;
            }
          }

          const items = Object.values(byStudentNo);
          const paidCount    = items.filter((i) => i.paymentType === "full_paid").length;
          const downpayCount = items.filter((i) => i.paymentType === "downpayment").length;
          const partialCount = items.filter((i) => i.paymentType === "partial").length;
          const unpaidCount  = items.filter((i) => i.paymentType === "unpaid").length;

          sendJson(res, 200, {
            ok: true,
            data: {
              stats: [
                { title: "Fully Paid",  value: String(paidCount),    subtitle: "Complete payment confirmed" },
                { title: "Downpayment", value: String(downpayCount), subtitle: "Met downpayment threshold" },
                { title: "Partial",     value: String(partialCount), subtitle: "Some payment, below threshold" },
                { title: "Unpaid",      value: String(unpaidCount),  subtitle: "No payment recorded" },
              ],
              byStudentNo,
            },
          });
        } catch (error: any) {
          sendJson(res, 500, { ok: false, error: error?.message || "Failed to load cashier student billing status." });
        } finally {
          await client.end().catch(() => {});
        }
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    envPrefix: ["VITE_", "SUPABASE_"],
    server: {
      host: "::",
      port: 8080,
      hmr: {
        overlay: false,
      },
    },
    plugins: [
      react(),
      defenseSchedulesApiPlugin(env.DATABASE_URL || env.SUPABASE_DB_URL),
      panelApprovalsApiPlugin(env.DATABASE_URL || env.SUPABASE_DB_URL),
      pmedReportsApiPlugin(env.DATABASE_URL || env.SUPABASE_DB_URL),
      registrarStudentFeedApiPlugin(env.DATABASE_URL || env.SUPABASE_DB_URL),
      cashierStudentBillingApiPlugin(env.DATABASE_URL || env.SUPABASE_DB_URL),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
