import React, { useMemo, useState } from "react";
import { Eye, Pin, Plus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useSnackbar } from "@/shared/components/SnackbarProvider";
import { useAnnouncements, useCreateAnnouncement } from "@/shared/hooks/useSupabaseData";
import { useAuth } from "@/shared/hooks/useAuth";
import { DataTableToolbar } from "@/shared/components/DataTableToolbar";
import { EmptyTableState } from "@/shared/components/EmptyTableState";

export const AnnouncementsPage: React.FC = () => {
  const { show } = useSnackbar();
  const { user } = useAuth();
  const { data: announcements, isLoading } = useAnnouncements();
  const createAnnouncement = useCreateAnnouncement();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [search, setSearch] = useState("");
  const [pinnedFilter, setPinnedFilter] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
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

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      show("Fill all fields", "error");
      return;
    }

    try {
      await createAnnouncement.mutateAsync({ title, content, isPinned });
      show("Announcement posted!", "success");
      setTitle("");
      setContent("");
      setIsPinned(false);
      setShowForm(false);
    } catch (error: any) {
      show(error.message, "error");
    }
  };

  if (isLoading) {
    return <div className="space-y-3">{[1, 2, 3].map((item) => <div key={item} className="h-24 rounded-xl skeleton-shimmer" />)}</div>;
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <DataTableToolbar
        title="Announcements"
        description="Broadcast updates, keep key posts pinned, and review recent notices."
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
            <button
              onClick={() => setShowForm(!showForm)}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              <Plus size={14} />
              {showForm ? "Close Composer" : "New Post"}
            </button>
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
        ]}
      />

      {showForm ? (
        <div className="rounded-xl border border-border bg-card p-5 space-y-4 animate-slide-up">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Announcement title"
            className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground"
          />
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Write your announcement..."
            rows={4}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
          />
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input type="checkbox" checked={isPinned} onChange={(event) => setIsPinned(event.target.checked)} className="rounded" />
            Pin this announcement
          </label>
          <button
            onClick={handleSubmit}
            disabled={createAnnouncement.isPending}
            className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            Post Announcement
          </button>
        </div>
      ) : null}

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
                <th className="px-4 py-3 text-left font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {!filteredAnnouncements.length ? (
                <EmptyTableState colSpan={6} title="No announcements yet" description="Posted announcements will appear in this table." />
              ) : (
                filteredAnnouncements.map((announcement: any) => (
                  <React.Fragment key={announcement.id}>
                    <tr className="border-t border-border/60">
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground">{announcement.title}</p>
                        <p className="line-clamp-1 text-xs text-muted-foreground">{announcement.content}</p>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{announcement.profiles?.full_name || "System"}</td>
                      <td className="px-4 py-3 text-muted-foreground">All users</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDistanceToNow(new Date(announcement.created_at), { addSuffix: true })}
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
                        <button
                          onClick={() => setExpandedId(expandedId === announcement.id ? null : announcement.id)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                        >
                          <Eye size={13} />
                          {expandedId === announcement.id ? "Hide" : "View"}
                        </button>
                      </td>
                    </tr>
                    {expandedId === announcement.id ? (
                      <tr className="border-t border-border/40 bg-muted/20">
                        <td colSpan={6} className="px-4 py-4">
                          <div className="rounded-xl border border-border bg-background p-4">
                            <div className="flex items-center gap-2">
                              {announcement.is_pinned ? <Pin size={14} className="text-primary" /> : null}
                              <p className="text-sm font-semibold text-foreground">{announcement.title}</p>
                            </div>
                            <p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">{announcement.content}</p>
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
    </div>
  );
};
