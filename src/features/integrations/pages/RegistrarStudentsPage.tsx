import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, BadgeCheck, Banknote, CircleDashed, RefreshCw, Users, WifiOff } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyTableState } from "@/shared/components/EmptyTableState";
import {
  getCradRegistrarStudentFeed,
  getCashierResearchPayments,
  type CashierResearchPaymentItem,
} from "@/features/integrations/services/registrarIntegrationService";

type StudentRow = {
  student_no: string;
  student_name: string;
  program?: string;
  year_level?: string;
  status?: string;
  matched_subjects?: string[];
};

type StudentBatch = {
  id: string;
  target_label: string;
  source: string;
  sent_at: string;
  student_count: number;
  students: StudentRow[];
};

function buildBatches(rows: any[]): StudentBatch[] {
  const batchMap = new Map<string, StudentBatch>();

  for (const row of rows) {
    const batchId = String(row.batch_id ?? row.id ?? "");
    if (!batchId) continue;

    let payload = row.payload ?? {};
    if (typeof payload === "string") {
      try {
        payload = JSON.parse(payload);
      } catch {
        payload = {};
      }
    }

    const batch = batchMap.get(batchId) ?? {
      id: batchId,
      target_label: String(row.target_label ?? "CRAD"),
      source: String(row.source ?? "Registrar"),
      sent_at: String(row.sent_at ?? row.created_at ?? new Date().toISOString()),
      student_count: 0,
      students: [],
    };

    batch.students.push({
      student_no: String(row.student_no ?? payload.student_no ?? ""),
      student_name: String(row.student_name ?? payload.student_name ?? "Unknown student"),
      program: String(row.program ?? payload.program ?? ""),
      year_level: String(row.year_level ?? payload.year_level ?? ""),
      status: String(row.status ?? payload.status ?? ""),
      matched_subjects: Array.isArray(payload.matched_subjects) ? payload.matched_subjects.map((item: unknown) => String(item)) : [],
    });
    batch.student_count = batch.students.length;

    batchMap.set(batchId, batch);
  }

  return Array.from(batchMap.values()).sort(
    (left, right) => new Date(right.sent_at).getTime() - new Date(left.sent_at).getTime()
  );
}

function PaymentBadge({ item }: { item: CashierResearchPaymentItem | undefined }) {
  if (!item) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-400">
        <CircleDashed className="h-3 w-3" /> Not billed
      </span>
    );
  }

  if (item.paymentType === "full_paid") {
    return (
      <div className="space-y-0.5">
        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
          <BadgeCheck className="h-3 w-3" /> Fully Paid
        </span>
        <p className="text-xs text-slate-500">{item.paidAmountFormatted} of {item.totalAmountFormatted}</p>
        {item.receiptNumbers && <p className="text-xs text-slate-400">OR: {item.receiptNumbers}</p>}
        {item.lastPaymentDate && <p className="text-xs text-slate-400">{format(new Date(item.lastPaymentDate), "MMM d, yyyy")}</p>}
      </div>
    );
  }

  if (item.paymentType === "downpayment") {
    return (
      <div className="space-y-0.5">
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
          <Banknote className="h-3 w-3" /> Downpayment Paid
        </span>
        <p className="text-xs text-slate-500">
          Paid {item.paidAmountFormatted} / required {item.downpaymentRequiredFormatted}
        </p>
        <p className="text-xs text-orange-500">Balance: {item.balanceAmountFormatted}</p>
        {item.lastPaymentDate && <p className="text-xs text-slate-400">{format(new Date(item.lastPaymentDate), "MMM d, yyyy")}</p>}
      </div>
    );
  }

  if (item.paymentType === "partial") {
    return (
      <div className="space-y-0.5">
        <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-semibold text-yellow-700">
          <Banknote className="h-3 w-3" /> Partial Payment
        </span>
        <p className="text-xs text-slate-500">
          Paid {item.paidAmountFormatted} — needs {item.downpaymentRequiredFormatted} downpayment
        </p>
        <p className="text-xs text-orange-500">Balance: {item.balanceAmountFormatted}</p>
      </div>
    );
  }

  return (
    <div className="space-y-0.5">
      <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-700">
        <CircleDashed className="h-3 w-3" /> Unpaid
      </span>
      {item.downpaymentRequired > 0 && (
        <p className="text-xs text-slate-500">Downpayment due: {item.downpaymentRequiredFormatted}</p>
      )}
      {item.totalAmount > 0 && (
        <p className="text-xs text-slate-400">Total: {item.totalAmountFormatted}</p>
      )}
    </div>
  );
}

export function RegistrarStudentsPage() {
  const [batches, setBatches] = useState<StudentBatch[]>([]);
  const [paymentMap, setPaymentMap] = useState<Record<string, CashierResearchPaymentItem>>({});
  const [cashierUnavailable, setCashierUnavailable] = useState(false);
  const [cashierError, setCashierError] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadData() {
    setLoading(true);
    setError("");

    // Load registrar student feed
    try {
      const rows = await getCradRegistrarStudentFeed();
      setBatches(buildBatches(rows));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load registrar student batches.");
      setBatches([]);
    }

    // Load cashier payment feed (non-blocking)
    try {
      setCashierUnavailable(false);
      setCashierError("");
      const result = await getCashierResearchPayments();
      setPaymentMap(result.byStudentNo);
    } catch (err) {
      setCashierUnavailable(true);
      setCashierError(err instanceof Error ? err.message : "Unknown error");
      setPaymentMap({});
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge className="border-sky-200 bg-sky-100 text-sky-700 hover:bg-sky-100">Registrar</Badge>
            <Badge variant="outline">Inbound feed</Badge>
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Student List Feed</h1>
            <p className="mt-2 text-sm text-slate-600">Recent student list batches received by CRAD from the registrar integration stream.</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link to="/integrations">
              <ArrowLeft className="h-4 w-4" />
              Back to Hub
            </Link>
          </Button>
          <Button onClick={() => void loadData()} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total batches</CardDescription>
            <CardTitle>{batches.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total students received</CardDescription>
            <CardTitle>{batches.reduce((sum, batch) => sum + batch.student_count, 0)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Latest batch</CardDescription>
            <CardTitle>{batches[0] ? format(new Date(batches[0].sent_at), "MMM d, yyyy h:mm a") : "No data"}</CardTitle>
          </CardHeader>
        </Card>
      </section>

      {cashierUnavailable && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 space-y-1">
          <div className="flex items-center gap-2 font-semibold">
            <WifiOff className="h-4 w-4 shrink-0" />
            Cashier payment data unavailable
          </div>
          <p className="text-amber-700 text-xs">
            Could not load billing status from the database. Check that{" "}
            <code className="rounded bg-amber-100 px-1 font-mono">DATABASE_URL</code> is set in{" "}
            <code className="rounded bg-amber-100 px-1 font-mono">.env</code> and the Vite dev server is running.
          </p>
          {cashierError && (
            <p className="text-xs text-amber-600 break-all">{cashierError}</p>
          )}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-4 w-4 text-sky-700" />
            Received Student Batches
          </CardTitle>
          <CardDescription>
            Student list received from the Registrar. The <strong>Cashier Payment</strong> column
            shows live billing status for Research / Capstone fees from the Cashier system.
          </CardDescription>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </CardHeader>
        <CardContent className="space-y-6">
          {batches.map((batch) => (
            <div key={batch.id} className="space-y-3 rounded-2xl border border-slate-200 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{batch.source}</p>
                  <p className="text-xs text-slate-500">
                    Target {batch.target_label} • Sent {format(new Date(batch.sent_at), "MMM d, yyyy h:mm a")}
                  </p>
                </div>
                <Badge variant="outline">{batch.student_count} students</Badge>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Student No</th>
                      <th className="px-4 py-3 text-left font-semibold">Name</th>
                      <th className="px-4 py-3 text-left font-semibold">Program</th>
                      <th className="px-4 py-3 text-left font-semibold">Year</th>
                      <th className="px-4 py-3 text-left font-semibold">Status</th>
                      <th className="px-4 py-3 text-left font-semibold">Matched Subjects</th>
                      <th className="px-4 py-3 text-left font-semibold">
                        <span className="inline-flex items-center gap-1">
                          Cashier Payment
                          {!cashierUnavailable && (
                            <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-green-400" title="Live from Cashier" />
                          )}
                        </span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {batch.students.length === 0 ? (
                      <EmptyTableState colSpan={7} title="No student rows in this batch" description="Run the registrar sync again to capture new roster records." />
                    ) : (
                      batch.students.map((student, index) => {
                        const payment = paymentMap[student.student_no];
                        return (
                          <tr key={`${batch.id}-${student.student_no || index}`} className="border-t border-slate-200 hover:bg-slate-50/60">
                            <td className="px-4 py-3 font-medium text-slate-900">{student.student_no || "N/A"}</td>
                            <td className="px-4 py-3 text-slate-600">{student.student_name || "Unknown student"}</td>
                            <td className="px-4 py-3 text-slate-600">{student.program || "—"}</td>
                            <td className="px-4 py-3 text-slate-600">{student.year_level || "—"}</td>
                            <td className="px-4 py-3 text-slate-600">{student.status || "—"}</td>
                            <td className="px-4 py-3 text-slate-600">
                              {student.matched_subjects?.length ? student.matched_subjects.join(", ") : "—"}
                            </td>
                            <td className="px-4 py-3">
                              {cashierUnavailable ? (
                                <span className="text-xs text-slate-400">—</span>
                              ) : (
                                <PaymentBadge item={payment} />
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          {!loading && batches.length === 0 ? (
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Student No</th>
                    <th className="px-4 py-3 text-left font-semibold">Name</th>
                    <th className="px-4 py-3 text-left font-semibold">Program</th>
                    <th className="px-4 py-3 text-left font-semibold">Year</th>
                    <th className="px-4 py-3 text-left font-semibold">Status</th>
                    <th className="px-4 py-3 text-left font-semibold">Matched Subjects</th>
                    <th className="px-4 py-3 text-left font-semibold">Cashier Payment</th>
                  </tr>
                </thead>
                <tbody>
                  <EmptyTableState colSpan={7} title="No registrar student batches found" description="The registrar feed has not persisted any student list rows yet." />
                </tbody>
              </table>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
