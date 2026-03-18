import React, { useState, useRef } from "react";
import { CreditCard, Upload, CheckCircle2 } from "lucide-react";
import { useSnackbar } from "@/shared/components/SnackbarProvider";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { useMyResearch, useMyPayments, useSubmitPayment } from "@/shared/hooks/useSupabaseData";
import { format } from "date-fns";

export const PaymentsPage: React.FC = () => {
  const { show } = useSnackbar();
  const { data: research } = useMyResearch();
  const { data: payments, isLoading } = useMyPayments();
  const submitPayment = useSubmitPayment();
  const [researchId, setResearchId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async () => {
    if (!researchId) { show("Select a research", "error"); return; }
    if (!file) { show("Upload a receipt", "error"); return; }
    try {
      await submitPayment.mutateAsync({ researchId, file });
      show("Payment proof submitted!", "success");
      setFile(null); setResearchId("");
    } catch (err: any) { show(err.message, "error"); }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2"><CreditCard size={20} className="text-primary" /> Payments</h1>
        <p className="text-sm text-muted-foreground">Upload proof of payment for your research</p>
      </div>
      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-foreground">Upload Proof of Payment</h2>
        <select value={researchId} onChange={(e) => setResearchId(e.target.value)} className="w-full h-11 px-3 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-colors">
          <option value="">Select research</option>
          {research?.map((r: any) => <option key={r.id} value={r.id}>{r.research_code} - {r.title}</option>)}
        </select>
        <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])} />
        <div onClick={() => fileRef.current?.click()} className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/30 transition-colors cursor-pointer">
          {file ? <p className="text-sm text-foreground">📎 {file.name}</p> : <><Upload size={24} className="mx-auto text-muted-foreground mb-2" /><p className="text-sm text-foreground">Upload receipt image</p><p className="text-xs text-muted-foreground">JPG, PNG, PDF up to 10MB</p></>}
        </div>
        <button onClick={handleSubmit} disabled={submitPayment.isPending} className="w-full h-11 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2">
          {submitPayment.isPending ? <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> : <><CheckCircle2 size={16} /> Submit Payment</>}
        </button>
      </div>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border"><h2 className="text-sm font-semibold text-foreground">Payment History</h2></div>
        {!payments?.length ? <div className="p-8 text-center"><p className="text-xs text-muted-foreground">No payments yet</p></div> : (
          <div className="divide-y divide-border">
            {payments.map((p: any) => (
              <div key={p.id} className="flex items-center gap-3 px-4 py-3 min-h-[44px]">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground font-mono">{p.payment_code}</p>
                  <p className="text-xs text-muted-foreground">{p.research?.research_code} · {format(new Date(p.created_at), "MMM d, yyyy")}</p>
                </div>
                <span className="text-sm font-semibold text-foreground">₱{Number(p.amount).toLocaleString()}</span>
                <StatusBadge variant={p.status}>{p.status}</StatusBadge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
