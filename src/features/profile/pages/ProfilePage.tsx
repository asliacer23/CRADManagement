import React, { useState, useRef } from "react";
import { User, Mail, Building2, Badge, Upload, Check, X } from "lucide-react";
import { useSnackbar } from "@/shared/components/SnackbarProvider";
import { useAuth } from "@/shared/hooks/useAuth";
import { useUserProfile, useUpdateUserProfile, useUploadAvatar } from "@/shared/hooks/useSupabaseData";

export const ProfilePage: React.FC = () => {
  const { show } = useSnackbar();
  const { user } = useAuth();
  const { data: profile, isLoading } = useUserProfile();
  const updateMutation = useUpdateUserProfile();
  const uploadMutation = useUploadAvatar();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [department, setDepartment] = useState(profile?.department || "");
  const [studentId, setStudentId] = useState(profile?.student_id || "");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile?.avatar_url || null);

  React.useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setDepartment(profile.department || "");
      setStudentId(profile.student_id || "");
      setAvatarPreview(profile.avatar_url || null);
    }
  }, [profile]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith("image/")) {
      show("Please select an image file", "error");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      show("File size must be less than 5MB", "error");
      return;
    }

    try {
      // Show preview
      const reader = new FileReader();
      reader.onload = () => setAvatarPreview(reader.result as string);
      reader.readAsDataURL(file);

      // Upload
      await uploadMutation.mutateAsync(file);
      show("Avatar uploaded successfully!", "success");
    } catch (err: any) {
      show(err.message || "Failed to upload avatar", "error");
      setAvatarPreview(profile?.avatar_url || null);
    }
  };

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({ fullName, department, studentId });
      show("Profile updated successfully!", "success");
      setIsEditing(false);
    } catch (err: any) {
      show(err.message || "Failed to update profile", "error");
    }
  };

  const handleCancel = () => {
    setFullName(profile?.full_name || "");
    setDepartment(profile?.department || "");
    setStudentId(profile?.student_id || "");
    setAvatarPreview(profile?.avatar_url || null);
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-32 skeleton-shimmer rounded" />
        <div className="grid md:grid-cols-3 gap-6">
          <div className="h-80 skeleton-shimmer rounded-xl" />
          <div className="md:col-span-2 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 skeleton-shimmer rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <User size={28} className="text-primary" /> My Profile
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your profile information and avatar</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Avatar Section */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <div className="relative">
            <div className="w-full aspect-square rounded-lg overflow-hidden bg-muted border border-border flex items-center justify-center">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <User size={48} className="text-muted-foreground" />
                  <p className="text-xs text-muted-foreground text-center">No avatar</p>
                </div>
              )}
            </div>

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadMutation.isPending}
              className="absolute bottom-2 right-2 h-10 w-10 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center shadow-lg"
            >
              {uploadMutation.isPending ? (
                <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <Upload size={18} />
              )}
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="hidden"
            disabled={uploadMutation.isPending}
          />

          <div className="text-xs text-muted-foreground text-center">
            <p className="font-medium">Upload Avatar</p>
            <p>Max 5MB • JPG, PNG</p>
          </div>

          {profile?.user_id && (
            <div className="pt-4 border-t border-border space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase">User ID</p>
              <p className="text-xs font-mono text-foreground break-all">{profile.user_id}</p>
            </div>
          )}

          {profile?.created_at && (
            <div className="pt-2 border-t border-border space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase">Member Since</p>
              <p className="text-xs text-foreground">
                {new Date(profile.created_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          )}
        </div>

        {/* Profile Information Section */}
        <div className="md:col-span-2 bg-card border border-border rounded-xl p-6 space-y-4">
          <div className="grid gap-4">
            {/* Full Name */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1 block">
                <User size={14} /> Full Name
              </label>
              {isEditing ? (
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full h-11 px-3 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-colors"
                />
              ) : (
                <div className="h-11 px-3 rounded-lg border border-border bg-muted/50 flex items-center text-sm text-foreground">
                  {fullName || "Not set"}
                </div>
              )}
            </div>

            {/* Email (Read-only) */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1 block">
                <Mail size={14} /> Email Address
              </label>
              <div className="h-11 px-3 rounded-lg border border-border bg-muted/50 flex items-center text-sm text-foreground">
                {profile?.email || user?.email || "Unknown"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Email cannot be changed here. Contact support if needed.</p>
            </div>

            {/* Department */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1 block">
                <Building2 size={14} /> Department
              </label>
              {isEditing ? (
                <input
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g., Information Technology"
                  className="w-full h-11 px-3 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-colors"
                />
              ) : (
                <div className="h-11 px-3 rounded-lg border border-border bg-muted/50 flex items-center text-sm text-foreground">
                  {department || "Not set"}
                </div>
              )}
            </div>

            {/* Student ID */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1 block">
                <Badge size={14} /> Student ID
              </label>
              {isEditing ? (
                <input
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="Enter your student ID"
                  className="w-full h-11 px-3 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-colors"
                />
              ) : (
                <div className="h-11 px-3 rounded-lg border border-border bg-muted/50 flex items-center text-sm text-foreground">
                  {studentId || "Not set"}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-border flex gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  disabled={updateMutation.isPending}
                  className="flex-1 h-10 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {updateMutation.isPending ? (
                    <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  ) : (
                    <>
                      <Check size={16} /> Save Changes
                    </>
                  )}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={updateMutation.isPending}
                  className="flex-1 h-10 rounded-lg border border-input bg-background text-foreground font-semibold text-sm hover:bg-muted transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <X size={16} /> Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="flex-1 h-10 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                <User size={16} /> Edit Profile
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Additional Info Section */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h2 className="text-sm font-semibold text-foreground">Account Information</h2>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Account Type</p>
            <p className="text-foreground font-medium capitalize">{user?.role || "User"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Last Updated</p>
            <p className="text-foreground font-medium">
              {profile?.updated_at
                ? new Date(profile.updated_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "Never"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
