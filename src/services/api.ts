import axios from "axios";

// Determine the base URL dynamically based on environment.
// In the integrated full-stack environment, relative path "/api" routes directly
// to the local Express server. If VITE_API_URL is specified, we try it, with an
// automatic fallback to "/api" if the external endpoint is unreachable (e.g. cold start/CORS).
const envApiUrl = (import.meta as any).env?.VITE_API_URL;
let currentBaseURL = envApiUrl && envApiUrl.trim() !== "" ? envApiUrl : "/api";

export const api = axios.create({
  baseURL: currentBaseURL,
  withCredentials: true, // Crucial for HTTP-only cookies
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

// Request interceptor: Attach access token
api.interceptors.request.use(
  (config) => {
    const token = typeof localStorage !== "undefined" ? localStorage.getItem("accessToken") : null;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Fallback to local /api on Network Error + Global error handling and 401 auto-refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (!originalRequest) {
      return Promise.reject(error);
    }

    // 1. If an external VITE_API_URL fails with a Network Error (CORS block, Render down, timeout),
    // automatically fallback to the local Express backend (/api) seamlessly.
    if (!error.response && currentBaseURL !== "/api" && !(originalRequest as any)._fallbackTried) {
      (originalRequest as any)._fallbackTried = true;
      console.warn(`External API (${currentBaseURL}) unreachable (${error.message}). Falling back to local backend (/api)...`);
      currentBaseURL = "/api";
      api.defaults.baseURL = "/api";
      originalRequest.baseURL = "/api";

      return api(originalRequest);
    }

    // 1b. If a request times out or experiences a transient network disconnect during cold start, retry once
    const isTimeoutOrNetwork = error.code === "ECONNABORTED" || error.message?.includes("timeout") || !error.response;
    if (isTimeoutOrNetwork && !(originalRequest as any)._timeoutRetried && originalRequest.method?.toLowerCase() === "get") {
      (originalRequest as any)._timeoutRetried = true;
      console.warn(`Request to ${originalRequest.url} timed out/failed. Retrying after brief delay...`);
      await new Promise((resolve) => setTimeout(resolve, 800));
      return api(originalRequest);
    }

    // 2. Do NOT intercept auth endpoints for token refresh loops
    const url = originalRequest?.url || "";
    const isAuthEndpoint =
      url.includes("/auth/login") ||
      url.includes("/auth/register") ||
      url.includes("/auth/refresh") ||
      url.includes("/auth/reset-password");

    const hasStoredToken = typeof window !== "undefined" && !!localStorage.getItem("accessToken");
    const hasStoredRefreshToken = typeof window !== "undefined" && !!localStorage.getItem("refreshToken");

    // Attempt refresh if 401, not already retried, not an auth endpoint, and user has token or refresh token
    if (error.response?.status === 401 && !(originalRequest as any)._retry && !isAuthEndpoint && (hasStoredToken || hasStoredRefreshToken)) {
      (originalRequest as any)._retry = true;

      try {
        const storedRefreshToken = typeof localStorage !== "undefined" ? localStorage.getItem("refreshToken") : null;
        const refreshResponse = await axios.post(
          `${currentBaseURL}/auth/refresh`,
          { refreshToken: storedRefreshToken },
          { withCredentials: true }
        );

        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = refreshResponse.data;
        
        // Store the new access token
        if (newAccessToken) localStorage.setItem("accessToken", newAccessToken);
        if (newRefreshToken) localStorage.setItem("refreshToken", newRefreshToken);
        
        // Update the Authorization header of the failed request
        if (originalRequest.headers && newAccessToken) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        
        // Retry the original request with the new token
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh token is expired or invalid -> clean up local auth
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        
        // Only redirect to login if not already on an auth page
        if (typeof window !== "undefined" && !window.location.pathname.includes("/login") && !window.location.pathname.includes("/register")) {
          window.location.href = "/login";
        }
        
        return Promise.reject(refreshError);
      }
    }

    // If unauthenticated 401 with no tokens or retry already failed on a protected endpoint
    if (error.response?.status === 401 && !isAuthEndpoint) {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
    }

    return Promise.reject(error);
  }
);

