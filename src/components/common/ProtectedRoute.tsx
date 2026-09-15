import React from "react";
import { Navigate, useLocation, Outlet } from "react-router-dom";
import { usePlatformAuth } from "../../context/PlatformAuthContext";
import { PlatformRole } from "../../types/platform";
import { ShieldAlert } from "lucide-react";

interface ProtectedRouteProps {
  children?: React.ReactNode;
  allowedRoles?: PlatformRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, isLoading } = usePlatformAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-xs font-mono text-slate-400">Verifying platform staff credentials...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl flex items-center justify-center mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Platform Access Restricted</h2>
        <p className="text-slate-400 text-sm max-w-md mb-6">
          Your platform role (<span className="text-indigo-400 font-mono font-semibold">{user.role}</span>) does not have sufficient clearance to access this governance module.
        </p>
        <button
          onClick={() => window.history.back()}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition"
        >
          Return to Permitted View
        </button>
      </div>
    );
  }

  return <>{children || <Outlet />}</>;
};
