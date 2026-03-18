import React, { useState } from "react";
import { Megaphone, Plus, Pin } from "lucide-react";
import { useSnackbar } from "@/shared/components/SnackbarProvider";
import { useAnnouncements, useCreateAnnouncement } from "@/shared/hooks/useSupabaseData";
import { useAuth } from "@/shared/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";

export const AnnouncementsPage: React.FC = () => {
  const { show } = useSnackbar();
  const { user } = useAuth();
  const { data: announcements, isLoading } = useAnnouncements();
  const createAnnouncement = useCreateAnnouncement();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const canCreate = user?.role === "staff" || user?.role === "admin";

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) { show("Fill all fields", "error"); return; }
    try {
      await createAnnouncement.mutateAsync({ title, content, isPinned });
      show("Announcement posted!", "success");
      setTitle(""); setContent(""); setIsPinned(false); setShowForm(false);
    } catch (err: any) { show(err.message, "error"); }
  };

  if (isLoading) return <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 skeleton-shimmer rounded-xl" />)}</div>;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2"><Megaphone size={20} className="text-primary" /> Announcements</h1>
          <p className="text-sm text-muted-foreground">System announcements and updates</p>
        </div>
        {canCreate && <button onClick={() => setShowForm(!showForm)} className="h-9 px-3 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity flex items-center gap-1.5"><Plus size={14} /> New Post</button>}
      </div>
      {showForm && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-4 animate-slide-up">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Announcement title" className="w-full h-11 px-3 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-colors" />
          <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Write your announcement..." rows={3} className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-colors resize-none" />
          <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
            <input type="checkbox" checked={isPinned} onChange={(e) => setIsPinned(e.target.checked)} className="rounded" /> Pin this announcement
          </label>
          <button onClick={handleSubmit} disabled={createAnnouncement.isPending} className="h-10 px-4 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 disabled:opacity-50">Post</button>
        </div>
      )}
      {!announcements?.length ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <Megaphone size={40} className="mx-auto text-muted-foreground mb-3" />
          <p className="text-sm font-medium text-foreground">No announcements yet</p>
        </div>
      ) : announcements.map((a: any) => (
        <div key={a.id} className="bg-card border border-border rounded-xl p-4 animate-slide-up">
          <div className="flex items-center gap-2 mb-1">
            {a.is_pinned && <Pin size={12} className="text-primary" />}
            <p className="text-sm font-semibold text-foreground">{a.title}</p>
          </div>
          <p className="text-sm text-muted-foreground">{a.content}</p>
          <p className="text-[11px] text-muted-foreground mt-2">{a.profiles?.full_name} · {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}</p>
        </div>
      ))}
    </div>
  );
};
