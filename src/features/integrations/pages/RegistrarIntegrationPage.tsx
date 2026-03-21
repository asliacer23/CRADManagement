import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  Database,
  FileText,
  GitBranch,
  Link2,
  RefreshCw,
  Send,
  ShieldCheck,
  Users,
} from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { buildCradProgramActivityReport, getCradCashierEvents, getCradCashierLinks, getCradFlowProfile, getCradIntegrationAuditLogs, getCradProgramActivityReport, getCradRecentClearanceRecords, saveCradGuidanceRecommendation } from "@/features/integrations/services/registrarIntegrationService";
import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEYS = {
  baseUrl: "crad.registrar.baseUrl",
  apiKey: "crad.registrar.apiKey",
};

type IntegrationStatus = "ready" | "connected" | "attention";

const statusStyles: Record<IntegrationStatus, string> = {
  ready: "border-emerald-200 bg-emerald-50 text-emerald-700",
  connected: "border-sky-200 bg-sky-50 text-sky-700",
  attention: "border-amber-200 bg-amber-50 text-amber-700",
};

const directionStyles = {
  receive: "bg-sky-100 text-sky-700 border-sky-200",
  send: "bg-amber-100 text-amber-700 border-amber-200",
};

function StatusPill({ status, label }: { status: IntegrationStatus; label: string }) {
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusStyles[status]}`}>{label}</span>;
}

export function RegistrarIntegrationPage() {
  const [baseUrl, setBaseUrl] = useState("http://localhost:3000/api/integrations");
  const [apiKey, setApiKey] = useState("");
  const [studentNo, setStudentNo] = useState("");
  const [studentName, setStudentName] = useState("");
  const [referenceNo, setReferenceNo] = useState("");
  const [title, setTitle] = useState("CRAD Participation Clearance");
  const [status, setStatus] = useState("Completed");
  const [notes, setNotes] = useState("");
  const [recommendationType, setRecommendationType] = useState("Program Endorsement");
  const [guidanceStatus, setGuidanceStatus] = useState("pending");
  const [recommendedBy, setRecommendedBy] = useState("Guidance Office");
  const [responseText, setResponseText] = useState("Run an integration action to preview the live response here.");
  const [busyAction, setBusyAction] = useState("");
  const [flowSummary, setFlowSummary] = useState("Loading CRAD schema flow profile...");
  const [clearanceSummary, setClearanceSummary] = useState("Loading CRAD clearance view...");
  const [clearanceRecords, setClearanceRecords] = useState<any[]>([]);
  const [registrarBatches, setRegistrarBatches] = useState<any[]>([]);
  const [recommendationLogs, setRecommendationLogs] = useState<any[]>([]);
  const [cashierLinks, setCashierLinks] = useState<any[]>([]);
  const [cashierEvents, setCashierEvents] = useState<any[]>([]);
  const [pmedReportPreview, setPmedReportPreview] = useState<any | null>(null);

  useEffect(() => {
    const storedBaseUrl = window.localStorage.getItem(STORAGE_KEYS.baseUrl);
    const storedApiKey = window.localStorage.getItem(STORAGE_KEYS.apiKey);
    if (storedBaseUrl) setBaseUrl(storedBaseUrl);
    if (storedApiKey) setApiKey(storedApiKey);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.baseUrl, baseUrl);
  }, [baseUrl]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.apiKey, apiKey);
  }, [apiKey]);

  useEffect(() => {
    let mounted = true;

    Promise.all([
      getCradFlowProfile(),
      getCradRecentClearanceRecords(),
      getCradIntegrationAuditLogs("registrar_student_list", 5),
      getCradIntegrationAuditLogs("student_recommendation", 5),
      getCradCashierLinks(),
      getCradCashierEvents(),
      getCradProgramActivityReport().catch(() => null),
    ])
      .then(([profile, records, studentLogs, recommendations, links, events, pmedReport]) => {
        if (!mounted) return;
        if (profile) {
          setFlowSummary(
            `${profile.department_name} is stage ${profile.clearance_stage_order} in the flow. Receives ${JSON.stringify(profile.receives)} and sends ${JSON.stringify(profile.sends)}.`
          );
        } else {
          setFlowSummary("No CRAD flow profile row was found in the schema yet.");
        }

        setClearanceSummary(
          records.length
            ? `Recent CRAD clearance records: ${records.map((record) => `${record.clearance_reference} (${record.status})`).join(", ")}`
            : "No CRAD clearance records were returned from the schema view yet."
        );
        setClearanceRecords(records);
        setRegistrarBatches(studentLogs);
        setRecommendationLogs(recommendations);
        setCashierLinks(links);
        setCashierEvents(events);
        setPmedReportPreview(pmedReport?.data ?? pmedReport ?? null);
      })
      .catch((error) => {
        if (!mounted) return;
        const message = error instanceof Error ? error.message : "Schema lookup failed.";
        setFlowSummary(`Unable to read crad.department_flow_profiles: ${message}`);
        setClearanceSummary(`Unable to read crad.department_clearance_records: ${message}`);
        setClearanceRecords([]);
        setRegistrarBatches([]);
        setRecommendationLogs([]);
        setCashierLinks([]);
        setCashierEvents([]);
        setPmedReportPreview(null);
      });

    return () => {
      mounted = false;
    };
  }, []);

  async function runRequest(label: string, input: RequestInfo | URL, init?: RequestInit) {
    setBusyAction(label);
    try {
      const response = await fetch(input, init);
      const payload = await response.json();
      setResponseText(JSON.stringify(payload, null, 2));
    } catch (error) {
      setResponseText(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : "Request failed." }, null, 2));
    } finally {
      setBusyAction("");
    }
  }

  function authHeaders(extra?: HeadersInit) {
    return {
      ...(apiKey ? { "x-integration-key": apiKey } : {}),
      ...extra,
    };
  }

  async function runFunction(label: string, functionName: string, body?: Record<string, unknown>) {
    setBusyAction(label);
    try {
      const { data, error } = await supabase.functions.invoke(functionName, body ? { body } : undefined);
      if (error) throw error;
      setResponseText(JSON.stringify(data, null, 2));
    } catch (error) {
      setResponseText(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : "Request failed." }, null, 2));
    } finally {
      setBusyAction("");
    }
  }

  async function loadProgramReport(label: string) {
    setBusyAction(label);
    try {
      const payload = await buildCradProgramActivityReport();
      const report = payload?.data ?? payload ?? null;
      setPmedReportPreview(report);
      setResponseText(
        JSON.stringify(
          {
            ok: true,
            message: "PMED report was stored in the database.",
            batch_id: report?.batch_id,
            generated_at: report?.generated_at,
            row_count: report?.row_count ?? report?.rows?.length ?? 0,
          },
          null,
          2
        )
      );
    } catch (error) {
      setResponseText(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : "Request failed." }, null, 2));
    } finally {
      setBusyAction("");
    }
  }

  async function submitGuidanceRecommendation() {
    setBusyAction("student-recommendation");
    try {
      const saved = await saveCradGuidanceRecommendation({
        student_id: studentNo,
        student_name: studentName,
        recommendation_type: recommendationType,
        guidance_status: guidanceStatus,
        recommended_by: recommendedBy,
        summary: notes,
        notes,
        reference_no: referenceNo,
      });
      setResponseText(JSON.stringify({ ok: true, message: "Student recommendation received.", data: saved }, null, 2));
      const logs = await getCradIntegrationAuditLogs("student_recommendation", 5);
      setRecommendationLogs(logs);
    } catch (error) {
      setResponseText(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : "Request failed." }, null, 2));
    } finally {
      setBusyAction("");
    }
  }

  async function previewGuidanceRecommendations() {
    setBusyAction("student-recommendation-list");
    try {
      const logs = await getCradIntegrationAuditLogs("student_recommendation", 20);
      setRecommendationLogs(logs);
      setResponseText(JSON.stringify({ ok: true, data: logs }, null, 2));
    } catch (error) {
      setResponseText(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : "Request failed." }, null, 2));
    } finally {
      setBusyAction("");
    }
  }

  const integrationCards = useMemo(
    () => [
      {
        title: "Student List",
        partner: "Registrar",
        direction: "receive" as const,
        status: baseUrl ? ("connected" as const) : ("attention" as const),
        statusLabel: baseUrl ? "Endpoint linked" : "Setup needed",
        summary: "Receive the registrar roster feed so CRAD can work against the same student directory.",
        icon: <Users className="h-5 w-5 text-sky-700" />,
      },
      {
        title: "Student Recommendations",
        partner: "Guidance",
        direction: "receive" as const,
        status: "ready" as const,
        statusLabel: "Function ready",
        summary: "Accept recommendations from Guidance through the `student-recommendations` Supabase function.",
        icon: <ShieldCheck className="h-5 w-5 text-emerald-700" />,
      },
      {
        title: "Activity Participation Records",
        partner: "Registrar",
        direction: "send" as const,
        status: baseUrl ? ("connected" as const) : ("attention" as const),
        statusLabel: baseUrl ? "Ready to send" : "Endpoint missing",
        summary: "Push CRAD participation and completion records into the registrar integration endpoint.",
        icon: <GitBranch className="h-5 w-5 text-amber-700" />,
      },
      {
        title: "Program Activity Reports",
        partner: "PMED",
        direction: "send" as const,
        status: "ready" as const,
        statusLabel: "Payload ready",
        summary: "Build outbound activity report payloads for PMED directly from Supabase function output.",
        icon: <Activity className="h-5 w-5 text-emerald-700" />,
      },
    ],
    [baseUrl]
  );

  const schemaHealth = useMemo(() => {
    if (flowSummary.startsWith("Unable") || clearanceSummary.startsWith("Unable")) {
      return { status: "attention" as const, label: "Schema issue" };
    }
    if (flowSummary.includes("No CRAD") || clearanceSummary.includes("No CRAD")) {
      return { status: "attention" as const, label: "Needs data" };
    }
    return { status: "ready" as const, label: "Schema linked" };
  }, [clearanceSummary, flowSummary]);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <Card className="overflow-hidden border-slate-200 bg-gradient-to-br from-white via-slate-50 to-sky-50">
          <CardContent className="p-0">
            <div className="border-b border-slate-200/80 px-6 py-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="border-sky-200 bg-sky-100 text-sky-700 hover:bg-sky-100">Integration Hub</Badge>
                    <StatusPill status={schemaHealth.status} label={schemaHealth.label} />
                  </div>
                  <div>
                    <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Department Integration Hub</h1>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                      Centralize inbound and outbound integrations for Registrar, Guidance, and PMED in one operational workspace.
                    </p>
                  </div>
                </div>

                <div className="grid gap-2 text-sm text-slate-600 sm:text-right">
                  <div className="rounded-2xl border border-white/80 bg-white/80 px-4 py-3 shadow-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Receives</p>
                    <p className="mt-1 font-medium text-slate-900">Student list, recommendations</p>
                  </div>
                  <div className="rounded-2xl border border-white/80 bg-white/80 px-4 py-3 shadow-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Sends</p>
                    <p className="mt-1 font-medium text-slate-900">Activity records, PMED reports</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-4 px-6 py-5 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
                <div className="mb-3 flex items-center gap-2">
                  <Database className="h-4 w-4 text-sky-700" />
                  <h2 className="text-sm font-semibold text-slate-900">CRAD Flow Profile</h2>
                </div>
                <p className="text-sm leading-6 text-slate-600">{flowSummary}</p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
                <div className="mb-3 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                  <h2 className="text-sm font-semibold text-slate-900">Clearance Snapshot</h2>
                </div>
                <p className="text-sm leading-6 text-slate-600">{clearanceSummary}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-slate-950 text-white">
          <CardHeader>
            <CardTitle className="text-white">Connection Controls</CardTitle>
            <CardDescription className="text-slate-300">Persist registrar connection details for day-to-day sync operations.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="grid gap-2 text-sm">
              Registrar API URL
              <Input
                value={baseUrl}
                onChange={(event) => setBaseUrl(event.target.value)}
                placeholder="http://localhost:3000/api/integrations"
                className="border-slate-700 bg-slate-900 text-white placeholder:text-slate-500"
              />
            </label>
            <label className="grid gap-2 text-sm">
              Integration API Key
              <Input
                value={apiKey}
                onChange={(event) => setApiKey(event.target.value)}
                placeholder="Optional shared key"
                className="border-slate-700 bg-slate-900 text-white placeholder:text-slate-500"
              />
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <Button
                variant="secondary"
                className="justify-start bg-white text-slate-900 hover:bg-slate-100"
                onClick={() => runRequest("manifest", `${baseUrl}?resource=manifest`, { headers: authHeaders() })}
                disabled={busyAction !== ""}
              >
                <Link2 className="h-4 w-4" />
                {busyAction === "manifest" ? "Loading Manifest..." : "Load Manifest"}
              </Button>
              <Button
                variant="secondary"
                className="justify-start bg-white text-slate-900 hover:bg-slate-100"
                onClick={() => loadProgramReport("program-report")}
                disabled={busyAction !== ""}
              >
                <Activity className="h-4 w-4" />
                {busyAction === "program-report" ? "Building..." : "Build PMED Payload"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {integrationCards.map((item) => (
          <Card key={item.title} className="border-slate-200 bg-white shadow-sm">
            <CardHeader className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100">
                  {item.icon}
                </div>
                <StatusPill status={item.status} label={item.statusLabel} />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle className="text-base text-slate-900">{item.title}</CardTitle>
                  <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${directionStyles[item.direction]}`}>
                    {item.direction === "receive" ? "Receives" : "Sends"}
                  </span>
                </div>
                <CardDescription className="mt-2 text-slate-500">{item.partner}</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
                <p className="text-sm leading-6 text-slate-600">{item.summary}</p>
              <div className="mt-4">
                <Link
                  to={
                    item.title === "Student List"
                      ? "/integrations/student-list"
                      : item.title === "Student Recommendations"
                        ? "/integrations/guidance/recommendations"
                        : item.title === "Activity Participation Records"
                          ? "/integrations/cashier"
                          : "/integrations/pmed/reports"
                  }
                  className="inline-flex items-center gap-2 text-sm font-medium text-sky-700 underline-offset-4 hover:underline"
                >
                  Open table view
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardDescription>Registrar student batches</CardDescription>
            <CardTitle>{registrarBatches.length}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-slate-600">Newest inbound roster batches now have a dedicated table page.</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardDescription>Guidance recommendations</CardDescription>
            <CardTitle>{recommendationLogs.length}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-slate-600">Recommendations received through Guidance are visible in their own queue.</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardDescription>Cashier payment links</CardDescription>
            <CardTitle>{cashierLinks.length}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-slate-600">Outbound billing link state is tracked separately from the clearance table.</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardDescription>Cashier sync events</CardDescription>
            <CardTitle>{cashierEvents.length}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-slate-600">Failed or synced push events are visible in the cashier monitor page.</p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-sky-700" />
                Registrar Inbound
              </CardTitle>
              <CardDescription>Pull the student list and validate the registrar connection before staff starts processing.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-600">Endpoint</p>
                <p className="mt-1 font-mono text-xs text-slate-900">GET {baseUrl}?resource=student-list</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={() => runRequest("student-list", `${baseUrl}?resource=student-list`, { headers: authHeaders() })}
                  disabled={busyAction !== ""}
                >
                  <RefreshCw className="h-4 w-4" />
                  {busyAction === "student-list" ? "Fetching..." : "Fetch Student List"}
                </Button>
                <a href={baseUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-medium text-sky-700 underline-offset-4 hover:underline">
                  Open Registrar Endpoint
                  <ArrowUpRight className="h-4 w-4" />
                </a>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="h-4 w-4 text-amber-700" />
                Registrar Outbound
              </CardTitle>
              <CardDescription>Send activity participation records with a structured payload and a visible delivery state.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <label className="grid gap-2 text-sm">
                  Student Number
                  <Input value={studentNo} onChange={(event) => setStudentNo(event.target.value)} placeholder="2025-0001" />
                </label>
                <label className="grid gap-2 text-sm">
                  Reference No
                  <Input value={referenceNo} onChange={(event) => setReferenceNo(event.target.value)} placeholder="CRAD-2026-001" />
                </label>
                <label className="grid gap-2 text-sm">
                  Title
                  <Input value={title} onChange={(event) => setTitle(event.target.value)} />
                </label>
                <label className="grid gap-2 text-sm">
                  Status
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={status}
                    onChange={(event) => setStatus(event.target.value)}
                  >
                    <option>Completed</option>
                    <option>Pending</option>
                    <option>Received</option>
                  </select>
                </label>
              </div>

              <label className="grid gap-2 text-sm">
                Notes
                <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Activity details, completion note, or participation context" />
              </label>

              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={() =>
                    runRequest("activity-record", baseUrl, {
                      method: "POST",
                      headers: authHeaders({ "Content-Type": "application/json" }),
                      body: JSON.stringify({
                        resource: "activity-participation-records",
                        student_no: studentNo,
                        reference_no: referenceNo,
                        title,
                        status,
                        notes,
                      }),
                    })
                  }
                  disabled={!studentNo || busyAction !== ""}
                >
                  <Send className="h-4 w-4" />
                  {busyAction === "activity-record" ? "Sending..." : "Send Activity Record"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-700" />
                  Guidance Intake
                </CardTitle>
                <CardDescription>Receive student recommendations from Guidance through the shared function endpoint.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <label className="grid gap-2 text-sm">
                    Student Number
                    <Input value={studentNo} onChange={(event) => setStudentNo(event.target.value)} placeholder="2025-0001" />
                  </label>
                  <label className="grid gap-2 text-sm">
                    Student Name
                    <Input value={studentName} onChange={(event) => setStudentName(event.target.value)} placeholder="Juan Dela Cruz" />
                  </label>
                  <label className="grid gap-2 text-sm">
                    Recommendation Type
                    <Input value={recommendationType} onChange={(event) => setRecommendationType(event.target.value)} />
                  </label>
                  <label className="grid gap-2 text-sm">
                    Guidance Status
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={guidanceStatus}
                      onChange={(event) => setGuidanceStatus(event.target.value)}
                    >
                      <option value="pending">Pending</option>
                      <option value="endorsed">Endorsed</option>
                      <option value="for-review">For Review</option>
                    </select>
                  </label>
                  <label className="grid gap-2 text-sm">
                    Recommended By
                    <Input value={recommendedBy} onChange={(event) => setRecommendedBy(event.target.value)} />
                  </label>
                  <label className="grid gap-2 text-sm">
                    Summary / Notes
                    <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Recommendation summary from Guidance" />
                  </label>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={submitGuidanceRecommendation}
                    disabled={!studentNo || busyAction !== ""}
                  >
                    <Send className="h-4 w-4" />
                    {busyAction === "student-recommendation" ? "Receiving..." : "Receive Recommendation"}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={previewGuidanceRecommendations}
                    disabled={busyAction !== ""}
                  >
                    <RefreshCw className="h-4 w-4" />
                    {busyAction === "student-recommendation-list" ? "Loading..." : "View Recent"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-emerald-700" />
                  PMED Reporting
                </CardTitle>
                <CardDescription>Build and save outbound program activity reports for PMED from the live CRAD database.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-sm font-semibold text-emerald-800">Outgoing payload</p>
                  <p className="mt-2 text-sm leading-6 text-emerald-700">
                    The PMED integration compiles research, manuscripts, payments, defenses, announcements, and audit signals, then stores the latest batch in the database.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button onClick={() => loadProgramReport("program-report")} disabled={busyAction !== ""}>
                    <Activity className="h-4 w-4" />
                    {busyAction === "program-report" ? "Building..." : "Build + Load PMED Report"}
                  </Button>
                </div>
                {pmedReportPreview ? (
                  <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="grid gap-3 md:grid-cols-3">
                      <div className="rounded-xl border border-slate-200 bg-white px-3 py-3">
                        <p className="text-[11px] uppercase tracking-wide text-slate-500">Batch</p>
                        <p className="mt-2 text-sm font-semibold text-slate-900">{pmedReportPreview.batch_id || "Latest batch"}</p>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-white px-3 py-3">
                        <p className="text-[11px] uppercase tracking-wide text-slate-500">Generated</p>
                        <p className="mt-2 text-sm font-semibold text-slate-900">
                          {pmedReportPreview.generated_at ? format(new Date(pmedReportPreview.generated_at), "MMM d, yyyy h:mm a") : "Not available"}
                        </p>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-white px-3 py-3">
                        <p className="text-[11px] uppercase tracking-wide text-slate-500">Rows Stored</p>
                        <p className="mt-2 text-sm font-semibold text-slate-900">{pmedReportPreview.row_count ?? pmedReportPreview.rows?.length ?? 0}</p>
                      </div>
                    </div>

                    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-slate-500">
                          <tr>
                            <th className="px-4 py-3 text-left font-semibold">Section</th>
                            <th className="px-4 py-3 text-left font-semibold">Reference</th>
                            <th className="px-4 py-3 text-left font-semibold">Title</th>
                            <th className="px-4 py-3 text-left font-semibold">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(pmedReportPreview.rows || []).slice(0, 5).map((row: any, index: number) => (
                            <tr key={`${row.batch_id || pmedReportPreview.batch_id}-${row.section}-${row.row_index || index}`} className="border-t border-slate-200">
                              <td className="px-4 py-3 text-slate-600 capitalize">{String(row.section || "").replace(/-/g, " ")}</td>
                              <td className="px-4 py-3 font-medium text-slate-900">{row.reference_code || "N/A"}</td>
                              <td className="px-4 py-3 text-slate-600">{row.title || "Untitled"}</td>
                              <td className="px-4 py-3 text-slate-600 capitalize">{String(row.status || "n/a").replace(/_/g, " ")}</td>
                            </tr>
                          ))}
                          {!(pmedReportPreview.rows || []).length ? (
                            <tr>
                              <td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-500">
                                No stored PMED rows yet.
                              </td>
                            </tr>
                          ) : null}
                        </tbody>
                      </table>
                    </div>

                    <Link to="/integrations/pmed/reports" className="inline-flex items-center gap-2 text-sm font-medium text-sky-700 underline-offset-4 hover:underline">
                      Open full PMED report table
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>

          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-sky-700" />
                Recent Clearance Records
              </CardTitle>
              <CardDescription>Live rows from `crad.department_clearance_records`, backed by the clinic seed data.</CardDescription>
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
                    {clearanceRecords.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-500">
                          No seeded CRAD clearance rows found yet.
                        </td>
                      </tr>
                    ) : (
                      clearanceRecords.map((record) => (
                        <tr key={record.id} className="border-t border-slate-200">
                          <td className="px-4 py-3">
                            <p className="font-medium text-slate-900">{record.clearance_reference}</p>
                            <p className="text-xs text-slate-500">{record.external_reference || "No external reference"}</p>
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            <p>{record.patient_name}</p>
                            <p className="text-xs uppercase tracking-wide text-slate-400">{record.patient_type}</p>
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-semibold capitalize text-slate-700">
                              {String(record.status).replace(/_/g, " ")}
                            </span>
                          </td>
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
        </div>

        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle>Response Preview</CardTitle>
            <CardDescription>Live output for registrar, guidance, and PMED integration requests.</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="min-h-[780px] overflow-auto rounded-2xl border border-slate-200 bg-slate-950 p-4 text-xs leading-6 text-slate-100">{responseText}</pre>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
