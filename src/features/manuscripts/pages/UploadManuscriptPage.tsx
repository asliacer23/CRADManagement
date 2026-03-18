import React from "react";
import { Upload, FileText, CheckCircle2 } from "lucide-react";
import { useSnackbar } from "@/shared/components/SnackbarProvider";

export const UploadManuscriptPage: React.FC = () => {
  const { show } = useSnackbar();
  const [dragOver, setDragOver] = React.useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    show("Manuscript uploaded successfully!", "success");
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Upload size={20} className="text-primary" /> Upload Manuscript
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Upload your research manuscript for review</p>
      </div>

      <div className="bg-card border border-border rounded-xl p-5 space-y-5">
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Research ID</label>
          <select className="w-full h-11 px-3 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-colors">
            <option value="">Select your research</option>
            <option value="R-2024-001">R-2024-001 - IoT-Based Smart Classroom</option>
            <option value="R-2024-002">R-2024-002 - AI-Powered Performance Predictor</option>
          </select>
        </div>

        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors cursor-pointer ${
            dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
          }`}
          onClick={() => show("File browser opened (demo)", "info")}
        >
          <Upload size={32} className="mx-auto text-muted-foreground mb-3" />
          <p className="text-sm font-medium text-foreground">Drag & drop your manuscript here</p>
          <p className="text-xs text-muted-foreground mt-1">PDF, DOCX up to 50MB</p>
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Version Notes</label>
          <textarea
            placeholder="Describe what changed in this version..."
            rows={3}
            className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-colors resize-none"
          />
        </div>

        <button
          onClick={() => show("Manuscript submitted for review!", "success")}
          className="w-full h-11 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
        >
          <CheckCircle2 size={16} /> Submit Manuscript
        </button>
      </div>
    </div>
  );
};
