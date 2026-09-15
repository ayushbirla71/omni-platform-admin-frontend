import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Terminal,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  Trash2,
  Download,
  Building2,
  Shield,
  Layers,
  ChevronDown,
  ChevronRight,
  Clock,
  CheckCircle2,
  XCircle,
  Copy,
  Info,
  Maximize2,
  Activity,
  Bug,
} from "lucide-react";
import { platformApi } from "../api/platform-api";
import { PlatformLogEntry, TenantMetadata } from "../types/platform";
import { usePlatformAuth } from "../context/PlatformAuthContext";
import { PrivacyShieldBanner } from "../components/common/PrivacyShieldBanner";

export const SystemLogsPage: React.FC = () => {
  const { user, isSuperAdmin, isPlatformDev } = usePlatformAuth();

  // Filters State
  const [tenantId, setTenantId] = useState<string>("all");
  const [level, setLevel] = useState<string>("all");
  const [moduleFilter, setModuleFilter] = useState<string>("all");
  const [search, setSearch] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"logs" | "errors">("logs");
  const [limit, setLimit] = useState<number>(200);

  // Data State
  const [logs, setLogs] = useState<PlatformLogEntry[]>([]);
  const [errors, setErrors] = useState<PlatformLogEntry[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [tenants, setTenants] = useState<TenantMetadata[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<number>(5000); // 5s default
  const [selectedLog, setSelectedLog] = useState<PlatformLogEntry | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Fetch tenants for dropdown selector
  useEffect(() => {
    let isMounted = true;
    platformApi.tenants
      .listTenants({ limit: 100 })
      .then((res) => {
        if (isMounted && res && res.tenants) {
          setTenants(res.tenants);
        }
      })
      .catch((err) => console.warn("Failed to load tenant list for log filter:", err));
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch logs or errors
  const fetchData = useCallback(
    async (isBackground = false) => {
      if (!isBackground) setIsLoading(true);
      else setIsRefreshing(true);

      try {
        if (activeTab === "logs") {
          const res = await platformApi.telemetry.getLogs({
            tenantId: tenantId !== "all" ? tenantId : undefined,
            level: level !== "all" ? level : undefined,
            module: moduleFilter !== "all" ? moduleFilter : undefined,
            search: search.trim() || undefined,
            limit,
          });
          setLogs(res.logs || []);
          setTotalCount(res.total || 0);
        } else {
          const res = await platformApi.telemetry.getSystemErrors({
            tenantId: tenantId !== "all" ? tenantId : undefined,
            search: search.trim() || undefined,
            limit: 100,
          });
          setErrors(res.errors || []);
          setTotalCount(res.total || 0);
        }
      } catch (err: any) {
        console.error("Failed to fetch system telemetry logs:", err);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [activeTab, tenantId, level, moduleFilter, search, limit]
  );

  // Effect for query changes
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh timer
  useEffect(() => {
    if (autoRefreshInterval <= 0) return;
    const timer = setInterval(() => {
      fetchData(true);
    }, autoRefreshInterval);
    return () => clearInterval(timer);
  }, [autoRefreshInterval, fetchData]);

  // Clear in-memory ring buffers
  const handleClearLogs = async () => {
    if (!window.confirm("Are you sure you want to clear the in-memory log buffer? This action is audited.")) return;
    try {
      const res = await platformApi.telemetry.clearLogs();
      setActionMessage({ type: "success", text: res.message || "Logs cleared successfully" });
      fetchData();
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message || "Failed to clear logs" });
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getLevelBadgeClass = (lvl: string) => {
    switch (lvl?.toLowerCase()) {
      case "error":
        return "bg-rose-950/80 text-rose-300 border-rose-800/60";
      case "warn":
        return "bg-amber-950/80 text-amber-300 border-amber-800/60";
      case "info":
        return "bg-blue-950/80 text-blue-300 border-blue-800/60";
      case "debug":
        return "bg-slate-800 text-slate-300 border-slate-700";
      default:
        return "bg-slate-800 text-slate-400 border-slate-700";
    }
  };

  const currentDataset = activeTab === "logs" ? logs : errors;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
              <Terminal className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                System Telemetry & Workspace Logs
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 font-mono">
                  Port 3001 Admin Portal
                </span>
              </h1>
              <p className="text-sm text-slate-400">
                Data-blind real-time diagnostics, error stack tracing, and per-tenant system telemetry.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => fetchData()}
            disabled={isLoading || isRefreshing}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-2 transition shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-primary-400" : ""}`} />
            Refresh
          </button>

          {/* Download Logs */}
          {(isSuperAdmin || isPlatformDev) && (
            <div className="flex items-center bg-slate-800 border border-slate-700 rounded-xl overflow-hidden text-xs">
              <a
                href={platformApi.telemetry.getDownloadLogUrl("app")}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-700/60 flex items-center gap-1.5 transition border-r border-slate-700 font-medium"
                title="Download app.log from server disk"
              >
                <Download className="w-3.5 h-3.5 text-blue-400" />
                app.log
              </a>
              <a
                href={platformApi.telemetry.getDownloadLogUrl("error")}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-700/60 flex items-center gap-1.5 transition font-medium"
                title="Download error.log from server disk"
              >
                <Download className="w-3.5 h-3.5 text-rose-400" />
                error.log
              </a>
            </div>
          )}

          {/* Clear Buffer */}
          {(isSuperAdmin || isPlatformDev) && (
            <button
              onClick={handleClearLogs}
              className="px-3 py-2 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear Buffer
            </button>
          )}
        </div>
      </div>

      <PrivacyShieldBanner />

      {actionMessage && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-medium ${
            actionMessage.type === "success"
              ? "bg-emerald-950/40 border-emerald-800/60 text-emerald-300"
              : "bg-rose-950/40 border-rose-800/60 text-rose-300"
          }`}
        >
          <div className="flex items-center gap-2">
            {actionMessage.type === "success" ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <XCircle className="w-4 h-4" />
            )}
            <span>{actionMessage.text}</span>
          </div>
          <button
            onClick={() => setActionMessage(null)}
            className="text-slate-400 hover:text-slate-200 text-xs ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Tabs and Auto-Refresh Toolbar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          {/* Tabs */}
          <div className="flex items-center gap-2 bg-slate-950/60 p-1 rounded-xl border border-slate-800/80">
            <button
              onClick={() => setActiveTab("logs")}
              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition ${
                activeTab === "logs"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              Live Stream ({activeTab === "logs" ? totalCount : logs.length})
            </button>
            <button
              onClick={() => setActiveTab("errors")}
              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition ${
                activeTab === "errors"
                  ? "bg-rose-600 text-white shadow-lg shadow-rose-600/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              <Bug className="w-3.5 h-3.5" />
              Error Stack Traces ({activeTab === "errors" ? totalCount : errors.length})
            </button>
          </div>

          {/* Auto Refresh Interval Picker */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
              <Clock className="w-3.5 h-3.5 text-primary-400" />
              Stream Rate:
            </span>
            <select
              value={autoRefreshInterval}
              onChange={(e) => setAutoRefreshInterval(Number(e.target.value))}
              className="bg-slate-950 border border-slate-700/80 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 font-medium"
            >
              <option value={0}>Paused (Manual)</option>
              <option value={2000}>2 seconds (Real-time)</option>
              <option value={5000}>5 seconds (Normal)</option>
              <option value={10000}>10 seconds (Slow)</option>
              <option value={30000}>30 seconds</option>
            </select>
          </div>
        </div>

        {/* Filter Toolbar with Tenant Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {/* Workspace / Tenant Filter */}
          <div className="col-span-1 sm:col-span-2">
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Building2 className="w-3 h-3 text-indigo-400" />
              Filter by Workspace Tenant
            </label>
            <div className="relative">
              <select
                value={tenantId}
                onChange={(e) => setTenantId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2.5 appearance-none focus:outline-none focus:border-indigo-500 font-mono"
              >
                <option value="all">🏢 All Workspaces (Global Platform Stream)</option>
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.id.substring(0, 8)}... - {t.plan})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>

          {/* Log Level Filter (only for logs tab) */}
          {activeTab === "logs" && (
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Filter className="w-3 h-3 text-indigo-400" />
                Log Level
              </label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500"
              >
                <option value="all">All Levels</option>
                <option value="info">INFO</option>
                <option value="warn">WARN</option>
                <option value="error">ERROR</option>
                <option value="debug">DEBUG</option>
              </select>
            </div>
          )}

          {/* Module Filter (only for logs tab) */}
          {activeTab === "logs" && (
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Layers className="w-3 h-3 text-indigo-400" />
                Subsystem Module
              </label>
              <select
                value={moduleFilter}
                onChange={(e) => setModuleFilter(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500"
              >
                <option value="all">All Modules</option>
                <option value="http">HTTP Gateway</option>
                <option value="auth">Auth & Session</option>
                <option value="webhooks">Inbound Webhooks</option>
                <option value="flows">Flow Execution Engine</option>
                <option value="ai">AI Copilot & RAG</option>
                <option value="db">PostgreSQL & Redis</option>
                <option value="platform">Platform Governance</option>
              </select>
            </div>
          )}

          {/* Search Keyword */}
          <div className={activeTab === "errors" ? "col-span-1 sm:col-span-2 md:col-span-3" : "col-span-1"}>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Search className="w-3 h-3 text-indigo-400" />
              Search Keywords / Req ID
            </label>
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search msg, reqId, stack..."
                className="w-full bg-slate-950 border border-slate-700 text-slate-200 placeholder-slate-500 text-xs rounded-xl pl-9 pr-3 py-2.5 focus:outline-none focus:border-indigo-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="text-slate-500 hover:text-slate-300 absolute right-3 top-2.5 text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Log Terminal Screen */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col font-mono text-xs">
        {/* Terminal Titlebar */}
        <div className="bg-slate-900/90 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
            <span className="text-slate-400 text-xs font-semibold ml-2 font-sans flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-slate-400" />
              {activeTab === "logs" ? "stdout / circular ring buffer" : "uncaught exceptions & error traces"}
            </span>
          </div>

          <div className="flex items-center gap-3 text-slate-400 text-[11px] font-sans">
            {tenantId !== "all" && (
              <span className="px-2 py-0.5 rounded bg-indigo-950/60 border border-indigo-800/60 text-indigo-300 flex items-center gap-1 font-mono">
                <Building2 className="w-3 h-3" />
                tenant:{tenantId.substring(0, 8)}
              </span>
            )}
            <span>Showing {currentDataset.length} entries</span>
          </div>
        </div>

        {/* Log Viewer Scrollable Area */}
        <div className="overflow-x-auto max-h-[650px] overflow-y-auto divide-y divide-slate-900/80">
          {isLoading ? (
            <div className="p-12 text-center text-slate-500 space-y-3 font-sans">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-primary-500" />
              <p>Fetching platform system telemetry stream...</p>
            </div>
          ) : currentDataset.length === 0 ? (
            <div className="p-12 text-center text-slate-500 space-y-2 font-sans">
              <Terminal className="w-8 h-8 mx-auto text-slate-600" />
              <p className="text-sm font-medium text-slate-300">No matching log entries found</p>
              <p className="text-xs text-slate-500">
                Try widening your tenant filter, log level, or clearing search criteria.
              </p>
            </div>
          ) : (
            currentDataset.map((item, index) => {
              const formattedTime = item.timestamp
                ? new Date(item.timestamp).toISOString().substring(11, 23)
                : "-";

              return (
                <div
                  key={index}
                  onClick={() => setSelectedLog(item)}
                  className="p-3 hover:bg-slate-900/80 transition cursor-pointer flex flex-col md:flex-row md:items-start justify-between gap-2 group"
                >
                  <div className="flex items-start gap-2.5 flex-1 overflow-hidden">
                    {/* Timestamp */}
                    <span className="text-slate-500 text-[11px] whitespace-nowrap shrink-0">
                      {formattedTime}
                    </span>

                    {/* Level Badge */}
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 border ${getLevelBadgeClass(
                        item.level
                      )}`}
                    >
                      {item.level || "INFO"}
                    </span>

                    {/* Module Tag */}
                    {item.module && (
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] shrink-0 border border-slate-700/50">
                        [{item.module}]
                      </span>
                    )}

                    {/* Message Body */}
                    <div className="flex-1 overflow-hidden">
                      <p className="text-slate-200 break-words whitespace-pre-wrap leading-relaxed">
                        {item.message}
                      </p>

                      {/* Error Stack Preview */}
                      {item.error?.stack && (
                        <div className="mt-1.5 p-2 bg-rose-950/30 border border-rose-900/40 rounded text-rose-300/90 text-[11px] overflow-x-auto whitespace-pre">
                          {item.error.stack.split("\n").slice(0, 3).join("\n")}
                          {item.error.stack.split("\n").length > 3 && (
                            <span className="text-rose-400 font-bold block mt-1">
                              + {item.error.stack.split("\n").length - 3} more stack frames (click to view)
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Metadata Indicators & Quick Copy */}
                  <div className="flex items-center gap-2 shrink-0 md:self-center font-sans text-[11px]">
                    {item.durationMs !== undefined && (
                      <span className="text-slate-400 text-[10px] bg-slate-800/80 px-1.5 py-0.5 rounded font-mono">
                        {item.durationMs}ms
                      </span>
                    )}
                    {item.statusCode !== undefined && (
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-bold font-mono ${
                          item.statusCode >= 500
                            ? "bg-rose-950 text-rose-300"
                            : item.statusCode >= 400
                            ? "bg-amber-950 text-amber-300"
                            : "bg-emerald-950 text-emerald-300"
                        }`}
                      >
                        {item.statusCode}
                      </span>
                    )}
                    {item.tenantId && (
                      <span className="text-indigo-300 text-[10px] bg-indigo-950/60 border border-indigo-800/40 px-1.5 py-0.5 rounded font-mono">
                        t:{item.tenantId.substring(0, 6)}
                      </span>
                    )}
                    {item.reqId && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(item.reqId!, `req-${index}`);
                        }}
                        className="text-slate-400 hover:text-slate-200 text-[10px] bg-slate-800 px-1.5 py-0.5 rounded flex items-center gap-1 font-mono"
                        title="Copy Request ID"
                      >
                        {copiedId === `req-${index}` ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        req:{item.reqId.substring(0, 6)}
                      </button>
                    )}
                    <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-300 transition" />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Detailed Log Modal / Drawer */}
      {selectedLog && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedLog(null)}
        >
          <div
            className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
              <div className="flex items-center gap-2.5">
                <span
                  className={`px-2 py-0.5 rounded text-xs font-bold uppercase border ${getLevelBadgeClass(
                    selectedLog.level
                  )}`}
                >
                  {selectedLog.level || "INFO"}
                </span>
                <h3 className="text-sm font-bold text-white">Telemetry Entry Details</h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 font-mono text-xs">
              {/* Message */}
              <div>
                <label className="block text-[11px] font-sans font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Message
                </label>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 whitespace-pre-wrap">
                  {selectedLog.message}
                </div>
              </div>

              {/* Execution Details Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-sans">
                <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl">
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Timestamp</p>
                  <p className="text-xs font-bold text-slate-200 mt-0.5 font-mono">
                    {new Date(selectedLog.timestamp).toISOString()}
                  </p>
                </div>
                <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl">
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Module</p>
                  <p className="text-xs font-bold text-indigo-400 mt-0.5">
                    {selectedLog.module || "core/http"}
                  </p>
                </div>
                <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl">
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Tenant Workspace</p>
                  <p className="text-xs font-bold text-slate-200 mt-0.5 font-mono">
                    {selectedLog.tenantId || "Global / Internal"}
                  </p>
                </div>
                <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl">
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Request ID</p>
                  <p className="text-xs font-bold text-slate-200 mt-0.5 font-mono">
                    {selectedLog.reqId || "N/A"}
                  </p>
                </div>
              </div>

              {/* Error Stack Trace if exists */}
              {selectedLog.error && (
                <div>
                  <label className="block text-[11px] font-sans font-semibold text-rose-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Exception & Stack Trace
                  </label>
                  <div className="p-3.5 bg-rose-950/30 border border-rose-900/60 rounded-xl text-rose-300 overflow-x-auto whitespace-pre leading-relaxed">
                    {selectedLog.error.stack || selectedLog.error.message}
                  </div>
                </div>
              )}

              {/* Meta / Extra Context JSON */}
              {selectedLog.meta && Object.keys(selectedLog.meta).length > 0 && (
                <div>
                  <label className="block text-[11px] font-sans font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Structured Metadata
                  </label>
                  <pre className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl text-emerald-300 overflow-x-auto">
                    {JSON.stringify(selectedLog.meta, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between font-sans">
              <span className="text-[11px] text-slate-500">
                Confidential platform operational log trace (Zero-PII compliant)
              </span>
              <button
                onClick={() => copyToClipboard(JSON.stringify(selectedLog, null, 2), "modal-json")}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
              >
                {copiedId === "modal-json" ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                Copy Raw JSON
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
