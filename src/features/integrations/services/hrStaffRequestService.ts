import { supabase } from "@/integrations/supabase/client";
import {
  HR_STAFF_INTEGRATION_ROLE_CODES,
  type HrStaffIntegrationRoleCode,
} from "../../../../../shared/hrStaffIntegrationRoles";

// ── Department constants ───────────────────────────────────────────────────────
const DEPT_NAME = "CRAD";
export type CradRoleType = HrStaffIntegrationRoleCode;

// ── Types ──────────────────────────────────────────────────────────────────────

export type HrStaffRequestRow = {
  id: number;
  request_reference: string;
  staff_id: number;
  employee_no: string;
  staff_name: string;
  role_type: string;
  department_name: string;
  request_status: "pending" | "approved" | "rejected" | "queue" | "waiting_applicant" | "hiring" | "hired";
  request_notes: string | null;
  requested_by: string | null;
  decided_by: string | null;
  decided_at: string | null;
  created_at: string;
  updated_at: string;
};

export type HrStaffRequestStatus = {
  totals: { activeRoster: number; workingRoster: number; pendingRequests: number; approvedRequests: number };
  recentRequests: HrStaffRequestRow[];
};

export type PagedResult = { items: HrStaffRequestRow[]; total: number };

// ── Row mapper ─────────────────────────────────────────────────────────────────

type RawRow = {
  id: number; request_reference: string; staff_id: number; request_status: string;
  request_notes: string | null; requested_by: string | null; decided_by: string | null;
  decided_at: string | null; created_at: string; updated_at: string;
  hr_staff_directory: { employee_no: string; full_name: string; role_type: string; department_name: string } | null;
};

function mapRow(r: RawRow): HrStaffRequestRow {
  const d = r.hr_staff_directory;
  return {
    id: r.id, request_reference: r.request_reference, staff_id: r.staff_id,
    employee_no: d?.employee_no ?? "", staff_name: d?.full_name ?? "Unknown",
    role_type: d?.role_type ?? "", department_name: d?.department_name ?? "",
    request_status: r.request_status as HrStaffRequestRow["request_status"],
    request_notes: r.request_notes, requested_by: r.requested_by,
    decided_by: r.decided_by, decided_at: r.decided_at,
    created_at: r.created_at, updated_at: r.updated_at,
  };
}

// ── Public API ─────────────────────────────────────────────────────────────────

export async function fetchHrStaffRequestStatus(): Promise<HrStaffRequestStatus> {
  const [{ count: active }, { count: working }, { count: pending }, { count: approved }, { data: recent }] =
    await Promise.all([
      supabase.from("hr_staff_directory").select("*", { count: "exact", head: true })
        .in("role_type", [...HR_STAFF_INTEGRATION_ROLE_CODES]).eq("employment_status", "active"),
      supabase.from("hr_staff_directory").select("*", { count: "exact", head: true })
        .in("role_type", [...HR_STAFF_INTEGRATION_ROLE_CODES]).eq("employment_status", "working"),
      supabase.from("hr_staff_requests").select("*", { count: "exact", head: true }).eq("request_status", "pending"),
      supabase.from("hr_staff_requests").select("*", { count: "exact", head: true }).eq("request_status", "approved"),
      (supabase as any).from("hr_staff_requests")
        .select("*, hr_staff_directory(employee_no,full_name,role_type,department_name)")
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

  return {
    totals: { activeRoster: active ?? 0, workingRoster: working ?? 0, pendingRequests: pending ?? 0, approvedRequests: approved ?? 0 },
    recentRequests: ((recent as RawRow[]) ?? []).map(mapRow),
  };
}

export async function fetchHrStaffRequests(params: {
  search?: string; status?: string; page?: number; perPage?: number;
} = {}): Promise<PagedResult> {
  const page = Math.max(1, params.page ?? 1);
  const perPage = Math.min(50, Math.max(1, params.perPage ?? 10));
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  let q = (supabase as any)
    .from("hr_staff_requests")
    .select("*, hr_staff_directory(employee_no,full_name,role_type,department_name)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (params.status && params.status !== "all") q = q.eq("request_status", params.status);

  const { data, count, error } = await q;
  if (error) throw new Error(error.message);

  let items = ((data as RawRow[]) ?? []).map(mapRow);
  if (params.search) {
    const sq = params.search.toLowerCase();
    items = items.filter(r =>
      r.request_reference.toLowerCase().includes(sq) ||
      r.employee_no.toLowerCase().includes(sq) ||
      r.staff_name.toLowerCase().includes(sq)
    );
  }
  return { items, total: count ?? 0 };
}

export async function createHrStaffRequest(payload: {
  roleType: HrStaffIntegrationRoleCode;
  requestedCount?: number;
  requestedBy?: string;
  requestNotes?: string;
}): Promise<void> {
  const { roleType, requestedCount = 1, requestedBy = `${DEPT_NAME} Admin`, requestNotes } = payload;
  const poolKey = `HR-REQ-POOL-${roleType.toUpperCase()}`;
  const poolName = roleType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const directoryRow = {
    employee_no: poolKey,
    full_name: `Open ${poolName} Hiring Request`,
    role_type: roleType,
    department_name: DEPT_NAME,
    employment_status: "inactive" as const,
    contact_email: null,
    contact_phone: null,
    hired_at: null,
  };

  let { data: staffRows, error: staffLookupErr } = await supabase
    .from("hr_staff_directory")
    .select("id")
    .eq("employee_no", poolKey)
    .limit(1);
  if (staffLookupErr) throw new Error(staffLookupErr.message);

  if (!staffRows?.length) {
    const { error: insertDirErr } = await supabase.from("hr_staff_directory").insert(directoryRow);
    if (insertDirErr) {
      const dup =
        insertDirErr.code === "23505" ||
        String(insertDirErr.message).includes("23505") ||
        String(insertDirErr.message).toLowerCase().includes("duplicate");
      if (!dup) throw new Error(insertDirErr.message);
    }
    const again = await supabase.from("hr_staff_directory").select("id").eq("employee_no", poolKey).limit(1);
    if (again.error) throw new Error(again.error.message);
    staffRows = again.data;
  }

  if (!staffRows?.length) throw new Error("Failed to resolve placeholder staff entry.");

  const ref = `HR-REQ-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 89999)}`;
  const notes = [requestNotes, `Requested count: ${Math.max(1, requestedCount)}`].filter(Boolean).join(" | ");

  const { error: insertErr } = await supabase.from("hr_staff_requests").insert({
    request_reference: ref, staff_id: (staffRows[0] as { id: number }).id,
    request_status: "pending", request_notes: notes || null, requested_by: requestedBy,
  });
  if (insertErr) throw new Error(insertErr.message);
}

export async function updateHrStaffRequestStatus(payload: {
  id: number; requestStatus: HrStaffRequestRow["request_status"]; decidedBy?: string;
}): Promise<void> {
  const { error } = await supabase.from("hr_staff_requests").update({
    request_status: payload.requestStatus,
    decided_by: payload.decidedBy || "HR Admin",
    decided_at: new Date().toISOString(),
  }).eq("id", payload.id);
  if (error) throw new Error(error.message);
}
