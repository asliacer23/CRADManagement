import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, CreditCard, ReceiptText, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyTableState } from "@/shared/components/EmptyTableState";
import { getCradCashierEvents, getCradCashierLinks, getCradRecentClearanceRecords } from "@/features/integrations/services/registrarIntegrationService";

export function CashierIntegrationPage() {
  const [clearanceRecords, setClearanceRecords] = useState<any[]>([]);
  const [paymentLinks, setPaymentLinks] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
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
