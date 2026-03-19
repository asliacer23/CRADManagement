import { supabase } from "@/integrations/supabase/client";

export async function getCradFlowProfile() {
  const { data, error } = await supabase
    .schema("crad")
    .from("department_flow_profiles")
    .select("*")
    .eq("department_key", "crad")
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getCradRecentClearanceRecords() {
  const { data, error } = await supabase
    .schema("crad")
    .from("department_clearance_records")
    .select("*")
    .eq("department_key", "crad")
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) throw error;
  return data ?? [];
}
