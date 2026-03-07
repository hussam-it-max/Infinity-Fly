import { apiGet, apiPost } from "./api.js";
import { handleApiError } from "./apiHandelError.js";

export const login = handleApiError((email, password) =>
  apiPost("/auth/login", { email, password })
);

export const register = handleApiError((data) =>
  apiPost("/auth/register", data)
);

export const logout = handleApiError(() =>
  apiPost("/auth/logout", {})
);

export const getCurrentUser = handleApiError(() =>
  apiGet("/auth/me")
);
