import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/shared/hooks/useTheme";
import { AuthProvider, useAuth } from "@/shared/hooks/useAuth";
import { SnackbarProvider } from "@/shared/components/SnackbarProvider";
import { AppLayout } from "@/shared/components/AppLayout";
import { LoginPage } from "@/features/auth/pages/LoginPage";
import { DashboardRouter } from "@/features/dashboard/pages/DashboardRouter";
import { SubmitResearchPage } from "@/features/research/pages/SubmitResearchPage";
import { MyResearchPage } from "@/features/research/pages/MyResearchPage";
import { ApproveResearchPage } from "@/features/research/pages/ApproveResearchPage";
import { UploadManuscriptPage } from "@/features/manuscripts/pages/UploadManuscriptPage";
import { ReviewManuscriptsPage } from "@/features/manuscripts/pages/ReviewManuscriptsPage";
import { PaymentsPage } from "@/features/payments/pages/PaymentsPage";
import { VerifyPaymentsPage } from "@/features/payments/pages/VerifyPaymentsPage";
import { DefenseSchedulePage } from "@/features/defense/pages/DefenseSchedulePage";
import { ManageDefensePage } from "@/features/defense/pages/ManageDefensePage";
import { NotificationsPage } from "@/features/notifications/pages/NotificationsPage";
import { RemarksPage } from "@/features/remarks/pages/RemarksPage";
import { AssignAdviserPage } from "@/features/advisers/pages/AssignAdviserPage";
import { ArchivePage } from "@/features/archive/pages/ArchivePage";
import { AnnouncementsPage } from "@/features/announcements/pages/AnnouncementsPage";
import { ManageUsersPage } from "@/features/admin/pages/ManageUsersPage";
import { AllResearchPage } from "@/features/admin/pages/AllResearchPage";
import { SystemSettingsPage } from "@/features/admin/pages/SystemSettingsPage";
import { AuditLogsPage } from "@/features/admin/pages/AuditLogsPage";
import { FinalApprovalsPage } from "@/features/admin/pages/FinalApprovalsPage";
import { PanelApprovalsPage } from "@/features/defense/pages/PanelApprovalsPage";
import { ProfilePage } from "@/features/profile/pages/ProfilePage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 1000 * 60 * 5, refetchOnWindowFocus: false } },
});

const ProtectedRoutes = () => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return (
    <AppLayout>
      <Routes>
        <Route path="/dashboard" element={<DashboardRouter />} />
        <Route path="/research/submit" element={<SubmitResearchPage />} />
        <Route path="/research/my" element={<MyResearchPage />} />
        <Route path="/research/approve" element={<ApproveResearchPage />} />
        <Route path="/manuscripts/upload" element={<UploadManuscriptPage />} />
        <Route path="/manuscripts/review" element={<ReviewManuscriptsPage />} />
        <Route path="/payments" element={<PaymentsPage />} />
        <Route path="/payments/verify" element={<VerifyPaymentsPage />} />
        <Route path="/defense" element={<DefenseSchedulePage />} />
        <Route path="/defense/manage" element={<ManageDefensePage />} />
        <Route path="/defense/panel-approvals" element={<PanelApprovalsPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/remarks" element={<RemarksPage />} />
        <Route path="/advisers/assign" element={<AssignAdviserPage />} />
        <Route path="/archive" element={<ArchivePage />} />
        <Route path="/announcements" element={<AnnouncementsPage />} />
        <Route path="/admin/users" element={<ManageUsersPage />} />
        <Route path="/admin/research" element={<AllResearchPage />} />
        <Route path="/admin/settings" element={<SystemSettingsPage />} />
        <Route path="/admin/logs" element={<AuditLogsPage />} />
        <Route path="/admin/final-approvals" element={<FinalApprovalsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AppLayout>
  );
};

const AppRoutes = () => {
  const { isAuthenticated } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />
      <Route path="/*" element={<ProtectedRoutes />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <SnackbarProvider>
          <TooltipProvider>
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </TooltipProvider>
        </SnackbarProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
