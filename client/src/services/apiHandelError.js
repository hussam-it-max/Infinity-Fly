import { toast } from "react-toastify";

/**
 * Wraps API calls with error handling.
 * Shows toast on error and rethrows so callers can handle (e.g. set error state).
 */
export const handleApiError = (apiCall) => async (...args) => {
  try {
    return await apiCall(...args);
  } catch (error) {
    const message = error?.message || "An unexpected error occurred";
    toast.error(message);
    console.error("API Error:", message, error);
    throw error;
  }
};
