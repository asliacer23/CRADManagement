import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, RefreshCw, ShieldCheck } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyTableState } from "@/shared/components/EmptyTableState";
import { getCradIntegrationAuditLogs } from "@/features/integrations/services/registrarIntegrationService";

type RecommendationRow = {
  id: string;
  created_at: string;
  student_id: string;
  student_name: string;
  recommendation_type: string;
  guidance_status: string;
  recommended_by: string;
  summary: string;
  reference_no: string;
};

function parseRecommendation(log: any): RecommendationRow {
  let details: any = log.details ?? {};
  if (typeof log.details === "string") {
    try {
      details = JSON.parse(log.details);
    } catch {
      details = {};
    }
  }

  return {
    id: log.id,
    created_at: log.created_at,
    student_id: String(details.student_id ?? ""),
    student_name: String(details.student_name ?? ""),
    recommendation_type: String(details.recommendation_type ?? "general"),
    guidance_status: String(details.guidance_status ?? "pending"),
    recommended_by: String(details.recommended_by ?? "Guidance"),
    summary: String(details.summary ?? details.notes ?? ""),
    reference_no: String(details.reference_no ?? ""),
  };
}

export function GuidanceRecommendationsPage() {
  const [rows, setRows] = useState<RecommendationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const logs = await getCradIntegrationAuditLogs("student_recommendation");
      setRows(logs.map(parseRecommendation));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load guidance recommendations.");
      setRows([]);
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
            <Badge className="border-emerald-200 bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Guidance</Badge>
            <Badge variant="outline">Inbound feed</Badge>
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Student Recommendations</h1>
            <p className="mt-2 text-sm text-slate-600">Recommendations received through the guidance integration endpoint and stored in CRAD audit logs.</p>
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-700" />
            Recommendation Queue
          </CardTitle>
          <CardDescription>Rows are fetched from `crad.audit_logs` where `entity_type = student_recommendation`.</CardDescription>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Student</th>
                  <th className="px-4 py-3 text-left font-semibold">Type</th>
                  <th className="px-4 py-3 text-left font-semibold">Status</th>
                  <th className="px-4 py-3 text-left font-semibold">Recommended By</th>
                  <th className="px-4 py-3 text-left font-semibold">Reference</th>
                  <th className="px-4 py-3 text-left font-semibold">Received</th>
                </tr>
              </thead>
              <tbody>
                {!loading && rows.length === 0 ? (
                  <EmptyTableState colSpan={6} title="No guidance recommendations found" description="Run the recommendation intake to store new rows here." />
                ) : (
                  rows.map((row) => (
                    <tr key={row.id} className="border-t border-slate-200 align-top">
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900">{row.student_name || "Unnamed student"}</p>
                        <p className="text-xs text-slate-500">{row.student_id || "No student id"}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{row.recommendation_type}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-semibold capitalize text-slate-700">
                          {row.guidance_status.replace(/-/g, " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{row.recommended_by}</td>
                      <td className="px-4 py-3 text-slate-600">{row.reference_no || "Not provided"}</td>
                      <td className="px-4 py-3 text-slate-600">{format(new Date(row.created_at), "MMM d, yyyy h:mm a")}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {rows.length > 0 ? (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {rows.slice(0, 4).map((row) => (
                <div key={`${row.id}-summary`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-900">{row.student_name || row.student_id}</p>
                  <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">{row.recommendation_type}</p>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{row.summary || "No summary supplied."}</p>
                </div>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
