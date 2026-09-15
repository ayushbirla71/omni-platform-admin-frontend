import React from "react";
import { ShieldCheck, Lock } from "lucide-react";

interface PrivacyShieldBannerProps {
  compact?: boolean;
}

export const PrivacyShieldBanner: React.FC<PrivacyShieldBannerProps> = ({ compact = false }) => {
  if (compact) {
    return (
      <div className="flex items-center space-x-2 bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 px-3 py-1 rounded-full text-xs font-medium">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        <span>Data Privacy Shield: Zero-PII Active</span>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-emerald-950/60 via-slate-900 to-indigo-950/50 border border-emerald-500/20 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg shadow-black/20">
      <div className="flex items-start sm:items-center space-x-3">
        <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 shrink-0">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h4 className="text-sm font-semibold text-emerald-300">Strict Data Privacy Shield Guarantee</h4>
            <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-1.5 py-0.5 rounded tracking-wider uppercase">
              Enforced
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Platform governance runs in a zero-PII metadata sandbox. Conversational transcripts, contacts, customer messages, and payment credentials are mathematically isolated and data-blind.
          </p>
        </div>
      </div>
      <div className="flex items-center space-x-2 text-xs text-slate-400 bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800 shrink-0">
        <Lock className="w-3.5 h-3.5 text-indigo-400" />
        <span>Zero Impersonation Policy</span>
      </div>
    </div>
  );
};
