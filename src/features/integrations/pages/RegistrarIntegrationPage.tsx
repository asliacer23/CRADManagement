import { useEffect, useState } from "react";
import { ArrowUpRight, Link2, RefreshCw, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getCradFlowProfile, getCradRecentClearanceRecords } from "@/features/integrations/services/registrarIntegrationService";
import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEYS = {
  baseUrl: "crad.registrar.baseUrl",
  apiKey: "crad.registrar.apiKey"
};

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
  const [responseText, setResponseText] = useState("Run a registrar integration action to preview the response here.");
  const [busyAction, setBusyAction] = useState("");
  const [flowSummary, setFlowSummary] = useState("Loading CRAD schema flow profile...");
  const [clearanceSummary, setClearanceSummary] = useState("Loading CRAD clearance view...");

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

    Promise.all([getCradFlowProfile(), getCradRecentClearanceRecords()])
      .then(([profile, records]) => {
        if (!mounted) return;
        if (profile) {
          setFlowSummary(
            `${profile.department_name} is stage ${profile.clearance_stage_order} in the flow. Receives ${JSON.stringify(profile.receives)} and sends ${JSON.stringify(profile.sends)}.`
          );
        } else {
          setFlowSummary("No CRAD flow profile row was found in the Postgres schema.");
        }
        setClearanceSummary(
          records.length
            ? `Recent CRAD clearance records loaded from schema view: ${records.map((record) => `${record.clearance_reference} (${record.status})`).join(", ")}`
            : "No CRAD clearance records were returned from the schema view yet."
        );
      })
      .catch((error) => {
        if (!mounted) return;
        const message = error instanceof Error ? error.message : "Schema lookup failed.";
        setFlowSummary(`Unable to read crad.department_flow_profiles: ${message}`);
        setClearanceSummary(`Unable to read crad.department_clearance_records: ${message}`);
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
      ...extra
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Registrar Integration</h1>
        <p className="text-sm text-muted-foreground mt-2">
          CRAD sends activity participation records to registrar and can pull the registrar student list for synced workflows.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>CRAD Schema Flow Profile</CardTitle>
            <CardDescription>Read from `crad.department_flow_profiles` in Postgres.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{flowSummary}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>CRAD Clearance View</CardTitle>
            <CardDescription>Read from `crad.department_clearance_records` in Postgres.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{clearanceSummary}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader>
            <CardTitle>Connection Settings</CardTitle>
            <CardDescription>Point this CRAD module to registrar and use the CRAD API endpoints for Guidance and PMED.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm">
                Registrar API URL
                <Input value={baseUrl} onChange={(event) => setBaseUrl(event.target.value)} placeholder="http://localhost:3000/api/integrations" />
              </label>
              <label className="grid gap-2 text-sm">
                Integration API Key
                <Input value={apiKey} onChange={(event) => setApiKey(event.target.value)} placeholder="Optional shared key" />
              </label>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-lg border p-4">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Outgoing</Badge>
                  <span className="text-sm font-medium">Activity Participation Records</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">`POST {baseUrl}?resource=activity-participation-records`</p>
              </div>
              <div className="rounded-lg border p-4">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Incoming</Badge>
                  <span className="text-sm font-medium">Student List Feed</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">`GET {baseUrl}?resource=student-list`</p>
              </div>
              <div className="rounded-lg border p-4">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Incoming API</Badge>
                  <span className="text-sm font-medium">Student Recommendations</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">Supabase function: `student-recommendations`</p>
              </div>
              <div className="rounded-lg border p-4">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Outgoing API</Badge>
                  <span className="text-sm font-medium">Program Activity Reports</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">Supabase function: `program-activity-reports`</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                onClick={() => runRequest("manifest", `${baseUrl}?resource=manifest`, { headers: authHeaders() })}
                disabled={busyAction !== ""}
              >
                <Link2 className="h-4 w-4" />
                {busyAction === "manifest" ? "Loading..." : "Load Manifest"}
              </Button>
              <Button
                variant="outline"
                onClick={() => runRequest("student-list", `${baseUrl}?resource=student-list`, { headers: authHeaders() })}
                disabled={busyAction !== ""}
              >
                <RefreshCw className="h-4 w-4" />
                {busyAction === "student-list" ? "Fetching..." : "Fetch Student List"}
              </Button>
              <Button
                variant="outline"
                onClick={() => runFunction("program-report", "program-activity-reports")}
                disabled={busyAction !== ""}
              >
                <RefreshCw className="h-4 w-4" />
                {busyAction === "program-report" ? "Loading..." : "Load PMED Report Payload"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Response Preview</CardTitle>
            <CardDescription>Live registrar response output for CRAD integration requests.</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="min-h-[420px] overflow-auto rounded-lg bg-muted p-4 text-xs leading-6">{responseText}</pre>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Send Activity Participation Record</CardTitle>
          <CardDescription>Use this form when CRAD needs to push an activity participation record into registrar.</CardDescription>
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
          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={() =>
                runRequest(
                  "activity-record",
                  baseUrl,
                  {
                    method: "POST",
                    headers: authHeaders({ "Content-Type": "application/json" }),
                    body: JSON.stringify({
                      resource: "activity-participation-records",
                      student_no: studentNo,
                      reference_no: referenceNo,
                      title,
                      status,
                      notes
                    })
                  }
                )
              }
              disabled={!studentNo || busyAction !== ""}
            >
              <Send className="h-4 w-4" />
              {busyAction === "activity-record" ? "Sending..." : "Send To Registrar"}
            </Button>
            <a href={baseUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm text-primary underline-offset-4 hover:underline">
              Open Registrar Endpoint
              <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Receive Student Recommendation</CardTitle>
          <CardDescription>Guidance can submit student recommendations to CRAD through the `student-recommendations` API endpoint.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
          </div>
          <label className="grid gap-2 text-sm">
            Summary / Notes
            <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Recommendation summary from Guidance" />
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={() =>
                runFunction("student-recommendation", "student-recommendations", {
                  student_id: studentNo,
                  student_name: studentName,
                  recommendation_type: recommendationType,
                  guidance_status: guidanceStatus,
                  recommended_by: recommendedBy,
                  summary: notes,
                  notes,
                  reference_no: referenceNo,
                })
              }
              disabled={!studentNo || busyAction !== ""}
            >
              <Send className="h-4 w-4" />
              {busyAction === "student-recommendation" ? "Receiving..." : "Receive Recommendation"}
            </Button>
            <Button
              variant="outline"
              onClick={() => runFunction("student-recommendation-list", "student-recommendations")}
              disabled={busyAction !== ""}
            >
              <RefreshCw className="h-4 w-4" />
              {busyAction === "student-recommendation-list" ? "Loading..." : "View Recent Recommendations"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
