import React, { useState, useRef } from "react";
import { Upload, FileText, CheckCircle2 } from "lucide-react";
import { useSnackbar } from "@/shared/components/SnackbarProvider";
import { useMyResearch, useUploadManuscript } from "@/shared/hooks/useSupabaseData";

export const UploadManuscriptPage: React.FC = () => {
  const { show } = useSnackbar();
  const { data: research } = useMyResearch();
  const uploadMutation = useUploadManuscript();
  const [researchId, setResearchId] = useState("");
  const [versionNotes, setVersionNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => { setFile(f); show(`Selected: ${f.name}`, "info"); };
  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); };

  const handleSubmit = async () => {
    if (!researchId) { show("Please select a research", "error"); return; }
    if (!file) { show("Please select a file", "error"); return; }
    try {
      await uploadMutation.mutateAsync({ researchId, file, versionNotes });
      show("Manuscript uploaded successfully!", "success");
      setFile(null); setVersionNotes(""); setResearchId("");
    } catch (err: any) { show(err.message || "Upload failed", "error"); }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2"><Upload size={20} className="text-primary" /> Upload Manuscript</h1>
        <p className="text-sm text-muted-foreground mt-1">Upload your research manuscript for review</p>
      </div>
      <div className="bg-card border border-border rounded-xl p-5 space-y-5">
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Research</label>
          <select value={researchId} onChange={(e) => setResearchId(e.target.value)} className="w-full h-11 px-3 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-colors">
            <option value="">Select your research</option>
            {research?.map((r: any) => <option key={r.id} value={r.id}>{r.research_code} - {r.title}</option>)}
          </select>
        </div>
        <input ref={fileRef} type="file" accept=".pdf,.docx,.doc" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
        <div onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors cursor-pointer ${dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}>
          {file ? (
            <div className="flex items-center justify-center gap-2">
              <FileText size={20} className="text-primary" />
              <span className="text-sm font-medium text-foreground">{file.name}</span>
              <span className="text-xs text-muted-foreground">({(file.size / 1024 / 1024).toFixed(1)} MB)</span>
            </div>
          ) : (
            <>
              <Upload size={32} className="mx-auto text-muted-foreground mb-3" />
              <p className="text-sm font-medium text-foreground">Drag & drop your manuscript here</p>
              <p className="text-xs text-muted-foreground mt-1">PDF, DOCX up to 50MB</p>
            </>
          )}
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Version Notes</label>
          <textarea value={versionNotes} onChange={(e) => setVersionNotes(e.target.value)} placeholder="Describe what changed..." rows={3} className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-colors resize-none" />
        </div>
        <button onClick={handleSubmit} disabled={uploadMutation.isPending} className="w-full h-11 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2">
          {uploadMutation.isPending ? <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> : <><CheckCircle2 size={16} /> Submit Manuscript</>}
        </button>
      </div>
    </div>
  );
};
