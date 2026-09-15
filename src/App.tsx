import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { PlatformAuthProvider, usePlatformAuth } from "./context/PlatformAuthContext";
import { ProtectedRoute } from "./components/common/ProtectedRoute";
import { AdminLayout } from "./components/layout/AdminLayout";
import { LoginPage } from "./pages/LoginPage";
import { TenantCatalogPage } from "./pages/TenantCatalogPage";
import { SystemHealthPage } from "./pages/SystemHealthPage";
import { TestingSuitePage } from "./pages/TestingSuitePage";
import { StaffManagementPage } from "./pages/StaffManagementPage";
import { AuditLogsPage } from "./pages/AuditLogsPage";
import { SystemLogsPage } from "./pages/SystemLogsPage";
import { PlansManagementPage } from "./pages/PlansManagementPage";
import { SubscriptionsPage } from "./pages/SubscriptionsPage";
import { SubscriptionPaymentsPage } from "./pages/SubscriptionPaymentsPage";
import { SupportTicketsPage } from "./pages/SupportTicketsPage";

// Smart home router based on user role
const RootRedirect: React.FC = () => {
  const { user, isAuthenticated, isLoading } = usePlatformAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center font-mono text-xs text-indigo-400">
        Initializing Omni Platform Clearance...
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  switch (user.role) {
    case "platform_dev":
      return <Navigate to="/telemetry" replace />;
    case "platform_tester":
      return <Navigate to="/testing" replace />;
    case "super_admin":
    case "support_agent":
    default:
      return <Navigate to="/tenants" replace />;
  }
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <PlatformAuthProvider>
        <Routes>
          {/* Public Auth Gateway */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Platform Governance Shell */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="/" element={<RootRedirect />} />

              {/* Tenancy Workspaces (Super Admin & Support Agent) */}
              <Route
                path="/tenants"
                element={
                  <ProtectedRoute allowedRoles={["super_admin", "support_agent"]}>
                    <TenantCatalogPage />
                  </ProtectedRoute>
                }
              />

              {/* SaaS Plan Tiers Management (Super Admin Only) */}
              <Route
                path="/plans"
                element={
                  <ProtectedRoute allowedRoles={["super_admin"]}>
                    <PlansManagementPage />
                  </ProtectedRoute>
                }
              />

              {/* Tenant Subscriptions Lifecycle (Super Admin & Support Agent) */}
              <Route
                path="/subscriptions"
                element={
                  <ProtectedRoute allowedRoles={["super_admin", "support_agent"]}>
                    <SubscriptionsPage />
                  </ProtectedRoute>
                }
              />

              {/* Subscription Payments Ledger (Super Admin & Support Agent) */}
              <Route
                path="/payments"
                element={
                  <ProtectedRoute allowedRoles={["super_admin", "support_agent"]}>
                    <SubscriptionPaymentsPage />
                  </ProtectedRoute>
                }
              />

              {/* Support Helpdesk & Tickets (Super Admin & Support Agent) */}
              <Route
                path="/support"
                element={
                  <ProtectedRoute allowedRoles={["super_admin", "support_agent"]}>
                    <SupportTicketsPage />
                  </ProtectedRoute>
                }
              />

              {/* System Infrastructure Telemetry (Super Admin & Platform Dev) */}
              <Route
                path="/telemetry"
                element={
                  <ProtectedRoute allowedRoles={["super_admin", "platform_dev"]}>
                    <SystemHealthPage />
                  </ProtectedRoute>
                }
              />

              {/* Real-time System Diagnostic & Logs Stream (Super Admin, Dev, Support) */}
              <Route
                path="/logs"
                element={
                  <ProtectedRoute allowedRoles={["super_admin", "platform_dev", "support_agent"]}>
                    <SystemLogsPage />
                  </ProtectedRoute>
                }
              />

              {/* Synthetic Testing Suite (Super Admin, QA Tester & Platform Dev) */}
              <Route
                path="/testing"
                element={
                  <ProtectedRoute allowedRoles={["super_admin", "platform_tester", "platform_dev"]}>
                    <TestingSuitePage />
                  </ProtectedRoute>
                }
              />

              {/* Staff Management & RBAC (Super Admin Only) */}
              <Route
                path="/staff"
                element={
                  <ProtectedRoute allowedRoles={["super_admin"]}>
                    <StaffManagementPage />
                  </ProtectedRoute>
                }
              />

              {/* Platform Audit Trail (Super Admin, Dev, Support) */}
              <Route
                path="/audit-logs"
                element={
                  <ProtectedRoute allowedRoles={["super_admin", "platform_dev", "support_agent"]}>
                    <AuditLogsPage />
                  </ProtectedRoute>
                }
              />
            </Route>
          </Route>

          {/* Catch-all Wildcard Route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </PlatformAuthProvider>
    </BrowserRouter>
  );
};
