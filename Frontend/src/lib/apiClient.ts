/**
 * Centralized API client for communicating with the NAUTILUS Backend.
 */

const rawBaseUrl = process.env.NEXT_PUBLIC_API_URL || "https://nautilusbanking.onrender.com";
const BASE_URL = rawBaseUrl.replace(/\/+$/, "");

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  status: number;
}

export async function apiRequest<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = `${BASE_URL}${cleanEndpoint}`;

  // Retrieve token if in browser
  let token: string | null = null;
  if (typeof window !== "undefined") {
    token = localStorage.getItem("nautilus_token");
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const isJson = response.headers.get("content-type")?.includes("application/json");
    const body = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      if (response.status === 401 && typeof window !== "undefined") {
        localStorage.removeItem("nautilus_token");
        localStorage.removeItem("nautilus_user");
        window.dispatchEvent(new CustomEvent("nautilus_session_expired"));
      }

      let errorMsg = `Request failed with status ${response.status}`;
      if (typeof body === "object" && body !== null) {
        if ("detail" in body && typeof (body as any).detail === "string") {
          errorMsg = (body as any).detail;
        } else if ("error" in body && typeof (body as any).error === "string") {
          errorMsg = (body as any).error;
        } else if ("message" in body && typeof (body as any).message === "string") {
          errorMsg = (body as any).message;
        } else if ("detail" in body && Array.isArray((body as any).detail)) {
          errorMsg = (body as any).detail.map((d: any) => d.msg || JSON.stringify(d)).join(", ");
        } else {
          errorMsg = JSON.stringify(body);
        }
      } else if (typeof body === "string" && body.length > 0) {
        errorMsg = body;
      }

      return {
        error: errorMsg,
        status: response.status,
      };
    }

    return {
      data: body as T,
      status: response.status,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Network error";
    console.warn(`[API Request Error] ${url}:`, err);
    return {
      error: message.includes("Failed to fetch")
        ? "Unable to reach server. The backend may be booting up (cold start) or experiencing connectivity issues. Please try again in a few seconds."
        : message,
      status: 0,
    };
  }
}
