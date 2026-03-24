import { supabase } from "@/integrations/supabase/client";

const TABLE = "crad_comlab_unit_requests";

export type ComlabUnitRequestStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "fulfilled"
  | "cancelled";

export type ComlabUnitRequestRow = {
  id: string;
  request_reference: string;
  device_type: string;
  quantity: number;
  specifications: string | null;
  purpose: string;
  location_for_use: string | null;
  date_needed: string | null;
  requested_by: string;
  requested_by_id: string | null;
  notes: string | null;
  status: ComlabUnitRequestStatus;
  comlab_notes: string | null;
  reviewed_by_name: string | null;
  reviewed_at: string | null;
  fulfilled_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ComlabUnitRequestSummary = {
  total: number;
  pending: number;
  approved: number;
  fulfilled: number;
  rejected: number;
  cancelled: number;
};

export type PagedComlabUnitRequests = {
  items: ComlabUnitRequestRow[];
  total: number;
};

export const DEVICE_TYPES = [
  "Desktop Computer",
  "Laptop",
  "Monitor",
  "Printer",
  "Scanner",
  "Projector",
  "UPS / AVR",
  "Keyboard & Mouse",
  "Network Switch / Router",
  "Other",
] as const;

export type DeviceType = (typeof DEVICE_TYPES)[number];

function generateRef(): string {
  const now = new Date();
  const ym = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
  const rand = Math.floor(10000 + Math.random() * 89999);
  return `CRAD-CL-${ym}-${rand}`;
}

// ── Single RPC call replaces 5 separate COUNT round-trips ─────────────────────
export async function fetchComlabUnitRequestSummary(): Promise<ComlabUnitRequestSummary> {
  const { data, error } = await supabase.rpc("get_crad_comlab_unit_request_summary");
  if (error) throw new Error(error.message);
  const d = data as ComlabUnitRequestSummary;
  return {
    total:     d.total     ?? 0,
    pending:   d.pending   ?? 0,
    approved:  d.approved  ?? 0,
    fulfilled: d.fulfilled ?? 0,
    rejected:  d.rejected  ?? 0,
    cancelled: d.cancelled ?? 0,
  };
}

// ── Server-side search + filter + pagination (no client-side filtering) ────────
export async function fetchComlabUnitRequests(params: {
  search?: string;
  status?: string;
  page?: number;
  perPage?: number;
} = {}): Promise<PagedComlabUnitRequests> {
  const page    = Math.max(1, params.page ?? 1);
  const perPage = Math.min(50, Math.max(1, params.perPage ?? 10));
  const from    = (page - 1) * perPage;
  const to      = from + perPage - 1;

  let q = supabase
    .from(TABLE)
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (params.status && params.status !== "all") {
    q = q.eq("status", params.status);
  }

  // Push search to the database — Supabase .or() with ilike keeps filtering
  // server-side so the returned count and pagination are always accurate.
  if (params.search?.trim()) {
    const term = `%${params.search.trim()}%`;
    q = q.or(
      `request_reference.ilike.${term},` +
      `device_type.ilike.${term},` +
      `requested_by.ilike.${term},` +
      `purpose.ilike.${term}`
    );
  }

  const { data, count, error } = await q;
  if (error) throw new Error(error.message);

  return {
    items: (data as ComlabUnitRequestRow[]) ?? [],
    total: count ?? 0,
  };
}

export async function createComlabUnitRequest(payload: {
  deviceType: string;
  quantity: number;
  specifications?: string;
  purpose: string;
  locationForUse?: string;
  dateNeeded?: string;
  requestedBy: string;
  notes?: string;
}): Promise<ComlabUnitRequestRow> {
  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      request_reference: generateRef(),
      device_type:       payload.deviceType,
      quantity:          payload.quantity,
      specifications:    payload.specifications  || null,
      purpose:           payload.purpose,
      location_for_use:  payload.locationForUse  || null,
      date_needed:       payload.dateNeeded       || null,
      requested_by:      payload.requestedBy,
      notes:             payload.notes            || null,
      status:            "pending",
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as ComlabUnitRequestRow;
}

// updated_at is now managed by the DB trigger — no manual timestamp needed.
export async function cancelComlabUnitRequest(id: string): Promise<void> {
  const { error } = await supabase
    .from(TABLE)
    .update({ status: "cancelled" })
    .eq("id", id)
    .eq("status", "pending");
  if (error) throw new Error(error.message);
}
