import React, { useEffect, useMemo, useState } from "react";
import { AlertCircle, Calendar, CheckCircle2, Clock, Eye, MapPin, Pencil, Users } from "lucide-react";
import { format } from "date-fns";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { useDefenseGrades, useDefenseSchedules, useSubmitDefenseGrade, useUpdateDefenseGrade, useUpdateDefenseSchedule } from "@/shared/hooks/useSupabaseData";
import { useAuth } from "@/shared/hooks/useAuth";
import { useSnackbar } from "@/shared/components/SnackbarProvider";
import { DataTableToolbar } from "@/shared/components/DataTableToolbar";
import { EmptyTableState } from "@/shared/components/EmptyTableState";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

function getSectionLabel(schedule: any) {
  return schedule.research?.departments?.code || "N/A";
}

function getGroupNumber(schedule: any) {
  const code = schedule.research?.research_code || "";
  const match = code.match(/(\d+)$/);
  return match ? match[1] : "N/A";
}

export const DefenseSchedulePage: React.FC = () => {
  const { data: schedules, isLoading, isError, error } = useDefenseSchedules();
  const updateDefenseSchedule = useUpdateDefenseSchedule();
  const { show } = useSnackbar();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [membersModalSchedule, setMembersModalSchedule] = useState<any | null>(null);
  const [editingSchedule, setEditingSchedule] = useState<any | null>(null);
  const [localSchedules, setLocalSchedules] = useState<any[]>([]);
  const [editForm, setEditForm] = useState({
    defense_date: "",
    defense_time: "",
    room: "",
    status: "scheduled",
  });

  useEffect(() => {
    setLocalSchedules(schedules || []);
  }, [schedules]);

  useEffect(() => {
    if (!editingSchedule) return;
    setEditForm({
      defense_date: String(editingSchedule.defense_date).slice(0, 10),
      defense_time: editingSchedule.defense_time || "",
      room: editingSchedule.room || "",
      status: editingSchedule.status || "scheduled",
    });
  }, [editingSchedule]);

  const filteredSchedules = useMemo(
    () =>
      (localSchedules || []).filter((schedule: any) => {
        const searchTarget = `${schedule.research?.title || ""} ${schedule.research?.research_code || ""} ${schedule.room || ""} ${getSectionLabel(schedule)} ${getGroupNumber(schedule)}`.toLowerCase();
        const matchesSearch = searchTarget.includes(search.toLowerCase());
        const matchesStatus = !statusFilter || schedule.status === statusFilter;
        return matchesSearch && matchesStatus;
      }),
    [localSchedules, search, statusFilter]
  );

  const stats = [
    { label: "Total", value: localSchedules?.length || 0 },
    { label: "Scheduled", value: (localSchedules || []).filter((schedule: any) => schedule.status === "scheduled").length },
    { label: "Completed", value: (localSchedules || []).filter((schedule: any) => schedule.status === "completed").length },
  ];

  async function handleSaveEdit() {
    if (!editingSchedule) return;

    try {
      await updateDefenseSchedule.mutateAsync({
        defenseId: editingSchedule.id,
        defense_date: editForm.defense_date,
        defense_time: editForm.defense_time,
        room: editForm.room,
        status: editForm.status,
      });

      setLocalSchedules((current) =>
        current.map((item) =>
          item.id === editingSchedule.id
            ? {
                ...item,
                defense_date: editForm.defense_date,
                defense_time: editForm.defense_time,
                room: editForm.room,
                status: editForm.status,
              }
            : item
        )
      );

      show("Defense schedule updated.", "success");
      setEditingSchedule(null);
    } catch (err: any) {
      show(err?.message || "Failed to update defense schedule.", "error");
    }
  }

  if (isLoading) return <div className="space-y-4">{[1, 2].map((i) => <div key={i} className="h-28 skeleton-shimmer rounded-xl" />)}</div>;

  if (isError) {
    return (
      <div className="rounded-xl border border-destructive/20 bg-card p-6">
        <p className="text-sm font-semibold text-foreground">Defense schedule unavailable</p>
        <p className="mt-1 text-xs text-muted-foreground">{error instanceof Error ? error.message : "Failed to load defense schedules."}</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-5 animate-fade-in">
        <DataTableToolbar
          title="Defense Schedule"
          description="View schedules and submit grades for completed defenses"
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by title, code, room, section, or group..."
          filters={[
            {
              key: "status",
              label: "Status",
              value: statusFilter,
              onChange: setStatusFilter,
              options: [
                { label: "All", value: "" },
                { label: "Scheduled", value: "scheduled" },
                { label: "Completed", value: "completed" },
                { label: "Cancelled", value: "cancelled" },
                { label: "Postponed", value: "postponed" },
              ],
            },
          ]}
          stats={stats.map((item) => (
            <div key={item.label} className="rounded-lg border border-border bg-card px-3 py-2">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{item.label}</p>
              <p className="text-lg font-bold text-foreground">{item.value}</p>
            </div>
          ))}
        />

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Research</th>
                  <th className="px-4 py-3 text-left font-semibold">Section</th>
                  <th className="px-4 py-3 text-left font-semibold">Group No.</th>
                  <th className="px-4 py-3 text-left font-semibold">Date</th>
                  <th className="px-4 py-3 text-left font-semibold">Time</th>
                  <th className="px-4 py-3 text-left font-semibold">Room</th>
                  <th className="px-4 py-3 text-left font-semibold">Panel</th>
                  <th className="px-4 py-3 text-left font-semibold">Group Members</th>
                  <th className="px-4 py-3 text-left font-semibold">Status</th>
                  <th className="px-4 py-3 text-left font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {!filteredSchedules.length ? (
                  <EmptyTableState colSpan={10} title="No defense schedules found" description="Scheduled defenses will appear here once records are available." />
                ) : (
                  filteredSchedules.map((schedule: any) => (
                    <React.Fragment key={schedule.id}>
                      <tr className="border-t border-border/60">
                        <td className="px-4 py-3">
                          <p className="font-medium text-foreground">{schedule.research?.title}</p>
                          <p className="text-xs text-muted-foreground font-mono">{schedule.research?.research_code}</p>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{getSectionLabel(schedule)}</td>
                        <td className="px-4 py-3 text-muted-foreground">{getGroupNumber(schedule)}</td>
                        <td className="px-4 py-3 text-muted-foreground">{format(new Date(schedule.defense_date), "MMM d, yyyy")}</td>
                        <td className="px-4 py-3 text-muted-foreground">{schedule.defense_time}</td>
                        <td className="px-4 py-3 text-muted-foreground">{schedule.room}</td>
                        <td className="px-4 py-3 text-muted-foreground">{schedule.defense_panel_members?.length || 0} panelists</td>
                        <td className="px-4 py-3">
                          <Button variant="outline" size="sm" onClick={() => setMembersModalSchedule(schedule)}>
                            <Users className="h-4 w-4" />
                            View Members
                          </Button>
                        </td>
                        <td className="px-4 py-3"><StatusBadge variant={schedule.status === "scheduled" ? "active" : schedule.status}>{schedule.status}</StatusBadge></td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => setExpandedId(expandedId === schedule.id ? null : schedule.id)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                            >
                              <Eye size={13} />
                              {expandedId === schedule.id ? "Hide" : "View"}
                            </button>
                            <button
                              onClick={() => setEditingSchedule(schedule)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                            >
                              <Pencil size={13} />
                              Edit
                            </button>
                          </div>
                        </td>
                      </tr>
                      {expandedId === schedule.id && (
                        <tr className="border-t border-border/40 bg-muted/20">
                          <td colSpan={10} className="px-4 py-4">
                            <DefenseScheduleDetails schedule={schedule} currentUserId={user?.id} />
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Dialog open={!!membersModalSchedule} onOpenChange={(open) => !open && setMembersModalSchedule(null)}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Group Members</DialogTitle>
            <DialogDescription>
              {membersModalSchedule?.research?.title || "Research group"} • Group {membersModalSchedule ? getGroupNumber(membersModalSchedule) : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {membersModalSchedule?.research?.research_members?.length ? (
              membersModalSchedule.research.research_members.map((member: any, index: number) => (
                <div key={`${member.member_name}-${index}`} className="rounded-xl border border-border bg-muted/20 px-4 py-3">
                  <p className="font-medium text-foreground">{member.member_name}</p>
                  <p className="text-xs text-muted-foreground">{member.is_leader ? "Group leader" : "Member"}</p>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-border bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
                No group members were recorded for this schedule.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingSchedule} onOpenChange={(open) => !open && setEditingSchedule(null)}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit Defense Schedule</DialogTitle>
            <DialogDescription>
              Update the schedule details for {editingSchedule?.research?.research_code || "this defense"}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">Section</label>
              <input value={editingSchedule ? getSectionLabel(editingSchedule) : ""} disabled className="h-10 rounded-lg border border-input bg-muted px-3 text-sm text-muted-foreground" />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">Group No.</label>
              <input value={editingSchedule ? getGroupNumber(editingSchedule) : ""} disabled className="h-10 rounded-lg border border-input bg-muted px-3 text-sm text-muted-foreground" />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <label className="text-sm font-medium text-foreground">Defense Date</label>
                <input type="date" value={editForm.defense_date} onChange={(event) => setEditForm({ ...editForm, defense_date: event.target.value })} className="h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground" />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium text-foreground">Time</label>
                <input type="time" value={editForm.defense_time} onChange={(event) => setEditForm({ ...editForm, defense_time: event.target.value })} className="h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground" />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <label className="text-sm font-medium text-foreground">Room</label>
                <input value={editForm.room} onChange={(event) => setEditForm({ ...editForm, room: event.target.value })} className="h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground" />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium text-foreground">Status</label>
                <select value={editForm.status} onChange={(event) => setEditForm({ ...editForm, status: event.target.value })} className="h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground">
                  <option value="scheduled">Scheduled</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="postponed">Postponed</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingSchedule(null)}>Cancel</Button>
              <Button onClick={handleSaveEdit} disabled={updateDefenseSchedule.isPending}>
                {updateDefenseSchedule.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

const DefenseScheduleDetails: React.FC<{ schedule: any; currentUserId?: string }> = ({ schedule, currentUserId }) => {
  const { show } = useSnackbar();
  const { user } = useAuth();
  const { data: grades, isLoading: gradesLoading } = useDefenseGrades(schedule.research?.id, schedule.id);
  const submitGrade = useSubmitDefenseGrade();
  const updateGrade = useUpdateDefenseGrade();
  const [formData, setFormData] = useState({ grade: 70, remarks: "" });

  const isPanelist = schedule.defense_panel_members?.some((panelist: any) => panelist.panelist_id === currentUserId);
  const isAdviser = user?.role === "adviser";
  const userGrade = grades?.find((grade: any) => grade.panelist_id === currentUserId);
  const isCompleted = schedule.status === "completed";
  const canSubmitGrade = (isPanelist || isAdviser) && isCompleted;

  const handleSubmitGrade = async () => {
    if (!formData.grade || formData.grade < 0 || formData.grade > 100) {
      show("Grade must be between 0 and 100", "error");
      return;
    }

    try {
      if (userGrade?.id) {
        await updateGrade.mutateAsync({ gradeId: userGrade.id, grade: Number(formData.grade), remarks: formData.remarks });
        show("Grade updated!", "success");
      } else {
        await submitGrade.mutateAsync({
          defenseId: schedule.id,
          researchId: schedule.research?.id,
          grade: Number(formData.grade),
          remarks: formData.remarks,
        });
        show("Grade submitted!", "success");
      }
      setFormData({ grade: 70, remarks: "" });
    } catch (error: any) {
      show(error.message || "Failed to submit grade", "error");
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-4">
        <DetailStat icon={<Calendar size={13} />} label="Defense Date" value={format(new Date(schedule.defense_date), "MMM d, yyyy")} />
        <DetailStat icon={<Clock size={13} />} label="Time" value={schedule.defense_time} />
        <DetailStat icon={<MapPin size={13} />} label="Room" value={schedule.room} />
        <DetailStat icon={<CheckCircle2 size={13} />} label="Panel Count" value={`${schedule.defense_panel_members?.length || 0}`} />
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Assigned Panel</p>
        <div className="flex flex-wrap gap-2">
          {schedule.defense_panel_members?.map((panelist: any) => (
            <span key={panelist.panelist_id} className="rounded-full border border-border bg-background px-3 py-1 text-xs text-foreground">
              {panelist.profiles?.full_name} {panelist.role ? `• ${panelist.role}` : ""}
            </span>
          ))}
        </div>
      </div>

      {!gradesLoading && grades && grades.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Submitted Grades</p>
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {grades.map((grade: any) => (
              <div key={grade.id} className="rounded-xl border border-border bg-background p-3">
                <p className="text-xs text-muted-foreground">
                  {grade.profiles?.full_name} {grade.panelist_id === currentUserId ? <span className="text-primary font-semibold">(You)</span> : null}
                </p>
                <p className="mt-1 text-lg font-bold text-foreground">{Number(grade.grade).toFixed(1)} / 100</p>
                {grade.remarks && <p className="mt-1 text-xs text-muted-foreground italic">{grade.remarks}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {isCompleted && (isPanelist || isAdviser) && !userGrade && (
        <div className="flex items-center gap-2 rounded-xl border border-warning/20 bg-warning/10 px-3 py-2 text-xs text-warning">
          <AlertCircle size={14} />
          You need to submit a grade for this completed defense.
        </div>
      )}

      {canSubmitGrade && (
        <div className="rounded-xl border border-primary/20 bg-background p-4 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{userGrade ? "Update your grade" : "Submit your grade"}</p>
          <div className="grid gap-3 md:grid-cols-[1fr_100px]">
            <input
              type="range"
              min="0"
              max="100"
              step="0.5"
              value={formData.grade}
              onChange={(event) => setFormData({ ...formData, grade: Number(event.target.value) })}
              className="w-full"
            />
            <input
              type="number"
              min="0"
              max="100"
              step="0.5"
              value={formData.grade}
              onChange={(event) => setFormData({ ...formData, grade: Number(event.target.value) })}
              className="h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground"
            />
          </div>
          <textarea
            value={formData.remarks}
            onChange={(event) => setFormData({ ...formData, remarks: event.target.value })}
            placeholder="Add any remarks about the defense..."
            className="h-20 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
          />
          <button
            onClick={handleSubmitGrade}
            disabled={submitGrade.isPending || updateGrade.isPending}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            <CheckCircle2 size={14} />
            {userGrade ? "Update Grade" : "Submit Grade"}
          </button>
        </div>
      )}
    </div>
  );
};

const DetailStat = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="rounded-xl border border-border bg-background px-3 py-3">
    <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
      {icon} {label}
    </p>
    <p className="mt-2 text-sm font-semibold text-foreground">{value}</p>
  </div>
);
