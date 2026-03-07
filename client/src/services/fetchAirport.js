import { apiGet } from "./api";
import { handleApiError } from "./apiHandelError";

const fetchAirportsRaw = (keyword) => {
  return apiGet(
    `/airports/fetch-airports?keyword=${encodeURIComponent(keyword)}`,
  );
};
export const fetchAirports = handleApiError(fetchAirportsRaw);
