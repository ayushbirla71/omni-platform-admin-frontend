const API_BASE = "/api";

export interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

export class PlatformApiError extends Error {
  public status: number;
  public data: any;

  constructor(status: number, message: string, data?: any) {
    super(message);
    this.name = "PlatformApiError";
    this.status = status;
    this.data = data;
  }
}

/**
 * Universal fetch wrapper for Omni Platform Admin Portal.
 * Enforces API_BASE = '/api' prefix. Endpoints passed to this client
 * MUST start with '/platform/...' and omit the '/api' prefix.
 */
export async function platformRequest<T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { params, headers: customHeaders, ...fetchOptions } = options;

  let url = `${API_BASE}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  const token = localStorage.getItem("platform_auth_token");

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(customHeaders as Record<string, string>),
  };

  const response = await fetch(url, {
    ...fetchOptions,
    headers,
  });

  let data: any = null;
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const errorMessage = data?.error || data?.message || `HTTP ${response.status}: ${response.statusText}`;

    // Auto-clear invalid/expired tokens on 401 unauthorized (skip redirect for login attempts)
    if (response.status === 401 && !endpoint.includes("/auth/login")) {
      localStorage.removeItem("platform_auth_token");
      localStorage.removeItem("platform_user_profile");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    throw new PlatformApiError(response.status, errorMessage, data);
  }

  return data as T;
}
