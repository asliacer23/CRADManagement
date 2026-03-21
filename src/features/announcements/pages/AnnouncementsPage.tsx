import React, { useMemo, useState } from "react";
import { Eye, Megaphone, Pin, Pencil, Plus, Sparkles, Trash2 } from "lucide-react";
import { format, formatDistanceToNow, isAfter, subDays } from "date-fns";
import { useSnackbar } from "@/shared/components/SnackbarProvider";
import { useAnnouncements, useCreateAnnouncement, useDeleteAnnouncement, useUpdateAnnouncement } from "@/shared/hooks/useSupabaseData";
import { useAuth } from "@/shared/hooks/useAuth";
import { DataTableToolbar } from "@/shared/components/DataTableToolbar";
import { EmptyTableState } from "@/shared/components/EmptyTableState";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const ANNOUNCEMENT_TEMPLATES = [
  {
    label: "Review Window",
    title: "Final Approval Review Window Open",
    content:
      "CRAD reviewers may now finalize completed defenses queued for final approval. Please review panel grades and archive readiness before endorsing each record.",
    isPinned: true,
  },
  {
    label: "Defense Advisory",
    title: "Updated Defense Schedule Advisory",
    content:
      "All scheduled defense groups must confirm venue readiness, panel availability, and final manuscript attachments at least 24 hours before the session.",
    isPinned: false,
  },
  {
    label: "Archive Notice",
    title: "Archive Processing Batch Released",
    content:
      "Recently approved research records have been endorsed to the archive queue for cataloguing, metadata validation, and repository publishing review.",
    isPinned: false,
  },
];

const EMPTY_COMPOSER = {
  id: "",
  title: "",
  content: "",
  isPinned: false,
};

export const AnnouncementsPage: React.FC = () => {
  const { show } = useSnackbar();
  const { user } = useAuth();
  const { data: announcements, isLoading } = useAnnouncements();
  const createAnnouncement = useCreateAnnouncement();
  const updateAnnouncement = useUpdateAnnouncement();
  const deleteAnnouncement = useDeleteAnnouncement();
  const [composerOpen, setComposerOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [search, setSearch] = useState("");
  const [pinnedFilter, setPinnedFilter] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [composer, setComposer] = useState(EMPTY_COMPOSER);
  const canCreate = user?.role === "staff" || user?.role === "admin";

  const filteredAnnouncements = useMemo(
    () =>
      (announcements || []).filter((announcement: any) => {
        const target = `${announcement.title || ""} ${announcement.content || ""} ${announcement.profiles?.full_name || ""}`.toLowerCase();
        const matchesSearch = target.includes(search.toLowerCase());
        const matchesPinned =
          !pinnedFilter ||
          (pinnedFilter === "pinned" ? Boolean(announcement.is_pinned) : !announcement.is_pinned);
        return matchesSearch && matchesPinned;
      }),
    [announcements, pinnedFilter, search]
  );

  const recentCount = (announcements || []).filter((announcement: any) =>
    isAfter(new Date(announcement.created_at), subDays(new Date(), 7))
  ).length;

  const isEditing = Boolean(composer.id);
  const busy = createAnnouncement.isPending || updateAnnouncement.isPending;

  function resetComposer() {
    setComposer(EMPTY_COMPOSER);
  }

  function openCreateComposer() {
    resetComposer();
    setComposerOpen(true);
  }

  function openEditComposer(announcement: any) {
    setComposer({
      id: announcement.id,
      title: announcement.title || "",
      content: announcement.content || "",
      isPinned: Boolean(announcement.is_pinned),
    });
    setComposerOpen(true);
  }

  function closeComposer() {
    setComposerOpen(false);
    resetComposer();
  }

  function applyTemplate(template: (typeof ANNOUNCEMENT_TEMPLATES)[number]) {
    setComposer({
      ...composer,
      title: template.title,
      content: template.content,
      isPinned: template.isPinned,
    });
  }

  async function handleSaveAnnouncement() {
    if (!composer.title.trim() || !composer.content.trim()) {
      show("Title and announcement details are required.", "error");
      return;
    }

    try {
      if (isEditing) {
        await updateAnnouncement.mutateAsync({
          id: composer.id,
          title: composer.title.trim(),
          content: composer.content.trim(),
          isPinned: composer.isPinned,
        });
        show("Announcement updated.", "success");
      } else {
        await createAnnouncement.mutateAsync({
          title: composer.title.trim(),
          content: composer.content.trim(),
          isPinned: composer.isPinned,
        });
        show("Announcement posted.", "success");
      }

      closeComposer();
    } catch (error: any) {
      show(error?.message || "Failed to save announcement.", "error");
    }
  }

  async function handleTogglePinned(announcement: any) {
    try {
      await updateAnnouncement.mutateAsync({
        id: announcement.id,
        title: announcement.title,
        content: announcement.content,
        isPinned: !announcement.is_pinned,
      });
      show(announcement.is_pinned ? "Announcement unpinned." : "Announcement pinned to the top.", "success");
    } catch (error: any) {
      show(error?.message || "Failed to update pin status.", "error");
    }
  }

  async function handleDeleteAnnouncement() {
    if (!deleteTarget) return;

    try {
      await deleteAnnouncement.mutateAsync(deleteTarget.id);
      show("Announcement deleted.", "success");
      setDeleteTarget(null);
    } catch (error: any) {
      show(error?.message || "Failed to delete announcement.", "error");
    }
  }

  if (isLoading) {
    return <div className="space-y-3">{[1, 2, 3].map((item) => <div key={item} className="h-24 rounded-xl skeleton-shimmer" />)}</div>;
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <DataTableToolbar
        title="Announcements"
        description="Publish research advisories, keep priority notices pinned, and manage institute-wide updates."
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search announcements, content, or author..."
        filters={[
          {
            key: "pinned",
            label: "Pinned",
            value: pinnedFilter,
            onChange: setPinnedFilter,
            options: [
              { label: "All", value: "" },
              { label: "Pinned", value: "pinned" },
              { label: "Standard", value: "standard" },
            ],
          },
        ]}
        actions={
          canCreate ? (
            <Button onClick={openCreateComposer} className="gap-2">
              <Plus size={14} />
              New Announcement
            </Button>
          ) : null
        }
        stats={[
          <div key="total" className="rounded-lg border border-border bg-card px-3 py-2">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Total</p>
            <p className="text-lg font-bold text-foreground">{announcements?.length || 0}</p>
          </div>,
          <div key="pinned" className="rounded-lg border border-border bg-card px-3 py-2">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Pinned</p>
            <p className="text-lg font-bold text-foreground">{(announcements || []).filter((item: any) => item.is_pinned).length}</p>
          </div>,
          <div key="recent" className="rounded-lg border border-border bg-card px-3 py-2">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Last 7 Days</p>
            <p className="text-lg font-bold text-foreground">{recentCount}</p>
          </div>,
        ]}
      />

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Publishing Templates</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Start with prepared CRAD notices for approvals, defense reminders, and archive rollouts.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {ANNOUNCEMENT_TEMPLATES.map((template) => (
              <button
                key={template.label}
                onClick={() => {
                  applyTemplate(template);
                  setComposerOpen(true);
                }}
                className="rounded-full border border-border bg-background px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted"
              >
                {template.label}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-2">
            <Megaphone className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Broadcast Notes</h2>
          </div>
          <div className="mt-4 space-y-3 text-sm text-muted-foreground">
            <p>Use pinned notices for defense deadlines, final approval windows, and archive advisories.</p>
            <p>Keep titles short and actionable so students, advisers, and CRAD staff can scan them quickly.</p>
            <p>Use the preview workspace before posting to check tone, clarity, and visibility.</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Title</th>
                <th className="px-4 py-3 text-left font-semibold">Author</th>
                <th className="px-4 py-3 text-left font-semibold">Audience</th>
                <th className="px-4 py-3 text-left font-semibold">Published</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-left font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {!filteredAnnouncements.length ? (
                <EmptyTableState colSpan={6} title="No announcements yet" description="Published CRAD announcements will appear here." />
              ) : (
                filteredAnnouncements.map((announcement: any) => (
                  <React.Fragment key={announcement.id}>
                    <tr className="border-t border-border/60">
                      <td className="px-4 py-3">
                        <div className="flex items-start gap-2">
                          {announcement.is_pinned ? <Pin size={14} className="mt-0.5 text-primary" /> : null}
                          <div>
                            <p className="font-medium text-foreground">{announcement.title}</p>
                            <p className="line-clamp-1 text-xs text-muted-foreground">{announcement.content}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{announcement.profiles?.full_name || "System"}</td>
                      <td className="px-4 py-3 text-muted-foreground">All users</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        <div>
                          <p>{formatDistanceToNow(new Date(announcement.created_at), { addSuffix: true })}</p>
                          <p className="text-xs">{format(new Date(announcement.created_at), "MMM d, yyyy h:mm a")}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                            announcement.is_pinned ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {announcement.is_pinned ? "Pinned" : "Standard"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setExpandedId(expandedId === announcement.id ? null : announcement.id)}
                            className="gap-1.5"
                          >
                            <Eye size={13} />
                            {expandedId === announcement.id ? "Hide" : "View"}
                          </Button>
                          {canCreate ? (
                            <>
                              <Button variant="outline" size="sm" onClick={() => openEditComposer(announcement)} className="gap-1.5">
                                <Pencil size={13} />
                                Edit
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => handleTogglePinned(announcement)} className="gap-1.5">
                                <Pin size={13} />
                                {announcement.is_pinned ? "Unpin" : "Pin"}
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => setDeleteTarget(announcement)} className="gap-1.5 text-destructive hover:text-destructive">
                                <Trash2 size={13} />
                                Delete
                              </Button>
                            </>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                    {expandedId === announcement.id ? (
                      <tr className="border-t border-border/40 bg-muted/20">
                        <td colSpan={6} className="px-4 py-4">
                          <div className="rounded-2xl border border-border bg-background p-5">
                            <div className="flex flex-wrap items-start justify-between gap-4">
                              <div>
                                <div className="flex items-center gap-2">
                                  {announcement.is_pinned ? <Pin size={14} className="text-primary" /> : null}
                                  <p className="text-base font-semibold text-foreground">{announcement.title}</p>
                                </div>
                                <p className="mt-1 text-xs text-muted-foreground">
                                  Posted by {announcement.profiles?.full_name || "System"} on {format(new Date(announcement.created_at), "MMM d, yyyy h:mm a")}
                                </p>
                              </div>
                              <span className="rounded-full border border-border bg-muted px-3 py-1 text-xs text-muted-foreground">
                                Audience: All users
                              </span>
                            </div>
                            <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{announcement.content}</p>
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={composerOpen} onOpenChange={(open) => !open && closeComposer()}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit Announcement" : "Publish Announcement"}</DialogTitle>
            <DialogDescription>
              Prepare a clear CRAD update with optional pin priority and a live post preview before publishing.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-4">
              <div className="rounded-2xl border border-border bg-muted/20 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Quick Start Templates</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {ANNOUNCEMENT_TEMPLATES.map((template) => (
                    <button
                      key={template.label}
                      onClick={() => applyTemplate(template)}
                      className="rounded-full border border-border bg-background px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                    >
                      {template.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium text-foreground">Title</label>
                <input
                  value={composer.title}
                  onChange={(event) => setComposer((current) => ({ ...current, title: event.target.value }))}
                  placeholder="Enter a concise CRAD announcement title"
                  className="h-11 rounded-lg border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground"
                />
              </div>

              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-foreground">Announcement Body</label>
                  <span className="text-xs text-muted-foreground">{composer.content.length} characters</span>
                </div>
                <textarea
                  value={composer.content}
                  onChange={(event) => setComposer((current) => ({ ...current, content: event.target.value }))}
                  placeholder="Explain the update, timeline, and next step for researchers, advisers, or staff."
                  rows={7}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
                />
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium text-foreground">Priority</label>
                <div className="grid gap-2 sm:grid-cols-2">
                  <button
                    onClick={() => setComposer((current) => ({ ...current, isPinned: false }))}
                    className={`rounded-xl border px-4 py-3 text-left transition-colors ${
                      !composer.isPinned ? "border-primary bg-primary/10 text-primary" : "border-border bg-background text-foreground hover:bg-muted"
                    }`}
                  >
                    <p className="text-sm font-semibold">Standard Notice</p>
                    <p className="mt-1 text-xs text-muted-foreground">Shows in the announcement feed without pin priority.</p>
                  </button>
                  <button
                    onClick={() => setComposer((current) => ({ ...current, isPinned: true }))}
                    className={`rounded-xl border px-4 py-3 text-left transition-colors ${
                      composer.isPinned ? "border-primary bg-primary/10 text-primary" : "border-border bg-background text-foreground hover:bg-muted"
                    }`}
                  >
                    <p className="text-sm font-semibold">Pinned Priority</p>
                    <p className="mt-1 text-xs text-muted-foreground">Keeps urgent CRAD notices visible at the top of the module.</p>
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-border bg-card p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Live Preview</p>
                <div className="mt-4 rounded-2xl border border-border bg-background p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        {composer.isPinned ? <Pin size={14} className="text-primary" /> : null}
                        <p className="truncate text-base font-semibold text-foreground">
                          {composer.title.trim() || "Announcement title preview"}
                        </p>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Audience: All users | Author: {user?.name || "CRAD Staff"}
                      </p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${composer.isPinned ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                      {composer.isPinned ? "Pinned" : "Standard"}
                    </span>
                  </div>
                  <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                    {composer.content.trim() || "Your announcement preview will appear here as you write."}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-muted/20 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Publishing Guide</p>
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  <li>State the workflow impact first so researchers know what changed.</li>
                  <li>Add timing, next actions, and who should respond to the notice.</li>
                  <li>Use pinned priority only for urgent defense, approval, or archive advisories.</li>
                </ul>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={closeComposer}>Cancel</Button>
            <Button onClick={handleSaveAnnouncement} disabled={busy}>
              {busy ? (isEditing ? "Saving..." : "Posting...") : (isEditing ? "Save Changes" : "Publish Announcement")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Delete Announcement</DialogTitle>
            <DialogDescription>
              Remove this CRAD announcement from the feed. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4">
            <p className="text-sm font-semibold text-foreground">{deleteTarget?.title}</p>
            <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{deleteTarget?.content}</p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteAnnouncement} disabled={deleteAnnouncement.isPending}>
              {deleteAnnouncement.isPending ? "Deleting..." : "Delete Announcement"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
