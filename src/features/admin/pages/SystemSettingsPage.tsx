import React from "react";
import { Settings, Save } from "lucide-react";
import { useSnackbar } from "@/shared/components/SnackbarProvider";
import { useSystemSettings, useUpdateSetting } from "@/shared/hooks/useSupabaseData";

export const SystemSettingsPage: React.FC = () => {
  const { show } = useSnackbar();
  const { data: settings, isLoading } = useSystemSettings();
  const updateSetting = useUpdateSetting();
  const [values, setValues] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    if (settings) {
      const v: Record<string, string> = {};
      settings.forEach((s: any) => { v[s.key] = s.value; });
      setValues(v);
    }
  }, [settings]);

  const handleSave = async () => {
    try {
      for (const [key, value] of Object.entries(values)) {
        await updateSetting.mutateAsync({ key, value });
      }
      show("Settings saved!", "success");
    } catch (err: any) { show(err.message, "error"); }
  };

  if (isLoading) return <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-16 skeleton-shimmer rounded-xl" />)}</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2"><Settings size={20} className="text-primary" /> System Settings</h1>
        <p className="text-sm text-muted-foreground">Configure system-wide settings</p>
      </div>
      <div className="bg-card border border-border rounded-xl p-5 space-y-5">
        {settings?.map((s: any) => (
          <div key={s.key}>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">{s.description || s.key}</label>
            {s.key === "maintenance_mode" ? (
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
                <div>
                  <p className="text-sm font-medium text-foreground">Maintenance Mode</p>
                  <p className="text-xs text-muted-foreground">Disable student access during maintenance</p>
                </div>
                <button onClick={() => setValues({ ...values, [s.key]: values[s.key] === "true" ? "false" : "true" })}
                  className={`h-6 w-11 rounded-full relative transition-colors ${values[s.key] === "true" ? "bg-primary" : "bg-muted"}`}>
                  <span className={`absolute top-1 h-4 w-4 rounded-full transition-transform ${values[s.key] === "true" ? "left-6 bg-primary-foreground" : "left-1 bg-muted-foreground"}`} />
                </button>
              </div>
            ) : (
              <input value={values[s.key] || ""} onChange={(e) => setValues({ ...values, [s.key]: e.target.value })}
                className="w-full h-11 px-3 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-colors" />
            )}
          </div>
        ))}
        <button onClick={handleSave} disabled={updateSetting.isPending}
          className="h-11 px-6 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2">
          <Save size={16} /> Save Settings
        </button>
      </div>
    </div>
  );
};
