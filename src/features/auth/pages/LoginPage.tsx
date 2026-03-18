import React, { useState } from "react";
import { useAuth } from "@/shared/hooks/useAuth";
import { useSnackbar } from "@/shared/components/SnackbarProvider";
import logo from "@/assets/logo.png";

export const LoginPage: React.FC = () => {
  const { login, signup, isLoading } = useAuth();
  const { show } = useSnackbar();
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSignup) {
      if (!fullName.trim()) { show("Please enter your full name", "error"); return; }
      if (!email.trim()) { show("Please enter your email", "error"); return; }
      if (password.length < 6) { show("Password must be at least 6 characters", "error"); return; }
      const { error } = await signup(email, password, fullName);
      if (error) show(error, "error");
      else show("Account created successfully!", "success");
      return;
    }

    if (!email.trim() || !password.trim()) { show("Please enter email and password", "error"); return; }
    const { error } = await login(email, password);
    if (error) show(error, "error");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 animate-slide-down">
          <div className="flex justify-center mb-4">
            <div className="h-20 w-20 rounded-2xl bg-card border border-border shadow-lg flex items-center justify-center p-2">
              <img src={logo} alt="BCP" className="h-full w-full object-contain" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">CRAD Management System</h1>
          <p className="text-sm text-muted-foreground mt-1">Bestlink College of the Philippines</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-sm animate-slide-up">
          <div className="flex mb-5 bg-muted rounded-lg p-1">
            <button
              type="button"
              onClick={() => setIsSignup(false)}
              className={`flex-1 py-2 rounded-md text-sm font-semibold transition-all ${!isSignup ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setIsSignup(true)}
              className={`flex-1 py-2 rounded-md text-sm font-semibold transition-all ${isSignup ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && (
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Juan Dela Cruz"
                  className="w-full h-11 px-3 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-colors"
                />
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@bestlink.edu.ph"
                className="w-full h-11 px-3 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-colors"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-11 px-3 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                isSignup ? "Create Account" : "Sign In"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
