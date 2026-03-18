import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

// ==================== RESEARCH ====================
export function useMyResearch() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-research", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("research")
        .select("*, research_categories(name), departments(name, code), adviser_assignments(adviser_id, profiles:adviser_id(full_name)), research_members(member_name, is_leader)")
        .eq("submitted_by", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useAllResearch() {
  return useQuery({
    queryKey: ["all-research"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("research")
        .select("*, profiles:submitted_by(full_name), research_categories(name), adviser_assignments(adviser_id, profiles:adviser_id(full_name))")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useResearchByAdviser() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["adviser-research", user?.id],
    queryFn: async () => {
      const { data: assignments, error: aErr } = await supabase
        .from("adviser_assignments")
        .select("research_id")
        .eq("adviser_id", user!.id);
      if (aErr) throw aErr;
      const ids = assignments?.map((a: any) => a.research_id) || [];
      if (ids.length === 0) return [];
      const { data, error } = await supabase
        .from("research")
        .select("*, profiles:submitted_by(full_name), research_categories(name), research_members(member_name)")
        .in("id", ids)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useSubmitResearch() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ title, abstract, categoryId, departmentId, members }: {
      title: string; abstract: string; categoryId?: string; departmentId?: string; members: string[];
    }) => {
      const { data: research, error } = await supabase
        .from("research")
        .insert({ title, abstract, category_id: categoryId || null, department_id: departmentId || null, submitted_by: user!.id, status: "pending", research_code: "" })
        .select()
        .single();
      if (error) throw error;

      if (members.length > 0) {
        const memberRows = members.filter(m => m.trim()).map((m, i) => ({
          research_id: research.id,
          member_name: m.trim(),
          is_leader: i === 0,
        }));
        if (memberRows.length > 0) {
          await supabase.from("research_members").insert(memberRows);
        }
      }

      // Trigger notification
      await supabase.functions.invoke("notify", {
        body: { action: "research_submitted", data: { title, research_id: research.id, actor_id: user!.id } },
      });

      // Audit log
      await supabase.from("audit_logs").insert({
        user_id: user!.id,
        action: "SUBMIT_RESEARCH",
        details: `Research "${title}" submitted`,
        entity_type: "research",
        entity_id: research.id,
      });

      return research;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-research"] });
      qc.invalidateQueries({ queryKey: ["all-research"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });
}

export function useUpdateResearchStatus() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ researchId, status, userId, title }: {
      researchId: string; status: string; userId: string; title: string;
    }) => {
      const { error } = await supabase
        .from("research")
        .update({ status: status as any })
        .eq("id", researchId);
      if (error) throw error;

      await supabase.functions.invoke("notify", {
        body: {
          action: "research_status_changed",
          data: { user_id: userId, research_id: researchId, status, title, actor_id: user!.id },
        },
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["all-research"] });
      qc.invalidateQueries({ queryKey: ["my-research"] });
      qc.invalidateQueries({ queryKey: ["adviser-research"] });
    },
  });
}

// ==================== MANUSCRIPTS ====================
export function useManuscripts(researchId?: string) {
  return useQuery({
    queryKey: ["manuscripts", researchId],
    queryFn: async () => {
      let query = supabase
        .from("manuscripts")
        .select("*, research(title, research_code, submitted_by), profiles:uploaded_by(full_name)")
        .order("created_at", { ascending: false });
      if (researchId) query = query.eq("research_id", researchId);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useUploadManuscript() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ researchId, file, versionNotes }: {
      researchId: string; file: File; versionNotes: string;
    }) => {
      // Get next version number
      const { data: existing } = await supabase
        .from("manuscripts")
        .select("version_number")
        .eq("research_id", researchId)
        .order("version_number", { ascending: false })
        .limit(1);
      const nextVersion = (existing?.[0]?.version_number || 0) + 1;

      // Upload file
      const filePath = `${user!.id}/${researchId}/${Date.now()}_${file.name}`;
      const { error: uploadErr } = await supabase.storage
        .from("manuscripts")
        .upload(filePath, file);
      if (uploadErr) throw uploadErr;

      const { data: { publicUrl } } = supabase.storage.from("manuscripts").getPublicUrl(filePath);

      const { data, error } = await supabase
        .from("manuscripts")
        .insert({
          research_id: researchId,
          version_number: nextVersion,
          file_url: filePath,
          file_name: file.name,
          version_notes: versionNotes,
          status: "submitted",
          uploaded_by: user!.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["manuscripts"] });
    },
  });
}

export function useUpdateManuscriptStatus() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ manuscriptId, status, userId, title }: {
      manuscriptId: string; status: string; userId: string; title: string;
    }) => {
      const { error } = await supabase
        .from("manuscripts")
        .update({ status: status as any, reviewed_by: user!.id, reviewed_at: new Date().toISOString() })
        .eq("id", manuscriptId);
      if (error) throw error;

      await supabase.functions.invoke("notify", {
        body: {
          action: "manuscript_reviewed",
          data: { user_id: userId, manuscript_id: manuscriptId, status, title, actor_id: user!.id },
        },
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["manuscripts"] });
    },
  });
}

// ==================== PAYMENTS ====================
export function useMyPayments() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-payments", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("*, research(title, research_code)")
        .eq("submitted_by", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function usePendingPayments() {
  return useQuery({
    queryKey: ["pending-payments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("*, research(title, research_code), profiles:submitted_by(full_name)")
        .in("status", ["pending", "submitted"])
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useSubmitPayment() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ researchId, file, amount }: {
      researchId: string; file: File; amount?: number;
    }) => {
      const filePath = `${user!.id}/${Date.now()}_${file.name}`;
      const { error: uploadErr } = await supabase.storage.from("payment-proofs").upload(filePath, file);
      if (uploadErr) throw uploadErr;

      const { data, error } = await supabase
        .from("payments")
        .insert({
          research_id: researchId,
          amount: amount || 2500,
          proof_url: filePath,
          proof_file_name: file.name,
          status: "submitted",
          submitted_by: user!.id,
          payment_code: "",
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-payments"] });
      qc.invalidateQueries({ queryKey: ["pending-payments"] });
    },
  });
}

export function useVerifyPayment() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ paymentId, status, userId, paymentCode }: {
      paymentId: string; status: "verified" | "rejected"; userId: string; paymentCode: string;
    }) => {
      const { error } = await supabase
        .from("payments")
        .update({ status, verified_by: user!.id, verified_at: new Date().toISOString() })
        .eq("id", paymentId);
      if (error) throw error;

      if (status === "verified") {
        await supabase.functions.invoke("notify", {
          body: {
            action: "payment_verified",
            data: { user_id: userId, payment_id: paymentId, payment_code: paymentCode, actor_id: user!.id },
          },
        });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pending-payments"] });
      qc.invalidateQueries({ queryKey: ["my-payments"] });
    },
  });
}

// ==================== DEFENSE ====================
export function useDefenseSchedules() {
  return useQuery({
    queryKey: ["defense-schedules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("defense_schedules")
        .select("*, research(title, research_code, submitted_by), defense_panel_members(panelist_id, role, profiles:panelist_id(full_name))")
        .order("defense_date", { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateDefense() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ researchId, date, time, room, panelistIds }: {
      researchId: string; date: string; time: string; room: string; panelistIds?: string[];
    }) => {
      const { data, error } = await supabase
        .from("defense_schedules")
        .insert({ research_id: researchId, defense_date: date, defense_time: time, room, created_by: user!.id })
        .select("*, research(title, submitted_by)")
        .single();
      if (error) throw error;

      if (panelistIds?.length) {
        await supabase.from("defense_panel_members").insert(
          panelistIds.map(pid => ({ defense_id: data.id, panelist_id: pid }))
        );
      }

      // Notify
      const userIds = [data.research?.submitted_by, ...(panelistIds || [])].filter(Boolean);
      await supabase.functions.invoke("notify", {
        body: {
          action: "defense_scheduled",
          data: { user_ids: userIds, title: data.research?.title, date, time, room, defense_id: data.id, actor_id: user!.id },
        },
      });

      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["defense-schedules"] });
    },
  });
}

// ==================== NOTIFICATIONS ====================
export function useNotifications() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
    refetchInterval: 30000,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notificationId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user!.id)
        .eq("is_read", false);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}

// ==================== ANNOUNCEMENTS ====================
export function useAnnouncements() {
  return useQuery({
    queryKey: ["announcements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("announcements")
        .select("*, profiles:created_by(full_name)")
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateAnnouncement() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ title, content, isPinned }: { title: string; content: string; isPinned?: boolean }) => {
      const { data, error } = await supabase
        .from("announcements")
        .insert({ title, content, is_pinned: isPinned || false, created_by: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["announcements"] }),
  });
}

// ==================== REMARKS ====================
export function useRemarks(researchId?: string) {
  return useQuery({
    queryKey: ["remarks", researchId],
    queryFn: async () => {
      let query = supabase
        .from("remarks")
        .select("*, profiles:author_id(full_name), research(title, research_code, submitted_by)")
        .order("created_at", { ascending: false });
      if (researchId) query = query.eq("research_id", researchId);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateRemark() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ researchId, message, manuscriptId }: {
      researchId: string; message: string; manuscriptId?: string;
    }) => {
      const { data, error } = await supabase
        .from("remarks")
        .insert({ research_id: researchId, message, author_id: user!.id, manuscript_id: manuscriptId || null })
        .select("*, research(title, submitted_by)")
        .single();
      if (error) throw error;

      await supabase.functions.invoke("notify", {
        body: {
          action: "remark_added",
          data: { student_id: data.research?.submitted_by, research_id: researchId, title: data.research?.title, actor_id: user!.id },
        },
      });

      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["remarks"] }),
  });
}

// ==================== ADVISER ASSIGNMENTS ====================
export function useUnassignedResearch() {
  return useQuery({
    queryKey: ["unassigned-research"],
    queryFn: async () => {
      const { data: assigned } = await supabase.from("adviser_assignments").select("research_id");
      const assignedIds = assigned?.map((a: any) => a.research_id) || [];

      let query = supabase.from("research").select("*, profiles:submitted_by(full_name)").order("created_at", { ascending: false });
      if (assignedIds.length > 0) {
        // Get research NOT in assigned list
        const { data, error } = await supabase
          .from("research")
          .select("*, profiles:submitted_by(full_name)")
          .not("id", "in", `(${assignedIds.join(",")})`)
          .order("created_at", { ascending: false });
        if (error) throw error;
        return data;
      }
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useAdvisers() {
  return useQuery({
    queryKey: ["advisers"],
    queryFn: async () => {
      const { data: roles } = await supabase.from("user_roles").select("user_id").eq("role", "adviser");
      if (!roles?.length) return [];
      const ids = roles.map((r: any) => r.user_id);
      const { data, error } = await supabase.from("profiles").select("*").in("user_id", ids);
      if (error) throw error;
      return data;
    },
  });
}

export function useAssignAdviser() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ researchId, adviserId, title }: {
      researchId: string; adviserId: string; title: string;
    }) => {
      const { data: research } = await supabase.from("research").select("submitted_by").eq("id", researchId).single();

      const { error } = await supabase
        .from("adviser_assignments")
        .insert({ research_id: researchId, adviser_id: adviserId, assigned_by: user!.id });
      if (error) throw error;

      await supabase.functions.invoke("notify", {
        body: {
          action: "adviser_assigned",
          data: { student_id: research?.submitted_by, adviser_id: adviserId, research_id: researchId, title, actor_id: user!.id },
        },
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["unassigned-research"] });
      qc.invalidateQueries({ queryKey: ["all-research"] });
      qc.invalidateQueries({ queryKey: ["adviser-research"] });
    },
  });
}

// ==================== AUDIT LOGS ====================
export function useAuditLogs() {
  return useQuery({
    queryKey: ["audit-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*, profiles:user_id(full_name, email)")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });
}

// ==================== SYSTEM SETTINGS ====================
export function useSystemSettings() {
  return useQuery({
    queryKey: ["system-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("system_settings").select("*");
      if (error) throw error;
      return data;
    },
  });
}

export function useUpdateSetting() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const { error } = await supabase
        .from("system_settings")
        .update({ value, updated_by: user!.id })
        .eq("key", key);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["system-settings"] }),
  });
}

// ==================== USERS (admin) ====================
export function useAllUsers() {
  return useQuery({
    queryKey: ["all-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*, user_roles(role)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

// ==================== DEPARTMENTS & CATEGORIES ====================
export function useDepartments() {
  return useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const { data, error } = await supabase.from("departments").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });
}

export function useResearchCategories() {
  return useQuery({
    queryKey: ["research-categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("research_categories").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });
}

// ==================== DASHBOARD STATS ====================
export function useDashboardStats(role: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["dashboard-stats", role, user?.id],
    queryFn: async () => {
      if (role === "student") {
        const { count: totalResearch } = await supabase.from("research").select("*", { count: "exact", head: true }).eq("submitted_by", user!.id);
        const { count: pendingReview } = await supabase.from("research").select("*", { count: "exact", head: true }).eq("submitted_by", user!.id).in("status", ["pending", "review"]);
        const { count: approved } = await supabase.from("research").select("*", { count: "exact", head: true }).eq("submitted_by", user!.id).eq("status", "approved");
        const { count: unreadNotifs } = await supabase.from("notifications").select("*", { count: "exact", head: true }).eq("user_id", user!.id).eq("is_read", false);
        return { totalResearch: totalResearch || 0, pendingReview: pendingReview || 0, approved: approved || 0, unreadNotifs: unreadNotifs || 0 };
      }
      if (role === "adviser") {
        const { data: assignments } = await supabase.from("adviser_assignments").select("research_id").eq("adviser_id", user!.id);
        const ids = assignments?.map((a: any) => a.research_id) || [];
        const { count: pendingReviews } = ids.length ? await supabase.from("research").select("*", { count: "exact", head: true }).in("id", ids).in("status", ["pending", "review"]) : { count: 0 };
        const { count: approvedCount } = ids.length ? await supabase.from("research").select("*", { count: "exact", head: true }).in("id", ids).eq("status", "approved") : { count: 0 };
        return { assignedStudents: ids.length, pendingReviews: pendingReviews || 0, approved: approvedCount || 0 };
      }
      if (role === "staff") {
        const { count: pendingPayments } = await supabase.from("payments").select("*", { count: "exact", head: true }).in("status", ["pending", "submitted"]);
        const { count: unassigned } = await supabase.from("research").select("*", { count: "exact", head: true });
        const { count: defenseCount } = await supabase.from("defense_schedules").select("*", { count: "exact", head: true }).eq("status", "scheduled");
        return { pendingPayments: pendingPayments || 0, totalResearch: unassigned || 0, defenseCount: defenseCount || 0 };
      }
      if (role === "admin") {
        const { count: totalUsers } = await supabase.from("profiles").select("*", { count: "exact", head: true });
        const { count: totalResearch } = await supabase.from("research").select("*", { count: "exact", head: true });
        const { count: activeDefense } = await supabase.from("defense_schedules").select("*", { count: "exact", head: true }).eq("status", "scheduled");
        return { totalUsers: totalUsers || 0, totalResearch: totalResearch || 0, activeDefense: activeDefense || 0 };
      }
      return {};
    },
    enabled: !!user,
  });
}

// ==================== ARCHIVE (completed/archived research) ====================
export function useArchivedResearch() {
  return useQuery({
    queryKey: ["archived-research"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("research")
        .select("*, profiles:submitted_by(full_name), research_members(member_name)")
        .in("status", ["completed", "archived"])
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

// ==================== CHART DATA ====================
export function useResearchChartData() {
  return useQuery({
    queryKey: ["research-chart-data"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("research")
        .select("status, created_at")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}
