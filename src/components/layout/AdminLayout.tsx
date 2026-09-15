import React from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import { usePlatformAuth } from "../../context/PlatformAuthContext";
import { PrivacyShieldBanner } from "../common/PrivacyShieldBanner";
import {
  LayoutDashboard,
  Server,
  FlaskConical,
  Users,
  ScrollText,
  Terminal,
  LogOut,
  Shield,
  Radio,
  Layers,
  CreditCard,
  Receipt,
  LifeBuoy,
} from "lucide-react";

export const AdminLayout: React.FC = () => {
  const { user, logout, isSuperAdmin, isPlatformDev, isPlatformTester, isSupportAgent, canViewLogs } = usePlatformAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case "super_admin":
        return {
          label: "Super Admin",
          bg: "bg-purple-500/10 text-purple-400 border-purple-500/30",
        };
      case "platform_dev":
        return {
          label: "Platform Dev",
          bg: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
        };
      case "platform_tester":
        return {
          label: "QA / Tester",
          bg: "bg-amber-500/10 text-amber-400 border-amber-500/30",
        };
      case "support_agent":
        return {
          label: "Support Agent",
          bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
        };
      default:
        return {
          label: role || "Staff",
          bg: "bg-slate-500/10 text-slate-400 border-slate-500/30",
        };
    }
  };

  const roleInfo = getRoleBadge(user?.role);

  // Navigation Items mapped by role capability
  const navItems = [
    {
      name: "Tenant Workspaces",
      path: "/tenants",
      icon: LayoutDashboard,
      visible: isSuperAdmin || isSupportAgent,
      badge: "Zero-PII",
    },
    {
      name: "SaaS Plan Tiers",
      path: "/plans",
      icon: Layers,
      visible: isSuperAdmin,
      badge: "Pricing",
    },
    {
      name: "Subscriptions",
      path: "/subscriptions",
      icon: CreditCard,
      visible: isSuperAdmin || isSupportAgent,
      badge: "Lifecycle",
    },
    {
      name: "Payments & Invoices",
      path: "/payments",
      icon: Receipt,
      visible: isSuperAdmin || isSupportAgent,
      badge: "Ledger",
    },
    {
      name: "Support Helpdesk",
      path: "/support",
      icon: LifeBuoy,
      visible: isSuperAdmin || isSupportAgent,
      badge: "Cases",
    },
    {
      name: "Infra Telemetry",
      path: "/telemetry",
      icon: Server,
      visible: isSuperAdmin || isPlatformDev,
      badge: "Live",
    },
    {
      name: "System Logs",
      path: "/logs",
      icon: Terminal,
      visible: isSuperAdmin || isPlatformDev || isSupportAgent,
      badge: "Stream",
    },
    {
      name: "Testing Suite",
      path: "/testing",
      icon: FlaskConical,
      visible: isSuperAdmin || isPlatformTester || isPlatformDev,
      badge: "QA",
    },
    {
      name: "Staff & RBAC",
      path: "/staff",
      icon: Users,
      visible: isSuperAdmin,
    },
    {
      name: "Platform Audit Trail",
      path: "/audit-logs",
      icon: ScrollText,
      visible: isSuperAdmin || isPlatformDev || isSupportAgent,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col md:flex-row text-slate-100">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-slate-900 border-b md:border-b-0 md:border-r border-slate-800 flex flex-col shrink-0">
        {/* Logo & Brand */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-bold">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <span className="text-sm font-bold tracking-tight text-white block">Omni Platform</span>
              <span className="text-[10px] font-mono tracking-widest text-indigo-400 uppercase font-semibold block">
                Governance Portal
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-1 md:hidden">
            <PrivacyShieldBanner compact />
          </div>
        </div>

        {/* Staff Identity Card */}
        <div className="p-4 mx-3 my-3 bg-slate-950/70 border border-slate-800/80 rounded-xl">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-xs font-bold text-indigo-300">
              {user?.name?.charAt(0).toUpperCase() || "P"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
              <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>
          <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-slate-800/60">
            <span
              className={`text-[10px] font-semibold font-mono px-2 py-0.5 rounded-full border ${roleInfo.bg}`}
            >
              {roleInfo.label}
            </span>
            <div className="flex items-center space-x-1 text-[10px] text-emerald-400 font-mono">
              <Radio className="w-2.5 h-2.5 animate-pulse" />
              <span>ONLINE</span>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 space-y-1 py-2 overflow-y-auto">
          {navItems
            .filter((item) => item.visible)
            .map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || (item.path !== "/" && location.pathname.startsWith(item.path));
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all group ${
                    isActive
                      ? "bg-indigo-600/15 text-indigo-300 border border-indigo-500/30 font-semibold"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent"
                  }`}
                >
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        isActive ? "text-indigo-400" : "text-slate-400 group-hover:text-slate-200"
                      }`}
                    />
                    <span className="truncate">{item.name}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.5 rounded border uppercase tracking-wider ${
                        isActive
                          ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/40"
                          : "bg-slate-800 text-slate-400 border-slate-700"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
        </nav>

        {/* Bottom Actions & Privacy Guarantee */}
        <div className="p-3 border-t border-slate-800/80 space-y-2">
          <div className="hidden md:block">
            <PrivacyShieldBanner compact />
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-xs font-medium text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition border border-transparent hover:border-rose-500/20"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out Session</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="h-14 bg-slate-900/60 backdrop-blur border-b border-slate-800/80 px-6 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
              Internal Clearance
            </span>
            <span className="text-slate-600">/</span>
            <span className="text-xs font-semibold text-slate-200">
              {navItems.find((n) => location.pathname.startsWith(n.path))?.name || "Dashboard"}
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-[11px] font-mono text-slate-400 bg-slate-950 px-2.5 py-1 rounded border border-slate-800 flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>API Gateway Connected</span>
            </div>
          </div>
        </header>

        <div className="p-6 max-w-7xl w-full mx-auto space-y-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
