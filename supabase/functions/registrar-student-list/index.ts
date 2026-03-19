import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-integration-key, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    if (req.method === "GET") {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("id, action, details, entity_id, entity_type, created_at")
        .eq("entity_type", "registrar_student_list")
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;

      return new Response(JSON.stringify({ ok: true, data: data ?? [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = await req.json();
    const students = Array.isArray(payload?.data?.students) ? payload.data.students : [];

    const summary = {
      source: String(payload?.source ?? "Registrar"),
      sent_at: String(payload?.sent_at ?? new Date().toISOString()),
      student_count: students.length,
    };

    const { error: auditError } = await supabase.from("audit_logs").insert({
      action: "REGISTRAR_STUDENT_LIST_RECEIVED",
      details: JSON.stringify({ summary, students: students.slice(0, 20) }),
      entity_id: students[0]?.student_no ?? null,
      entity_type: "registrar_student_list",
    });

    if (auditError) throw auditError;

    return new Response(JSON.stringify({
      ok: true,
      message: "Registrar student list received by CRAD.",
      data: summary
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : "Request failed." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
