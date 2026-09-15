import React, { useEffect, useState } from "react";
import { platformApi } from "../api/platform-api";
import { SystemHealthTelemetry } from "../types/platform";
import {
  Server,
  Database,
  Cpu,
  Activity,
  HardDrive,
  Clock,
  RefreshCw,
  AlertCircle,
  Radio,
  Layers,
  Terminal,
} from "lucide-react";

export const SystemHealthPage: React.FC = () => {
  const [telemetry, setTelemetry] = useState<SystemHealthTelemetry | null>(null);
  const [errorStats, setErrorStats] = useState<{
    webhookFailuresLast24h: number;
    recentAuditActionCounts: Array<{ action: string; count: number }>;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchTelemetry = async () => {
    try {
      const [health, errors] = await Promise.all([
        platformApi.telemetry.getHealth(),
        platformApi.telemetry.getErrors(),
      ]);
      setTelemetry(health);
      setErrorStats(errors);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Failed to load telemetry:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTelemetry();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchTelemetry();
    }, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / (3600 * 24));
    const hours = Math.floor((seconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${days}d ${hours}h ${minutes}m ${secs}s`;
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Refresh Control */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-white tracking-tight">
              Infrastructure & Process Telemetry
            </h1>
            <span className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full">
              LIVE METRICS
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time diagnostics for Node.js process, PostgreSQL pool, Redis cache, and WebSocket cluster.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded bg-slate-950 border-slate-700 text-indigo-600 focus:ring-0"
            />
            <span className="font-mono text-[11px]">Auto-Refresh (5s)</span>
          </label>

          <button
            onClick={fetchTelemetry}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white rounded-lg transition shadow"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Poll Now</span>
          </button>
        </div>
      </div>

      {telemetry ? (
        <div className="space-y-6">
          {/* Top Live Health Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Database Health */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg">
                  <Database className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 uppercase">
                  {telemetry.database.status}
                </span>
              </div>
              <div className="mt-4">
                <p className="text-xs text-slate-400 font-mono">POSTGRES POOL</p>
                <div className="flex items-baseline space-x-2 mt-1">
                  <span className="text-2xl font-bold text-white font-mono">
                    {telemetry.database.pingLatencyMs}ms
                  </span>
                  <span className="text-xs text-slate-500 font-mono">latency</span>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>Active: {(telemetry.database?.pool?.totalCount ?? 0) - (telemetry.database?.pool?.idleCount ?? 0)}</span>
                  <span>Idle: {telemetry.database?.pool?.idleCount ?? 0}</span>
                  <span>Waiting: {telemetry.database?.pool?.waitingCount ?? 0}</span>
                </div>
              </div>
            </div>

            {/* Redis Cache */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="p-2 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-lg">
                  <Activity className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 uppercase">
                  {telemetry.redis.status}
                </span>
              </div>
              <div className="mt-4">
                <p className="text-xs text-slate-400 font-mono">REDIS PUB/SUB CLUSTER</p>
                <div className="flex items-baseline space-x-2 mt-1">
                  <span className="text-2xl font-bold text-white font-mono">
                    {telemetry.redis.pingLatencyMs >= 0 ? `${telemetry.redis.pingLatencyMs}ms` : "Fallback"}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">ping</span>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>State: {telemetry.redis.connected ? "Connected" : "In-Memory"}</span>
                  <span className="text-emerald-400 font-bold">READY</span>
                </div>
              </div>
            </div>

            {/* Realtime WebSockets */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="p-2 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 rounded-lg">
                  <Radio className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 uppercase">
                  ACTIVE
                </span>
              </div>
              <div className="mt-4">
                <p className="text-xs text-slate-400 font-mono">REAL-TIME WEBSOCKETS</p>
                <div className="flex items-baseline space-x-2 mt-1">
                  <span className="text-2xl font-bold text-white font-mono">
                    {telemetry.realtime.activeConnections}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">clients</span>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>Active Tenants: {telemetry.realtime.activeTenants}</span>
                  <span>Port: 4000</span>
                </div>
              </div>
            </div>

            {/* Node.js Memory RSS */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="p-2 bg-purple-500/10 border border-purple-500/30 text-purple-400 rounded-lg">
                  <HardDrive className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/30 uppercase">
                  PID {telemetry.process.pid}
                </span>
              </div>
              <div className="mt-4">
                <p className="text-xs text-slate-400 font-mono">NODE.JS HEAP USED</p>
                <div className="flex items-baseline space-x-2 mt-1">
                  <span className="text-2xl font-bold text-white font-mono">
                    {telemetry.process.memory.heapUsedMb} MB
                  </span>
                  <span className="text-xs text-slate-500 font-mono">
                    / {telemetry.process.memory.heapTotalMb} MB
                  </span>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>RSS: {telemetry.process.memory.rssMb} MB</span>
                  <span>Ext: {telemetry.process.memory.externalMb} MB</span>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Telemetry Grids */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Host & Server Telemetry */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
              <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-800 text-sm font-semibold text-white">
                <Server className="w-4 h-4 text-cyan-400" />
                <span>Host Server Environment</span>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4 text-xs font-mono">
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <p className="text-slate-500 text-[10px]">NODE RUNTIME</p>
                  <p className="text-white font-bold mt-0.5">{telemetry.server.nodeVersion}</p>
                </div>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <p className="text-slate-500 text-[10px]">OS PLATFORM / ARCH</p>
                  <p className="text-white font-bold mt-0.5">
                    {telemetry.server.platform} ({telemetry.server.architecture})
                  </p>
                </div>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <p className="text-slate-500 text-[10px]">CPU CORES</p>
                  <p className="text-white font-bold mt-0.5">{telemetry.server.cpuCount} Cores</p>
                </div>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <p className="text-slate-500 text-[10px]">LOAD AVERAGE (1/5/15m)</p>
                  <p className="text-white font-bold mt-0.5">
                    {(telemetry.server.loadAverage || []).map((l) => (typeof l === "number" ? l.toFixed(2) : l)).join(", ") || "N/A"}
                  </p>
                </div>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <p className="text-slate-500 text-[10px]">SYSTEM MEMORY</p>
                  <p className="text-white font-bold mt-0.5">
                    {(telemetry.server.freeMemoryMb ?? 0).toLocaleString()} MB free /{" "}
                    {(telemetry.server.totalMemoryMb ?? 0).toLocaleString()} MB
                  </p>
                </div>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <p className="text-slate-500 text-[10px]">PROCESS UPTIME</p>
                  <p className="text-white font-bold mt-0.5">
                    {formatUptime(telemetry.process.uptimeSeconds)}
                  </p>
                </div>
              </div>
            </div>

            {/* Error Diagnostics & Audit Actions */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
              <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-800 text-sm font-semibold text-white">
                <AlertCircle className="w-4 h-4 text-rose-400" />
                <span>24h Anomaly & Platform Activity</span>
              </div>
              <div className="mt-4 space-y-4">
                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-200">Webhook Delivery Failures (24h)</p>
                    <p className="text-[11px] text-slate-500">
                      External webhook endpoints returning 4xx/5xx or timeouts
                    </p>
                  </div>
                  <div className="text-xl font-bold font-mono text-emerald-400">
                    {errorStats?.webhookFailuresLast24h || 0}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-300 mb-2">
                    Top Administrative Actions (24h)
                  </p>
                  <div className="space-y-1.5 font-mono text-xs">
                    {errorStats?.recentAuditActionCounts && errorStats.recentAuditActionCounts.length > 0 ? (
                      errorStats.recentAuditActionCounts.map((act) => (
                        <div
                          key={act.action}
                          className="flex items-center justify-between p-2 bg-slate-950 rounded border border-slate-800"
                        >
                          <span className="text-indigo-400">{act.action}</span>
                          <span className="text-slate-400 font-bold">{act.count} events</span>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 text-center text-slate-500 text-xs bg-slate-950 rounded border border-slate-800">
                        No administrative operations recorded in the last 24 hours.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-right text-[11px] font-mono text-slate-500">
            Last telemetry snapshot: {lastUpdated.toLocaleTimeString()}
          </div>
        </div>
      ) : (
        <div className="p-12 text-center text-slate-500 font-mono">
          Loading live telemetry feeds...
        </div>
      )}
    </div>
  );
};
