import React, { useEffect, useState, useCallback } from "react";
import { platformApi } from "../api/platform-api";
import { PlatformAuditLogItem, TenantMetadata } from "../types/platform";
import {
  ScrollText,
  Search,
  RefreshCw,
  Terminal,
  ChevronRight,
  Building2,
  ChevronDown,
} from "lucide-react";

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<PlatformAuditLogItem[]>([]);
  const [tenants, setTenants] = useState<TenantMetadata[]>([]);
  const [tenantFilter, setTenantFilter] = useState<string>("all");
  const [actionFilter, setActionFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<PlatformAuditLogItem | null>(null);

  // Load tenants list for filtering
  useEffect(() => {
    platformApi.tenants
      .listTenants({ limit: 100 })
      .then((res) => {
        if (res && res.tenants) {
          setTenants(res.tenants);
        }
      })
      .catch((err) => console.warn("Failed to load tenant list for audit filter:", err));
  }, []);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await platformApi.staff.getAuditLogs({
        limit: 100,
        action: actionFilter.trim() || undefined,
        tenantId: tenantFilter !== "all" ? tenantFilter : undefined,
      });
      setLogs(res);
      if (res.length > 0 && (!selectedLog || !res.find((l) => l.id === selectedLog.id))) {
        setSelectedLog(res[0]);
      }
    } catch (err) {
      console.error("Failed to load audit logs:", err);
    } finally {
      setIsLoading(false);
    }
  }, [actionFilter, tenantFilter, selectedLog]);

  useEffect(() => {
    fetchLogs();
  }, [tenantFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs();
  };

  const getActionColor = (action: string) => {
    if (action.includes("suspend") || action.includes("delete") || action.includes("deactivate") || action.includes("clear")) {
      return "text-rose-400 bg-rose-500/10 border-rose-500/30";
    }
    if (action.includes("create") || action.includes("activate")) {
      return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
    }
    if (action.includes("test") || action.includes("synthetic")) {
      return "text-amber-400 bg-amber-500/10 border-amber-500/30";
    }
    if (action.includes("auth") || action.includes("login")) {
      return "text-cyan-400 bg-cyan-500/10 border-cyan-500/30";
    }
    return "text-indigo-400 bg-indigo-500/10 border-indigo-500/30";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-white tracking-tight">Platform Audit Trail</h1>
            <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full">
              IMMUTABLE LOGS
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Cryptographically timestamped record of all administrative, configuration, and security operations.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 rounded-lg border border-slate-700 transition self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          <span>Refresh Trail</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-lg">
        <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Tenant Selector */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1 font-mono">
              <Building2 className="w-3 h-3 text-indigo-400" />
              Workspace Filter
            </label>
            <div className="relative">
              <select
                value={tenantFilter}
                onChange={(e) => setTenantFilter(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white appearance-none font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="all">🏢 All Workspaces (Global)</option>
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.id.substring(0, 8)}...)
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* Action keyword */}
          <div className="sm:col-span-2">
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1 font-mono">
              <Search className="w-3 h-3 text-indigo-400" />
              Action Type / Keyword
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={actionFilter}
                  onChange={(e) => setActionFilter(e.target.value)}
                  placeholder="e.g. tenant.plan_updated, staff.create, telemetry.logs_cleared..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white rounded-lg transition"
              >
                Filter
              </button>
            </div>
          </div>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Audit Log Table */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl shadow-xl overflow-hidden flex flex-col">
          <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ScrollText className="w-4 h-4 text-indigo-400" />
              <h2 className="text-xs font-semibold text-white">Event Log Sequence</h2>
            </div>
            <span className="text-[11px] font-mono text-slate-400">Total Entries: {logs.length}</span>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 text-[10px] uppercase">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Staff Operator</th>
                  <th className="px-4 py-3">Action Type</th>
                  <th className="px-4 py-3">Target</th>
                  <th className="px-4 py-3 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                      Loading platform audit trail...
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                      No audit log records found matching the filter.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => {
                    const isSelected = selectedLog?.id === log.id;
                    return (
                      <tr
                        key={log.id}
                        onClick={() => setSelectedLog(log)}
                        className={`cursor-pointer transition ${
                          isSelected ? "bg-indigo-950/40 border-l-2 border-indigo-500" : "hover:bg-slate-800/30"
                        }`}
                      >
                        <td className="px-4 py-3 text-[11px] text-slate-400 whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </td>
                        <td className="px-4 py-3 text-slate-200 truncate max-w-[150px]">
                          {log.platformUserEmail || log.platformUserId || "System"}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getActionColor(
                              log.action
                            )}`}
                          >
                            {log.action}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-400 text-[11px] truncate max-w-[120px]">
                          {log.targetType ? `${log.targetType}:${log.targetId || "-"}` : "-"}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-500">
                          <ChevronRight className="w-3.5 h-3.5 inline" />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Log Inspector */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-800 text-sm font-semibold text-white">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <span>Audit Payload Inspector</span>
          </div>

          {selectedLog ? (
            <div className="mt-4 space-y-3.5 font-mono text-xs flex-1">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <p className="text-slate-500 text-[10px]">EVENT ID</p>
                <p className="text-white text-[11px] font-bold break-all mt-0.5">{selectedLog.id}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <p className="text-slate-500 text-[10px]">OPERATOR</p>
                  <p className="text-indigo-400 font-bold truncate mt-0.5">
                    {selectedLog.platformUserEmail || "System"}
                  </p>
                </div>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <p className="text-slate-500 text-[10px]">CLIENT IP</p>
                  <p className="text-white font-bold mt-0.5">{selectedLog.ipAddress || "Internal/Local"}</p>
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <p className="text-slate-500 text-[10px]">TIMESTAMP</p>
                <p className="text-white mt-0.5">{new Date(selectedLog.createdAt).toISOString()}</p>
              </div>

              <div>
                <p className="text-slate-400 text-[11px] mb-1.5 font-sans font-semibold">Structured Details & State Delta</p>
                <pre className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-indigo-300 text-[11px] overflow-x-auto max-h-[260px]">
                  {JSON.stringify(selectedLog.details, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-2 py-16 text-center font-mono text-xs">
              <ScrollText className="w-8 h-8" />
              <p>Select an audit log row to inspect context details.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
