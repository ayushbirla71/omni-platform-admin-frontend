import React, { useEffect, useState } from "react";
import { platformApi } from "../api/platform-api";
import { PlatformStaffUser, PlatformRole } from "../types/platform";
import { usePlatformAuth } from "../context/PlatformAuthContext";
import {
  Users,
  UserPlus,
  Shield,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  KeyRound,
  Edit2,
  X,
} from "lucide-react";

export const StaffManagementPage: React.FC = () => {
  const { isSuperAdmin } = usePlatformAuth();
  const [staff, setStaff] = useState<PlatformStaffUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<PlatformStaffUser | null>(null);

  // Form State
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formRole, setFormRole] = useState<PlatformRole>("support_agent");
  const [formStatus, setFormStatus] = useState<"active" | "suspended" | "deactivated">("active");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchStaff = async () => {
    setIsLoading(true);
    try {
      const res = await platformApi.staff.list();
      setStaff(res);
    } catch (err: any) {
      console.error("Failed to load staff list:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleOpenCreateModal = () => {
    setFormName("");
    setFormEmail("");
    setFormPassword("");
    setFormRole("support_agent");
    setErrorMessage(null);
    setIsCreateModalOpen(true);
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      await platformApi.staff.create({
        name: formName.trim(),
        email: formEmail.trim(),
        password: formPassword,
        role: formRole,
      });
      setIsCreateModalOpen(false);
      await fetchStaff();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to create platform staff member");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEditModal = (u: PlatformStaffUser) => {
    setSelectedUserForEdit(u);
    setFormRole(u.role);
    setFormStatus(u.status);
    setErrorMessage(null);
  };

  const handleUpdateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForEdit) return;
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      await platformApi.staff.update(selectedUserForEdit.id, {
        role: formRole,
        status: formStatus,
      });
      setSelectedUserForEdit(null);
      await fetchStaff();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to update platform staff member");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleBadge = (role: PlatformRole) => {
    switch (role) {
      case "super_admin":
        return "bg-purple-500/10 text-purple-400 border-purple-500/30";
      case "platform_dev":
        return "bg-cyan-500/10 text-cyan-400 border-cyan-500/30";
      case "platform_tester":
        return "bg-amber-500/10 text-amber-400 border-amber-500/30";
      case "support_agent":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/30";
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-white tracking-tight">Platform Staff & RBAC</h1>
            <span className="bg-purple-500/10 text-purple-400 border border-purple-500/30 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full">
              SUPER ADMIN GOVERNANCE
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Administer internal platform operators, assign granular RBAC roles, and manage access privileges.
          </p>
        </div>

        {isSuperAdmin && (
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center space-x-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white rounded-lg shadow-lg shadow-indigo-600/20 transition"
          >
            <UserPlus className="w-4 h-4" />
            <span>Create Platform Operator</span>
          </button>
        )}
      </div>

      {/* Role Descriptions Info Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5">
          <div className="flex items-center space-x-2 text-xs font-bold text-purple-400 font-mono">
            <Shield className="w-3.5 h-3.5" />
            <span>super_admin</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Full platform governance, staff user lifecycle, tenant suspension & quota overrides, and audit log inspection.
          </p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5">
          <div className="flex items-center space-x-2 text-xs font-bold text-cyan-400 font-mono">
            <Shield className="w-3.5 h-3.5" />
            <span>platform_dev</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Live process telemetry, PG pool metrics, Redis latency, WebSocket connection stats, and system error analysis.
          </p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5">
          <div className="flex items-center space-x-2 text-xs font-bold text-amber-400 font-mono">
            <Shield className="w-3.5 h-3.5" />
            <span>platform_tester</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Synthetic webhook ingestion testing, dry-run channel dispatch, and global connector connectivity diagnostic sweeps.
          </p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5">
          <div className="flex items-center space-x-2 text-xs font-bold text-emerald-400 font-mono">
            <Shield className="w-3.5 h-3.5" />
            <span>support_agent</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Read-only metadata verification, tenant workspace status checks, and quota troubleshooting (Zero-PII shield enforced).
          </p>
        </div>
      </div>

      {/* Staff User Grid Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-slate-400" />
            <h2 className="text-sm font-semibold text-white">Active Platform Personnel</h2>
          </div>
          <span className="text-xs font-mono text-slate-400">Total: {staff.length} staff</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase font-mono text-[10px]">
              <tr>
                <th className="px-5 py-3">Operator Name & Email</th>
                <th className="px-5 py-3">Assigned Role</th>
                <th className="px-5 py-3">Security & MFA</th>
                <th className="px-5 py-3">Account Status</th>
                <th className="px-5 py-3">Last Active</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-500">
                    Loading platform staff records...
                  </td>
                </tr>
              ) : staff.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-500">
                    No platform staff operators found.
                  </td>
                </tr>
              ) : (
                staff.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/30 transition">
                    <td className="px-5 py-3.5">
                      <div className="font-sans font-semibold text-slate-200">{u.name}</div>
                      <div className="text-[11px] text-slate-400">{u.email}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${getRoleBadge(u.role)}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center space-x-1.5">
                        <KeyRound className={`w-3.5 h-3.5 ${u.mfaEnabled ? "text-emerald-400" : "text-slate-600"}`} />
                        <span className={`text-[11px] ${u.mfaEnabled ? "text-emerald-400" : "text-slate-500"}`}>
                          {u.mfaEnabled ? "MFA Enforced" : "Standard Auth"}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          u.status === "active"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                            : u.status === "suspended"
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                            : "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-400 text-[11px]">
                      {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : "Never logged in"}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {isSuperAdmin && (
                        <button
                          onClick={() => handleOpenEditModal(u)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 text-[11px] font-sans transition"
                        >
                          Modify Access
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Staff Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <UserPlus className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">Create Platform Operator</h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-lg flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleCreateStaff} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Operator Full Name</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Alex Rivera"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Platform Staff Email</label>
                <input
                  type="email"
                  required
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="alex.rivera@omniplatform.internal"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Temporary Staff Password</label>
                <input
                  type="password"
                  required
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Assigned Platform Role</label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value as PlatformRole)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="support_agent">Support Agent (Read-only metadata)</option>
                  <option value="platform_tester">Platform QA / Tester (Synthetic test runner)</option>
                  <option value="platform_dev">Platform Dev (Live Telemetry & Logs)</option>
                  <option value="super_admin">Super Admin (Full Governance Authority)</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg shadow-lg shadow-indigo-600/20 disabled:opacity-50 transition"
                >
                  {isSubmitting ? "Provisioning..." : "Provision Staff Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Staff Modal */}
      {selectedUserForEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Edit2 className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">Modify Staff Clearance</h3>
              </div>
              <button
                onClick={() => setSelectedUserForEdit(null)}
                className="text-slate-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs font-mono">
              <p className="text-white font-bold">{selectedUserForEdit.name}</p>
              <p className="text-slate-400 text-[11px]">{selectedUserForEdit.email}</p>
            </div>

            {errorMessage && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-lg flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleUpdateStaff} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Platform Role</label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value as PlatformRole)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="support_agent">Support Agent</option>
                  <option value="platform_tester">Platform QA / Tester</option>
                  <option value="platform_dev">Platform Dev</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Account Lifecycle Status</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="active">Active (Full Clearance)</option>
                  <option value="suspended">Suspended (Temporary Revocation)</option>
                  <option value="deactivated">Deactivated (Terminated Access)</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setSelectedUserForEdit(null)}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg shadow-lg shadow-indigo-600/20 disabled:opacity-50 transition"
                >
                  {isSubmitting ? "Saving Changes..." : "Save Staff Privileges"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
