import React, { useState, useMemo } from "react";
import { Users, UserPlus, Search, CheckCircle2, AlertCircle, BarChart3, BookOpen, TrendingUp, X } from "lucide-react";
import { useSnackbar } from "@/shared/components/SnackbarProvider";
import { useUnassignedResearch, useAdvisers, useAssignMultipleAdvisers, useRemoveAdviserAssignment, useAdviserWorkload, useAllResearch } from "@/shared/hooks/useSupabaseData";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";

export const AssignAdviserPage: React.FC = () => {
  const { show } = useSnackbar();
  const { data: research, isLoading } = useUnassignedResearch();
  const { data: allResearch } = useAllResearch();
  const { data: advisers } = useAdvisers();
  const { data: adviserWorkload, isLoading: workloadLoading } = useAdviserWorkload();
  const assignMutation = useAssignMultipleAdvisers();
  const removeMutation = useRemoveAdviserAssignment();
  const [selected, setSelected] = useState<Record<string, Set<string>>>({});
  const [search, setSearch] = useState("");
  const [expandedResearch, setExpandedResearch] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"research" | "advisers">("research");

  const filtered = useMemo(() => 
    research?.filter((r: any) =>
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.research_code.toLowerCase().includes(search.toLowerCase()) ||
      r.profiles?.full_name.toLowerCase().includes(search.toLowerCase())
    ) || [],
    [research, search]
  );

  const toggleAdviserSelection = (researchId: string, adviserId: string) => {
    const current = selected[researchId] || new Set<string>();
    const updated = new Set(current);
    if (updated.has(adviserId)) {
      updated.delete(adviserId);
    } else {
      updated.add(adviserId);
    }
    setSelected({ ...selected, [researchId]: updated });
  };

  const handleAssign = async (r: any) => {
    const adviserIds = Array.from(selected[r.id] || new Set<string>());
    if (adviserIds.length === 0) { show("Select at least one adviser", "error"); return; }
    try {
      await assignMutation.mutateAsync({ researchId: r.id, adviserIds, title: r.title });
      show(`${adviserIds.length} adviser(s) assigned successfully!`, "success");
      setSelected({ ...selected, [r.id]: new Set() });
      setExpandedResearch(null);
    } catch (err: any) { show(err.message, "error"); }
  };

  const handleRemoveAdviser = async (researchId: string, adviserId: string) => {
    try {
      await removeMutation.mutateAsync({ researchId, adviserId });
      show("Adviser removed successfully!", "success");
    } catch (err: any) { show(err.message, "error"); }
  };

  const totalStats = {
    unassigned: research?.length || 0,
    advisers: advisers?.length || 0,
    avgWorkload: adviserWorkload?.length ? Math.round(adviserWorkload.reduce((sum, a) => sum + a.assignedCount, 0) / adviserWorkload.length) : 0,
  };

  const ResearchCard = ({ r }: { r: any }) => {
    const isExpanded = expandedResearch === r.id;
    const selectedAdviserIds = selected[r.id] || new Set<string>();
    const currentlyAssigned = r.adviser_assignments || [];

    return (
      <div 
        key={r.id}
        className="bg-card border border-border rounded-lg p-4 space-y-3 hover:border-border/50 transition-colors"
      >
        <div 
          onClick={() => setExpandedResearch(isExpanded ? null : r.id)}
          className="cursor-pointer"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-mono font-bold text-muted-foreground">{r.research_code}</span>
                <AlertCircle size={14} className="text-orange-500" />
              </div>
              <h3 className="text-sm font-semibold text-foreground line-clamp-2">{r.title}</h3>
              <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                <p className="flex items-center gap-2"><Users size={12} /> {r.profiles?.full_name || "Unknown"}</p>
                {r.departments?.name && <p>{r.departments.code} - {r.departments.name}</p>}
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-xs font-semibold text-orange-600 bg-orange-500/10 px-2 py-1 rounded">UNASSIGNED</p>
            </div>
          </div>
        </div>

        {isExpanded && (
          <div className="border-t border-border pt-3 space-y-3 animate-fade-in">
            {/* Currently Assigned Advisers */}
            {currentlyAssigned.length > 0 && (
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase mb-2 block">Currently Assigned Advisers</label>
                <div className="flex flex-wrap gap-2">
                  {currentlyAssigned.map((assignment: any) => (
                    <div key={assignment.adviser_id} className="inline-flex items-center gap-1 bg-primary/20 text-primary px-3 py-1 rounded-full text-xs font-medium">
                      {assignment.profiles?.full_name || 'Unknown Adviser'}
                      <button
                        onClick={() => handleRemoveAdviser(r.id, assignment.adviser_id)}
                        disabled={removeMutation.isPending}
                        className="ml-1 hover:text-primary/70 transition-colors"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Adviser Selection Checkboxes */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase mb-2 block">Assign Additional Advisers</label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {adviserWorkload?.map((adviser: any) => {
                  const isAlreadyAssigned = currentlyAssigned.some((a: any) => a.adviser_id === adviser.user_id);
                  const isSelected = selectedAdviserIds.has(adviser.user_id);
                  
                  return (
                    <div key={adviser.user_id} className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id={`adviser-${r.id}-${adviser.user_id}`}
                        checked={isSelected}
                        disabled={isAlreadyAssigned}
                        onChange={() => toggleAdviserSelection(r.id, adviser.user_id)}
                        className="h-4 w-4 rounded border border-input bg-background cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      <label 
                        htmlFor={`adviser-${r.id}-${adviser.user_id}`}
                        className="text-xs text-foreground cursor-pointer flex-1 disabled:opacity-50"
                      >
                        <div className="font-medium">{adviser.full_name}</div>
                        <div className="text-muted-foreground">
                          {adviser.assignedCount} assigned {isAlreadyAssigned ? "(already assigned to this)" : ""}
                        </div>
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>

            {selectedAdviserIds.size > 0 && (
              <div className="rounded-lg bg-primary/10 border border-primary/20 p-3">
                <p className="text-xs font-semibold text-primary mb-1">Selected: {selectedAdviserIds.size} adviser(s)</p>
                <p className="text-xs text-primary/70">These advisers will be notified of the assignment.</p>
              </div>
            )}

            <button 
              onClick={() => handleAssign(r)}
              disabled={assignMutation.isPending || selectedAdviserIds.size === 0}
              className="w-full h-10 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {assignMutation.isPending ? (
                <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 size={14} /> Confirm Assignments
                </>
              )}
            </button>
          </div>
        )}
      </div>
    );
  };

  const AdviserCard = ({ adviser }: { adviser: any }) => (
    <div className="bg-card border border-border rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-foreground">{adviser.full_name}</h3>
          {adviser.department && <p className="text-xs text-muted-foreground">{adviser.department}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-primary/10 p-3">
          <p className="text-xs text-muted-foreground mb-1">Assigned Research</p>
          <p className="text-2xl font-bold text-primary">{adviser.assignedCount}</p>
        </div>
        <div className="rounded-lg bg-muted/50 p-3">
          <p className="text-xs text-muted-foreground mb-1">Availability</p>
          <div className="flex items-center gap-1">
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all"
                style={{ width: `${Math.min((adviser.assignedCount / 10) * 100, 100)}%` }}
              />
            </div>
            <p className="text-xs font-semibold text-foreground">{Math.max(0, 10 - adviser.assignedCount)}</p>
          </div>
        </div>
      </div>

      {adviser.assignedResearch?.length > 0 && (
        <div className="border-t border-border pt-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Current Research</p>
          <div className="space-y-1 max-h-24 overflow-y-auto">
            {adviser.assignedResearch.slice(0, 5).map((assignment: any, idx: number) => (
              <div key={idx} className="text-xs text-foreground flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span className="line-clamp-1">{assignment.research?.title}</span>
              </div>
            ))}
            {adviser.assignedResearch.length > 5 && (
              <p className="text-xs text-muted-foreground italic">+{adviser.assignedResearch.length - 5} more...</p>
            )}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Users size={24} className="text-primary" /> Assign Adviser
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Manage adviser assignments for student research projects</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-orange-500/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle size={14} className="text-orange-600" />
            <p className="text-xs text-orange-600 font-semibold uppercase">Unassigned</p>
          </div>
          <p className="text-3xl font-bold text-orange-600">{totalStats.unassigned}</p>
          <p className="text-xs text-muted-foreground mt-1">Pending assignments</p>
        </div>

        <div className="bg-card border border-primary/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <Users size={14} className="text-primary" />
            <p className="text-xs text-primary font-semibold uppercase">Available Advisers</p>
          </div>
          <p className="text-3xl font-bold text-primary">{totalStats.advisers}</p>
          <p className="text-xs text-muted-foreground mt-1">Ready to assign</p>
        </div>

        <div className="bg-card border border-blue-500/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 size={14} className="text-blue-600" />
            <p className="text-xs text-blue-600 font-semibold uppercase">Avg Workload</p>
          </div>
          <p className="text-3xl font-bold text-blue-600">{totalStats.avgWorkload}</p>
          <p className="text-xs text-muted-foreground mt-1">Per adviser</p>
        </div>
      </div>

      <Tabs defaultValue="research" className="space-y-4">
        <TabsList className="w-full">
          <TabsTrigger value="research" className="relative">
            <BookOpen size={14} className="mr-1" />
            Research to Assign
            {totalStats.unassigned > 0 && (
              <span className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-orange-500 text-white text-xs font-bold">
                {totalStats.unassigned}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="advisers">
            <Users size={14} className="mr-1" />
            Adviser Workload
          </TabsTrigger>
        </TabsList>

        {/* Research Assignment Tab */}
        <TabsContent value="research" className="space-y-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-card border border-border rounded-lg animate-pulse" />
              ))}
            </div>
          ) : !research?.length ? (
            <div className="bg-card border border-border rounded-lg p-12 text-center">
              <CheckCircle2 size={40} className="mx-auto text-muted-foreground mb-3" />
              <p className="text-sm font-medium text-foreground">All research has been assigned</p>
              <p className="text-xs text-muted-foreground mt-1">Great job! No pending assignments.</p>
            </div>
          ) : (
            <>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by research code, title, or student name..."
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-colors"
                />
              </div>

              <div className="space-y-3">
                {filtered.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground">No research found matching your search</p>
                  </div>
                ) : (
                  filtered.map((r: any) => <ResearchCard key={r.id} r={r} />)
                )}
              </div>
            </>
          )}
        </TabsContent>

        {/* Adviser Workload Tab */}
        <TabsContent value="advisers">
          {workloadLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 bg-card border border-border rounded-lg animate-pulse" />
              ))}
            </div>
          ) : !adviserWorkload?.length ? (
            <div className="bg-card border border-border rounded-lg p-12 text-center">
              <Users size={40} className="mx-auto text-muted-foreground mb-3" />
              <p className="text-sm font-medium text-foreground">No advisers found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {adviserWorkload.map((adviser: any) => (
                <AdviserCard key={adviser.user_id} adviser={adviser} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
