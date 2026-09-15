import React, { useEffect, useState } from "react";
import { platformApi } from "../api/platform-api";
import {
  WorkspaceSubscriptionItem,
  PlatformPlanItem,
} from "../types/platform";
import { usePlatformAuth } from "../context/PlatformAuthContext";
import {
  CreditCard,
  Search,
  Filter,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Calendar,
  Layers,
  Sparkles,
  Edit3,
  Check,
  X,
  Mail,
  Receipt,
  Radio,
  Users,
  MessageSquare,
  Bot,
  AlertCircle,
} from "lucide-react";

export const SubscriptionsPage: React.FC = () => {
  const { isSuperAdmin, isSupportAgent } = usePlatformAuth();

  const [subscriptions, setSubscriptions] = useState<WorkspaceSubscriptionItem[]>([]);
  const [plans, setPlans] = useState<PlatformPlanItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Quick Renew Modal State
  const [renewingSub, setRenewingSub] = useState<WorkspaceSubscriptionItem | null>(null);
  const [renewPlanId, setRenewPlanId] = useState("");
  const [renewAmount, setRenewAmount] = useState(49);
  const [renewCycle, setRenewCycle] = useState("monthly");
  const [renewMethod, setRenewMethod] = useState("stripe");
  const [renewSendReceipt, setRenewSendReceipt] = useState(true);
  const [renewNotes, setRenewNotes] = useState("");
  const [isRenewing, setIsRenewing] = useState(false);
  const [renewError, setRenewError] = useState<string | null>(null);

  // Lifecycle & Entitlements Modal State
  const [editingSub, setEditingSub] = useState<WorkspaceSubscriptionItem | null>(null);
  const [editPlanId, setEditPlanId] = useState("");
  const [editStatus, setEditStatus] = useState("active");
  const [editExpiresAt, setEditExpiresAt] = useState("");
  const [editMaxChannels, setEditMaxChannels] = useState(5);
  const [editMaxContacts, setEditMaxContacts] = useState(5000);
  const [editMaxMessages, setEditMaxMessages] = useState(25000);
  const [editMaxAiQueries, setEditMaxAiQueries] = useState(1000);
  const [isSavingLifecycle, setIsSavingLifecycle] = useState(false);
  const [lifecycleError, setLifecycleError] = useState<string | null>(null);

  const fetchPlans = async () => {
    try {
      const data = await platformApi.plans.list({ includeInactive: true });
      setPlans(data);
    } catch (err) {
      console.error("Failed to load plans for dropdown:", err);
    }
  };

  const fetchSubscriptions = async () => {
    setIsLoading(true);
    try {
      const res = await platformApi.subscriptions.list({
        search: search.trim() || undefined,
        status: statusFilter || undefined,
        planId: planFilter || undefined,
        page,
        limit: 10,
      });
      setSubscriptions(res.subscriptions);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (err) {
      console.error("Failed to load workspace subscriptions:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  useEffect(() => {
    fetchSubscriptions();
  }, [page, statusFilter, planFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchSubscriptions();
  };

  const openRenewModal = (sub: WorkspaceSubscriptionItem) => {
    setRenewingSub(sub);
    setRenewPlanId(sub.planId || (plans[0]?.id ?? "starter"));
    const matchingPlan = plans.find((p) => p.id === sub.planId);
    setRenewAmount(matchingPlan ? matchingPlan.priceMonthly : 49);
    setRenewCycle("monthly");
    setRenewMethod("stripe");
    setRenewSendReceipt(true);
    setRenewNotes(`Workspace renewal for ${sub.tenantName}`);
    setRenewError(null);
  };

  const handlePlanChangeInRenew = (newPlanId: string) => {
    setRenewPlanId(newPlanId);
    const plan = plans.find((p) => p.id === newPlanId);
    if (plan) {
      setRenewAmount(renewCycle === "yearly" ? plan.priceYearly : plan.priceMonthly);
    }
  };

  const handleRenewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renewingSub) return;
    setIsRenewing(true);
    setRenewError(null);

    try {
      await platformApi.subscriptions.quickRenew(renewingSub.tenantId, {
        planId: renewPlanId,
        amount: Number(renewAmount),
        billingCycle: renewCycle,
        paymentMethod: renewMethod,
        sendReceipt: renewSendReceipt,
        notes: renewNotes,
      });

      setRenewingSub(null);
      fetchSubscriptions();
    } catch (err: any) {
      setRenewError(err.message || "Failed to process subscription renewal");
    } finally {
      setIsRenewing(false);
    }
  };

  const openLifecycleModal = (sub: WorkspaceSubscriptionItem) => {
    setEditingSub(sub);
    setEditPlanId(sub.planId || "starter");
    setEditStatus(sub.planStatus || "active");
    setEditExpiresAt(sub.planExpiresAt ? sub.planExpiresAt.slice(0, 10) : "");
    setEditMaxChannels(sub.maxChannels);
    setEditMaxContacts(sub.maxContacts);
    setEditMaxMessages(sub.maxMonthlyMessages);
    setEditMaxAiQueries(sub.maxMonthlyAiQueries);
    setLifecycleError(null);
  };

  const handleLifecycleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSub) return;
    setIsSavingLifecycle(true);
    setLifecycleError(null);

    try {
      await platformApi.subscriptions.updateLifecycle(editingSub.tenantId, {
        planId: editPlanId,
        planStatus: editStatus,
        planExpiresAt: editExpiresAt ? new Date(editExpiresAt).toISOString() : null,
        maxChannels: Number(editMaxChannels),
        maxContacts: Number(editMaxContacts),
        maxMonthlyMessages: Number(editMaxMessages),
        maxMonthlyAiQueries: Number(editMaxAiQueries),
      });

      setEditingSub(null);
      fetchSubscriptions();
    } catch (err: any) {
      setLifecycleError(err.message || "Failed to update subscription lifecycle");
    } finally {
      setIsSavingLifecycle(false);
    }
  };

  const getStatusBadge = (status: string, daysRemaining: number | null, isExpired: boolean) => {
    if (isExpired || status === "expired") {
      return (
        <span className="flex items-center space-x-1 text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/30">
          <XCircle className="w-3 h-3" />
          <span>EXPIRED</span>
        </span>
      );
    }
    switch (status) {
      case "active":
        return (
          <span className="flex items-center space-x-1 text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" />
            <span>ACTIVE</span>
          </span>
        );
      case "trial":
        return (
          <span className="flex items-center space-x-1 text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            <Clock className="w-3 h-3" />
            <span>TRIAL</span>
          </span>
        );
      case "suspended":
        return (
          <span className="flex items-center space-x-1 text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <AlertTriangle className="w-3 h-3" />
            <span>SUSPENDED</span>
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 uppercase">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Workspace Subscriptions Lifecycle</h1>
            <p className="text-xs text-slate-400">
              Manage SaaS subscriptions, expiration tracking, entitlement overrides, and manual renewals.
            </p>
          </div>
        </div>

        <button
          onClick={fetchSubscriptions}
          disabled={isLoading}
          className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-lg transition self-start sm:self-auto"
          title="Refresh Subscriptions"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-indigo-400" : ""}`} />
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by workspace name or tenant ID..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </form>

        <div className="flex items-center gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="trial">Trial</option>
            <option value="expired">Expired</option>
            <option value="suspended">Suspended</option>
            <option value="cancelled">Cancelled</option>
          </select>

          {/* Plan Filter */}
          <select
            value={planFilter}
            onChange={(e) => {
              setPlanFilter(e.target.value);
              setPage(1);
            }}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Plans</option>
            {plans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 font-mono text-[11px] uppercase border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Workspace</th>
                <th className="py-3 px-4">Current Plan</th>
                <th className="py-3 px-4">Status & Expiry</th>
                <th className="py-3 px-4">Entitlements (Channels/Msgs)</th>
                <th className="py-3 px-4">Last Payment</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 font-mono">
                    Loading workspace subscription lifecycles...
                  </td>
                </tr>
              ) : subscriptions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No subscriptions match the selected criteria.
                  </td>
                </tr>
              ) : (
                subscriptions.map((sub) => (
                  <tr key={sub.tenantId} className="hover:bg-slate-800/40 transition">
                    {/* Workspace */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white">{sub.tenantName}</div>
                      <span className="text-[10px] font-mono text-slate-400 block truncate max-w-[180px]">
                        {sub.tenantId}
                      </span>
                    </td>

                    {/* Plan */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-1.5">
                        <Layers className="w-3.5 h-3.5 text-indigo-400" />
                        <span className="font-semibold text-slate-200">{sub.planName}</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 uppercase">
                        {sub.planId}
                      </span>
                    </td>

                    {/* Status & Expiration */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          {getStatusBadge(sub.planStatus, sub.daysRemaining, sub.isExpired)}
                        </div>
                        {sub.planExpiresAt ? (
                          <div className="text-[11px] text-slate-400 flex items-center space-x-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span>
                              {new Date(sub.planExpiresAt).toLocaleDateString()} (
                              <strong
                                className={
                                  sub.isExpired
                                    ? "text-rose-400"
                                    : (sub.daysRemaining ?? 0) <= 7
                                    ? "text-amber-400"
                                    : "text-emerald-400"
                                }
                              >
                                {sub.daysRemaining !== null
                                  ? sub.daysRemaining <= 0
                                    ? "Expired"
                                    : `${sub.daysRemaining}d left`
                                  : "N/A"}
                              </strong>
                              )
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-mono">No Expiry (Lifetime)</span>
                        )}
                      </div>
                    </td>

                    {/* Entitlements */}
                    <td className="py-3.5 px-4 font-mono text-[11px]">
                      <div className="text-slate-300">
                        Channels: <strong className="text-white">{sub.activeChannels}</strong> /{" "}
                        {sub.maxChannels === -1 ? "∞" : sub.maxChannels}
                      </div>
                      <div className="text-slate-400">
                        Msgs: {sub.maxMonthlyMessages === -1 ? "Unlimited" : sub.maxMonthlyMessages.toLocaleString()}
                        /mo
                      </div>
                      <div className="text-slate-400">
                        AI: {sub.maxMonthlyAiQueries === -1 ? "Unlimited" : sub.maxMonthlyAiQueries.toLocaleString()}
                        /mo
                      </div>
                    </td>

                    {/* Last Payment */}
                    <td className="py-3.5 px-4 text-[11px]">
                      {sub.lastPaymentAt ? (
                        <div>
                          <span className="text-slate-200 block font-medium">
                            {new Date(sub.lastPaymentAt).toLocaleDateString()}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 block">
                            {sub.lastInvoiceNumber || "Direct Renew"}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400">No payment record</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => openRenewModal(sub)}
                        className="inline-flex items-center space-x-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 border border-indigo-500/30 transition"
                      >
                        <Receipt className="w-3 h-3" />
                        <span>Quick Renew</span>
                      </button>

                      {(isSuperAdmin || isSupportAgent) && (
                        <button
                          onClick={() => openLifecycleModal(sub)}
                          className="inline-flex items-center space-x-1 text-xs font-medium px-2 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700 transition"
                          title="Edit lifecycle & quotas"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div>
            Showing <span className="font-semibold text-white">{subscriptions.length}</span> of{" "}
            <span className="font-semibold text-white">{total}</span> subscriptions
          </div>
          <div className="flex items-center space-x-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="px-3 py-1 bg-slate-900 border border-slate-800 rounded hover:bg-slate-800 text-slate-300 disabled:opacity-40 transition"
            >
              Previous
            </button>
            <span className="font-mono text-slate-400">
              Page {page} / {totalPages || 1}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="px-3 py-1 bg-slate-900 border border-slate-800 rounded hover:bg-slate-800 text-slate-300 disabled:opacity-40 transition"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Quick Renew Modal */}
      {renewingSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Renew Workspace Subscription</h2>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Workspace: {renewingSub.tenantName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setRenewingSub(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRenewSubmit} className="p-6 space-y-4">
              {renewError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{renewError}</span>
                </div>
              )}

              {/* Plan Selection */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Subscription Plan Tier <span className="text-rose-400">*</span>
                </label>
                <select
                  required
                  value={renewPlanId}
                  onChange={(e) => handlePlanChangeInRenew(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.currency} {p.priceMonthly}/mo | {p.currency} {p.priceYearly}/yr)
                    </option>
                  ))}
                </select>
              </div>

              {/* Billing Cycle & Amount */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Billing Cycle</label>
                  <select
                    value={renewCycle}
                    onChange={(e) => {
                      setRenewCycle(e.target.value);
                      const p = plans.find((x) => x.id === renewPlanId);
                      if (p) {
                        setRenewAmount(e.target.value === "yearly" ? p.priceYearly : p.priceMonthly);
                      }
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="monthly">Monthly (+30 Days)</option>
                    <option value="yearly">Yearly (+365 Days)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Amount Paid ($) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={renewAmount}
                    onChange={(e) => setRenewAmount(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Payment Method</label>
                <select
                  value={renewMethod}
                  onChange={(e) => setRenewMethod(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="stripe">Stripe</option>
                  <option value="razorpay">Razorpay</option>
                  <option value="bank_transfer">Direct Bank Wire / Transfer</option>
                  <option value="credit_card">Corporate Credit Card</option>
                  <option value="manual">Manual Admin Override / Cash</option>
                  <option value="crypto">Cryptocurrency</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Payment Notes / Ref</label>
                <input
                  type="text"
                  value={renewNotes}
                  onChange={(e) => setRenewNotes(e.target.value)}
                  placeholder="e.g. Wire transfer #TX99201 from client finance"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Send Receipt Checkbox */}
              <label className="flex items-center space-x-2 bg-slate-950 border border-slate-800 p-3 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={renewSendReceipt}
                  onChange={(e) => setRenewSendReceipt(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0"
                />
                <div className="flex items-center space-x-2">
                  <Mail className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-xs text-slate-200">
                    Dispatch transactional email receipt & invoice to workspace owner
                  </span>
                </div>
              </label>

              {/* Actions */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setRenewingSub(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRenewing}
                  className="px-5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-lg shadow-lg shadow-indigo-500/20 transition disabled:opacity-50"
                >
                  {isRenewing ? "Renewing..." : "Confirm & Renew Subscription"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lifecycle & Entitlements Modal */}
      {editingSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Override Entitlements & Lifecycle</h2>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Workspace: {editingSub.tenantName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingSub(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleLifecycleSubmit} className="p-6 space-y-4">
              {lifecycleError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{lifecycleError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Plan Tier</label>
                  <select
                    value={editPlanId}
                    onChange={(e) => setEditPlanId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    {plans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="active">Active</option>
                    <option value="trial">Trial</option>
                    <option value="suspended">Suspended</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="expired">Expired</option>
                  </select>
                </div>
              </div>

              {/* Expiration Date */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Expiration Date (Leave blank for lifetime)
                </label>
                <input
                  type="date"
                  value={editExpiresAt}
                  onChange={(e) => setEditExpiresAt(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              {/* Quota Limits Overrides */}
              <div className="space-y-2 pt-2 border-t border-slate-800/80">
                <span className="text-xs font-semibold text-slate-200 block">
                  Quota Limits Overrides (-1 for unlimited)
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Max Channels</label>
                    <input
                      type="number"
                      required
                      value={editMaxChannels}
                      onChange={(e) => setEditMaxChannels(parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Max Contacts</label>
                    <input
                      type="number"
                      required
                      value={editMaxContacts}
                      onChange={(e) => setEditMaxContacts(parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Messages / mo</label>
                    <input
                      type="number"
                      required
                      value={editMaxMessages}
                      onChange={(e) => setEditMaxMessages(parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">AI Queries / mo</label>
                    <input
                      type="number"
                      required
                      value={editMaxAiQueries}
                      onChange={(e) => setEditMaxAiQueries(parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setEditingSub(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingLifecycle}
                  className="px-5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-lg shadow-lg shadow-indigo-500/20 transition disabled:opacity-50"
                >
                  {isSavingLifecycle ? "Saving..." : "Save Entitlements"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
