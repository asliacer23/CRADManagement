import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Activity, ArrowLeft, Database, RefreshCw, Search, Table2 } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { EmptyTableState } from "@/shared/components/EmptyTableState";
import { buildCradProgramActivityReport, getCradProgramActivityReport } from "@/features/integrations/services/registrarIntegrationService";

const sectionLabels: Record<string, string> = {
  research: "Research",
  manuscripts: "Manuscripts",
  payments: "Payments",
  defenses: "Defenses",
  announcements: "Announcements",
  "audit-signals": "Audit Signals",
};

const metricLabels: Record<string, string> = {
  total_research: "Total Research",
  total_manuscripts: "Total Manuscripts",
  total_payments: "Total Payments",
  total_defense_schedules: "Total Defense Schedules",
  total_announcements: "Total Announcements",
  total_final_approvals: "Total Final Approvals",
  total_audit_signals: "Total Audit Signals",
};

function normalizeReport(payload: any) {
  return payload?.data ?? payload ?? null;
}

export function PmedReportsPage() {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [sectionFilter, setSectionFilter] = useState("all");

  async function loadLatest({ autoBuild = false }: { autoBuild?: boolean } = {}) {
    setLoading(true);
    setError("");

    try {
      const response = await getCradProgramActivityReport();
      const data = normalizeReport(response);

      if (!data && autoBuild) {
        const built = await buildCradProgramActivityReport();
        setReport(normalizeReport(built));
        return;
      }

      setReport(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load PMED report.");
      setReport(null);
    } finally {
      setLoading(false);
    }
  }

  async function buildLatest() {
    setLoading(true);
    setError("");

    try {
      const response = await buildCradProgramActivityReport();
      setReport(normalizeReport(response));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to build PMED report.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLatest({ autoBuild: true });
  }, []);

  const overview = report?.overview ?? {};
  const rows = Array.isArray(report?.rows) ? report.rows : [];
  const sections = Array.from(new Set(rows.map((row: any) => row.section).filter(Boolean)));

  const filteredRows = useMemo(
    () =>
      rows.filter((row: any) => {
        const haystack = `${row.section || ""} ${row.reference_code || ""} ${row.title || ""} ${row.status || ""} ${row.owner_name || ""}`.toLowerCase();
        const matchesSearch = haystack.includes(search.toLowerCase());
        const matchesSection = sectionFilter === "all" || row.section === sectionFilter;
        return matchesSearch && matchesSection;
      }),
    [rows, search, sectionFilter]
  );

  const metricRows = useMemo(
    () =>
      Object.entries(overview).map(([key, value]) => ({
        key,
        label: metricLabels[key] || key.replace(/_/g, " "),
        value,
      })),
    [overview]
  );

  const batchSummary = report
    ? {
        batchId: report.batch_id || "No batch id",
        generatedAt: report.generated_at ? format(new Date(report.generated_at), "MMM d, yyyy h:mm a") : "Not generated",
        rowCount: report.row_count ?? rows.length,
      }
    : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge className="border-violet-200 bg-violet-100 text-violet-700 hover:bg-violet-100">PMED</Badge>
            <Badge variant="outline">Database-backed report feed</Badge>
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Program Activity Report</h1>
            <p className="mt-2 text-sm text-slate-600">
              Build the latest PMED report into the database, then review the saved metrics and activity rows in table form.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link to="/integrations">
              <ArrowLeft className="h-4 w-4" />
              Back to Hub
            </Link>
          </Button>
          <Button variant="outline" onClick={() => loadLatest()} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Load Latest
          </Button>
          <Button onClick={buildLatest} disabled={loading}>
            <Database className="h-4 w-4" />
            {loading ? "Building..." : "Build New Report"}
          </Button>
        </div>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Latest batch</CardDescription>
            <CardTitle>{batchSummary?.batchId || "No saved batch"}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Generated at</CardDescription>
            <CardTitle>{batchSummary?.generatedAt || "Not generated"}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Stored rows</CardDescription>
            <CardTitle>{batchSummary?.rowCount || 0}</CardTitle>
          </CardHeader>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-violet-700" />
            PMED Metrics
          </CardTitle>
          <CardDescription>
            Saved overview counts from the latest CRAD-to-PMED reporting batch.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Metric</th>
                  <th className="px-4 py-3 text-left font-semibold">Value</th>
                </tr>
              </thead>
              <tbody>
                {!loading && metricRows.length === 0 ? (
                  <EmptyTableState colSpan={2} title="No PMED metrics saved yet" description="Build a PMED report to store the current CRAD totals." />
                ) : (
                  metricRows.map((metric) => (
                    <tr key={metric.key} className="border-t border-slate-200">
                      <td className="px-4 py-3 font-medium text-slate-900">{metric.label}</td>
                      <td className="px-4 py-3 text-slate-600">{String(metric.value ?? 0)}</td>
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
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Table2 className="h-4 w-4 text-violet-700" />
                PMED Activity Feed
              </CardTitle>
              <CardDescription>
                Database rows captured for the latest PMED reporting batch.
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="relative min-w-[240px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search report rows"
                  className="pl-9"
                />
              </div>
              <select
                value={sectionFilter}
                onChange={(event) => setSectionFilter(event.target.value)}
                className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="all">All Sections</option>
                {sections.map((section) => (
                  <option key={section} value={section}>
                    {sectionLabels[section] || section}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Section</th>
                  <th className="px-4 py-3 text-left font-semibold">Reference</th>
                  <th className="px-4 py-3 text-left font-semibold">Title</th>
                  <th className="px-4 py-3 text-left font-semibold">Status</th>
                  <th className="px-4 py-3 text-left font-semibold">Owner / Source</th>
                  <th className="px-4 py-3 text-left font-semibold">Event Date</th>
                </tr>
              </thead>
              <tbody>
                {!loading && filteredRows.length === 0 ? (
                  <EmptyTableState
                    colSpan={6}
                    title="No saved PMED activity rows"
                    description="Build a PMED report and the latest rows will be stored and listed here."
                  />
                ) : (
                  filteredRows.map((row: any) => (
                    <tr key={`${row.batch_id}-${row.section}-${row.row_index}-${row.id ?? row.reference_code}`} className="border-t border-slate-200">
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="capitalize">
                          {sectionLabels[row.section] || row.section}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900">{row.reference_code || "N/A"}</td>
                      <td className="px-4 py-3 text-slate-600">{row.title || "Untitled"}</td>
                      <td className="px-4 py-3 text-slate-600 capitalize">{String(row.status || "n/a").replace(/_/g, " ")}</td>
                      <td className="px-4 py-3 text-slate-600">{row.owner_name || "System"}</td>
                      <td className="px-4 py-3 text-slate-600">
                        {row.event_date ? format(new Date(row.event_date), "MMM d, yyyy h:mm a") : "N/A"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
