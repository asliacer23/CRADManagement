import React, { useState, useRef } from "react";
import { Upload, FileText, CheckCircle2, Download, Eye, Clock, ThumbsUp, ThumbsDown } from "lucide-react";
import { useSnackbar } from "@/shared/components/SnackbarProvider";
import { useMyResearch, useUploadManuscript, useManuscriptHistory } from "@/shared/hooks/useSupabaseData";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const UploadManuscriptPage: React.FC = () => {
  const { show } = useSnackbar();
  const { data: research } = useMyResearch();
  const uploadMutation = useUploadManuscript();
  const [researchId, setResearchId] = useState("");
  const [versionNotes, setVersionNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [expandedVersion, setExpandedVersion] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: manuscriptHistory, isLoading: historyLoading } = useManuscriptHistory(researchId);

  const handleFile = (f: File) => { 
    setFile(f); 
    show(`Selected: ${f.name}`, "info"); 
  };
  
  const handleDrop = (e: React.DragEvent) => { 
    e.preventDefault(); 
    setDragOver(false); 
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); 
  };

  const handleSubmit = async () => {
    if (!researchId) { show("Please select a research", "error"); return; }
    if (!file) { show("Please select a file", "error"); return; }
    try {
      await uploadMutation.mutateAsync({ researchId, file, versionNotes });
      show("Manuscript uploaded successfully!", "success");
      setFile(null); 
      setVersionNotes(""); 
    } catch (err: any) { show(err.message || "Upload failed", "error"); }
  };

  const handleDownloadFile = async (fileUrl: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage.from("manuscripts").download(fileUrl);
      if (error) throw error;
      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
      show("File downloaded successfully", "success");
    } catch (err: any) {
      show("Download failed: " + err.message, "error");
    }
  };

  const selectedResearch = research?.find((r: any) => r.id === researchId);
  const latestVersion = manuscriptHistory?.[manuscriptHistory.length - 1];
  const totalVersions = manuscriptHistory?.length || 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Upload size={24} className="text-primary" /> Upload Manuscript
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Upload and manage your research manuscript versions</p>
      </div>

      <Tabs defaultValue="upload" className="space-y-4">
        <TabsList className="w-full">
          <TabsTrigger value="upload">Upload New Version</TabsTrigger>
          <TabsTrigger value="history" className="relative">
            Version History
            {totalVersions > 0 && (
              <span className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                {totalVersions}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Upload Section */}
        <TabsContent value="upload">
          <div className="bg-card border border-border rounded-xl p-6 space-y-5">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Select Research *</label>
              <select 
                value={researchId} 
                onChange={(e) => {
                  setResearchId(e.target.value);
                  setExpandedVersion(null);
                }} 
                className="w-full h-11 px-3 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-colors"
              >
                <option value="">Select your research</option>
                {research?.map((r: any) => (
                  <option key={r.id} value={r.id}>
                    {r.research_code} - {r.title}
                  </option>
                ))}
              </select>
              {selectedResearch && (
                <div className="mt-2 p-2 rounded bg-muted/50 text-xs text-muted-foreground">
                  <p><strong>Status:</strong> <StatusBadge variant={selectedResearch.status}>{selectedResearch.status}</StatusBadge></p>
                </div>
              )}
            </div>

            <div>
              <input 
                ref={fileRef} 
                type="file" 
                accept=".pdf,.docx,.doc" 
                className="hidden" 
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} 
              />
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Manuscript File *</label>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors cursor-pointer ${
                  dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                }`}
              >
                {file ? (
                  <div className="flex items-center justify-center gap-2">
                    <FileText size={24} className="text-primary" />
                    <div className="text-left">
                      <p className="text-sm font-medium text-foreground">{file.name}</p>
                      <p className="text-xs text-muted-foreground">({(file.size / 1024 / 1024).toFixed(1)} MB)</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <Upload size={32} className="mx-auto text-muted-foreground mb-3" />
                    <p className="text-sm font-medium text-foreground">Drag & drop your manuscript here</p>
                    <p className="text-xs text-muted-foreground mt-1">Or click to browse (PDF, DOCX up to 50MB)</p>
                  </>
                )}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Version Notes</label>
              <textarea 
                value={versionNotes} 
                onChange={(e) => setVersionNotes(e.target.value)} 
                placeholder="Describe what changed in this version..." 
                rows={3} 
                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-colors resize-none" 
              />
            </div>

            <button 
              onClick={handleSubmit} 
              disabled={uploadMutation.isPending || !researchId || !file}
              className="w-full h-11 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {uploadMutation.isPending ? (
                <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 size={16} /> Submit Manuscript
                </>
              )}
            </button>
          </div>
        </TabsContent>

        {/* History Section */}
        <TabsContent value="history">
          {!researchId ? (
            <div className="bg-card border border-border rounded-xl p-12 text-center">
              <FileText size={40} className="mx-auto text-muted-foreground mb-3" />
              <p className="text-sm font-medium text-foreground">Select a research to view history</p>
            </div>
          ) : historyLoading ? (
            <div className="bg-card border border-border rounded-xl p-8">
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 bg-muted/50 rounded-lg animate-pulse" />
                ))}
              </div>
            </div>
          ) : !manuscriptHistory?.length ? (
            <div className="bg-card border border-border rounded-xl p-12 text-center">
              <FileText size={40} className="mx-auto text-muted-foreground mb-3" />
              <p className="text-sm font-medium text-foreground">No manuscript versions yet</p>
              <p className="text-xs text-muted-foreground mt-1">Upload your first version to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {manuscriptHistory.map((m: any, index: number) => {
                const isExpanded = expandedVersion === m.id;
                const isLatest = index === manuscriptHistory.length - 1;
                
                return (
                  <div key={m.id} className="bg-card border border-border rounded-lg p-4 space-y-3">
                    <div 
                      onClick={() => setExpandedVersion(isExpanded ? null : m.id)}
                      className="cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className="text-xs font-mono font-bold text-muted-foreground">Version {m.version_number}</span>
                            <StatusBadge variant={m.status}>{m.status}</StatusBadge>
                            {isLatest && <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">Latest</span>}
                          </div>
                          <p className="text-sm font-medium text-foreground">{m.file_name}</p>
                          <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                            <p className="flex items-center gap-2">
                              <Clock size={12} /> 
                              {format(new Date(m.created_at), "MMM d, yyyy h:mm a")}
                            </p>
                            {m.uploaded_by_profile?.full_name && (
                              <p className="flex items-center gap-2">
                                <FileText size={12} /> 
                                Uploaded by: {m.uploaded_by_profile.full_name}
                              </p>
                            )}
                          </div>
                        </div>
                        <Eye size={14} className="text-muted-foreground flex-shrink-0" />
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-border pt-3 space-y-3 animate-fade-in">
                        {m.version_notes && (
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Version Notes</p>
                            <p className="text-sm text-foreground bg-muted/30 p-2 rounded">{m.version_notes}</p>
                          </div>
                        )}

                        {m.reviewed_at && (
                          <div className="bg-muted/20 rounded-lg p-3 space-y-1">
                            <div className="flex items-center gap-2">
                              {m.status === "approved" ? (
                                <ThumbsUp size={14} className="text-green-500" />
                              ) : m.status === "revision_needed" ? (
                                <ThumbsDown size={14} className="text-yellow-500" />
                              ) : (
                                <Clock size={14} className="text-muted-foreground" />
                              )}
                              <p className="text-xs font-semibold text-muted-foreground">
                                {m.status === "approved" ? "Approved" : m.status === "revision_needed" ? "Revision Needed" : "Reviewed"} by {m.reviewed_by_profile?.full_name || "Staff"}
                              </p>
                            </div>
                            <p className="text-xs text-muted-foreground ml-5">
                              {format(new Date(m.reviewed_at), "MMM d, yyyy h:mm a")}
                            </p>
                          </div>
                        )}

                        <button
                          onClick={() => handleDownloadFile(m.file_url, m.file_name)}
                          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-border text-xs text-muted-foreground hover:bg-muted transition-colors"
                        >
                          <Download size={13} /> Download File
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
