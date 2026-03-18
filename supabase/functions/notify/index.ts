import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { action, data } = await req.json();

    switch (action) {
      case "research_submitted": {
        // Notify all staff and admins about new research
        const { data: staffRoles } = await supabase
          .from("user_roles")
          .select("user_id")
          .in("role", ["staff", "admin"]);

        if (staffRoles) {
          const notifications = staffRoles.map((r: any) => ({
            user_id: r.user_id,
            type: "research",
            title: "New Research Submitted",
            message: `Research "${data.title}" has been submitted for review.`,
            reference_id: data.research_id,
            reference_type: "research",
          }));
          await supabase.from("notifications").insert(notifications);
        }
        break;
      }

      case "research_status_changed": {
        await supabase.from("notifications").insert({
          user_id: data.user_id,
          type: "research",
          title: `Research ${data.status}`,
          message: `Your research "${data.title}" has been ${data.status}.`,
          reference_id: data.research_id,
          reference_type: "research",
        });
        break;
      }

      case "manuscript_reviewed": {
        await supabase.from("notifications").insert({
          user_id: data.user_id,
          type: "manuscript",
          title: `Manuscript ${data.status}`,
          message: `Your manuscript for "${data.title}" has been ${data.status}.`,
          reference_id: data.manuscript_id,
          reference_type: "manuscript",
        });
        break;
      }

      case "payment_verified": {
        await supabase.from("notifications").insert({
          user_id: data.user_id,
          type: "payment",
          title: "Payment Verified",
          message: `Your payment ${data.payment_code} has been verified.`,
          reference_id: data.payment_id,
          reference_type: "payment",
        });
        break;
      }

      case "defense_scheduled": {
        // Notify research submitter and adviser
        const userIds = data.user_ids || [];
        const notifications = userIds.map((uid: string) => ({
          user_id: uid,
          type: "defense",
          title: "Defense Scheduled",
          message: `Defense for "${data.title}" scheduled on ${data.date} at ${data.time}, ${data.room}.`,
          reference_id: data.defense_id,
          reference_type: "defense",
        }));
        if (notifications.length > 0) {
          await supabase.from("notifications").insert(notifications);
        }
        break;
      }

      case "adviser_assigned": {
        await supabase.from("notifications").insert([
          {
            user_id: data.student_id,
            type: "research",
            title: "Adviser Assigned",
            message: `An adviser has been assigned to your research "${data.title}".`,
            reference_id: data.research_id,
            reference_type: "research",
          },
          {
            user_id: data.adviser_id,
            type: "research",
            title: "New Research Assignment",
            message: `You have been assigned as adviser for "${data.title}".`,
            reference_id: data.research_id,
            reference_type: "research",
          },
        ]);
        break;
      }

      case "remark_added": {
        await supabase.from("notifications").insert({
          user_id: data.student_id,
          type: "manuscript",
          title: "New Remark from Adviser",
          message: `Your adviser left a remark on "${data.title}".`,
          reference_id: data.research_id,
          reference_type: "research",
        });
        break;
      }

      default:
        return new Response(JSON.stringify({ error: "Unknown action" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    // Create audit log
    await supabase.from("audit_logs").insert({
      user_id: data.actor_id || null,
      action: action.toUpperCase(),
      details: `Notification: ${action}`,
      entity_type: data.reference_type || "notification",
      entity_id: data.reference_id || null,
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
