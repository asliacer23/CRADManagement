import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Activity, ArrowLeft, FileText, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyTableState } from "@/shared/components/EmptyTableState";
import { getCradProgramActivityReport } from "@/features/integrations/services/registrarIntegrationService";

export function PmedReportsPage() {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const response = await getCradProgramActivityReport();
      setReport(response?.data ?? response ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to build PMED report.");
      setReport(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const overview = report?.overview ?? {};
  const researchRows = Array.isArray(report?.recent_research) ? report.recent_research : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge className="border-violet-200 bg-violet-100 text-violet-700 hover:bg-violet-100">PMED</Badge>
            <Badge variant="outline">Outbound report</Badge>
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Program Activity Report</h1>
            <p className="mt-2 text-sm text-slate-600">Live PMED payload generated from CRAD data so staff can confirm the outbound report before sending it.</p>
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
            Rebuild Report
          </Button>
        </div>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <section className="grid gap-4 md:grid-cols-5">
        <Card><CardHeader className="pb-3"><CardDescription>Total research</CardDescription><CardTitle>{overview.total_research ?? 0}</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-3"><CardDescription>Manuscripts</CardDescription><CardTitle>{overview.total_manuscripts ?? 0}</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-3"><CardDescription>Payments</CardDescription><CardTitle>{overview.total_payments ?? 0}</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-3"><CardDescription>Defense schedules</CardDescription><CardTitle>{overview.total_defense_schedules ?? 0}</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-3"><CardDescription>Announcements</CardDescription><CardTitle>{overview.total_announcements ?? 0}</CardTitle></CardHeader></Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-violet-700" />
            PMED Payload Overview
          </CardTitle>
          <CardDescription>
            Generated {report?.generated_at ? format(new Date(report.generated_at), "MMM d, yyyy h:mm a") : "on demand"} from source {report?.source ?? "CRAD"}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Research Code</th>
                  <th className="px-4 py-3 text-left font-semibold">Title</th>
                  <th className="px-4 py-3 text-left font-semibold">Status</th>
                  <th className="px-4 py-3 text-left font-semibold">Created</th>
                </tr>
              </thead>
              <tbody>
                {!loading && researchRows.length === 0 ? (
                  <EmptyTableState colSpan={4} title="No research rows in PMED report" description="The report built successfully, but it did not include any research records." />
                ) : (
                  researchRows.map((row: any) => (
                    <tr key={row.id} className="border-t border-slate-200">
                      <td className="px-4 py-3 font-medium text-slate-900">{row.research_code}</td>
                      <td className="px-4 py-3 text-slate-600">{row.title}</td>
                      <td className="px-4 py-3 text-slate-600">{row.status}</td>
                      <td className="px-4 py-3 text-slate-600">{row.created_at ? format(new Date(row.created_at), "MMM d, yyyy") : "N/A"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {report ? (
            <Card className="mt-6 border-slate-200 bg-slate-950 text-slate-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base text-white">
                  <FileText className="h-4 w-4" />
                  Raw Payload
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="overflow-auto text-xs leading-6 text-slate-200">{JSON.stringify(report, null, 2)}</pre>
              </CardContent>
            </Card>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
