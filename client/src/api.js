const API_URL = import.meta.env.VITE_API_URL || "http://localhost:2000/api";
let accessToken = localStorage.getItem("triply_access_token");

export const setToken = (token) => {
  accessToken = token;
  token ? localStorage.setItem("triply_access_token", token) : localStorage.removeItem("triply_access_token");
};

export const getToken = () => accessToken;

let refreshPromise = null;
const refreshAccessToken = () => {
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_URL}/auth/refresh-access-token`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    })
      .then(async (response) => {
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.message || "Session expired");
        const token = payload.data?.newAccessToken;
        if (!token) throw new Error("Session expired");
        setToken(token);
        return token;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
};

const NO_REFRESH_PATHS = ["/auth/login", "/auth/register", "/auth/refresh-access-token"];

export const api = async (path, options = {}, _isRetry = false) => {
  const response = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    headers: {
      ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...options.headers,
    },
    ...options,
    body: options.body && !(options.body instanceof FormData) ? JSON.stringify(options.body) : options.body,
  });

  if (response.status === 401 && !_isRetry && !NO_REFRESH_PATHS.includes(path)) {
    try {
      await refreshAccessToken();
      return api(path, options, true);
    } catch {
      setToken(null);
      throw new Error("Your session has expired. Please sign in again.");
    }
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.message || "Request failed");
  return payload.data;
};

export { API_URL };