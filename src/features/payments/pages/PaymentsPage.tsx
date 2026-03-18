import React from "react";
import { CreditCard, Upload, CheckCircle2 } from "lucide-react";
import { useSnackbar } from "@/shared/components/SnackbarProvider";
import { StatusBadge } from "@/shared/components/StatusBadge";

const paymentHistory = [
  { id: "PAY-001", research: "R-2024-001", amount: "₱2,500", date: "Mar 5, 2026", status: "approved" as const },
  { id: "PAY-002", research: "R-2024-002", amount: "₱2,500", date: "Mar 8, 2026", status: "pending" as const },
];

export const PaymentsPage: React.FC = () => {
  const { show } = useSnackbar();

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <CreditCard size={20} className="text-primary" /> Payments
        </h1>
        <p className="text-sm text-muted-foreground">Upload proof of payment for your research</p>
      </div>

      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-foreground">Upload Proof of Payment</h2>
        <select className="w-full h-11 px-3 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-colors">
          <option value="">Select research</option>
          <option value="R-2024-001">R-2024-001 - IoT Smart Classroom</option>
          <option value="R-2024-002">R-2024-002 - AI Performance Predictor</option>
        </select>
        <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/30 transition-colors cursor-pointer"
          onClick={() => show("File upload dialog opened (demo)", "info")}>
          <Upload size={24} className="mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-foreground">Upload receipt image</p>
          <p className="text-xs text-muted-foreground">JPG, PNG up to 10MB</p>
        </div>
        <button onClick={() => show("Payment proof submitted!", "success")}
          className="w-full h-11 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
          <CheckCircle2 size={16} /> Submit Payment
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Payment History</h2>
        </div>
        <div className="divide-y divide-border">
          {paymentHistory.map((p) => (
            <div key={p.id} className="flex items-center gap-3 px-4 py-3 min-h-[44px]">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground font-mono">{p.id}</p>
                <p className="text-xs text-muted-foreground">{p.research} · {p.date}</p>
              </div>
              <span className="text-sm font-semibold text-foreground">{p.amount}</span>
              <StatusBadge variant={p.status}>{p.status}</StatusBadge>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
