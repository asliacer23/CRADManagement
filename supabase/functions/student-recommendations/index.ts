import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
  const crad = supabase.schema("crad");

  try {
    if (req.method === "GET") {
      const { data, error } = await crad
        .from("audit_logs")
        .select("id, action, details, entity_id, entity_type, created_at")
        .eq("entity_type", "student_recommendation")
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;

      return new Response(JSON.stringify({ ok: true, data: data ?? [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = await req.json();

    const recommendation = {
      student_id: String(payload.student_id ?? "").trim(),
      student_name: String(payload.student_name ?? "").trim(),
      recommendation_type: String(payload.recommendation_type ?? "general").trim(),
      guidance_status: String(payload.guidance_status ?? "pending").trim(),
      summary: String(payload.summary ?? "").trim(),
      recommended_by: String(payload.recommended_by ?? "Guidance").trim(),
      notes: String(payload.notes ?? "").trim(),
      reference_no: String(payload.reference_no ?? "").trim(),
    };

    if (!recommendation.student_name && !recommendation.student_id) {
      return new Response(JSON.stringify({ ok: false, error: "Student identifier is required." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const serialized = JSON.stringify(recommendation);

    const { data: staffRoles } = await crad
      .from("user_roles")
      .select("user_id")
      .in("role", ["staff", "admin"]);

    if (staffRoles?.length) {
      const notifications = staffRoles.map((role: { user_id: string }) => ({
        user_id: role.user_id,
        type: "system",
        title: "New Student Recommendation",
        message: `${recommendation.student_name || recommendation.student_id} was recommended by ${recommendation.recommended_by}.`,
        reference_id: recommendation.student_id || recommendation.reference_no || null,
        reference_type: "student_recommendation",
      }));

      await crad.from("notifications").insert(notifications);
    }

    const { error: auditError } = await crad.from("audit_logs").insert({
      action: "STUDENT_RECOMMENDATION_RECEIVED",
      details: serialized,
      entity_id: recommendation.student_id || recommendation.reference_no || null,
      entity_type: "student_recommendation",
    });

    if (auditError) throw auditError;

    return new Response(JSON.stringify({ ok: true, message: "Student recommendation received.", data: recommendation }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : "Request failed." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
