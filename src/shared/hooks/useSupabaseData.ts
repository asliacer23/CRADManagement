import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useAuth } from "./useAuth";

// ==================== RESEARCH ====================
export function useMyResearch() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-research", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("research")
        .select("*, research_categories(name), departments(name, code), adviser_assignments(adviser_id, profiles!adviser_id(full_name)), research_members(member_name, is_leader)")
        .eq("submitted_by", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 2,
  });
}

export function useAllResearch() {
  return useQuery({
    queryKey: ["all-research"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("research")
        .select("*, profiles!submitted_by(full_name), research_categories(name), departments(name, code), adviser_assignments(adviser_id, profiles!adviser_id(full_name)), research_members(member_name, is_leader)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 2,
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
        .select("*, profiles!submitted_by(full_name), research_categories(name), research_members(member_name, is_leader)")
        .in("id", ids)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 2,
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

      // Fire notification in background (don't block)
      supabase.functions.invoke("notify", {
        body: { action: "research_submitted", data: { title, research_id: research.id, actor_id: user!.id } },
      }).catch(() => {});

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

      supabase.functions.invoke("notify", {
        body: {
          action: "research_status_changed",
          data: { user_id: userId, research_id: researchId, status, title, actor_id: user!.id },
        },
      }).catch(() => {});
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["all-research"] });
      qc.invalidateQueries({ queryKey: ["my-research"] });
      qc.invalidateQueries({ queryKey: ["adviser-research"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
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
        .select("*, research(title, research_code, submitted_by), uploaded_by_profile:profiles!uploaded_by(full_name), reviewed_by_profile:profiles!reviewed_by(full_name)")
        .order("created_at", { ascending: false });
      if (researchId) query = query.eq("research_id", researchId);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 2,
  });
}

export function useManuscriptHistory(researchId: string) {
  return useQuery({
    queryKey: ["manuscript-history", researchId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("manuscripts")
        .select("*, uploaded_by_profile:profiles!uploaded_by(full_name), reviewed_by_profile:profiles!reviewed_by(full_name)")
        .eq("research_id", researchId)
        .order("version_number", { ascending: true });
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 2,
  });
}

export function useUploadManuscript() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ researchId, file, versionNotes }: {
      researchId: string; file: File; versionNotes: string;
    }) => {
      const { data: existing } = await supabase
        .from("manuscripts")
        .select("version_number")
        .eq("research_id", researchId)
        .order("version_number", { ascending: false })
        .limit(1);
      const nextVersion = (existing?.[0]?.version_number || 0) + 1;

      const filePath = `${user!.id}/${researchId}/${Date.now()}_${file.name}`;
      const { error: uploadErr } = await supabase.storage
        .from("manuscripts")
        .upload(filePath, file);
      if (uploadErr) throw uploadErr;

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

      supabase.functions.invoke("notify", {
        body: {
          action: "manuscript_reviewed",
          data: { user_id: userId, manuscript_id: manuscriptId, status, title, actor_id: user!.id },
        },
      }).catch(() => {});
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
    staleTime: 1000 * 60 * 2,
  });
}

export function usePendingPayments() {
  return useQuery({
    queryKey: ["pending-payments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("*, research(title, research_code), submitted_by_profile:profiles!submitted_by(full_name)")
        .in("status", ["pending", "submitted"])
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60,
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

      let paymentAmount = amount;
      if (paymentAmount == null) {
        const { data: feeSetting, error: feeError } = await supabase
          .from("system_settings")
          .select("value")
          .eq("key", "research_fee")
          .maybeSingle();
        if (feeError) throw feeError;

        const parsedFee = Number(feeSetting?.value);
        paymentAmount = Number.isFinite(parsedFee) && parsedFee > 0 ? parsedFee : 2500;
      }

      const { data, error } = await supabase
        .from("payments")
        .insert({
          research_id: researchId,
          amount: paymentAmount,
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
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
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
        supabase.functions.invoke("notify", {
          body: {
            action: "payment_verified",
            data: { user_id: userId, payment_id: paymentId, payment_code: paymentCode, actor_id: user!.id },
          },
        }).catch(() => {});
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pending-payments"] });
      qc.invalidateQueries({ queryKey: ["my-payments"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
      qc.invalidateQueries({ queryKey: ["all-payments"] });
    },
  });
}

export function useAllPayments(status?: Database["public"]["Enums"]["payment_status"]) {
  return useQuery({
    queryKey: ["all-payments", status],
    queryFn: async () => {
      let query = supabase
        .from("payments")
        .select("*, research(title, research_code), submitted_by_profile:profiles!submitted_by(full_name), verified_by_profile:profiles!verified_by(full_name)");
      
      if (status) {
        query = query.eq("status", status);
      }
      
      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60,
  });
}

// ==================== DEFENSE ====================
export function useDefenseSchedules() {
  return useQuery({
    queryKey: ["defense-schedules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("defense_schedules")
        .select("*, research(title, research_code, submitted_by), defense_panel_members(panelist_id, role, profiles!panelist_id(full_name))")
        .order("defense_date", { ascending: true });
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 2,
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

      const userIds = [data.research?.submitted_by, ...(panelistIds || [])].filter(Boolean);
      supabase.functions.invoke("notify", {
        body: {
          action: "defense_scheduled",
          data: { user_ids: userIds, title: data.research?.title, date, time, room, defense_id: data.id, actor_id: user!.id },
        },
      }).catch(() => {});

      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["defense-schedules"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
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
    staleTime: 1000 * 15,
  });
}

export function useUnreadCount() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["unread-count", user?.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user!.id)
        .eq("is_read", false);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!user,
    refetchInterval: 30000,
    staleTime: 1000 * 15,
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["unread-count"] });
    },
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["unread-count"] });
    },
  });
}

// ==================== ANNOUNCEMENTS ====================
export function useAnnouncements() {
  return useQuery({
    queryKey: ["announcements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("announcements")
        .select("*, profiles!created_by(full_name)")
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 5,
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

      // Notify all users about announcement
      supabase.functions.invoke("notify", {
        body: { action: "announcement_created", data: { title, announcement_id: data.id, actor_id: user!.id } },
      }).catch(() => {});

      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["announcements"] }),
  });
}

export function useDeleteAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("announcements").delete().eq("id", id);
      if (error) throw error;
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
        .select("*, profiles!author_id(full_name), research(title, research_code, submitted_by)")
        .order("created_at", { ascending: false });
      if (researchId) query = query.eq("research_id", researchId);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60,
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

      supabase.functions.invoke("notify", {
        body: {
          action: "remark_added",
          data: { student_id: data.research?.submitted_by, research_id: researchId, title: data.research?.title, actor_id: user!.id },
        },
      }).catch(() => {});

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

      let query = supabase.from("research").select("*, profiles!submitted_by(full_name), departments(name, code), adviser_assignments(adviser_id, profiles!adviser_id(full_name))").order("created_at", { ascending: false });
      if (assignedIds.length > 0) {
        const { data, error } = await supabase
          .from("research")
          .select("*, profiles!submitted_by(full_name), departments(name, code), adviser_assignments(adviser_id, profiles!adviser_id(full_name))")
          .not("id", "in", `(${assignedIds.join(",")})`)
          .order("created_at", { ascending: false });
        if (error) throw error;
        return data;
      }
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60,
  });
}

export function useAdvisers() {
  return useQuery({
    queryKey: ["advisers"],
    queryFn: async () => {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("*")
        .order("full_name");
      if (error) throw error;
      if (!profiles?.length) return [];

      const roles = await Promise.all(
        profiles.map(async (profile: any) => {
          const { data: role, error: roleError } = await supabase.rpc("get_user_role", { _user_id: profile.user_id });
          if (roleError) throw roleError;
          return { profile, role };
        })
      );

      return roles
        .filter(({ role }) => role === "adviser")
        .map(({ profile }) => profile);
    },
    staleTime: 1000 * 60 * 5,
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

      supabase.functions.invoke("notify", {
        body: {
          action: "adviser_assigned",
          data: { student_id: research?.submitted_by, adviser_id: adviserId, research_id: researchId, title, actor_id: user!.id },
        },
      }).catch(() => {});
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["unassigned-research"] });
      qc.invalidateQueries({ queryKey: ["all-research"] });
      qc.invalidateQueries({ queryKey: ["adviser-research"] });
      qc.invalidateQueries({ queryKey: ["adviser-workload"] });
    },
  });
}

export function useAssignMultipleAdvisers() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ researchId, adviserIds, title }: {
      researchId: string; adviserIds: string[]; title: string;
    }) => {
      const { data: research } = await supabase.from("research").select("submitted_by").eq("id", researchId).single();

      const assignments = adviserIds.map((adviserId) => ({
        research_id: researchId,
        adviser_id: adviserId,
        assigned_by: user!.id,
      }));

      const { error } = await supabase
        .from("adviser_assignments")
        .insert(assignments);
      if (error) throw error;

      // Send notifications for each assigned adviser
      Promise.all(
        adviserIds.map((adviserId) =>
          supabase.functions.invoke("notify", {
            body: {
              action: "adviser_assigned",
              data: { student_id: research?.submitted_by, adviser_id: adviserId, research_id: researchId, title, actor_id: user!.id },
            },
          }).catch(() => {})
        )
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["unassigned-research"] });
      qc.invalidateQueries({ queryKey: ["all-research"] });
      qc.invalidateQueries({ queryKey: ["adviser-research"] });
      qc.invalidateQueries({ queryKey: ["adviser-workload"] });
      qc.invalidateQueries({ queryKey: ["my-research"] });
    },
  });
}

export function useRemoveAdviserAssignment() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ researchId, adviserId }: {
      researchId: string; adviserId: string;
    }) => {
      const { error } = await supabase
        .from("adviser_assignments")
        .delete()
        .eq("research_id", researchId)
        .eq("adviser_id", adviserId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["unassigned-research"] });
      qc.invalidateQueries({ queryKey: ["all-research"] });
      qc.invalidateQueries({ queryKey: ["adviser-research"] });
      qc.invalidateQueries({ queryKey: ["adviser-workload"] });
      qc.invalidateQueries({ queryKey: ["my-research"] });
    },
  });
}

export function useAdviserWorkload() {
  return useQuery({
    queryKey: ["adviser-workload"],
    queryFn: async () => {
      const { data: advisers, error: adviserError } = await supabase
        .from("profiles")
        .select("*")
        .order("full_name");
      if (adviserError) throw adviserError;
      if (!advisers?.length) return [];

      const roles = await Promise.all(
        advisers.map(async (profile: any) => {
          const { data: role, error: roleError } = await supabase.rpc("get_user_role", { _user_id: profile.user_id });
          if (roleError) throw roleError;
          return { profile, role };
        })
      );

      const adviserProfiles = roles
        .filter(({ role }) => role === "adviser")
        .map(({ profile }) => profile);

      const { data: assignments } = await supabase
        .from("adviser_assignments")
        .select("adviser_id, research_id, research(title, status)");

      const workload = adviserProfiles.map((profile: any) => {
        const assignedCount = assignments?.filter((a: any) => a.adviser_id === profile.user_id).length || 0;
        const assignedResearch = assignments?.filter((a: any) => a.adviser_id === profile.user_id) || [];
        return { ...profile, assignedCount, assignedResearch };
      });

      return workload.sort((a, b) => a.assignedCount - b.assignedCount);
    },
    staleTime: 1000 * 60 * 2,
  });
}

// ==================== AUDIT LOGS ====================
export function useAuditLogs() {
  return useQuery({
    queryKey: ["audit-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*, profiles!user_id(full_name, email)")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60,
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
    staleTime: 1000 * 60 * 10,
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
      // Fetch profiles and roles separately, then merge
      const { data: profiles, error: pErr } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (pErr) throw pErr;

      const { data: roles, error: rErr } = await supabase
        .from("user_roles")
        .select("user_id, role");
      if (rErr) throw rErr;

      const roleMap = new Map<string, string>();
      roles?.forEach((r: any) => roleMap.set(r.user_id, r.role));

      return profiles?.map((p: any) => ({
        ...p,
        user_roles: [{ role: roleMap.get(p.user_id) || "student" }],
      })) || [];
    },
    staleTime: 1000 * 60 * 2,
  });
}

export function useUpdateUserRole() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      // Upsert the role
      const { data: existing } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", userId)
        .single();

      if (existing) {
        const { error } = await supabase
          .from("user_roles")
          .update({ role: role as any })
          .eq("user_id", userId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("user_roles")
          .insert({ user_id: userId, role: role as any });
        if (error) throw error;
      }

      supabase.functions.invoke("notify", {
        body: {
          action: "role_changed",
          data: { user_id: userId, new_role: role, actor_id: user!.id },
        },
      }).catch(() => {});
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["all-users"] });
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
    staleTime: 1000 * 60 * 30,
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
    staleTime: 1000 * 60 * 30,
  });
}

// ==================== DASHBOARD STATS ====================
export function useDashboardStats(role: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["dashboard-stats", role, user?.id],
    queryFn: async () => {
      if (role === "student") {
        const [totalRes, pendingRes, approvedRes, unreadRes] = await Promise.all([
          supabase.from("research").select("*", { count: "exact", head: true }).eq("submitted_by", user!.id),
          supabase.from("research").select("*", { count: "exact", head: true }).eq("submitted_by", user!.id).in("status", ["pending", "review"]),
          supabase.from("research").select("*", { count: "exact", head: true }).eq("submitted_by", user!.id).eq("status", "approved"),
          supabase.from("notifications").select("*", { count: "exact", head: true }).eq("user_id", user!.id).eq("is_read", false),
        ]);
        return {
          totalResearch: totalRes.count || 0,
          pendingReview: pendingRes.count || 0,
          approved: approvedRes.count || 0,
          unreadNotifs: unreadRes.count || 0,
        };
      }
      if (role === "adviser") {
        const { data: assignments } = await supabase.from("adviser_assignments").select("research_id").eq("adviser_id", user!.id);
        const ids = assignments?.map((a: any) => a.research_id) || [];
        if (ids.length === 0) return { assignedStudents: 0, pendingReviews: 0, approved: 0 };
        const [pendingRes, approvedRes] = await Promise.all([
          supabase.from("research").select("*", { count: "exact", head: true }).in("id", ids).in("status", ["pending", "review"]),
          supabase.from("research").select("*", { count: "exact", head: true }).in("id", ids).eq("status", "approved"),
        ]);
        return { assignedStudents: ids.length, pendingReviews: pendingRes.count || 0, approved: approvedRes.count || 0 };
      }
      if (role === "staff") {
        const [pendingPay, totalRes, defRes] = await Promise.all([
          supabase.from("payments").select("*", { count: "exact", head: true }).in("status", ["pending", "submitted"]),
          supabase.from("research").select("*", { count: "exact", head: true }),
          supabase.from("defense_schedules").select("*", { count: "exact", head: true }).eq("status", "scheduled"),
        ]);
        return { pendingPayments: pendingPay.count || 0, totalResearch: totalRes.count || 0, defenseCount: defRes.count || 0 };
      }
      if (role === "admin") {
        const [usersRes, researchRes, defenseRes] = await Promise.all([
          supabase.from("profiles").select("*", { count: "exact", head: true }),
          supabase.from("research").select("*", { count: "exact", head: true }),
          supabase.from("defense_schedules").select("*", { count: "exact", head: true }).eq("status", "scheduled"),
        ]);
        return { totalUsers: usersRes.count || 0, totalResearch: researchRes.count || 0, activeDefense: defenseRes.count || 0 };
      }
      return {};
    },
    enabled: !!user,
    staleTime: 1000 * 60,
  });
}

// ==================== ARCHIVE (completed/archived research) ====================
export function useArchivedResearch() {
  return useQuery({
    queryKey: ["archived-research"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("research")
        .select("*, profiles!submitted_by(full_name), research_members(member_name), departments(name, code)")
        .in("status", ["completed", "archived"])
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 5,
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
    staleTime: 1000 * 60 * 5,
  });
}

// ==================== PROFILE ====================
export function useUserProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["user-profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });
}

export function useUpdateUserProfile() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ fullName, department, studentId }: {
      fullName?: string; department?: string; studentId?: string;
    }) => {
      const { error } = await supabase
        .from("profiles")
        .update({
          ...(fullName && { full_name: fullName }),
          ...(department !== undefined && { department }),
          ...(studentId !== undefined && { student_id: studentId }),
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["user-profile"] });
    },
  });
}

export function useUploadAvatar() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (file: File) => {
      // Delete old avatar if exists
      const { data: profile } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("user_id", user!.id)
        .single();

      if (profile?.avatar_url) {
        const oldFilePath = profile.avatar_url;
        await supabase.storage.from("avatars").remove([oldFilePath]).catch(() => {});
      }

      // Upload new avatar
      const filePath = `${user!.id}/${Date.now()}_${file.name}`;
      const { error: uploadErr } = await supabase.storage
        .from("avatars")
        .upload(filePath, file);
      if (uploadErr) throw uploadErr;

      // Get public URL
      const { data: publicUrl } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      // Update profile with avatar URL
      const { error: updateErr } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl.publicUrl, updated_at: new Date().toISOString() })
        .eq("user_id", user!.id);
      if (updateErr) throw updateErr;

      return publicUrl.publicUrl;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["user-profile"] });
    },
  });
}
