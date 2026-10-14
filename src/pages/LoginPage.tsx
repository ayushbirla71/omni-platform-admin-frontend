import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { usePlatformAuth } from "../context/PlatformAuthContext";
import { PasswordInput } from "../components/common/PasswordInput";
import { Shield, Lock, Mail, KeyRound, AlertCircle, Sparkles } from "lucide-react";

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mfaToken, setMfaToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = usePlatformAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || "/";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login({
        email: email.trim(),
        password,
        mfaToken: mfaToken.trim() || undefined,
      });
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || "Invalid platform staff credentials");
    } finally {
      setIsSubmitting(false);
    }
  };

  const setDemoCredentials = (roleEmail: string) => {
    setEmail(roleEmail);
    setPassword("Admin1234!");
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-xl shadow-indigo-500/20 text-white font-bold border border-indigo-400/30">
            <Shield className="w-8 h-8" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-extrabold text-white tracking-tight">
          Omni Platform Staff Portal
        </h2>
        <p className="mt-1 text-center text-xs font-mono text-indigo-300">
          Internal Infrastructure & Governance Gateway
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-slate-900/80 backdrop-blur-xl py-8 px-6 shadow-2xl border border-slate-800 sm:rounded-2xl sm:px-10">
          {error && (
            <div className="mb-5 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-start space-x-2.5 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Platform Staff Email
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@omniplatform.internal"
                  className="block w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Staff Password
              </label>
              <PasswordInput
                leftIcon={<Lock className="w-4 h-4" />}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="block w-full pl-9 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-mono"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-slate-300">
                  MFA Code <span className="text-slate-500 text-[10px]">(Optional for dev)</span>
                </label>
              </div>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={mfaToken}
                  onChange={(e) => setMfaToken(e.target.value)}
                  placeholder="6-digit TOTP token"
                  maxLength={6}
                  className="block w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition"
            >
              {isSubmitting ? "Authenticating Staff..." : "Sign In to Platform Admin"}
            </button>
          </form>

          {/* Quick Demo Staff Logins */}
          {/* <div className="mt-6 pt-5 border-t border-slate-800">
            <div className="flex items-center space-x-1.5 mb-2.5 text-[11px] text-slate-400">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Quick-Fill Seeded Staff Accounts:</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
              <button
                type="button"
                onClick={() => setDemoCredentials("superadmin@omniplatform.internal")}
                className="p-1.5 bg-slate-950 hover:bg-purple-950/40 border border-purple-500/20 text-purple-300 rounded text-left transition"
              >
                Super Admin
              </button>
              <button
                type="button"
                onClick={() => setDemoCredentials("dev@omniplatform.internal")}
                className="p-1.5 bg-slate-950 hover:bg-cyan-950/40 border border-cyan-500/20 text-cyan-300 rounded text-left transition"
              >
                Platform Dev
              </button>
              <button
                type="button"
                onClick={() => setDemoCredentials("qa@omniplatform.internal")}
                className="p-1.5 bg-slate-950 hover:bg-amber-950/40 border border-amber-500/20 text-amber-300 rounded text-left transition"
              >
                QA / Tester
              </button>
              <button
                type="button"
                onClick={() => setDemoCredentials("support@omniplatform.internal")}
                className="p-1.5 bg-slate-950 hover:bg-emerald-950/40 border border-emerald-500/20 text-emerald-300 rounded text-left transition"
              >
                Support Agent
              </button>
            </div>
          </div> */}
        </div>

        {/* Privacy Shield Notice */}
        <div className="mt-6 text-center">
          <p className="text-[11px] text-slate-500 max-w-sm mx-auto leading-relaxed">
            🛡️ <strong className="text-slate-400">Strict Data Privacy Shield:</strong> All administrative access is data-blind with zero access to customer conversations or PII.
          </p>
        </div>
      </div>
    </div>
  );
};
