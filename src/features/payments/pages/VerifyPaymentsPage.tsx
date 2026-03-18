import React, { useState } from "react";
import { CreditCard, CheckCircle2, XCircle, Download, User, Calendar, FileText, Clock, AlertCircle, Eye } from "lucide-react";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { TableSkeleton } from "@/shared/components/Skeletons";
import { usePendingPayments, useAllPayments, useVerifyPayment } from "@/shared/hooks/useSupabaseData";
import { useSnackbar } from "@/shared/components/SnackbarProvider";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const VerifyPaymentsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState("pending");
  const [expandedPayment, setExpandedPayment] = useState<string | null>(null);
  
  const { data: pendingPayments, isLoading: pendingLoading } = usePendingPayments();
  const { data: verifiedPayments, isLoading: verifiedLoading } = useAllPayments("verified");
  const { data: rejectedPayments, isLoading: rejectedLoading } = useAllPayments("rejected");
  
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

  const PaymentCard = ({ p }: { p: any }) => (
    <div key={p.id} className="bg-card border border-border rounded-lg p-4 space-y-3 hover:border-border/50 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-xs font-mono font-bold text-foreground">{p.payment_code}</span>
            <StatusBadge variant={p.status}>{p.status}</StatusBadge>
          </div>
          <p className="text-sm font-semibold text-foreground line-clamp-2">{p.research?.title || "Unknown Research"}</p>
          <div className="mt-2 space-y-1 text-xs text-muted-foreground">
            <p className="flex items-center gap-2"><User size={12} /> {p.submitted_by_profile?.full_name || "Unknown"}</p>
            <p className="flex items-center gap-2"><FileText size={12} /> {p.research?.research_code || "—"}</p>
            <p className="flex items-center gap-2"><Calendar size={12} /> {format(new Date(p.created_at), "MMM d, yyyy h:mm a")}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-foreground">₱{Number(p.amount).toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Payment Amount</p>
        </div>
      </div>

      {(activeTab !== "pending" || expandedPayment === p.id) && (
        <div className="border-t border-border pt-3">
          <div className="grid grid-cols-2 gap-2 text-xs">
            {p.verified_at && (
              <div>
                <p className="text-muted-foreground">Verified On</p>
                <p className="text-foreground font-medium">{format(new Date(p.verified_at), "MMM d, yyyy")}</p>
              </div>
            )}
            {p.verified_by_profile?.full_name && (
              <div>
                <p className="text-muted-foreground">Verified By</p>
                <p className="text-foreground font-medium">{p.verified_by_profile.full_name}</p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="space-y-2">
        {p.proof_url && (
          <button onClick={() => handleDownloadProof(p.proof_url, p.proof_file_name || "proof")}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-border text-xs text-muted-foreground hover:bg-muted transition-colors">
            <Download size={13} /> Download Proof File
          </button>
        )}
        
        {p.notes && (
          <div className="rounded-lg bg-muted/50 border border-border p-2.5 text-xs">
            <p className="text-muted-foreground font-medium mb-1">Notes:</p>
            <p className="text-foreground">{p.notes}</p>
          </div>
        )}

        {activeTab === "pending" && (
          <div className="flex gap-2">
            <button onClick={() => handleVerify(p, "verified")} 
              disabled={verifyPayment.isPending}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-green-600 text-white text-xs font-semibold hover:bg-green-700 transition-colors disabled:opacity-50">
              <CheckCircle2 size={14} /> Verify
            </button>
            <button onClick={() => handleVerify(p, "rejected")} 
              disabled={verifyPayment.isPending}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-destructive text-destructive text-xs font-semibold hover:bg-destructive/10 transition-colors disabled:opacity-50">
              <XCircle size={14} /> Reject
            </button>
          </div>
        )}

        {activeTab !== "pending" && (
          <button onClick={() => setExpandedPayment(expandedPayment === p.id ? null : p.id)}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-border text-xs text-muted-foreground hover:bg-muted transition-colors">
            <Eye size={13} /> {expandedPayment === p.id ? "Hide Details" : "View Details"}
          </button>
        )}
      </div>
    </div>
  );

  const TabContent = ({ payments, isLoading, iconColor, emptyMessage }: any) => {
    if (isLoading) {
      return <TableSkeleton rows={3} cols={2} />;
    }

    if (!payments?.length) {
      return (
        <div className="p-12 text-center">
          <AlertCircle size={40} className={`mx-auto mb-3 ${iconColor}`} />
          <p className="text-sm font-medium text-foreground">{emptyMessage}</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {payments.map((p: any) => <PaymentCard key={p.id} p={p} />)}
      </div>
    );
  };

  const pendingCount = pendingPayments?.length || 0;
  const verifiedCount = verifiedPayments?.length || 0;
  const rejectedCount = rejectedPayments?.length || 0;
  const totalCount = pendingCount + verifiedCount + rejectedCount;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <CreditCard size={24} className="text-primary" /> Payment Verification
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Manage and verify all payment submissions</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-xs text-muted-foreground mb-1">Total Payments</p>
          <p className="text-2xl font-bold text-foreground">{totalCount}</p>
        </div>
        <div className="bg-card border border-orange-500/20 rounded-lg p-4">
          <p className="text-xs text-orange-600 mb-1 flex items-center gap-1"><Clock size={12} /> Pending</p>
          <p className="text-2xl font-bold text-orange-600">{pendingCount}</p>
        </div>
        <div className="bg-card border border-green-500/20 rounded-lg p-4">
          <p className="text-xs text-green-600 mb-1 flex items-center gap-1"><CheckCircle2 size={12} /> Verified</p>
          <p className="text-2xl font-bold text-green-600">{verifiedCount}</p>
        </div>
        <div className="bg-card border border-destructive/20 rounded-lg p-4">
          <p className="text-xs text-destructive mb-1 flex items-center gap-1"><XCircle size={12} /> Rejected</p>
          <p className="text-2xl font-bold text-destructive">{rejectedCount}</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="pending" className="relative">
            Pending
            {pendingCount > 0 && (
              <span className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-orange-500 text-white text-xs font-bold">
                {pendingCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="verified" className="relative">
            Verified
            {verifiedCount > 0 && (
              <span className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-500 text-white text-xs font-bold">
                {verifiedCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="rejected" className="relative">
            Rejected
            {rejectedCount > 0 && (
              <span className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-destructive text-white text-xs font-bold">
                {rejectedCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <TabContent 
            payments={pendingPayments} 
            isLoading={pendingLoading}
            iconColor="text-orange-500"
            emptyMessage="No pending payments to verify"
          />
        </TabsContent>

        <TabsContent value="verified">
          <TabContent 
            payments={verifiedPayments} 
            isLoading={verifiedLoading}
            iconColor="text-green-500"
            emptyMessage="No verified payments yet"
          />
        </TabsContent>

        <TabsContent value="rejected">
          <TabContent 
            payments={rejectedPayments} 
            isLoading={rejectedLoading}
            iconColor="text-destructive"
            emptyMessage="No rejected payments yet"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
