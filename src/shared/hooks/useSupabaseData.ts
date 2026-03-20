import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useAuth } from "./useAuth";

const crad = supabase.schema("crad") as any;

function getBypassAdminDashboardData() {
  return {
    summary: {
      totalUsers: 6,
      totalResearch: 5,
      pendingResearch: 2,
      scheduledDefenses: 1,
      pendingPayments: 2,
      pendingFinalApprovals: 1,
      archivedResearch: 1,
      totalAnnouncements: 2,
      pendingManuscripts: 2,
    },
    roleCounts: { student: 3, adviser: 1, staff: 1, admin: 1 },
    researchStatusCounts: { pending: 1, approved: 1, pending_final_approval: 1, archived: 1, review: 1 },
    manuscriptStatusCounts: { approved: 2, submitted: 1, under_review: 1 },
    paymentStatusCounts: { submitted: 1, verified: 2, pending: 1 },
    defenseStatusCounts: { scheduled: 1, completed: 2 },
    approvalStatusCounts: { pending: 1, approved: 1 },
    departmentAnalytics: [
      { department: "Information Technology", code: "IT", totalResearch: 3, activePipeline: 2, archived: 1 },
      { department: "Computer Science", code: "CS", totalResearch: 2, activePipeline: 2, archived: 0 },
    ],
    recentResearch: [
      { id: "1", title: "Student Wellness Appointment Assistant", research_code: "R-2026-205", status: "review", created_at: new Date().toISOString(), profiles: { full_name: "Paolo Ramos" }, departments: { code: "CS" } },
      { id: "2", title: "Community Research Repository and Archival Dashboard", research_code: "R-2026-204", status: "archived", created_at: new Date(Date.now() - 86400000).toISOString(), profiles: { full_name: "Ana Reyes" }, departments: { code: "IT" } },
      { id: "3", title: "AI-Powered Attendance Analytics for Student Intervention", research_code: "R-2026-203", status: "pending_final_approval", created_at: new Date(Date.now() - 172800000).toISOString(), profiles: { full_name: "Ana Reyes" }, departments: { code: "CS" } },
    ],
    pendingPaymentsList: [
      { id: "1", payment_code: "PAY-9204", amount: 2500, status: "pending", research: { title: "Student Wellness Appointment Assistant", research_code: "R-2026-205" }, submitted_by_profile: { full_name: "Paolo Ramos" } },
      { id: "2", payment_code: "PAY-9201", amount: 2500, status: "submitted", research: { title: "Smart Inventory Tracking System for Campus Laboratories", research_code: "R-2026-201" }, submitted_by_profile: { full_name: "Juan Dela Cruz" } },
    ],
    pendingApprovalsList: [
      { id: "1", status: "pending", created_at: new Date().toISOString(), research: { title: "AI-Powered Attendance Analytics for Student Intervention", research_code: "R-2026-203" } },
    ],
    upcomingDefenses: [
      { id: "1", defense_date: new Date(Date.now() + 7 * 86400000).toISOString(), defense_time: "09:00", room: "Room 301", status: "scheduled", research: { title: "Barangay Request Management Portal", research_code: "R-2026-202" } },
    ],
    recentLogs: [
      { id: "1", action: "DEFENSE_COMPLETED", details: "Completed defense workflow for AI-Powered Attendance Analytics.", created_at: new Date().toISOString(), profiles: { full_name: "CRAD Staff", email: "staff.seed@crad.local" } },
      { id: "2", action: "PAYMENT_VERIFIED", details: "Verified payment PAY-9202 for Barangay Request Management Portal.", created_at: new Date(Date.now() - 86400000).toISOString(), profiles: { full_name: "CRAD Staff", email: "staff.seed@crad.local" } },
    ],
    recentAnnouncements: [
      { id: "1", title: "Panel Scheduling Open", is_pinned: false, created_at: new Date().toISOString() },
      { id: "2", title: "CRAD Demo Workspace Ready", is_pinned: true, created_at: new Date(Date.now() - 3 * 86400000).toISOString() },
    ],
    chartData: [
      { status: "pending", created_at: new Date(Date.now() - 40 * 86400000).toISOString() },
      { status: "approved", created_at: new Date(Date.now() - 30 * 86400000).toISOString() },
      { status: "pending_final_approval", created_at: new Date(Date.now() - 24 * 86400000).toISOString() },
      { status: "archived", created_at: new Date(Date.now() - 70 * 86400000).toISOString() },
      { status: "review", created_at: new Date(Date.now() - 18 * 86400000).toISOString() },
    ],
  };
}

function getBypassDefenseSchedules() {
  return [
    {
      id: "45000000-0000-0000-0000-000000000201",
      defense_date: new Date(Date.now() + 7 * 86400000).toISOString(),
      defense_time: "09:00",
      room: "Room 301",
      status: "scheduled",
      research: {
        id: "40000000-0000-0000-0000-000000000202",
        title: "Barangay Request Management Portal",
        research_code: "R-2026-202",
        submitted_by: "d50e8400-e29b-41d4-a716-446655440004",
        departments: { code: "IT", name: "Information Technology" },
        research_members: [
          { member_name: "Juan Dela Cruz", is_leader: true },
          { member_name: "Carlo Mendoza", is_leader: false },
        ],
      },
      defense_panel_members: [
        { panelist_id: "d50e8400-e29b-41d4-a716-446655440003", role: "leader", profiles: { full_name: "Prof. Maria Santos" } },
        { panelist_id: "d50e8400-e29b-41d4-a716-446655440001", role: "panelist", profiles: { full_name: "CRAD Admin" } },
      ],
    },
    {
      id: "45000000-0000-0000-0000-000000000202",
      defense_date: new Date(Date.now() - 2 * 86400000).toISOString(),
      defense_time: "13:00",
      room: "Research Hall A",
      status: "completed",
      research: {
        id: "40000000-0000-0000-0000-000000000203",
        title: "AI-Powered Attendance Analytics for Student Intervention",
        research_code: "R-2026-203",
        submitted_by: "d50e8400-e29b-41d4-a716-446655440005",
        departments: { code: "CS", name: "Computer Science" },
        research_members: [
          { member_name: "Ana Reyes", is_leader: true },
          { member_name: "Paolo Ramos", is_leader: false },
        ],
      },
      defense_panel_members: [
        { panelist_id: "d50e8400-e29b-41d4-a716-446655440003", role: "leader", profiles: { full_name: "Prof. Maria Santos" } },
        { panelist_id: "d50e8400-e29b-41d4-a716-446655440001", role: "panelist", profiles: { full_name: "CRAD Admin" } },
      ],
    },
    {
      id: "45000000-0000-0000-0000-000000000203",
      defense_date: new Date(Date.now() - 15 * 86400000).toISOString(),
      defense_time: "10:30",
      room: "Research Hall B",
      status: "completed",
      research: {
        id: "40000000-0000-0000-0000-000000000204",
        title: "Community Research Repository and Archival Dashboard",
        research_code: "R-2026-204",
        submitted_by: "d50e8400-e29b-41d4-a716-446655440005",
        departments: { code: "IT", name: "Information Technology" },
        research_members: [
          { member_name: "Ana Reyes", is_leader: true },
        ],
      },
      defense_panel_members: [
        { panelist_id: "d50e8400-e29b-41d4-a716-446655440003", role: "leader", profiles: { full_name: "Prof. Maria Santos" } },
      ],
    },
  ];
}

// ==================== RESEARCH ====================
export function useMyResearch() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-research", user?.id],
    queryFn: async () => {
      const { data, error } = await crad.from("research")
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
      const { data, error } = await crad.from("research")
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
      const { data: assignments, error: aErr } = await crad.from("adviser_assignments")
        .select("research_id")
        .eq("adviser_id", user!.id);
      if (aErr) throw aErr;
      const ids = assignments?.map((a: any) => a.research_id) || [];
      if (ids.length === 0) return [];
      const { data, error } = await crad.from("research")
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
      const { data: research, error } = await crad.from("research")
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
          await crad.from("research_members").insert(memberRows);
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
      const { error } = await crad.from("research")
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
      let query = crad.from("manuscripts")
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
      const { data, error } = await crad.from("manuscripts")
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
      const { data: existing } = await crad.from("manuscripts")
        .select("version_number")
        .eq("research_id", researchId)
        .order("version_number", { ascending: false })
        .limit(1);
      const nextVersion = (existing?.[0]?.version_number || 0) + 1;

      const filePath = `${user!.id}/${researchId}/${Date.now()}_${file.name}`;
      const { error: uploadErr } = await supabase.storage
        crad.from("manuscripts")
        .upload(filePath, file);
      if (uploadErr) throw uploadErr;

      const { data, error } = await crad.from("manuscripts")
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
      const { error } = await crad.from("manuscripts")
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
      const { data, error } = await crad.from("payments")
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
      const { data, error } = await crad.from("payments")
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
        const { data: feeSetting, error: feeError } = await crad.from("system_settings")
          .select("value")
          .eq("key", "research_fee")
          .maybeSingle();
        if (feeError) throw feeError;

        const parsedFee = Number(feeSetting?.value);
        paymentAmount = Number.isFinite(parsedFee) && parsedFee > 0 ? parsedFee : 2500;
      }

      const { data, error } = await crad.from("payments")
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
      const { error } = await crad.from("payments")
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
      let query = crad.from("payments")
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
  const { user } = useAuth();
  return useQuery({
    queryKey: ["defense-schedules", user?.id],
    queryFn: async () => {
      if (user?.isBypass) {
        return getBypassDefenseSchedules();
      }

      const { data, error } = await crad.from("defense_schedules")
        .select("*, research(id, title, research_code, submitted_by, departments(code, name), research_members(member_name, is_leader)), defense_panel_members(panelist_id, role, profiles!panelist_id(full_name))")
        .order("defense_date", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 2,
    retry: user?.isBypass ? false : 1,
  });
}

export function useCreateDefense() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ researchId, date, time, room, panelistIds }: {
      researchId: string; date: string; time: string; room: string; panelistIds?: string[];
    }) => {
      const { data, error } = await crad.from("defense_schedules")
        .insert({ research_id: researchId, defense_date: date, defense_time: time, room, created_by: user!.id })
        .select("*, research(title, submitted_by)")
        .single();
      if (error) throw error;

      if (panelistIds?.length) {
        await crad.from("defense_panel_members").insert(
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

export function useUpdateDefenseStatus() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ defenseId, status }: { defenseId: string; status: "scheduled" | "completed" | "cancelled" }) => {
      const { error } = await crad.from("defense_schedules")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", defenseId);
      if (error) throw error;

      // Send notification when marked as completed
      if (status === "completed") {
        const { data: defense } = await crad.from("defense_schedules")
          .select("*, research(id, title, submitted_by)")
          .eq("id", defenseId)
          .single();

        if (defense?.research) {
          supabase.functions.invoke("notify", {
            body: {
              action: "defense_completed",
              data: {
                user_id: defense.research.submitted_by,
                defense_id: defenseId,
                title: defense.research.title,
                actor_id: user!.id,
              },
            },
          }).catch(() => {});
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["defense-schedules"] });
      qc.invalidateQueries({ queryKey: ["pending-final-approvals"] });
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
      const { data, error } = await crad.from("notifications")
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
      const { count, error } = await crad.from("notifications")
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
      const { error } = await crad.from("notifications")
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
      const { error } = await crad.from("notifications")
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
      const { data, error } = await crad.from("announcements")
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
      const { data, error } = await crad.from("announcements")
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
      const { error } = await crad.from("announcements").delete().eq("id", id);
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
      let query = crad.from("remarks")
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
      const { data, error } = await crad.from("remarks")
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
      const { data: assigned } = await crad.from("adviser_assignments").select("research_id");
      const assignedIds = assigned?.map((a: any) => a.research_id) || [];

      let query = crad.from("research").select("*, profiles!submitted_by(full_name), departments(name, code), adviser_assignments(adviser_id, profiles!adviser_id(full_name))").order("created_at", { ascending: false });
      if (assignedIds.length > 0) {
        const { data, error } = await crad.from("research")
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
      const { data: profiles, error } = await crad.from("profiles")
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
      const { data: research } = await crad.from("research").select("submitted_by").eq("id", researchId).single();

      const { error } = await crad.from("adviser_assignments")
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
      const { data: research } = await crad.from("research").select("submitted_by").eq("id", researchId).single();

      const assignments = adviserIds.map((adviserId) => ({
        research_id: researchId,
        adviser_id: adviserId,
        assigned_by: user!.id,
      }));

      const { error } = await crad.from("adviser_assignments")
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
      const { error } = await crad.from("adviser_assignments")
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
      const { data: advisers, error: adviserError } = await crad.from("profiles")
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

      const { data: assignments } = await crad.from("adviser_assignments")
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
      const { data, error } = await crad.from("audit_logs")
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
      const { data, error } = await crad.from("system_settings").select("*");
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
      const { error } = await crad.from("system_settings")
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
      const { data: profiles, error: pErr } = await crad.from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (pErr) throw pErr;

      const { data: roles, error: rErr } = await crad.from("user_roles")
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
      const { data: existing } = await crad.from("user_roles")
        .select("id")
        .eq("user_id", userId)
        .single();

      if (existing) {
        const { error } = await crad.from("user_roles")
          .update({ role: role as any })
          .eq("user_id", userId);
        if (error) throw error;
      } else {
        const { error } = await crad.from("user_roles")
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
      const { data, error } = await crad.from("departments").select("*").order("name");
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
      const { data, error } = await crad.from("research_categories").select("*").order("name");
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
          crad.from("research").select("*", { count: "exact", head: true }).eq("submitted_by", user!.id),
          crad.from("research").select("*", { count: "exact", head: true }).eq("submitted_by", user!.id).in("status", ["pending", "review"]),
          crad.from("research").select("*", { count: "exact", head: true }).eq("submitted_by", user!.id).eq("status", "approved"),
          crad.from("notifications").select("*", { count: "exact", head: true }).eq("user_id", user!.id).eq("is_read", false),
        ]);
        return {
          totalResearch: totalRes.count || 0,
          pendingReview: pendingRes.count || 0,
          approved: approvedRes.count || 0,
          unreadNotifs: unreadRes.count || 0,
        };
      }
      if (role === "adviser") {
        const { data: assignments } = await crad.from("adviser_assignments").select("research_id").eq("adviser_id", user!.id);
        const ids = assignments?.map((a: any) => a.research_id) || [];
        if (ids.length === 0) return { assignedStudents: 0, pendingReviews: 0, approved: 0 };
        const [pendingRes, approvedRes] = await Promise.all([
          crad.from("research").select("*", { count: "exact", head: true }).in("id", ids).in("status", ["pending", "review"]),
          crad.from("research").select("*", { count: "exact", head: true }).in("id", ids).eq("status", "approved"),
        ]);
        return { assignedStudents: ids.length, pendingReviews: pendingRes.count || 0, approved: approvedRes.count || 0 };
      }
      if (role === "staff") {
        const [pendingPay, totalRes, defRes] = await Promise.all([
          crad.from("payments").select("*", { count: "exact", head: true }).in("status", ["pending", "submitted"]),
          crad.from("research").select("*", { count: "exact", head: true }),
          crad.from("defense_schedules").select("*", { count: "exact", head: true }).eq("status", "scheduled"),
        ]);
        return { pendingPayments: pendingPay.count || 0, totalResearch: totalRes.count || 0, defenseCount: defRes.count || 0 };
      }
      if (role === "admin") {
        const [usersRes, researchRes, defenseRes] = await Promise.all([
          crad.from("profiles").select("*", { count: "exact", head: true }),
          crad.from("research").select("*", { count: "exact", head: true }),
          crad.from("defense_schedules").select("*", { count: "exact", head: true }).eq("status", "scheduled"),
        ]);
        return { totalUsers: usersRes.count || 0, totalResearch: researchRes.count || 0, activeDefense: defenseRes.count || 0 };
      }
      return {};
    },
    enabled: !!user,
    staleTime: 1000 * 60,
  });
}

export function useUpdateDefenseSchedule() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ defenseId, defense_date, defense_time, room, status }: {
      defenseId: string;
      defense_date: string;
      defense_time: string;
      room: string;
      status: string;
    }) => {
      if (user?.isBypass) {
        return { id: defenseId, defense_date, defense_time, room, status };
      }

      const { data, error } = await crad.from("defense_schedules")
        .update({ defense_date, defense_time, room, status, updated_at: new Date().toISOString() })
        .eq("id", defenseId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["defense-schedules"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });
}

export function useAdminDashboardAnalytics() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["admin-dashboard-analytics", user?.id],
    queryFn: async () => {
      if (user?.isBypass) {
        return getBypassAdminDashboardData();
      }

      const [
        { count: totalUsers, error: usersCountError },
        { data: roles, error: rolesError },
        { data: research, error: researchError },
        { data: manuscripts, error: manuscriptsError },
        { data: payments, error: paymentsError },
        { data: defenses, error: defensesError },
        { data: finalApprovals, error: approvalsError },
        { data: announcements, error: announcementsError },
        { data: logs, error: logsError },
      ] = await Promise.all([
        crad.from("profiles").select("*", { count: "exact", head: true }),
        crad.from("user_roles").select("role"),
        crad.from("research")
          .select("id, title, research_code, status, created_at, updated_at, departments(name, code), profiles!submitted_by(full_name)"),
        crad.from("manuscripts")
          .select("id, status, created_at, research(title, research_code), uploaded_by_profile:profiles!uploaded_by(full_name)")
          .order("created_at", { ascending: false }),
        crad.from("payments")
          .select("id, payment_code, amount, status, created_at, research(title, research_code), submitted_by_profile:profiles!submitted_by(full_name)")
          .order("created_at", { ascending: false }),
        crad.from("defense_schedules")
          .select("id, defense_date, defense_time, room, status, created_at, research(title, research_code)")
          .order("defense_date", { ascending: true }),
        crad.from("final_approvals")
          .select("id, status, updated_at, created_at, research(title, research_code)")
          .order("updated_at", { ascending: false }),
        crad.from("announcements")
          .select("id, title, is_pinned, created_at")
          .order("created_at", { ascending: false }),
        crad.from("audit_logs")
          .select("id, action, details, created_at, profiles!user_id(full_name, email)")
          .order("created_at", { ascending: false })
          .limit(8),
      ]);

      if (usersCountError) throw usersCountError;
      if (rolesError) throw rolesError;
      if (researchError) throw researchError;
      if (manuscriptsError) throw manuscriptsError;
      if (paymentsError) throw paymentsError;
      if (defensesError) throw defensesError;
      if (approvalsError) throw approvalsError;
      if (announcementsError) throw announcementsError;
      if (logsError) throw logsError;

      const roleCounts = (roles || []).reduce((acc: Record<string, number>, role: any) => {
        acc[role.role] = (acc[role.role] || 0) + 1;
        return acc;
      }, {});

      const researchStatusCounts = (research || []).reduce((acc: Record<string, number>, item: any) => {
        acc[item.status] = (acc[item.status] || 0) + 1;
        return acc;
      }, {});

      const manuscriptStatusCounts = (manuscripts || []).reduce((acc: Record<string, number>, item: any) => {
        acc[item.status] = (acc[item.status] || 0) + 1;
        return acc;
      }, {});

      const paymentStatusCounts = (payments || []).reduce((acc: Record<string, number>, item: any) => {
        acc[item.status] = (acc[item.status] || 0) + 1;
        return acc;
      }, {});

      const defenseStatusCounts = (defenses || []).reduce((acc: Record<string, number>, item: any) => {
        acc[item.status] = (acc[item.status] || 0) + 1;
        return acc;
      }, {});

      const approvalStatusCounts = (finalApprovals || []).reduce((acc: Record<string, number>, item: any) => {
        acc[item.status] = (acc[item.status] || 0) + 1;
        return acc;
      }, {});

      const departmentRows = new Map<string, { department: string; code: string; totalResearch: number; activePipeline: number; archived: number }>();
      (research || []).forEach((item: any) => {
        const departmentName = item.departments?.name || "Unassigned";
        const departmentCode = item.departments?.code || "N/A";
        const row = departmentRows.get(departmentCode) || {
          department: departmentName,
          code: departmentCode,
          totalResearch: 0,
          activePipeline: 0,
          archived: 0,
        };
        row.totalResearch += 1;
        if (["archived", "completed"].includes(item.status)) row.archived += 1;
        else row.activePipeline += 1;
        departmentRows.set(departmentCode, row);
      });

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const upcomingDefenses = (defenses || [])
        .filter((item: any) => {
          const defenseDate = new Date(item.defense_date);
          return item.status === "scheduled" && defenseDate >= today;
        })
        .slice(0, 5);

      return {
        summary: {
          totalUsers: totalUsers || 0,
          totalResearch: research?.length || 0,
          pendingResearch: (researchStatusCounts.pending || 0) + (researchStatusCounts.review || 0),
          scheduledDefenses: defenseStatusCounts.scheduled || 0,
          pendingPayments: (paymentStatusCounts.pending || 0) + (paymentStatusCounts.submitted || 0),
          pendingFinalApprovals: approvalStatusCounts.pending || 0,
          archivedResearch: researchStatusCounts.archived || 0,
          totalAnnouncements: announcements?.length || 0,
          pendingManuscripts: (manuscriptStatusCounts.submitted || 0) + (manuscriptStatusCounts.under_review || 0),
        },
        roleCounts,
        researchStatusCounts,
        manuscriptStatusCounts,
        paymentStatusCounts,
        defenseStatusCounts,
        approvalStatusCounts,
        departmentAnalytics: Array.from(departmentRows.values()).sort((a, b) => b.totalResearch - a.totalResearch),
        recentResearch: (research || []).slice().sort((a: any, b: any) => +new Date(b.created_at) - +new Date(a.created_at)).slice(0, 6),
        pendingPaymentsList: (payments || []).filter((item: any) => ["pending", "submitted"].includes(item.status)).slice(0, 6),
        pendingApprovalsList: (finalApprovals || []).filter((item: any) => item.status === "pending").slice(0, 6),
        upcomingDefenses,
        recentLogs: logs || [],
        recentAnnouncements: (announcements || []).slice(0, 5),
        chartData: (research || []).map((item: any) => ({ status: item.status, created_at: item.created_at })),
      };
    },
    enabled: !!user,
    staleTime: 1000 * 30,
    refetchOnWindowFocus: true,
    retry: user?.isBypass ? false : 1,
  });
}

// ==================== ARCHIVE (completed/archived research) ====================
export function useArchivedResearch() {
  return useQuery({
    queryKey: ["archived-research"],
    queryFn: async () => {
      const { data, error } = await crad.from("research")
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
      const { data, error } = await crad.from("research")
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
      const { data, error } = await crad.from("profiles")
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
      const { error } = await crad.from("profiles")
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
      const { data: profile } = await crad.from("profiles")
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
      const { error: updateErr } = await crad.from("profiles")
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

// ==================== DEFENSE GRADES ====================
export function useDefenseGrades(researchId?: string, defenseId?: string) {
  return useQuery({
    queryKey: ["defense-grades", researchId, defenseId],
    queryFn: async () => {
      let query = crad.from("defense_grades")
        .select("*, profiles!panelist_id(full_name)");
      
      if (researchId) query = query.eq("research_id", researchId);
      if (defenseId) query = query.eq("defense_id", defenseId);
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!researchId || !!defenseId,
    staleTime: 1000 * 10,  // Consider stale after 10 seconds
    refetchInterval: 1000 * 5,  // Refetch every 5 seconds automatically
    refetchOnWindowFocus: true,  // Refetch when user focuses back on window
  });
}

export function useSubmitDefenseGrade() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ defenseId, researchId, grade, remarks }: {
      defenseId: string; researchId: string; grade: number; remarks?: string;
    }) => {
      const { data, error } = await crad.from("defense_grades")
        .insert({
          defense_id: defenseId,
          research_id: researchId,
          panelist_id: user!.id,
          grade,
          remarks: remarks || null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["defense-grades"] });
      qc.invalidateQueries({ queryKey: ["defense-schedules"] });
    },
  });
}

export function useUpdateDefenseGrade() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ gradeId, grade, remarks }: {
      gradeId: string; grade: number; remarks?: string;
    }) => {
      const { error } = await crad.from("defense_grades")
        .update({
          grade,
          remarks: remarks || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", gradeId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["defense-grades"] });
    },
  });
}

// ==================== FINAL APPROVALS ====================
export function usePendingFinalApprovals() {
  return useQuery({
    queryKey: ["pending-final-approvals"],
    queryFn: async () => {
      const { data, error } = await crad.from("final_approvals")
        .select("*, research(id, title, research_code, submitted_by, defense_schedules(id, status, defense_date, updated_at), research_members(member_name, is_leader), profiles!submitted_by(full_name))")
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      if (error) throw error;

      const approvals = data || [];
      const researchIds = approvals.map((a: any) => a.research_id).filter(Boolean);
      if (researchIds.length === 0) return approvals;

      const { data: grades, error: gradesError } = await crad.from("defense_grades")
        .select("*, profiles!panelist_id(full_name)")
        .in("research_id", researchIds);
      if (gradesError) throw gradesError;

      const gradesByResearchId = new Map<string, any[]>();
      (grades || []).forEach((g: any) => {
        const list = gradesByResearchId.get(g.research_id) || [];
        list.push(g);
        gradesByResearchId.set(g.research_id, list);
      });

      return approvals.map((approval: any) => ({
        ...approval,
        defense_grades: gradesByResearchId.get(approval.research_id) || [],
      }));
    },
    staleTime: 1000 * 30,  // Refetch every 30 seconds
    refetchOnWindowFocus: true,  // Refetch when user focuses back on window
  });
}

export function useFinalApprovalsWithGrades() {
  return useQuery({
    queryKey: ["final-approvals-with-grades"],
    queryFn: async () => {
      const { data, error } = await crad.from("final_approvals")
        .select("*, research(id, title, research_code, submitted_by, defense_schedules!inner(id), research_members(member_name, is_leader), profiles!submitted_by(full_name))")
        .neq("status", "pending")
        .order("updated_at", { ascending: false });
      if (error) throw error;

      // Fetch defense grades for each
      const enriched = await Promise.all(
        (data || []).map(async (approval: any) => {
          const { data: grades, error: gradesError } = await crad.from("defense_grades")
            .select("*, profiles!panelist_id(full_name)")
            .eq("research_id", approval.research_id);
          if (gradesError) {
            console.error("Error fetching grades:", gradesError);
            return { ...approval, defense_grades: [] };
          }
          return { ...approval, defense_grades: grades || [] };
        })
      );

      return enriched;
    },
    staleTime: 1000 * 60 * 2,
  });
}

export function useResearchFinalApproval(researchId?: string) {
  return useQuery({
    queryKey: ["research-final-approval", researchId],
    queryFn: async () => {
      const { data, error } = await crad.from("final_approvals")
        .select("*, approved_by_profile:profiles!approved_by(full_name)")
        .eq("research_id", researchId!)
        .single();
      if (error && error.code !== "PGRST116") throw error; // PGRST116 = no rows
      return data;
    },
    enabled: !!researchId,
    staleTime: 1000 * 60 * 2,
  });
}

export function useUpdateFinalApproval() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ researchId, status, remarks }: {
      researchId: string; status: "approved" | "rejected" | "revision_requested"; remarks?: string;
    }) => {
      const { error } = await crad.from("final_approvals")
        .update({
          status,
          remarks: remarks || null,
          approved_by: user!.id,
          updated_at: new Date().toISOString(),
        })
        .eq("research_id", researchId);
      if (error) throw error;

      // Fetch submitter info for notification
      const { data: research } = await crad.from("research")
        .select("submitted_by, title")
        .eq("id", researchId)
        .single();

      // Send notification
      supabase.functions.invoke("notify", {
        body: {
          action: "research_final_approval_completed",
          data: {
            user_id: research?.submitted_by,
            research_id: researchId,
            status,
            title: research?.title,
            actor_id: user!.id,
          },
        },
      }).catch(() => {});

      return true;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pending-final-approvals"] });
      qc.invalidateQueries({ queryKey: ["final-approvals-with-grades"] });
      qc.invalidateQueries({ queryKey: ["research-final-approval"] });
      qc.invalidateQueries({ queryKey: ["all-research"] });
      qc.invalidateQueries({ queryKey: ["archived-research"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });
}
