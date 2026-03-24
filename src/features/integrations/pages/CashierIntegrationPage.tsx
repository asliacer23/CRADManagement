import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, BadgeCheck, BookOpen, CreditCard, ReceiptText, RefreshCw, WifiOff } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyTableState } from "@/shared/components/EmptyTableState";
import {
  getCradCashierEvents,
  getCradCashierLinks,
  getCradRecentClearanceRecords,
  getCashierResearchPayments,
  type CashierResearchPaymentItem,
} from "@/features/integrations/services/registrarIntegrationService";

export function CashierIntegrationPage() {
  const [clearanceRecords, setClearanceRecords] = useState<any[]>([]);
  const [paymentLinks, setPaymentLinks] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [researchPayments, setResearchPayments] = useState<CashierResearchPaymentItem[]>([]);
  const [researchStats, setResearchStats] = useState<{ title: string; value: string; subtitle: string }[]>([]);
  const [cashierUnavailable, setCashierUnavailable] = useState(false);
  const [cashierError, setCashierError] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const [clearances, links, syncEvents] = await Promise.all([
        getCradRecentClearanceRecords(),
        getCradCashierLinks(),
        getCradCashierEvents(),
      ]);
      setClearanceRecords(clearances);
      setPaymentLinks(links);
      setEvents(syncEvents);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load cashier integration data.");
      setClearanceRecords([]);
      setPaymentLinks([]);
      setEvents([]);
    }

    // Load research payment feed from cashier backend (separate, non-blocking)
    try {
      setCashierUnavailable(false);
      setCashierError("");
      const result = await getCashierResearchPayments();
      setResearchPayments(result.items);
      setResearchStats(result.stats);
    } catch (err) {
      setCashierUnavailable(true);
      setCashierError(err instanceof Error ? err.message : "Unknown error");
      setResearchPayments([]);
      setResearchStats([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge className="border-amber-200 bg-amber-100 text-amber-700 hover:bg-amber-100">Registrar + Cashier</Badge>
            <Badge variant="outline">Outbound sync</Badge>
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Cashier Integration Monitor</h1>
            <p className="mt-2 text-sm text-slate-600">Track the records CRAD pushes into the registrar and cashier workflow, including clearances, payment links, and sync events.</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link to="/integrations">
              <ArrowLeft className="h-4 w-4" />
              Back to Hub
            </Link>
          </Button>
          <Button onClick={loadData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {/* Research Payment Detection from Cashier */}
      <Card className="border-emerald-200 bg-emerald-50/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-emerald-800">
            <BookOpen className="h-4 w-4" />
            Research &amp; Capstone Payments — Cashier Feed
          </CardTitle>
          <CardDescription>
            Live detection of Research and Capstone fee payments recorded in the Cashier system.
            When a student pays their research fee at the cashier window, it appears here automatically.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {cashierUnavailable ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 space-y-1">
              <div className="flex items-center gap-2 font-semibold">
                <WifiOff className="h-4 w-4 shrink-0" />
                Cashier billing data unavailable
              </div>
              <p className="text-amber-700 text-xs">
                Could not query billing data from the database. Ensure{" "}
                <code className="rounded bg-amber-100 px-1 font-mono">DATABASE_URL</code> is set in{" "}
                <code className="rounded bg-amber-100 px-1 font-mono">.env</code>.
              </p>
              {cashierError && (
                <p className="text-xs text-amber-600 break-all">{cashierError}</p>
              )}
            </div>
          ) : (
            <>
              {researchStats.length > 0 && (
                <div className="grid gap-3 sm:grid-cols-3">
                  {researchStats.map((stat) => (
                    <div key={stat.title} className="rounded-lg border border-emerald-200 bg-white p-3">
                      <p className="text-xs text-slate-500">{stat.subtitle}</p>
                      <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                      <p className="text-xs font-medium text-slate-600">{stat.title}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Student</th>
                      <th className="px-4 py-3 text-left font-semibold">Fee</th>
                      <th className="px-4 py-3 text-left font-semibold">Amount</th>
                      <th className="px-4 py-3 text-left font-semibold">Billing Status</th>
                      <th className="px-4 py-3 text-left font-semibold">Receipt / Reference</th>
                      <th className="px-4 py-3 text-left font-semibold">Paid On</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!loading && researchPayments.length === 0 ? (
                      <EmptyTableState
                        colSpan={6}
                        title="No research or capstone payments detected"
                        description="No billing records with a Research/Capstone fee have been found in the cashier system yet."
                      />
                    ) : (
                      researchPayments.map((item) => (
                        <tr key={`${item.billingId}-${item.itemId}`} className="border-t border-slate-200 hover:bg-slate-50">
                          <td className="px-4 py-3">
                            <p className="font-medium text-slate-900">{item.studentName || "—"}</p>
                            <p className="text-xs text-slate-500">{item.studentNo}{item.course ? ` · ${item.course}` : ""}{item.yearLevel ? ` ${item.yearLevel}` : ""}</p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-slate-700">{item.itemName}</p>
                            <p className="text-xs text-slate-400">{item.itemCode} · {item.semester} {item.schoolYear}</p>
                          </td>
                          <td className="px-4 py-3 font-medium text-slate-900">{item.itemAmountFormatted}</td>
                          <td className="px-4 py-3">
                            {item.isPaid ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                                <BadgeCheck className="h-3 w-3" /> Paid
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-700 capitalize">
                                {item.billingStatus}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-slate-700">{item.receiptNumber || item.referenceNumber || "—"}</p>
                            {item.paymentMethod && <p className="text-xs text-slate-400">{item.paymentMethod}</p>}
                          </td>
                          <td className="px-4 py-3 text-slate-500 text-xs">
                            {item.paymentDate
                              ? format(new Date(item.paymentDate), "MMM d, yyyy")
                              : item.billingCreatedAt
                              ? format(new Date(item.billingCreatedAt), "MMM d, yyyy")
                              : "—"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <section className="grid gap-4 md:grid-cols-3">
        <Card><CardHeader className="pb-3"><CardDescription>Clearance records</CardDescription><CardTitle>{clearanceRecords.length}</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-3"><CardDescription>Payment links</CardDescription><CardTitle>{paymentLinks.length}</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-3"><CardDescription>Sync events</CardDescription><CardTitle>{events.length}</CardTitle></CardHeader></Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ReceiptText className="h-4 w-4 text-sky-700" />
            Clearance Records
          </CardTitle>
          <CardDescription>Rows from `crad.department_clearance_records` that feed downstream registrar and cashier processing.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Reference</th>
                  <th className="px-4 py-3 text-left font-semibold">Student</th>
                  <th className="px-4 py-3 text-left font-semibold">Status</th>
                  <th className="px-4 py-3 text-left font-semibold">Approver</th>
                  <th className="px-4 py-3 text-left font-semibold">Updated</th>
                </tr>
              </thead>
              <tbody>
                {!loading && clearanceRecords.length === 0 ? (
                  <EmptyTableState colSpan={5} title="No clearance records found" description="CRAD has not pushed any clearance rows to the clinic workflow yet." />
                ) : (
                  clearanceRecords.map((record) => (
                    <tr key={record.id} className="border-t border-slate-200">
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900">{record.clearance_reference}</p>
                        <p className="text-xs text-slate-500">{record.external_reference || "No external reference"}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{record.patient_name}</td>
                      <td className="px-4 py-3 text-slate-600">{String(record.status).replace(/_/g, " ")}</td>
                      <td className="px-4 py-3 text-slate-600">{record.approver_name || "Pending review"}</td>
                      <td className="px-4 py-3 text-slate-600">{format(new Date(record.updated_at), "MMM d, yyyy")}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-amber-700" />
              Cashier Payment Links
            </CardTitle>
            <CardDescription>Rows from `crad.cashier_payment_links` showing how CRAD payment records map into cashier billing state.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Source Key</th>
                    <th className="px-4 py-3 text-left font-semibold">Status</th>
                    <th className="px-4 py-3 text-left font-semibold">Amounts</th>
                    <th className="px-4 py-3 text-left font-semibold">Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  {!loading && paymentLinks.length === 0 ? (
                    <EmptyTableState colSpan={4} title="No cashier payment links found" description="No payment link rows are available in the CRAD cashier view." />
                  ) : (
                    paymentLinks.map((link) => (
                      <tr key={link.id} className="border-t border-slate-200">
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-900">{link.source_key}</p>
                          <p className="text-xs text-slate-500">{link.invoice_number || "No invoice yet"}</p>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{link.payment_status}</td>
                        <td className="px-4 py-3 text-slate-600">
                          Due: {link.amount_due} • Paid: {link.amount_paid} • Balance: {link.balance_due}
                        </td>
                        <td className="px-4 py-3 text-slate-600">{link.official_receipt || "Pending"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-emerald-700" />
              Cashier Sync Events
            </CardTitle>
            <CardDescription>Rows from `crad.cashier_integration_events` that show delivery state and any sync errors.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Event</th>
                    <th className="px-4 py-3 text-left font-semibold">Reference</th>
                    <th className="px-4 py-3 text-left font-semibold">Payment Status</th>
                    <th className="px-4 py-3 text-left font-semibold">Sync Status</th>
                    <th className="px-4 py-3 text-left font-semibold">Last Error</th>
                  </tr>
                </thead>
                <tbody>
                  {!loading && events.length === 0 ? (
                    <EmptyTableState colSpan={5} title="No cashier sync events found" description="No sync events have been recorded for CRAD yet." />
                  ) : (
                    events.map((event) => (
                      <tr key={event.id} className="border-t border-slate-200">
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-900">{event.event_key}</p>
                          <p className="text-xs text-slate-500">{event.patient_name || "Unknown patient"}</p>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{event.reference_no || event.source_key}</td>
                        <td className="px-4 py-3 text-slate-600">{event.payment_status}</td>
                        <td className="px-4 py-3 text-slate-600">{event.sync_status}</td>
                        <td className="px-4 py-3 text-slate-600">{event.last_error || "No error"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
