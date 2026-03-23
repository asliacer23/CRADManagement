import { useEffect, useState } from "react";
import { UserPlus, RefreshCw, Send } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  fetchHrStaffRequestStatus,
  fetchHrStaffRequests,
  createHrStaffRequest,
  type HrStaffRequestRow,
  type HrStaffRequestStatus,
} from "../services/hrStaffRequestService";
import { HR_STAFF_INTEGRATION_ROLES, type HrStaffIntegrationRoleCode } from "../../../../../shared/hrStaffIntegrationRoles";

function roleLabel(r: string) { return r.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()); }
function formatDt(v: string | null) { if (!v) return "--"; const d = new Date(v); return isNaN(d.getTime()) ? v : d.toLocaleString(); }

function StatusBadge({ status }: { status: string }) {
  const variant =
    status === "approved" || status === "hired" ? "default" :
    status === "rejected" ? "destructive" :
    "secondary";
  return <Badge variant={variant}>{status}</Badge>;
}

export function HrStaffRequestPage() {
  const [statusData, setStatusData] = useState<HrStaffRequestStatus | null>(null);
  const [requests, setRequests] = useState<HrStaffRequestRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const perPage = 10;
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [requestLoading, setRequestLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [roleType, setRoleType] = useState<HrStaffIntegrationRoleCode>("research_coordinator");
  const [count, setCount] = useState(1);
  const [notes, setNotes] = useState("");
  const [requestedBy, setRequestedBy] = useState("CRAD Admin");

  async function loadAll(silent = false) {
    if (!silent) setRequestLoading(true);
    try {
      const [s, r] = await Promise.all([
        fetchHrStaffRequestStatus(),
        fetchHrStaffRequests({ search: search || undefined, status: statusFilter, page, perPage }),
      ]);
      setStatusData(s);
      setRequests(r.items);
      setTotal(r.total);
    } catch (e) { if (!silent) toast.error(e instanceof Error ? e.message : "Failed to load data"); }
    finally { setRequestLoading(false); setLoading(false); }
  }

  useEffect(() => { void loadAll(); }, [search, statusFilter, page]);

  async function handleSubmit() {
    setSubmitting(true);
    try {
      await createHrStaffRequest({ roleType, requestedCount: count, requestedBy, requestNotes: notes });
      setDialogOpen(false);
      toast.success("Staff request sent to HR.");
      await loadAll();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Request failed"); }
    finally { setSubmitting(false); }
  }

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black">Request Staff from HR</h1>
          <p className="text-muted-foreground">Submit staffing requests to HR and monitor approval status for CRAD staff.</p>
        </div>
        <Button onClick={() => { setDialogOpen(true); setRoleType("research_coordinator"); setCount(1); setNotes(""); }}>
          <UserPlus className="mr-2 h-4 w-4" /> Request Staff
        </Button>
      </div>

      {statusData && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { title: "Active Roster", value: statusData.totals.activeRoster, subtitle: "Currently active" },
            { title: "Working Roster", value: statusData.totals.workingRoster, subtitle: "On duty" },
            { title: "Pending Requests", value: statusData.totals.pendingRequests, subtitle: "Awaiting HR" },
            { title: "Approved", value: statusData.totals.approvedRequests, subtitle: "Approved by HR" },
          ].map(c => (
            <Card key={c.title}>
              <CardContent className="pt-6">
                <div className="text-2xl font-black">{c.value}</div>
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-wide">{c.title}</div>
                <div className="text-xs text-muted-foreground">{c.subtitle}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader><CardTitle>HR Staff Requests</CardTitle></CardHeader>
        <CardContent>
          <div className="flex gap-3 mb-4 flex-wrap">
            <Input placeholder="Search reference, employee, name…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="max-w-sm" />
            <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                {["all","pending","queue","waiting_applicant","hiring","approved","hired","rejected"].map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={() => loadAll()} disabled={requestLoading}>
              <RefreshCw className={`h-4 w-4 ${requestLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>REQUEST</TableHead><TableHead>STAFF</TableHead>
                <TableHead>ROLE</TableHead><TableHead>STATUS</TableHead>
                <TableHead>REQUESTED BY</TableHead><TableHead>CREATED</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map(r => (
                <TableRow key={r.id}>
                  <TableCell>
                    <div className="font-semibold">{r.request_reference}</div>
                    <div className="text-xs text-muted-foreground">{r.employee_no}</div>
                  </TableCell>
                  <TableCell>{r.staff_name}</TableCell>
                  <TableCell><Badge variant="outline">{roleLabel(r.role_type)}</Badge></TableCell>
                  <TableCell><StatusBadge status={r.request_status} /></TableCell>
                  <TableCell>{r.requested_by ?? "--"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDt(r.created_at)}</TableCell>
                </TableRow>
              ))}
              {!loading && requests.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No requests found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>

          <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
            <span>Showing {requests.length} of {total}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
              <span className="px-2 py-1">{page} / {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Request Staff from HR</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Role type</Label>
                <Select value={roleType} onValueChange={v => setRoleType(v as HrStaffIntegrationRoleCode)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {HR_STAFF_INTEGRATION_ROLES.map((r) => (
                      <SelectItem key={r.value} value={r.value}>{r.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Requested count</Label>
                <Input type="number" min={1} value={count} onChange={e => setCount(Math.max(1, parseInt(e.target.value) || 1))} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Requested by</Label>
              <Input value={requestedBy} onChange={e => setRequestedBy(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Notes</Label>
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Optional notes for HR…" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Sending…" : "Send Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
