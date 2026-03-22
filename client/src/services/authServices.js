import { apiGet, apiPost } from "./api.js";
import { handleApiError } from "./apiHandelError.js";

const AUTH_HINT_KEY = "infinityFlyAuthHint";

export const login = handleApiError(async (email, password) => {
  const response = await apiPost("/auth/login", { email, password });
  localStorage.setItem(AUTH_HINT_KEY, "1");
  return response;
});

export const register = handleApiError((data) =>
  apiPost("/auth/register", data)
);

export const logout = handleApiError(async () => {
  const response = await apiPost("/auth/logout", {});
  localStorage.removeItem(AUTH_HINT_KEY);
  return response;
});

export const hasAuthHint = () => localStorage.getItem(AUTH_HINT_KEY) === "1";

export const getCurrentUser = () =>
  apiGet("/auth/me")
;
