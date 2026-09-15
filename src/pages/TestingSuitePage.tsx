import React, { useState } from "react";
import { platformApi } from "../api/platform-api";
import { SyntheticWebhookResult, ChannelHealthPingResult } from "../types/platform";
import {
  FlaskConical,
  Send,
  Radio,
  CheckCircle2,
  Terminal,
  Activity,
  Layers,
  Sparkles,
} from "lucide-react";

export const TestingSuitePage: React.FC = () => {
  // Webhook Simulator State
  const [channelType, setChannelType] = useState<"whatsapp" | "telegram" | "web">("whatsapp");
  const [mockSenderId, setMockSenderId] = useState("+15550009999");
  const [mockText, setMockText] = useState("Hello from synthetic QA dispatcher");
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchResult, setDispatchResult] = useState<SyntheticWebhookResult | null>(null);

  // Channel Health Ping State
  const [isPingingChannels, setIsPingingChannels] = useState(false);
  const [channelPingResult, setChannelPingResult] = useState<ChannelHealthPingResult | null>(null);

  const handleDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsDispatching(true);
    try {
      const res = await platformApi.testing.dispatchSyntheticWebhook({
        channelType,
        mockSenderId,
        mockText,
      });
      setDispatchResult(res);
    } catch (err: any) {
      console.error("Synthetic dispatch error:", err);
    } finally {
      setIsDispatching(false);
    }
  };

  const handleRunChannelPings = async () => {
    setIsPingingChannels(true);
    try {
      const res = await platformApi.testing.getChannelPings();
      setChannelPingResult(res);
    } catch (err) {
      console.error("Failed to run channel pings:", err);
    } finally {
      setIsPingingChannels(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2">
          <h1 className="text-xl font-bold text-white tracking-tight">Platform Synthetic Testing Suite</h1>
          <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full">
            SANDBOX UTILITIES
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-0.5">
          Verify webhook ingestion pipelines, channel connectivity pings, and payload schema conformance without impacting production tenant storage.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Synthetic Webhook Dispatcher */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-800 text-sm font-semibold text-white">
              <FlaskConical className="w-4 h-4 text-amber-400" />
              <span>Synthetic Inbound Webhook Dispatcher</span>
            </div>

            <form onSubmit={handleDispatch} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Target Ingestion Channel</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setChannelType("whatsapp")}
                    className={`py-2 px-3 rounded-lg border font-mono text-center transition ${
                      channelType === "whatsapp"
                        ? "bg-emerald-600/20 text-emerald-300 border-emerald-500/40 font-bold"
                        : "bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800"
                    }`}
                  >
                    WhatsApp Cloud
                  </button>
                  <button
                    type="button"
                    onClick={() => setChannelType("telegram")}
                    className={`py-2 px-3 rounded-lg border font-mono text-center transition ${
                      channelType === "telegram"
                        ? "bg-cyan-600/20 text-cyan-300 border-cyan-500/40 font-bold"
                        : "bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800"
                    }`}
                  >
                    Telegram Bot
                  </button>
                  <button
                    type="button"
                    onClick={() => setChannelType("web")}
                    className={`py-2 px-3 rounded-lg border font-mono text-center transition ${
                      channelType === "web"
                        ? "bg-indigo-600/20 text-indigo-300 border-indigo-500/40 font-bold"
                        : "bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800"
                    }`}
                  >
                    Web Live Chat
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Mock Sender Identifier</label>
                <input
                  type="text"
                  value={mockSenderId}
                  onChange={(e) => setMockSenderId(e.target.value)}
                  placeholder="+15550009999"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Mock Message Payload Text</label>
                <input
                  type="text"
                  value={mockText}
                  onChange={(e) => setMockText(e.target.value)}
                  placeholder="Ping test message"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <button
                type="submit"
                disabled={isDispatching}
                className="w-full flex items-center justify-center space-x-2 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-lg shadow-lg shadow-amber-600/20 disabled:opacity-50 transition"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isDispatching ? "Executing Synthetic Dispatch..." : "Dispatch Dry-Run Webhook"}</span>
              </button>
            </form>
          </div>

          <div className="mt-4 p-3 bg-slate-950 rounded-lg border border-slate-800 text-[11px] text-slate-400">
            💡 Dry-run tests simulate full HMAC header calculation and payload parsing through backend router pipelines without persisting to tenant customer inboxes.
          </div>
        </div>

        {/* Dispatch Inspector Terminal */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-sm font-semibold text-white">
            <div className="flex items-center space-x-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span>Execution Output & Pipeline Metrics</span>
            </div>
            {dispatchResult && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                HTTP {dispatchResult.statusCode} OK ({dispatchResult.durationMs}ms)
              </span>
            )}
          </div>

          <div className="flex-1 mt-4 bg-slate-950 rounded-xl p-4 border border-slate-800/80 font-mono text-xs overflow-auto max-h-[380px]">
            {dispatchResult ? (
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-emerald-400 text-xs">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{dispatchResult.response}</span>
                </div>
                <div>
                  <p className="text-slate-500 text-[10px] mb-1 uppercase tracking-wider">
                    Simulated Payload Dispatched:
                  </p>
                  <pre className="text-indigo-300 text-[11px] bg-slate-900/80 p-3 rounded border border-slate-800 overflow-x-auto">
                    {JSON.stringify(dispatchResult.simulatedPayload, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-2 py-12">
                <Terminal className="w-8 h-8" />
                <p>Run a synthetic webhook dispatch to inspect telemetry results.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Channel Connectivity Diagnostic Ping */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <Radio className="w-4 h-4 text-indigo-400" />
            <span className="text-sm font-semibold text-white">Platform Channel Health Diagnostic</span>
          </div>
          <button
            onClick={handleRunChannelPings}
            disabled={isPingingChannels}
            className="flex items-center space-x-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition"
          >
            <Activity className={`w-3.5 h-3.5 ${isPingingChannels ? "animate-spin text-indigo-400" : ""}`} />
            <span>{isPingingChannels ? "Scanning..." : "Execute Channel Health Audit"}</span>
          </button>
        </div>

        {channelPingResult ? (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-4">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <span className="text-[10px] font-mono text-slate-500">AGGREGATE STATUS</span>
              <p className="text-xl font-bold text-emerald-400 font-mono mt-1 uppercase">
                {channelPingResult.status}
              </p>
              <p className="text-[10px] font-mono text-slate-400 mt-1">
                Scan Latency: {channelPingResult.latencyMs}ms
              </p>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <span className="text-[10px] font-mono text-slate-500">ACTIVE CHANNELS</span>
              <p className="text-xl font-bold text-white font-mono mt-1">
                {channelPingResult.activeChannels}
              </p>
              <p className="text-[10px] font-mono text-slate-400 mt-1">Across all workspaces</p>
            </div>
            <div className="col-span-2 bg-slate-950 p-4 rounded-xl border border-slate-800">
              <span className="text-[10px] font-mono text-slate-500">CHANNELS BY CONNECTOR TYPE</span>
              <div className="flex flex-wrap gap-2 mt-2">
                {Object.entries(channelPingResult.channelsByType || {}).map(([type, count]) => (
                  <span
                    key={type}
                    className="px-2.5 py-1 bg-slate-900 border border-slate-800 text-slate-200 rounded text-xs font-mono"
                  >
                    <strong className="text-indigo-400">{type}</strong>: {count}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-slate-500 text-xs font-mono">
            Click "Execute Channel Health Audit" to scan global connector states.
          </div>
        )}
      </div>
    </div>
  );
};
