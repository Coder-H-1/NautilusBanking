/**
 * Centralized API client for communicating with the NAUTILUS Backend.
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://nautilusbanking.onrender.com";

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  status: number;
}

export async function apiRequest<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

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
      const errorMsg =
        typeof body === "object" && body !== null && "detail" in body
          ? body.detail
          : typeof body === "string"
          ? body
          : `Request failed with status ${response.status}`;

      return {
        error: typeof errorMsg === "string" ? errorMsg : JSON.stringify(errorMsg),
        status: response.status,
      };
    }

    return {
      data: body as T,
      status: response.status,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Network error";
    return {
      error: message,
      status: 0,
    };
  }
}
