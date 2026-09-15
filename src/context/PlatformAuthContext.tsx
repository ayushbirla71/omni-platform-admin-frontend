import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { PlatformStaffUser, PlatformRole } from "../types/platform";
import { platformApi } from "../api/platform-api";
import { platformRealtimeClient } from "../lib/socket";

interface PlatformAuthContextType {
  user: PlatformStaffUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: { email: string; password: string; mfaToken?: string }) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  hasRole: (...roles: PlatformRole[]) => boolean;
  // Specific permission helpers
  isSuperAdmin: boolean;
  isPlatformDev: boolean;
  isPlatformTester: boolean;
  isSupportAgent: boolean;
  canManageStaff: boolean;
  canModifyTenantBilling: boolean;
  canViewTelemetry: boolean;
  canViewLogs: boolean;
  canRunTests: boolean;
  canViewAuditLogs: boolean;
}

const PlatformAuthContext = createContext<PlatformAuthContextType | undefined>(undefined);

export const PlatformAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<PlatformStaffUser | null>(() => {
    try {
      const saved = localStorage.getItem("platform_user_profile");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem("platform_auth_token");
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    const currentToken = localStorage.getItem("platform_auth_token");
    if (!currentToken) {
      setUser(null);
      setToken(null);
      setIsLoading(false);
      return;
    }

    try {
      const res = await platformApi.auth.getMe();
      const userData = (res as any)?.user || res;
      if (userData && userData.id) {
        setUser(userData);
        setToken(currentToken);
        localStorage.setItem("platform_user_profile", JSON.stringify(userData));
      } else {
        throw new Error("Invalid staff user profile received");
      }
    } catch (err) {
      console.warn("Platform auth verification failed, logging out:", err);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (credentials: { email: string; password: string; mfaToken?: string }) => {
    setIsLoading(true);
    try {
      const res = await platformApi.auth.login(credentials);
      localStorage.setItem("platform_auth_token", res.token);
      localStorage.setItem("platform_user_profile", JSON.stringify(res.user));
      setToken(res.token);
      setUser(res.user);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    platformRealtimeClient.disconnect();
    localStorage.removeItem("platform_auth_token");
    localStorage.removeItem("platform_user_profile");
    setToken(null);
    setUser(null);
  };

  const hasRole = (...roles: PlatformRole[]): boolean => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  const isSuperAdmin = user?.role === "super_admin";
  const isPlatformDev = user?.role === "platform_dev";
  const isPlatformTester = user?.role === "platform_tester";
  const isSupportAgent = user?.role === "support_agent";

  const canManageStaff = isSuperAdmin;
  const canModifyTenantBilling = isSuperAdmin;
  const canViewTelemetry = isSuperAdmin || isPlatformDev;
  const canViewLogs = isSuperAdmin || isPlatformDev || isSupportAgent;
  const canRunTests = isSuperAdmin || isPlatformTester || isPlatformDev;
  const canViewAuditLogs = isSuperAdmin || isPlatformDev || isSupportAgent;

  return (
    <PlatformAuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user && !!token,
        login,
        logout,
        refreshUser,
        hasRole,
        isSuperAdmin,
        isPlatformDev,
        isPlatformTester,
        isSupportAgent,
        canManageStaff,
        canModifyTenantBilling,
        canViewTelemetry,
        canViewLogs,
        canRunTests,
        canViewAuditLogs,
      }}
    >
      {children}
    </PlatformAuthContext.Provider>
  );
};

export function usePlatformAuth(): PlatformAuthContextType {
  const context = useContext(PlatformAuthContext);
  if (!context) {
    throw new Error("usePlatformAuth must be used within a PlatformAuthProvider");
  }
  return context;
}
