import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User as SupaUser, Session } from "@supabase/supabase-js";

const db = supabase as any;

export type UserRole = "student" | "adviser" | "staff" | "admin";

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  isBypass?: boolean;
}

interface AuthContextType {
  user: AppUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  signup: (email: string, password: string, fullName: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  login: async () => ({}),
  signup: async () => ({}),
  logout: async () => {},
  isLoading: true,
});

const TEMP_BYPASS_STORAGE_KEY = "crad-temp-bypass-user";

const TEMP_BYPASS_USERS: Record<string, { password: string; user: AppUser }> = {
  "admin@gmail.com": {
    password: "admin123",
    user: {
      id: "d50e8400-e29b-41d4-a716-446655440001",
      name: "CRAD Admin",
      email: "admin.seed@crad.local",
      role: "admin",
      isBypass: true,
    },
  },
  "staff@gmail.com": {
    password: "admin123",
    user: {
      id: "d50e8400-e29b-41d4-a716-446655440002",
      name: "CRAD Staff",
      email: "staff.seed@crad.local",
      role: "staff",
      isBypass: true,
    },
  },
};

async function fetchAppUser(supaUser: SupaUser): Promise<AppUser | null> {
  const { data: profile } = await db.from("profiles")
    .select("full_name, avatar_url")
    .eq("user_id", supaUser.id)
    .single();

  const { data: roleData } = await db.from("user_roles")
    .select("role")
    .eq("user_id", supaUser.id)
    .single();

  return {
    id: supaUser.id,
    name: profile?.full_name || supaUser.email?.split("@")[0] || "User",
    email: supaUser.email || "",
    role: (roleData?.role as UserRole) || "student",
    avatar: profile?.avatar_url || undefined,
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedBypassUser = localStorage.getItem(TEMP_BYPASS_STORAGE_KEY);
    if (storedBypassUser) {
      setUser(JSON.parse(storedBypassUser) as AppUser);
      setIsLoading(false);
      return () => {};
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        // Use setTimeout to avoid deadlock with Supabase auth
        setTimeout(async () => {
          const appUser = await fetchAppUser(session.user);
          setUser(appUser);
          setIsLoading(false);
        }, 0);
      } else {
        setUser(null);
        setIsLoading(false);
      }
    });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const appUser = await fetchAppUser(session.user);
        setUser(appUser);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    const bypassAccount = TEMP_BYPASS_USERS[email.trim().toLowerCase()];
    if (bypassAccount && bypassAccount.password === password) {
      localStorage.setItem(TEMP_BYPASS_STORAGE_KEY, JSON.stringify(bypassAccount.user));
      setUser(bypassAccount.user);
      setIsLoading(false);
      return {};
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setIsLoading(false);
      return { error: error.message };
    }
    return {};
  }, []);

  const signup = useCallback(async (email: string, password: string, fullName: string) => {
    setIsLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) {
      setIsLoading(false);
      return { error: error.message };
    }
    return {};
  }, []);

  const logout = useCallback(async () => {
    localStorage.removeItem(TEMP_BYPASS_STORAGE_KEY);
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, signup, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
