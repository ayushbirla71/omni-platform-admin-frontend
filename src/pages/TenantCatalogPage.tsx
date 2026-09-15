import React, { useEffect, useState } from "react";
import { platformApi } from "../api/platform-api";
import { TenantMetadata, PlatformTenantOverview } from "../types/platform";
import { usePlatformAuth } from "../context/PlatformAuthContext";
import { PrivacyShieldBanner } from "../components/common/PrivacyShieldBanner";
import {
  Search,
  Filter,
  Building2,
  Radio,
  Users,
  MessageSquare,
  Edit3,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  X,
  RefreshCw,
  Sliders,
} from "lucide-react";

export const TenantCatalogPage: React.FC = () => {
  const { isSuperAdmin } = usePlatformAuth();

  const [overview, setOverview] = useState<PlatformTenantOverview | null>(null);
  const [tenants, setTenants] = useState<TenantMetadata[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Edit Modal State (Super Admin)
  const [editingTenant, setEditingTenant] = useState<TenantMetadata | null>(null);
  const [editPlan, setEditPlan] = useState("");
  const [editStatus, setEditStatus] = useState<"active" | "suspended" | "trial" | "cancelled">("active");
  const [editQuota, setEditQuota] = useState(10000);
  const [editChannels, setEditChannels] = useState(5);
  const [editUsers, setEditUsers] = useState(10);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const fetchOverview = async () => {
    try {
      const data = await platformApi.tenants.getOverview();
      setOverview(data);
    } catch (err) {
      console.error("Failed to load platform overview:", err);
    }
  };

  const fetchTenants = async () => {
    setIsLoading(true);
    try {
      const res = await platformApi.tenants.listTenants({
        search: search.trim() || undefined,
        plan: planFilter || undefined,
        status: statusFilter || undefined,
        page,
        limit: 10,
      });
      setTenants(res.tenants);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (err) {
      console.error("Failed to load tenants:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  useEffect(() => {
    fetchTenants();
  }, [page, planFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchTenants();
  };

  const openEditModal = (t: TenantMetadata) => {
    setEditingTenant(t);
    setEditPlan(t.plan || "starter");
    setEditStatus((t.planStatus as any) || "active");
    setEditQuota(t.messageQuotaMonthly ?? t.maxMonthlyMessages ?? 25000);
    setEditChannels(t.maxChannels ?? 5);
    setEditUsers(t.maxUsers ?? 10);
    setSaveError(null);
  };

  const handleSaveGovernance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTenant) return;
    setIsSaving(true);
    setSaveError(null);

    try {
      await platformApi.tenants.updateGovernance(editingTenant.id, {
        plan: editPlan,
        planStatus: editStatus,
        messageQuotaMonthly: Number(editQuota),
        maxChannels: Number(editChannels),
        maxUsers: Number(editUsers),
      });
      setEditingTenant(null);
      await Promise.all([fetchOverview(), fetchTenants()]);
    } catch (err: any) {
      setSaveError(err.message || "Failed to update tenant governance");
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-2.5 h-2.5 mr-1" /> ACTIVE
          </span>
        );
      case "trial":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold font-mono bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <Clock className="w-2.5 h-2.5 mr-1" /> TRIAL
          </span>
        );
      case "suspended":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold font-mono bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <AlertTriangle className="w-2.5 h-2.5 mr-1" /> SUSPENDED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold font-mono bg-slate-500/10 text-slate-400 border border-slate-500/30">
            <XCircle className="w-2.5 h-2.5 mr-1" /> {status.toUpperCase()}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Privacy Shield Top Guarantee */}
      <PrivacyShieldBanner />

      {/* Header & Overview Cards */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Tenant Workspaces Catalog</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Data-blind tenancy metadata, plan quotas, and workspace governance.
            </p>
          </div>
          <button
            onClick={() => {
              fetchOverview();
              fetchTenants();
            }}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 rounded-lg border border-slate-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Overview Stats */}
        {overview && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
              <span className="text-[11px] font-mono text-slate-400">TOTAL TENANTS</span>
              <p className="text-2xl font-bold text-white mt-1">{overview.totalTenants}</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
              <span className="text-[11px] font-mono text-emerald-400">ACTIVE WORKSPACES</span>
              <p className="text-2xl font-bold text-emerald-400 mt-1">{overview.activeTenants}</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
              <span className="text-[11px] font-mono text-amber-400">TRIAL WORKSPACES</span>
              <p className="text-2xl font-bold text-amber-400 mt-1">{overview.trialTenants}</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
              <span className="text-[11px] font-mono text-rose-400">SUSPENDED</span>
              <p className="text-2xl font-bold text-rose-400 mt-1">{overview.suspendedTenants}</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
              <span className="text-[11px] font-mono text-indigo-400">ACTIVE CHANNELS</span>
              <p className="text-2xl font-bold text-indigo-400 mt-1">{overview.totalChannels}</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
              <span className="text-[11px] font-mono text-purple-400">PLATFORM STAFF</span>
              <p className="text-2xl font-bold text-purple-400 mt-1">{overview.totalPlatformStaff}</p>
            </div>
          </div>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="w-full sm:w-80 relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Tenant ID, name, or slug..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
          />
        </form>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <div className="flex items-center space-x-1.5 text-xs text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <span>Filters:</span>
          </div>
          <select
            value={planFilter}
            onChange={(e) => {
              setPlanFilter(e.target.value);
              setPage(1);
            }}
            className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">All Plans</option>
            <option value="free">Free</option>
            <option value="starter">Starter</option>
            <option value="growth">Growth</option>
            <option value="enterprise">Enterprise</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="trial">Trial</option>
            <option value="suspended">Suspended</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Tenancy Master Data Grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-mono text-slate-400 uppercase">
              <tr>
                <th className="px-4 py-3">Tenant / Workspace</th>
                <th className="px-4 py-3">Plan & Status</th>
                <th className="px-4 py-3">Connected Channels</th>
                <th className="px-4 py-3">Staff Users</th>
                <th className="px-4 py-3">Monthly Messages</th>
                <th className="px-4 py-3">Created Date</th>
                {isSuperAdmin && <th className="px-4 py-3 text-right">Governance</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-500 font-mono">
                    Loading workspace metadata...
                  </td>
                </tr>
              ) : tenants.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-500 font-mono">
                    No workspaces matched the current search filter.
                  </td>
                </tr>
              ) : (
                tenants.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-800/40 transition">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0">
                          <Building2 className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-white truncate">{t.name}</p>
                          <p className="text-[10px] font-mono text-slate-500 truncate">
                            ID: {t.id}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="space-y-1">
                        <span className="inline-block uppercase font-mono font-bold text-[10px] text-indigo-300 bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-500/30">
                          {t.plan}
                        </span>
                        <div>{getStatusBadge(t.planStatus)}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-mono">
                      <div className="flex items-center space-x-1 text-slate-300">
                        <Radio className="w-3.5 h-3.5 text-indigo-400" />
                        <span>{(t.channelCount ?? t.activeChannelCount ?? 0)} / {(t.maxChannels ?? 5)} max</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-mono">
                      <div className="flex items-center space-x-1 text-slate-300">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>{(t.userCount ?? 0)} / {(t.maxUsers ?? 10)} seats</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-mono">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span>{(t.messagesSentCurrentPeriod ?? 0).toLocaleString()}</span>
                          <span className="text-slate-500">/ {(t.messageQuotaMonthly ?? t.maxMonthlyMessages ?? 25000).toLocaleString()}</span>
                        </div>
                        <div className="w-28 bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800">
                          <div
                            className={`h-full rounded-full ${
                              ((t.messagesSentCurrentPeriod ?? 0) / (t.messageQuotaMonthly ?? t.maxMonthlyMessages ?? 25000)) > 0.9
                                ? "bg-rose-500"
                                : "bg-indigo-500"
                            }`}
                            style={{
                              width: `${Math.min(
                                100,
                                Math.round(((t.messagesSentCurrentPeriod ?? 0) / (t.messageQuotaMonthly ?? t.maxMonthlyMessages ?? 25000)) * 100)
                              )}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-[11px] text-slate-400">
                      {t.createdAt ? new Date(t.createdAt).toLocaleDateString() : "—"}
                    </td>
                    {isSuperAdmin && (
                      <td className="px-4 py-3.5 text-right">
                        <button
                          onClick={() => openEditModal(t)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-300 rounded text-xs font-semibold border border-slate-700 hover:border-indigo-500 transition inline-flex items-center space-x-1"
                        >
                          <Sliders className="w-3 h-3" />
                          <span>Govern</span>
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="px-4 py-3 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div>
            Showing <span className="text-white font-mono">{tenants.length}</span> of{" "}
            <span className="text-white font-mono">{total}</span> workspaces
          </div>
          <div className="flex items-center space-x-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 disabled:opacity-40 hover:bg-slate-800 text-xs text-slate-300 font-mono transition"
            >
              Previous
            </button>
            <span className="font-mono text-slate-400">
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 disabled:opacity-40 hover:bg-slate-800 text-xs text-slate-300 font-mono transition"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Super Admin Governance Edit Modal */}
      {editingTenant && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setEditingTenant(null)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center font-bold">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Override Tenant Governance</h3>
                <p className="text-xs text-slate-400 font-mono">Workspace: {editingTenant.name}</p>
              </div>
            </div>

            {saveError && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-lg">
                {saveError}
              </div>
            )}

            <form onSubmit={handleSaveGovernance} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Subscription Plan</label>
                  <select
                    value={editPlan}
                    onChange={(e) => setEditPlan(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="free">Free</option>
                    <option value="starter">Starter</option>
                    <option value="growth">Growth</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Workspace Lifecycle Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                  >
                    <option value="active">active</option>
                    <option value="trial">trial</option>
                    <option value="suspended">suspended</option>
                    <option value="cancelled">cancelled</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">
                  Monthly Message Quota (Messages / Period)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={editQuota}
                  onChange={(e) => setEditQuota(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Max Channels Limit</label>
                  <input
                    type="number"
                    min="1"
                    value={editChannels}
                    onChange={(e) => setEditChannels(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Max Seats Limit</label>
                  <input
                    type="number"
                    min="1"
                    value={editUsers}
                    onChange={(e) => setEditUsers(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-[11px] text-slate-400">
                🔒 Modifications will be immutably recorded to the platform audit logs under your staff ID.
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingTenant(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold disabled:opacity-50 transition"
                >
                  {isSaving ? "Applying Override..." : "Save Governance Settings"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
