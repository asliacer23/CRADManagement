import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { Client } from "pg";

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
      mode === "development" && componentTagger(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
