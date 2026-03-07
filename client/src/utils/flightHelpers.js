import airportsData from "../data/airports.json";

const airportMap = Object.fromEntries(
  airportsData.map((a) => [a.iataCode, a.address?.cityName || a.name || a.iataCode])
);

export function getAirportCity(code) {
  return airportMap[code] || code;
}

export function getAirportLabel(code) {
  const city = airportMap[code];
  return city ? `${city} (${code})` : code || "";
}

export function formatTime(isoString) {
  if (!isoString) return "—";
  const d = new Date(isoString);
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });
}

export function formatDate(isoString) {
  if (!isoString) return "—";
  const d = new Date(isoString);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function parseDuration(isoDuration) {
  if (!isoDuration) return "—";
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return isoDuration;
  const h = parseInt(match[1] || 0);
  const m = parseInt(match[2] || 0);
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

export function formatPrice(amount, currency = "EUR") {
  const num = typeof amount === "string" ? parseFloat(amount) : Number(amount);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(isNaN(num) ? 0 : num);
}
