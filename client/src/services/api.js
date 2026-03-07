const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL ||
  process.env.REACT_APP_API_URL ||
  "http://localhost:5000/api";

const getErrorMessage = (error, status) => {
  if (error?.message && typeof error.message === "string") return error.message;
  if (typeof error === "string") {
    if (error.trim().startsWith("<")) return "Server error. Please try again.";
    return error;
  }
  if (error?.error) return error.error;
  if (status === 404) return "Resource not found";
  if (status === 429) return "Too many requests. Please wait a moment and try again.";
  if (status >= 500) return "Server error. Please try again later.";
  if (status === 0 || error?.name === "TypeError") return "Cannot reach server. Please check your connection.";
  return `Request failed (${status || "network error"})`;
};

export const request = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  try {
    const headers = { ...options.headers };
    if (options.body && !headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }
    const response = await fetch(url, {
      ...options,
      headers,
    });

    let data = null;
    const contentType = response.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      try {
        data = await response.json();
      } catch {
        data = { message: await response.text() };
      }
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      let message = data?.message || data?.error;
      if (!message || (typeof message === "string" && message.trim().startsWith("<"))) {
        message = getErrorMessage(data, response.status);
      } else if (typeof message !== "string") {
        message = getErrorMessage(data, response.status);
      }
      const err = new Error(message);
      err.status = response.status;
      err.data = data;
      throw err;
    }

    return {
      ok: true,
      status: response.status,
      data,
    };
  } catch (error) {
    if (error.status !== undefined) throw error;
    const msg = error.message === "Failed to fetch"
      ? "Cannot connect to server. Make sure the server is running."
      : error.message || "Network error";
    const err = new Error(msg);
    err.original = error;
    throw err;
  }
};

export const apiGet = (endpoint) => {
  return request(endpoint, { method: "GET", credentials: "include" });
};

export const apiPost = (endpoint, body) => {
  return request(endpoint, {
    method: "POST",
    credentials: "include",
    body: JSON.stringify(body),
  });
};
