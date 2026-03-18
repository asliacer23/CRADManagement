import React from "react";
import { useAuth } from "@/shared/hooks/useAuth";
import { StudentDashboard } from "./StudentDashboard";
import { AdviserDashboard } from "./AdviserDashboard";
import { StaffDashboard } from "./StaffDashboard";
import { AdminDashboard } from "./AdminDashboard";

export const DashboardRouter: React.FC = () => {
  const { user } = useAuth();
  switch (user?.role) {
    case "adviser": return <AdviserDashboard />;
    case "staff": return <StaffDashboard />;
    case "admin": return <AdminDashboard />;
    default: return <StudentDashboard />;
  }
};
