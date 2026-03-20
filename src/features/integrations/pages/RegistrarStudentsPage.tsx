import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, RefreshCw, Users } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyTableState } from "@/shared/components/EmptyTableState";
import { getCradRegistrarStudentFeed } from "@/features/integrations/services/registrarIntegrationService";

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

export function RegistrarStudentsPage() {
  const [batches, setBatches] = useState<StudentBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const rows = await getCradRegistrarStudentFeed();
      setBatches(buildBatches(rows));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load registrar student batches.");
      setBatches([]);
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-4 w-4 text-sky-700" />
            Received Student Batches
          </CardTitle>
          <CardDescription>Every batch is loaded directly from `public.crad_registrar_student_list_feed` rows written by the registrar sender.</CardDescription>
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
                    </tr>
                  </thead>
                  <tbody>
                    {batch.students.length === 0 ? (
                      <EmptyTableState colSpan={6} title="No student rows in this batch" description="Run the registrar sync again to capture new roster records." />
                    ) : (
                      batch.students.map((student, index) => (
                        <tr key={`${batch.id}-${student.student_no || index}`} className="border-t border-slate-200">
                          <td className="px-4 py-3 font-medium text-slate-900">{student.student_no || "N/A"}</td>
                          <td className="px-4 py-3 text-slate-600">{student.student_name || "Unknown student"}</td>
                          <td className="px-4 py-3 text-slate-600">{student.program || "Not provided"}</td>
                          <td className="px-4 py-3 text-slate-600">{student.year_level || "Not provided"}</td>
                          <td className="px-4 py-3 text-slate-600">{student.status || "Not provided"}</td>
                          <td className="px-4 py-3 text-slate-600">{student.matched_subjects?.length ? student.matched_subjects.join(", ") : "-"}</td>
                        </tr>
                      ))
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
                  </tr>
                </thead>
                <tbody>
                  <EmptyTableState colSpan={6} title="No registrar student batches found" description="The registrar feed has not persisted any student list rows yet." />
                </tbody>
              </table>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
