import React from "react";
import { CreditCard, CheckCircle2, XCircle, Eye } from "lucide-react";
import { useSnackbar } from "@/shared/components/SnackbarProvider";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { usePendingPayments, useVerifyPayment } from "@/shared/hooks/useSupabaseData";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

export const VerifyPaymentsPage: React.FC = () => {
  const { show } = useSnackbar();
  const { data: payments, isLoading } = usePendingPayments();
  const verifyMutation = useVerifyPayment();

  const handleAction = async (p: any, status: "verified" | "rejected") => {
    try {
      await verifyMutation.mutateAsync({ paymentId: p.id, status, userId: p.submitted_by, paymentCode: p.payment_code });
      show(`Payment ${status}!`, status === "verified" ? "success" : "error");
    } catch (err: any) { show(err.message, "error"); }
  };

  const viewProof = (proofUrl: string) => {
    const { data } = supabase.storage.from("payment-proofs").getPublicUrl(proofUrl);
    window.open(data.publicUrl, "_blank");
  };

  if (isLoading) return <div className="space-y-4">{[1,2].map(i => <div key={i} className="h-24 skeleton-shimmer rounded-xl" />)}</div>;

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2"><CreditCard size={20} className="text-primary" /> Verify Payments</h1>
        <p className="text-sm text-muted-foreground">Review and verify student payment submissions</p>
      </div>
      {!payments?.length ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <CheckCircle2 size={40} className="mx-auto text-success mb-3" />
          <p className="text-sm font-medium text-foreground">No pending payments</p>
        </div>
      ) : payments.map((p: any) => (
        <div key={p.id} className="bg-card border border-border rounded-xl p-4 animate-slide-up">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-sm font-medium text-foreground">{p.profiles?.full_name}</p>
              <p className="text-xs text-muted-foreground"><span className="font-mono">{p.payment_code}</span> · {p.research?.research_code} · ₱{Number(p.amount).toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">{format(new Date(p.created_at), "MMM d, yyyy")}</p>
            </div>
            <StatusBadge variant={p.status}>{p.status}</StatusBadge>
          </div>
          <div className="flex gap-2">
            {p.proof_url && <button onClick={() => viewProof(p.proof_url)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-muted text-muted-foreground text-xs font-semibold hover:bg-muted/80 transition-colors min-h-[44px]"><Eye size={14} /> View Proof</button>}
            <button onClick={() => handleAction(p, "verified")} disabled={verifyMutation.isPending} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-success/10 text-success text-xs font-semibold hover:bg-success/20 transition-colors min-h-[44px]"><CheckCircle2 size={14} /> Verify</button>
            <button onClick={() => handleAction(p, "rejected")} disabled={verifyMutation.isPending} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-destructive/10 text-destructive text-xs font-semibold hover:bg-destructive/20 transition-colors min-h-[44px]"><XCircle size={14} /> Reject</button>
          </div>
        </div>
      ))}
    </div>
  );
};
