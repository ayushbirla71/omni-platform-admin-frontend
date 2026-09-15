import React, { useEffect, useState } from "react";
import { platformApi } from "../api/platform-api";
import { PlatformPlanItem, CreatePlatformPlanDto, UpdatePlatformPlanDto } from "../types/platform";
import { usePlatformAuth } from "../context/PlatformAuthContext";
import {
  Layers,
  Plus,
  CheckCircle2,
  XCircle,
  Edit3,
  Trash2,
  DollarSign,
  Users,
  Radio,
  Sparkles,
  MessageSquare,
  Bot,
  X,
  AlertCircle,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";

export const PlansManagementPage: React.FC = () => {
  const { isSuperAdmin } = usePlatformAuth();

  const [plans, setPlans] = useState<PlatformPlanItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [includeInactive, setIncludeInactive] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");

  // Form Fields
  const [formData, setFormData] = useState<{
    id: string;
    name: string;
    description: string;
    priceMonthly: number;
    priceYearly: number;
    currency: string;
    maxChannels: number;
    maxContacts: number;
    maxMonthlyMessages: number;
    maxMonthlyAiQueries: number;
    badgeText: string;
    featuresStr: string;
    isActive: boolean;
    isPublic: boolean;
    isCustom: boolean;
  }>({
    id: "",
    name: "",
    description: "",
    priceMonthly: 29,
    priceYearly: 290,
    currency: "USD",
    maxChannels: 5,
    maxContacts: 5000,
    maxMonthlyMessages: 25000,
    maxMonthlyAiQueries: 1000,
    badgeText: "",
    featuresStr: "WhatsApp & Telegram integrations\nAI Automated Flows\nMulti-agent Inbox\nAnalytics Dashboard",
    isActive: true,
    isPublic: true,
    isCustom: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchPlans = async () => {
    setIsLoading(true);
    try {
      const data = await platformApi.plans.list({ includeInactive });
      setPlans(data);
    } catch (err: any) {
      console.error("Failed to load platform plans:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, [includeInactive]);

  const openCreateModal = () => {
    setIsEditing(false);
    setSelectedPlanId("");
    setFormData({
      id: "",
      name: "",
      description: "",
      priceMonthly: 29,
      priceYearly: 290,
      currency: "USD",
      maxChannels: 5,
      maxContacts: 5000,
      maxMonthlyMessages: 25000,
      maxMonthlyAiQueries: 1000,
      badgeText: "",
      featuresStr: "WhatsApp & Telegram integrations\nAI Automated Flows\nMulti-agent Inbox\nAnalytics Dashboard",
      isActive: true,
      isPublic: true,
      isCustom: false,
    });
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const openEditModal = (plan: PlatformPlanItem) => {
    setIsEditing(true);
    setSelectedPlanId(plan.id);
    setFormData({
      id: plan.id,
      name: plan.name,
      description: plan.description || "",
      priceMonthly: plan.priceMonthly,
      priceYearly: plan.priceYearly,
      currency: plan.currency || "USD",
      maxChannels: plan.maxChannels,
      maxContacts: plan.maxContacts,
      maxMonthlyMessages: plan.maxMonthlyMessages,
      maxMonthlyAiQueries: plan.maxMonthlyAiQueries,
      badgeText: plan.badgeText || "",
      featuresStr: (plan.features || []).join("\n"),
      isActive: plan.isActive,
      isPublic: plan.isPublic,
      isCustom: plan.isCustom,
    });
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleDeleteOrDeactivate = async (plan: PlatformPlanItem) => {
    if (!window.confirm(`Are you sure you want to deactivate or delete plan tier "${plan.name}" (${plan.id})?`)) {
      return;
    }
    try {
      const res = await platformApi.plans.deleteOrDeactivate(plan.id);
      alert(res.message);
      fetchPlans();
    } catch (err: any) {
      alert(err.message || "Failed to remove or deactivate plan");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    const featureList = formData.featuresStr
      .split("\n")
      .map((f) => f.trim())
      .filter(Boolean);

    try {
      if (isEditing) {
        const updatePayload: UpdatePlatformPlanDto = {
          name: formData.name,
          description: formData.description || undefined,
          priceMonthly: Number(formData.priceMonthly),
          priceYearly: Number(formData.priceYearly),
          currency: formData.currency,
          maxChannels: Number(formData.maxChannels),
          maxContacts: Number(formData.maxContacts),
          maxMonthlyMessages: Number(formData.maxMonthlyMessages),
          maxMonthlyAiQueries: Number(formData.maxMonthlyAiQueries),
          badgeText: formData.badgeText || undefined,
          features: featureList,
          isActive: formData.isActive,
          isPublic: formData.isPublic,
          isCustom: formData.isCustom,
        };

        await platformApi.plans.update(selectedPlanId, updatePayload);
      } else {
        const createPayload: CreatePlatformPlanDto = {
          id: formData.id.toLowerCase().trim().replace(/[^a-z0-9_-]/g, "_"),
          name: formData.name,
          description: formData.description || undefined,
          priceMonthly: Number(formData.priceMonthly),
          priceYearly: Number(formData.priceYearly),
          currency: formData.currency,
          maxChannels: Number(formData.maxChannels),
          maxContacts: Number(formData.maxContacts),
          maxMonthlyMessages: Number(formData.maxMonthlyMessages),
          maxMonthlyAiQueries: Number(formData.maxMonthlyAiQueries),
          badgeText: formData.badgeText || undefined,
          features: featureList,
          isActive: formData.isActive,
          isPublic: formData.isPublic,
          isCustom: formData.isCustom,
        };

        if (!createPayload.id) {
          throw new Error("Plan slug ID is required (e.g. starter, pro, enterprise)");
        }

        await platformApi.plans.create(createPayload);
      }

      setIsModalOpen(false);
      fetchPlans();
    } catch (err: any) {
      setErrorMsg(err.message || "Error saving platform plan tier");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">SaaS Subscription Plans</h1>
              <p className="text-xs text-slate-400">
                Dynamic pricing tiers, quota entitlements, and feature packages for workspaces.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <label className="flex items-center space-x-2 text-xs text-slate-300 bg-slate-900 border border-slate-800 px-3 py-2 rounded-lg cursor-pointer hover:bg-slate-800/60 transition">
            <input
              type="checkbox"
              checked={includeInactive}
              onChange={(e) => setIncludeInactive(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0"
            />
            <span>Show Inactive Tiers</span>
          </label>

          <button
            onClick={fetchPlans}
            disabled={isLoading}
            className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-lg transition"
            title="Refresh Plans"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-indigo-400" : ""}`} />
          </button>

          {isSuperAdmin && (
            <button
              onClick={openCreateModal}
              className="flex items-center space-x-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs px-4 py-2 rounded-lg shadow-lg shadow-indigo-500/20 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Create Plan Tier</span>
            </button>
          )}
        </div>
      </div>

      {/* Plan Cards Grid */}
      {isLoading ? (
        <div className="p-12 text-center text-xs font-mono text-slate-500 bg-slate-900/40 rounded-xl border border-slate-800/60">
          Loading platform plan tiers...
        </div>
      ) : plans.length === 0 ? (
        <div className="p-12 text-center text-xs text-slate-400 bg-slate-900/40 rounded-xl border border-slate-800/60">
          No SaaS subscription plans found. Create your first plan tier above.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-slate-900/80 border rounded-xl overflow-hidden flex flex-col justify-between transition-all ${
                plan.isActive
                  ? "border-slate-800 hover:border-slate-700"
                  : "border-slate-800/50 opacity-70 bg-slate-950/60"
              }`}
            >
              <div className="p-5 space-y-4">
                {/* Card Top / Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-base font-bold text-white">{plan.name}</h3>
                      {plan.badgeText && (
                        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                          {plan.badgeText}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">ID: {plan.id}</span>
                  </div>

                  <div className="flex items-center space-x-1">
                    {plan.isActive ? (
                      <span className="flex items-center space-x-1 text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>ACTIVE</span>
                      </span>
                    ) : (
                      <span className="flex items-center space-x-1 text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        <XCircle className="w-3 h-3" />
                        <span>INACTIVE</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Description */}
                {plan.description && (
                  <p className="text-xs text-slate-400 leading-relaxed">{plan.description}</p>
                )}

                {/* Pricing Block */}
                <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3 flex items-center justify-between">
                  <div>
                    <div className="flex items-baseline space-x-1">
                      <span className="text-lg font-extrabold text-white">
                        {plan.currency} {plan.priceMonthly}
                      </span>
                      <span className="text-[11px] text-slate-400">/mo</span>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      or {plan.currency} {plan.priceYearly}/yr
                    </span>
                  </div>

                  <div className="text-right space-y-0.5">
                    {plan.isPublic && (
                      <span className="text-[10px] font-mono text-slate-400 block">Publicly Visible</span>
                    )}
                    {plan.isCustom && (
                      <span className="text-[10px] font-mono text-purple-400 block">Enterprise Custom</span>
                    )}
                  </div>
                </div>

                {/* Entitlement Quota Limits */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-400 block">
                    Entitlement Quotas
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-950/50 border border-slate-800/60 p-2 rounded flex items-center space-x-2">
                      <Radio className="w-3.5 h-3.5 text-indigo-400" />
                      <div>
                        <span className="text-[10px] text-slate-400 block">Max Channels</span>
                        <span className="font-semibold text-slate-200">
                          {plan.maxChannels === -1 ? "Unlimited" : plan.maxChannels}
                        </span>
                      </div>
                    </div>

                    <div className="bg-slate-950/50 border border-slate-800/60 p-2 rounded flex items-center space-x-2">
                      <Users className="w-3.5 h-3.5 text-cyan-400" />
                      <div>
                        <span className="text-[10px] text-slate-400 block">Max Contacts</span>
                        <span className="font-semibold text-slate-200">
                          {plan.maxContacts === -1 ? "Unlimited" : plan.maxContacts.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="bg-slate-950/50 border border-slate-800/60 p-2 rounded flex items-center space-x-2">
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                      <div>
                        <span className="text-[10px] text-slate-400 block">Messages / mo</span>
                        <span className="font-semibold text-slate-200">
                          {plan.maxMonthlyMessages === -1 ? "Unlimited" : plan.maxMonthlyMessages.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="bg-slate-950/50 border border-slate-800/60 p-2 rounded flex items-center space-x-2">
                      <Bot className="w-3.5 h-3.5 text-purple-400" />
                      <div>
                        <span className="text-[10px] text-slate-400 block">AI Queries / mo</span>
                        <span className="font-semibold text-slate-200">
                          {plan.maxMonthlyAiQueries === -1 ? "Unlimited" : plan.maxMonthlyAiQueries.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Features List */}
                {plan.features && plan.features.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-400 block">
                      Included Features
                    </span>
                    <ul className="space-y-1 text-xs text-slate-300">
                      {plan.features.slice(0, 5).map((feat, idx) => (
                        <li key={idx} className="flex items-center space-x-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span className="truncate">{feat}</span>
                        </li>
                      ))}
                      {plan.features.length > 5 && (
                        <li className="text-[11px] text-slate-400 pl-5">
                          + {plan.features.length - 5} more features
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </div>

              {/* Action Buttons Footer */}
              {isSuperAdmin && (
                <div className="p-3 bg-slate-950 border-t border-slate-800/80 flex items-center justify-end space-x-2">
                  <button
                    onClick={() => openEditModal(plan)}
                    className="flex items-center space-x-1.5 text-xs text-indigo-300 hover:text-indigo-200 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 px-3 py-1.5 rounded-lg transition"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Tier</span>
                  </button>

                  <button
                    onClick={() => handleDeleteOrDeactivate(plan)}
                    className="flex items-center space-x-1 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 px-2.5 py-1.5 rounded-lg transition"
                    title="Deactivate or Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Plan Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl my-8">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">
                    {isEditing ? `Edit Plan Tier: ${formData.name}` : "Create New SaaS Plan Tier"}
                  </h2>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Configure tier pricing, quotas, and capability entitlements
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {errorMsg && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Plan Slug / ID */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Plan Code Identifier <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    disabled={isEditing}
                    value={formData.id}
                    onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                    placeholder="e.g. starter, pro, enterprise"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono disabled:opacity-60"
                  />
                  <span className="text-[10px] text-slate-400">Unique alphanumeric key</span>
                </div>

                {/* Plan Name */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Display Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Professional Business Tier"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g. Complete omnichannel platform for scaling customer success teams"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Pricing & Currency */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Price Monthly <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={formData.priceMonthly}
                    onChange={(e) => setFormData({ ...formData, priceMonthly: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Price Yearly <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={formData.priceYearly}
                    onChange={(e) => setFormData({ ...formData, priceYearly: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Currency</label>
                  <input
                    type="text"
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value.toUpperCase() })}
                    placeholder="USD"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 uppercase font-mono"
                  />
                </div>
              </div>

              {/* Quota Limits */}
              <div className="space-y-2 pt-2 border-t border-slate-800/80">
                <span className="text-xs font-semibold text-slate-200 block">
                  Entitlement Quota Limits (-1 for unlimited)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Max Channels</label>
                    <input
                      type="number"
                      required
                      value={formData.maxChannels}
                      onChange={(e) => setFormData({ ...formData, maxChannels: parseInt(e.target.value) || 0 })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Max Contacts</label>
                    <input
                      type="number"
                      required
                      value={formData.maxContacts}
                      onChange={(e) => setFormData({ ...formData, maxContacts: parseInt(e.target.value) || 0 })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Messages / mo</label>
                    <input
                      type="number"
                      required
                      value={formData.maxMonthlyMessages}
                      onChange={(e) => setFormData({ ...formData, maxMonthlyMessages: parseInt(e.target.value) || 0 })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">AI Queries / mo</label>
                    <input
                      type="number"
                      required
                      value={formData.maxMonthlyAiQueries}
                      onChange={(e) => setFormData({ ...formData, maxMonthlyAiQueries: parseInt(e.target.value) || 0 })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Badge & Features */}
              <div className="space-y-3 pt-2 border-t border-slate-800/80">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Badge Text (Optional)</label>
                  <input
                    type="text"
                    value={formData.badgeText}
                    onChange={(e) => setFormData({ ...formData, badgeText: e.target.value })}
                    placeholder="e.g. Most Popular, Best Value, Early Bird"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Features List (One feature per line)
                  </label>
                  <textarea
                    rows={4}
                    value={formData.featuresStr}
                    onChange={(e) => setFormData({ ...formData, featuresStr: e.target.value })}
                    placeholder="WhatsApp & Telegram Integrations&#10;Smart AI Agent Copilot&#10;Zero-PII Secure Architecture"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              {/* Status & Options Toggles */}
              <div className="pt-2 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label className="flex items-center space-x-2 bg-slate-950 border border-slate-800 p-2.5 rounded-lg cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0"
                  />
                  <div>
                    <span className="text-xs font-semibold text-white block">Active Tier</span>
                    <span className="text-[10px] text-slate-400 block">Available for workspaces</span>
                  </div>
                </label>

                <label className="flex items-center space-x-2 bg-slate-950 border border-slate-800 p-2.5 rounded-lg cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isPublic}
                    onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                    className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0"
                  />
                  <div>
                    <span className="text-xs font-semibold text-white block">Public Pricing</span>
                    <span className="text-[10px] text-slate-400 block">Visible in catalog</span>
                  </div>
                </label>

                <label className="flex items-center space-x-2 bg-slate-950 border border-slate-800 p-2.5 rounded-lg cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isCustom}
                    onChange={(e) => setFormData({ ...formData, isCustom: e.target.checked })}
                    className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0"
                  />
                  <div>
                    <span className="text-xs font-semibold text-white block">Custom / Enterprise</span>
                    <span className="text-[10px] text-slate-400 block">Manual assignment</span>
                  </div>
                </label>
              </div>

              {/* Form Buttons */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-lg shadow-lg shadow-indigo-500/20 transition disabled:opacity-50"
                >
                  {isSubmitting ? "Saving Plan..." : isEditing ? "Save Plan Changes" : "Create Plan Tier"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
