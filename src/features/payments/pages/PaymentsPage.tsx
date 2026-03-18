import React, { useState, useRef } from "react";
import { CreditCard, Upload, CheckCircle2, Clock, AlertCircle, Download, Eye, CheckSquare2, XSquare } from "lucide-react";
import { useSnackbar } from "@/shared/components/SnackbarProvider";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { useMyResearch, useMyPayments, useSubmitPayment, useSystemSettings } from "@/shared/hooks/useSupabaseData";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const PaymentsPage: React.FC = () => {
  const { show } = useSnackbar();
  const { data: research } = useMyResearch();
  const { data: payments, isLoading } = useMyPayments();
  const { data: settings } = useSystemSettings();
  const submitPayment = useSubmitPayment();
  const [researchId, setResearchId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [expandedPayment, setExpandedPayment] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const researchFeeSetting = settings?.find((setting: any) => setting.key === "research_fee");
  const parsedResearchFee = Number(researchFeeSetting?.value);
  const researchFee = Number.isFinite(parsedResearchFee) && parsedResearchFee > 0 ? parsedResearchFee : 2500;

  const handleSubmit = async () => {
    if (!researchId) { show("Select a research", "error"); return; }
    if (!file) { show("Upload a receipt", "error"); return; }
    try {
      await submitPayment.mutateAsync({ researchId, file, amount: researchFee });
      show("Payment proof submitted!", "success");
      setFile(null); 
      setResearchId("");
    } catch (err: any) { show(err.message, "error"); }
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
      show("File downloaded successfully", "success");
    } catch (err: any) {
      show("Download failed: " + err.message, "error");
    }
  };

  const pendingPayments = payments?.filter((p: any) => p.status === "pending" || p.status === "submitted") || [];
  const verifiedPayments = payments?.filter((p: any) => p.status === "verified") || [];
  const rejectedPayments = payments?.filter((p: any) => p.status === "rejected") || [];

  const PaymentCard = ({ p }: { p: any }) => {
    const isExpanded = expandedPayment === p.id;
    const isPending = p.status === "pending" || p.status === "submitted";
    const isVerified = p.status === "verified";
    const isRejected = p.status === "rejected";

    return (
      <div 
        key={p.id} 
        className="bg-card border border-border rounded-lg p-4 space-y-3 hover:border-border/50 transition-colors"
      >
        <div 
          onClick={() => setExpandedPayment(isExpanded ? null : p.id)}
          className="cursor-pointer"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="text-xs font-mono font-bold text-muted-foreground">{p.payment_code}</span>
                <StatusBadge variant={p.status}>{p.status}</StatusBadge>
              </div>
              <p className="text-sm font-semibold text-foreground">{p.research?.title || "Unknown Research"}</p>
              <p className="text-xs text-muted-foreground mt-1">{p.research?.research_code || "—"}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-lg font-bold text-foreground">₱{Number(p.amount).toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Amount</p>
            </div>
          </div>
        </div>

        {isExpanded && (
          <div className="border-t border-border pt-3 space-y-3 animate-fade-in">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Submitted</p>
                <p className="text-sm text-foreground">{format(new Date(p.created_at), "MMM d, yyyy")}</p>
                <p className="text-xs text-muted-foreground">{format(new Date(p.created_at), "h:mm a")}</p>
              </div>
              {isVerified && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Verified</p>
                  <p className="text-sm text-foreground">{format(new Date(p.verified_at), "MMM d, yyyy")}</p>
                  <p className="text-xs text-muted-foreground">{format(new Date(p.verified_at), "h:mm a")}</p>
                </div>
              )}
            </div>

            {p.proof_url && (
              <button 
                onClick={() => handleDownloadProof(p.proof_url, p.proof_file_name || "proof")}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-border text-xs text-muted-foreground hover:bg-muted transition-colors"
              >
                <Download size={13} /> Download Proof File
              </button>
            )}

            {isVerified && (
              <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-3">
                <div className="flex items-center gap-2 mb-1">
                  <CheckSquare2 size={14} className="text-green-600" />
                  <p className="text-xs font-semibold text-green-700">Payment Verified</p>
                </div>
                {isExpanded && (
                  <p className="text-xs text-green-600 ml-6">Your payment has been confirmed and processed successfully.</p>
                )}
              </div>
            )}

            {isRejected && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3">
                <div className="flex items-center gap-2 mb-1">
                  <XSquare size={14} className="text-red-600" />
                  <p className="text-xs font-semibold text-red-700">Payment Rejected</p>
                </div>
              </div>
            )}

            {isPending && (
              <div className="rounded-lg bg-orange-500/10 border border-orange-500/20 p-3">
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-orange-600 animate-spin" />
                  <p className="text-xs font-semibold text-orange-700">Awaiting Verification</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <CreditCard size={24} className="text-primary" /> Payments
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your research payment submissions and track status</p>
      </div>

      <Tabs defaultValue="submit" className="space-y-4">
        <TabsList className="w-full">
          <TabsTrigger value="submit">Submit Payment</TabsTrigger>
          <TabsTrigger value="pending" className="relative">
            Pending
            {pendingPayments.length > 0 && (
              <span className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-orange-500 text-white text-xs font-bold">
                {pendingPayments.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="verified" className="relative">
            Verified
            {verifiedPayments.length > 0 && (
              <span className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-500 text-white text-xs font-bold">
                {verifiedPayments.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="rejected" className="relative">
            Rejected
            {rejectedPayments.length > 0 && (
              <span className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold">
                {rejectedPayments.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Submit Payment Section */}
        <TabsContent value="submit">
          <div className="bg-card border border-border rounded-xl p-6 space-y-5">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Select Research *</label>
              <select 
                value={researchId} 
                onChange={(e) => setResearchId(e.target.value)} 
                className="w-full h-11 px-3 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-colors"
              >
                <option value="">Select your research</option>
                {research?.map((r: any) => (
                  <option key={r.id} value={r.id}>
                    {r.research_code} - {r.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <input 
                ref={fileRef} 
                type="file" 
                accept="image/*,.pdf" 
                className="hidden" 
                onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])} 
              />
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Payment Receipt *</label>
              <div 
                onClick={() => fileRef.current?.click()} 
                className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/30 transition-colors cursor-pointer"
              >
                {file ? (
                  <div className="flex items-center justify-center gap-2">
                    <AlertCircle size={20} className="text-primary" />
                    <div>
                      <p className="text-sm text-foreground">📎 {file.name}</p>
                      <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <Upload size={28} className="mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-foreground">Upload receipt image</p>
                    <p className="text-xs text-muted-foreground">JPG, PNG, PDF up to 10MB</p>
                  </>
                )}
              </div>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <p className="text-xs font-semibold text-blue-700 uppercase mb-1">Amount Due</p>
              <p className="text-2xl font-bold text-blue-600">PHP {researchFee.toLocaleString()}</p>
              <p className="text-xs text-blue-600 mt-1">Per research capstone project</p>
            </div>

            <button 
              onClick={handleSubmit} 
              disabled={submitPayment.isPending || !researchId || !file}
              className="w-full h-11 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitPayment.isPending ? (
                <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 size={16} /> Submit Payment
                </>
              )}
            </button>
          </div>
        </TabsContent>

        {/* Payment History Tabs */}
        <TabsContent value="pending">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-24 bg-card border border-border rounded-lg animate-pulse" />
              ))}
            </div>
          ) : !pendingPayments.length ? (
            <div className="bg-card border border-border rounded-xl p-12 text-center">
              <CheckCircle2 size={40} className="mx-auto text-muted-foreground mb-3" />
              <p className="text-sm font-medium text-foreground">No pending payments</p>
              <p className="text-xs text-muted-foreground mt-1">All your payments have been processed</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingPayments.map((p: any) => (
                <PaymentCard key={p.id} p={p} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="verified">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-24 bg-card border border-border rounded-lg animate-pulse" />
              ))}
            </div>
          ) : !verifiedPayments.length ? (
            <div className="bg-card border border-border rounded-xl p-12 text-center">
              <AlertCircle size={40} className="mx-auto text-muted-foreground mb-3" />
              <p className="text-sm font-medium text-foreground">No verified payments yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {verifiedPayments.map((p: any) => (
                <PaymentCard key={p.id} p={p} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="rejected">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-24 bg-card border border-border rounded-lg animate-pulse" />
              ))}
            </div>
          ) : !rejectedPayments.length ? (
            <div className="bg-card border border-border rounded-xl p-12 text-center">
              <AlertCircle size={40} className="mx-auto text-muted-foreground mb-3" />
              <p className="text-sm font-medium text-foreground">No rejected payments</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rejectedPayments.map((p: any) => (
                <PaymentCard key={p.id} p={p} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
