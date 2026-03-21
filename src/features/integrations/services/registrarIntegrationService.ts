import { supabase } from "@/integrations/supabase/client";

const cradViews = supabase.schema("crad") as any;
const publicDb = supabase as any;

export async function getCradFlowProfile() {
  const { data, error } = await cradViews
    .from("department_flow_profiles")
    .select("*")
    .eq("department_key", "crad")
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getCradRecentClearanceRecords() {
  const { data, error } = await cradViews
    .from("department_clearance_records")
    .select("*")
    .eq("department_key", "crad")
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) throw error;
  return data ?? [];
}

export async function getCradCashierLinks() {
  const { data, error } = await cradViews
    .from("cashier_payment_links")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) throw error;
  return data ?? [];
}

export async function getCradCashierEvents() {
  const { data, error } = await cradViews
    .from("cashier_integration_events")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) throw error;
  return data ?? [];
}

export async function getCradIntegrationAuditLogs(entityType: string, limit = 20) {
  const { data, error } = await publicDb
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

  const publicResult = await publicDb
    .from("crad_registrar_student_list_feed")
    .select(selectClause)
    .order("sent_at", { ascending: false })
    .order("row_index", { ascending: true })
    .limit(limit);

  if (!publicResult.error) {
    return publicResult.data ?? [];
  }

  throw publicResult.error;
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

  const { data: staffRoles, error: roleError } = await publicDb.from("user_roles").select("user_id").in("role", ["staff", "admin"]);
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

    const { error: notificationError } = await publicDb.from("notifications").insert(notifications);
    if (notificationError) throw notificationError;
  }

  const { error } = await publicDb.from("audit_logs").insert({
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
