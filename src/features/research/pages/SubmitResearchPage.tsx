import React, { useState } from "react";
import { useSnackbar } from "@/shared/components/SnackbarProvider";
import { useSubmitResearch, useDepartments, useResearchCategories } from "@/shared/hooks/useSupabaseData";
import { FileText, Upload, X, Plus } from "lucide-react";

export const SubmitResearchPage: React.FC = () => {
  const { show } = useSnackbar();
  const submitMutation = useSubmitResearch();
  const { data: departments } = useDepartments();
  const { data: categories } = useResearchCategories();
  const [title, setTitle] = useState("");
  const [abstract, setAbstract] = useState("");
  const [members, setMembers] = useState<string[]>([""]);
  const [categoryId, setCategoryId] = useState("");
  const [departmentId, setDepartmentId] = useState("");

  const addMember = () => setMembers([...members, ""]);
  const removeMember = (i: number) => setMembers(members.filter((_, idx) => idx !== i));
  const updateMember = (i: number, val: string) => { const u = [...members]; u[i] = val; setMembers(u); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { show("Please enter a research title", "error"); return; }
    try {
      await submitMutation.mutateAsync({ title, abstract, categoryId: categoryId || undefined, departmentId: departmentId || undefined, members });
      show("Research submitted successfully!", "success");
      setTitle(""); setAbstract(""); setMembers([""]); setCategoryId(""); setDepartmentId("");
    } catch (err: any) { show(err.message || "Failed to submit", "error"); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2"><FileText size={20} className="text-primary" /> Submit Research</h1>
        <p className="text-sm text-muted-foreground mt-1">Fill out the form below to submit your research proposal</p>
      </div>
      <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-5 space-y-5">
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Research Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter your research title" className="w-full h-11 px-3 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-colors" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Department</label>
            <select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} className="w-full h-11 px-3 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-colors">
              <option value="">Select department</option>
              {departments?.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Category</label>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full h-11 px-3 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-colors">
              <option value="">Select category</option>
              {categories?.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Abstract</label>
          <textarea value={abstract} onChange={(e) => setAbstract(e.target.value)} placeholder="Write a brief abstract..." rows={5} className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-colors resize-none" />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Group Members</label>
            <button type="button" onClick={addMember} className="text-xs text-primary hover:underline flex items-center gap-1"><Plus size={12} /> Add</button>
          </div>
          <div className="space-y-2">
            {members.map((m, i) => (
              <div key={i} className="flex items-center gap-2">
                <input value={m} onChange={(e) => updateMember(i, e.target.value)} placeholder={`Member ${i + 1}`} className="flex-1 h-10 px-3 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-colors" />
                {members.length > 1 && <button type="button" onClick={() => removeMember(i)} className="p-2 rounded-lg hover:bg-muted"><X size={14} className="text-muted-foreground" /></button>}
              </div>
            ))}
          </div>
        </div>
        <button type="submit" disabled={submitMutation.isPending} className="w-full h-11 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2">
          {submitMutation.isPending ? <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> : <><Upload size={16} /> Submit Research</>}
        </button>
      </form>
    </div>
  );
};
