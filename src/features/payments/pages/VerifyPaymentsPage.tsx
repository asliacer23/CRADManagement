import React from "react";
import { CreditCard, CheckCircle2, XCircle, Download, User, Calendar, FileText } from "lucide-react";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { TableSkeleton } from "@/shared/components/Skeletons";
import { usePendingPayments, useVerifyPayment } from "@/shared/hooks/useSupabaseData";
import { useSnackbar } from "@/shared/components/SnackbarProvider";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

export const VerifyPaymentsPage: React.FC = () => {
  const { data: payments, isLoading } = usePendingPayments();
  const verifyPayment = useVerifyPayment();
  const { show } = useSnackbar();

  const handleVerify = async (p: any, status: "verified" | "rejected") => {
    try {
      await verifyPayment.mutateAsync({
        paymentId: p.id,
        status,
        userId: p.submitted_by,
        paymentCode: p.payment_code,
      });
      show(`Payment ${status}`, "success");
    } catch (err: any) {
      show(err.message || "Action failed", "error");
    }
  };

  const handleDownloadProof = async (proofUrl: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage.from("payment-proofs").download(proofUrl);
      if (error) throw error;
      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      show("Download failed: " + err.message, "error");
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2"><CreditCard size={20} className="text-primary" /> Verify Payments</h1>
        <p className="text-sm text-muted-foreground">{payments?.length || 0} payments pending verification</p>
      </div>

      {isLoading ? (
        <div className="bg-card border border-border rounded-xl overflow-hidden"><TableSkeleton rows={3} cols={4} /></div>
      ) : !payments?.length ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <CreditCard size={40} className="mx-auto text-muted-foreground mb-3" />
          <p className="text-sm font-medium text-foreground">No pending payments</p>
          <p className="text-xs text-muted-foreground mt-1">All payments have been processed</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden divide-y divide-border">
          {payments.map((p: any) => (
            <div key={p.id} className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono font-bold text-foreground">{p.payment_code}</span>
                    <StatusBadge variant={p.status}>{p.status}</StatusBadge>
                  </div>
                  <p className="text-sm font-medium text-foreground">{p.research?.title || "Unknown Research"}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1"><User size={11} /> {p.profiles?.full_name || "Unknown"}</span>
                    <span className="flex items-center gap-1"><FileText size={11} /> {p.research?.research_code || "—"}</span>
                    <span className="flex items-center gap-1"><Calendar size={11} /> {format(new Date(p.created_at), "MMM d, yyyy")}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-foreground">₱{Number(p.amount).toLocaleString()}</p>
                </div>
              </div>
              {p.proof_url && (
                <button onClick={() => handleDownloadProof(p.proof_url, p.proof_file_name || "proof")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:bg-muted transition-colors">
                  <Download size={12} /> Download Proof ({p.proof_file_name || "file"})
                </button>
              )}
              {p.notes && (
                <p className="text-xs text-muted-foreground bg-muted/30 rounded-lg p-2.5">{p.notes}</p>
              )}
              <div className="flex items-center gap-2">
                <button onClick={() => handleVerify(p, "verified")} disabled={verifyPayment.isPending}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-green-600 text-white text-xs font-semibold hover:bg-green-700 transition-colors disabled:opacity-50">
                  <CheckCircle2 size={14} /> Verify Payment
                </button>
                <button onClick={() => handleVerify(p, "rejected")} disabled={verifyPayment.isPending}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-destructive text-destructive text-xs font-semibold hover:bg-destructive/10 transition-colors disabled:opacity-50">
                  <XCircle size={14} /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
