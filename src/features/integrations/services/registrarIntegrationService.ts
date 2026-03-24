import { supabase } from "@/integrations/supabase/client";

const db = supabase as any;

// ---------------------------------------------------------------------------
// Cashier student billing detection.
// Served by the Vite dev-server plugin at /api/cashier-student-billing.
// Queries the shared Supabase database directly — no cashier API server needed.
// ---------------------------------------------------------------------------

export interface CashierResearchPaymentItem {
  billingId: number;
  billingCode: string;
  semester: string;
  schoolYear: string;
  billingStatus: string;
  totalAmount: number;
  totalAmountFormatted: string;
  paidAmount: number;
  paidAmountFormatted: string;
  balanceAmount: number;
  balanceAmountFormatted: string;
  downpaymentRequired: number;
  downpaymentRequiredFormatted: string;
  studentNo: string;
  studentName: string;
  course: string;
  yearLevel: string;
  /** 'full_paid' | 'downpayment' | 'partial' | 'unpaid' */
  paymentType: "full_paid" | "downpayment" | "partial" | "unpaid";
  isPaid: boolean;
  isDownpayment: boolean;
  isPartial: boolean;
  paymentMethods: string;
  receiptNumbers: string;
  lastPaymentDate: string | null;
  billingCreatedAt: string | null;
}

export interface CashierResearchPaymentsResponse {
  stats: { title: string; value: string; subtitle: string }[];
  items: CashierResearchPaymentItem[];
  byStudentNo: Record<string, CashierResearchPaymentItem>;
}

export async function getCashierResearchPayments(): Promise<CashierResearchPaymentsResponse> {
  const res = await fetch("/api/cashier-student-billing", {
    headers: { "Accept": "application/json" },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`Cashier billing lookup failed (${res.status}): ${text}`);
  }

  const payload = await res.json();
  return {
    stats:       payload?.data?.stats       ?? [],
    items:       Object.values(payload?.data?.byStudentNo ?? {}),
    byStudentNo: payload?.data?.byStudentNo ?? {},
  };
}

export async function getCradFlowProfile() {
  const { data, error } = await db
    .from("crad_department_flow_profiles")
    .select("*")
    .eq("department_key", "crad")
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getCradRecentClearanceRecords() {
  const { data, error } = await db
    .from("crad_cashier_clearance_records")
    .select("*")
    .eq("department_key", "crad")
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) throw error;
  return data ?? [];
}

export async function getCradCashierLinks() {
  const { data, error } = await db
    .from("crad_cashier_payment_links")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) throw error;
  return data ?? [];
}

export async function getCradCashierEvents() {
  const { data, error } = await db
    .from("crad_cashier_sync_events")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) throw error;
  return data ?? [];
}

export async function getCradIntegrationAuditLogs(entityType: string, limit = 20) {
  const { data, error } = await db
    .from("audit_logs")
    .select("id, action, details, entity_id, entity_type, created_at")
    .eq("entity_type", entityType)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

export async function getCradRegistrarStudentFeed(limit = 200) {
  const selectClause = "id, batch_id, source, target_key, target_label, row_index, student_no, student_name, program, year_level, status, payload, sent_at, created_at";

  const { data, error } = await db
    .from("crad_registrar_student_list_feed")
    .select(selectClause)
    .order("sent_at", { ascending: false })
    .order("row_index", { ascending: true })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

export async function saveCradGuidanceRecommendation(input: {
  student_id: string;
  student_name: string;
  recommendation_type: string;
  guidance_status: string;
  recommended_by: string;
  summary: string;
  notes: string;
  reference_no: string;
}) {
  const recommendation = {
    student_id: String(input.student_id ?? "").trim(),
    student_name: String(input.student_name ?? "").trim(),
    recommendation_type: String(input.recommendation_type ?? "general").trim(),
    guidance_status: String(input.guidance_status ?? "pending").trim(),
    recommended_by: String(input.recommended_by ?? "Guidance").trim(),
    summary: String(input.summary ?? "").trim(),
    notes: String(input.notes ?? "").trim(),
    reference_no: String(input.reference_no ?? "").trim(),
  };

  const { data: staffRoles, error: roleError } = await db.from("user_roles").select("user_id").in("role", ["staff", "admin"]);
  if (roleError) throw roleError;

  if (staffRoles?.length) {
    const notifications = staffRoles.map((role: { user_id: string }) => ({
      user_id: role.user_id,
      type: "system",
      title: "New Student Recommendation",
      message: `${recommendation.student_name || recommendation.student_id} was recommended by ${recommendation.recommended_by}.`,
      reference_id: null,
      reference_type: "student_recommendation",
    }));

    const { error: notificationError } = await db.from("notifications").insert(notifications);
    if (notificationError) throw notificationError;
  }

  const { error } = await db.from("audit_logs").insert({
    action: "STUDENT_RECOMMENDATION_RECEIVED",
    details: JSON.stringify(recommendation),
    entity_id: null,
    entity_type: "student_recommendation",
  });

  if (error) throw error;
  return recommendation;
}

export async function getCradProgramActivityReport() {
  const response = await fetch("/api/pmed-reports");
  const payload = await response.json().catch(() => ({}));

  if (!response.ok || payload?.ok === false) {
    throw new Error(payload?.error || "Failed to load PMED report.");
  }

  return payload;
}

export async function buildCradProgramActivityReport() {
  const response = await fetch("/api/pmed-reports", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok || payload?.ok === false) {
    throw new Error(payload?.error || "Failed to build PMED report.");
  }

  return payload;
}
