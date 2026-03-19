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

  try {
    const [researchCount, manuscriptCount, paymentCount, defenseCount, announcementCount, latestResearch] = await Promise.all([
      supabase.from("research").select("*", { count: "exact", head: true }),
      supabase.from("manuscripts").select("*", { count: "exact", head: true }),
      supabase.from("payments").select("*", { count: "exact", head: true }),
      supabase.from("defense_schedules").select("*", { count: "exact", head: true }),
      supabase.from("announcements").select("*", { count: "exact", head: true }),
      supabase
        .from("research")
        .select("id, title, research_code, status, created_at")
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

    const payload = {
      generated_at: new Date().toISOString(),
      source: "CRADManagement",
      overview: {
        total_research: researchCount.count ?? 0,
        total_manuscripts: manuscriptCount.count ?? 0,
        total_payments: paymentCount.count ?? 0,
        total_defense_schedules: defenseCount.count ?? 0,
        total_announcements: announcementCount.count ?? 0,
      },
      recent_research: latestResearch.data ?? [],
    };

    return new Response(JSON.stringify({ ok: true, data: payload }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : "Request failed." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
