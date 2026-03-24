import { useEffect, useState } from "react";
import { Monitor, RefreshCw, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  fetchComlabUnitRequestSummary,
  fetchComlabUnitRequests,
  createComlabUnitRequest,
  cancelComlabUnitRequest,
  DEVICE_TYPES,
  type ComlabUnitRequestRow,
  type ComlabUnitRequestSummary,
  type DeviceType,
} from "../services/comlabUnitRequestService";
import { useAuth } from "@/shared/hooks/useAuth";

function formatDt(v: string | null) {
  if (!v) return "—";
  const d = new Date(v);
  return isNaN(d.getTime()) ? v : d.toLocaleString();
}

function formatDate(v: string | null) {
  if (!v) return "—";
  const d = new Date(v);
  return isNaN(d.getTime()) ? v : d.toLocaleDateString();
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  fulfilled: "Fulfilled",
  cancelled: "Cancelled",
};

function StatusBadge({ status }: { status: string }) {
  const variant =
    status === "fulfilled" || status === "approved"
      ? "default"
      : status === "rejected" || status === "cancelled"
      ? "destructive"
      : "secondary";
  return (
    <Badge variant={variant} className="capitalize">
      {STATUS_LABELS[status] ?? status}
    </Badge>
  );
}

export function ComlabUnitRequestPage() {
  const { user } = useAuth();

  const [summary, setSummary] = useState<ComlabUnitRequestSummary | null>(null);
  const [requests, setRequests] = useState<ComlabUnitRequestRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const perPage = 10;
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [deviceType, setDeviceType] = useState<DeviceType>("Desktop Computer");
  const [quantity, setQuantity] = useState(1);
  const [specifications, setSpecifications] = useState("");
  const [purpose, setPurpose] = useState("");
  const [locationForUse, setLocationForUse] = useState("");
  const [dateNeeded, setDateNeeded] = useState("");
  const [notes, setNotes] = useState("");

  const [viewRow, setViewRow] = useState<ComlabUnitRequestRow | null>(null);
  const [cancelTarget, setCancelTarget] = useState<ComlabUnitRequestRow | null>(null);

  async function loadAll(silent = false) {
    if (!silent) setListLoading(true);
    try {
      const [s, r] = await Promise.all([
        fetchComlabUnitRequestSummary(),
        fetchComlabUnitRequests({ search: search || undefined, status: statusFilter, page, perPage }),
      ]);
      setSummary(s);
      setRequests(r.items);
      setTotal(r.total);
    } catch (e) {
      if (!silent) toast.error(e instanceof Error ? e.message : "Failed to load data");
    } finally {
      setListLoading(false);
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAll();
  }, [search, statusFilter, page]);

  function resetForm() {
    setDeviceType("Desktop Computer");
    setQuantity(1);
    setSpecifications("");
    setPurpose("");
    setLocationForUse("");
    setDateNeeded("");
    setNotes("");
  }

  async function handleSubmit() {
    if (!purpose.trim()) {
      toast.error("Purpose / justification is required.");
      return;
    }
    setSubmitting(true);
    try {
      await createComlabUnitRequest({
        deviceType,
        quantity,
        specifications: specifications.trim() || undefined,
        purpose: purpose.trim(),
        locationForUse: locationForUse.trim() || undefined,
        dateNeeded: dateNeeded || undefined,
        requestedBy: user?.name ?? "CRAD Staff",
        notes: notes.trim() || undefined,
      });
      setDialogOpen(false);
      resetForm();
      toast.success("Request submitted to Comlab successfully.");
      await loadAll();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancel(row: ComlabUnitRequestRow) {
    try {
      await cancelComlabUnitRequest(row.id);
      setCancelTarget(null);
      toast.success("Request cancelled.");
      await loadAll();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Cancel failed");
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black">Request Computer Units from Comlab</h1>
          <p className="text-muted-foreground">
            Submit and track computer unit requests to the Computer Laboratory.
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setDialogOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" /> New Request
        </Button>
      </div>

      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { title: "Total", value: summary.total, sub: "All time" },
            { title: "Pending", value: summary.pending, sub: "Awaiting Comlab" },
            { title: "Approved", value: summary.approved, sub: "Approved by Comlab" },
            { title: "Fulfilled", value: summary.fulfilled, sub: "Unit delivered" },
            { title: "Rejected", value: summary.rejected, sub: "Not approved" },
          ].map((c) => (
            <Card key={c.title}>
              <CardContent className="pt-6">
                <div className="text-2xl font-black">{c.value}</div>
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                  {c.title}
                </div>
                <div className="text-xs text-muted-foreground">{c.sub}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>My Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 mb-4 flex-wrap">
            <Input
              placeholder="Search reference, device, purpose…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="max-w-sm"
            />
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["all", "pending", "approved", "rejected", "fulfilled", "cancelled"].map((s) => (
                  <SelectItem key={s} value={s}>
                    {s === "all" ? "All Statuses" : STATUS_LABELS[s] ?? s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={() => loadAll()}
              disabled={listLoading}
            >
              <RefreshCw className={`h-4 w-4 ${listLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>REFERENCE</TableHead>
                <TableHead>DEVICE TYPE</TableHead>
                <TableHead>QTY</TableHead>
                <TableHead>PURPOSE</TableHead>
                <TableHead>DATE NEEDED</TableHead>
                <TableHead>STATUS</TableHead>
                <TableHead>SUBMITTED</TableHead>
                <TableHead>ACTIONS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <div className="font-semibold text-sm">{r.request_reference}</div>
                    <div className="text-xs text-muted-foreground">{r.requested_by}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{r.device_type}</Badge>
                  </TableCell>
                  <TableCell className="text-center font-bold">{r.quantity}</TableCell>
                  <TableCell
                    className="max-w-[180px] truncate text-sm text-muted-foreground"
                    title={r.purpose}
                  >
                    {r.purpose}
                  </TableCell>
                  <TableCell className="text-sm">{formatDate(r.date_needed)}</TableCell>
                  <TableCell>
                    <StatusBadge status={r.status} />
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDt(r.created_at)}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setViewRow(r)}
                      >
                        View
                      </Button>
                      {r.status === "pending" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setCancelTarget(r)}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!loading && requests.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center text-muted-foreground py-10"
                  >
                    <Monitor className="mx-auto mb-2 h-8 w-8 opacity-30" />
                    <p>No requests found.</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
            <span>
              Showing {requests.length} of {total}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <span className="px-2 py-1">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── New Request Dialog ── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              <Monitor className="inline mr-2 h-5 w-5" />
              Request Computer Unit from Comlab
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Device Type *</Label>
                <Select
                  value={deviceType}
                  onValueChange={(v) => setDeviceType(v as DeviceType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DEVICE_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Quantity *</Label>
                <Input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) =>
                    setQuantity(Math.max(1, parseInt(e.target.value) || 1))
                  }
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label>Specifications</Label>
              <Input
                value={specifications}
                onChange={(e) => setSpecifications(e.target.value)}
                placeholder="e.g. Core i5, 8GB RAM, SSD 256GB…"
              />
            </div>

            <div className="space-y-1">
              <Label>Purpose / Justification *</Label>
              <Textarea
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                rows={3}
                placeholder="Why is this unit needed? What will it be used for?"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Location for Use</Label>
                <Input
                  value={locationForUse}
                  onChange={(e) => setLocationForUse(e.target.value)}
                  placeholder="e.g. CRAD Office, Room 201"
                />
              </div>
              <div className="space-y-1">
                <Label>Date Needed</Label>
                <Input
                  type="date"
                  value={dateNeeded}
                  onChange={(e) => setDateNeeded(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label>Additional Notes</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Optional notes for the Comlab team…"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Submitting…" : "Submit Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── View Detail Dialog ── */}
      <Dialog open={!!viewRow} onOpenChange={() => setViewRow(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Request Details</DialogTitle>
          </DialogHeader>
          {viewRow && (
            <div className="space-y-3 text-sm">
              <div className="flex gap-2 flex-wrap">
                <Badge variant="outline">{viewRow.device_type}</Badge>
                <StatusBadge status={viewRow.status} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">
                  Reference
                </p>
                <p className="font-mono font-semibold">{viewRow.request_reference}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">
                    Quantity
                  </p>
                  <p>{viewRow.quantity}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">
                    Date Needed
                  </p>
                  <p>{formatDate(viewRow.date_needed)}</p>
                </div>
              </div>
              {viewRow.specifications && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">
                    Specifications
                  </p>
                  <p>{viewRow.specifications}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">
                  Purpose
                </p>
                <p className="text-muted-foreground leading-relaxed">{viewRow.purpose}</p>
              </div>
              {viewRow.location_for_use && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">
                    Location for Use
                  </p>
                  <p>{viewRow.location_for_use}</p>
                </div>
              )}
              {viewRow.notes && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">
                    Notes
                  </p>
                  <p className="text-muted-foreground">{viewRow.notes}</p>
                </div>
              )}
              {(viewRow.comlab_notes || viewRow.reviewed_by_name) && (
                <div className="rounded-md border border-border bg-muted/40 p-3 space-y-1">
                  <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    Comlab Response
                  </p>
                  {viewRow.reviewed_by_name && (
                    <p className="text-xs">
                      Reviewed by{" "}
                      <span className="font-semibold">{viewRow.reviewed_by_name}</span>{" "}
                      on {formatDt(viewRow.reviewed_at)}
                    </p>
                  )}
                  {viewRow.comlab_notes && (
                    <p className="text-muted-foreground">{viewRow.comlab_notes}</p>
                  )}
                  {viewRow.fulfilled_at && (
                    <p className="text-xs text-green-600 font-semibold">
                      Fulfilled on {formatDt(viewRow.fulfilled_at)}
                    </p>
                  )}
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">
                  Submitted
                </p>
                <p className="text-xs text-muted-foreground">{formatDt(viewRow.created_at)}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewRow(null)}>
              Close
            </Button>
            {viewRow?.status === "pending" && (
              <Button
                variant="destructive"
                onClick={() => {
                  setCancelTarget(viewRow);
                  setViewRow(null);
                }}
              >
                <X className="mr-2 h-4 w-4" /> Cancel Request
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Cancel Confirm ── */}
      <AlertDialog open={!!cancelTarget} onOpenChange={() => setCancelTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Request?</AlertDialogTitle>
            <AlertDialogDescription>
              This will cancel request{" "}
              <span className="font-mono font-semibold">
                {cancelTarget?.request_reference}
              </span>
              . This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Request</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => cancelTarget && handleCancel(cancelTarget)}
            >
              Yes, Cancel It
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
