import { handleApiError } from "./apiHandelError";
import { apiGet, apiPost } from "./api.js";

const searchFlightsRaw = (params) => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value != null && value !== "") {
      searchParams.append(key, String(value));
    }
  });
  return apiGet(`/flights/search?${searchParams.toString()}`);
};

export const searchFlights = handleApiError(searchFlightsRaw);

const bookFlightRaw = (bookingData) => {
  return apiPost("/booking/book", bookingData);
};
export const bookFlight = handleApiError(bookFlightRaw);

const confirmPriceRaw = (data) => {
  return apiPost("/booking/confirm-price", data);
};
export const confirmPrice = handleApiError(confirmPriceRaw);

const revalidateFlightRaw = (data) => {
  return apiPost("/revalidate/revalidate", data);
};
export const revalidateFlight = handleApiError(revalidateFlightRaw);

const cancelPendingRaw = (data) => {
  return apiPost("/booking/cancel-pending", data);
};
export const cancelPendingBooking = handleApiError(cancelPendingRaw);

const getMyTripsRaw = () => apiGet("/booking/my-trips");
export const getMyTrips = handleApiError(getMyTripsRaw);
