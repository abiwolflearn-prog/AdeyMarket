import axios from "axios";

// Determine the base URL dynamically based on environment
// In AI Studio, the frontend runs on the same origin as the Express backend in production mode.
// We use VITE_API_URL if explicitly defined, otherwise default to relative path "/api" 
// which works for both local proxy setups and production single-origin deployments.
const baseURL = (import.meta as any).env?.VITE_API_URL || "/api";

export const api = axios.create({
  baseURL,
  withCredentials: true, // Crucial for HTTP-only cookies in Phase 2
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor: Attach access token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Global error handling and 401 auto-refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Do NOT intercept auth endpoints (login, register, refresh, reset-password)
    const url = originalRequest?.url || "";
    const isAuthEndpoint =
      url.includes("/auth/login") ||
      url.includes("/auth/register") ||
      url.includes("/auth/refresh") ||
      url.includes("/auth/reset-password");

    const hasStoredToken = typeof window !== "undefined" && !!localStorage.getItem("accessToken");

    // Only attempt refresh if 401, not already retried, not an auth endpoint, and user previously had a token
    if (error.response?.status === 401 && !originalRequest?._retry && !isAuthEndpoint && hasStoredToken) {
      originalRequest._retry = true;

      try {
        // Use a fresh axios instance to avoid infinite interceptor loops
        const refreshResponse = await axios.post(
          `${baseURL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const newAccessToken = refreshResponse.data.accessToken;
        
        // Store the new access token
        localStorage.setItem("accessToken", newAccessToken);
        
        // Update the Authorization header of the failed request
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        
        // Retry the original request with the new token
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh token is expired or invalid -> clean up local auth
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        
        // Only redirect to login if not already on an auth page
        if (typeof window !== "undefined" && !window.location.pathname.includes("/login") && !window.location.pathname.includes("/register")) {
          window.location.href = "/login";
        }
        
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
