import amadeusServices from "../services/amadeusServices.js";
import redis from "../uitles/Redis.js";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const staticAirports = require("../data/airports.json");

/**
 * Filter static airports by keyword (IATA, name, city, country).
 * Uses local data to avoid Amadeus rate limits.
 */
function searchStaticAirports(keyword) {
  const k = keyword.trim().toLowerCase();
  if (k.length < 2) return [];
  const seen = new Set();
  return staticAirports
    .filter((a) => {
      if (!a.iataCode || seen.has(a.iataCode)) return false;
      const code = (a.iataCode || "").toLowerCase();
      const name = (a.name || "").toLowerCase();
      const city = (a.address?.cityName || "").toLowerCase();
      const country = (a.address?.countryName || "").toLowerCase();
      const match = code.includes(k) || name.includes(k) || city.includes(k) || country.includes(k);
      if (match) seen.add(a.iataCode);
      return match;
    })
    .slice(0, 25);
}

const fetchAirport = async (req, res) => {
  const { keyword } = req.query;
  if (!keyword) {
    return res
      .status(400)
      .json({ message: "keyword query parameter is required" });
  }

  const trimmedKeyword = keyword.trim();
  if (trimmedKeyword.length < 2) {
    return res.status(200).json({ airports: [] });
  }

  const cacheKey = `airports_${trimmedKeyword.toLowerCase()}`;
  const shouldCache = trimmedKeyword.length >= 3;

  try {
    // 1. Check static list first (no API calls = no rate limits)
    const staticResults = searchStaticAirports(trimmedKeyword);
    if (staticResults.length > 0) {
      return res.status(200).json({ airports: staticResults });
    }

    // 2. Check Redis cache before calling Amadeus
    if (shouldCache) {
      const cachedAirports = await redis.get(cacheKey);
      if (cachedAirports) {
        console.log(`[cache hit] ${cacheKey}`);
        return res.status(200).json({ airports: JSON.parse(cachedAirports) });
      }
    }

    // 3. Fallback to Amadeus for airports not in static list
    const airports = await amadeusServices.fetchAirPort(trimmedKeyword);
    if (!airports || airports.length === 0) {
      return res.status(200).json({ airports: [] });
    }

    if (shouldCache) {
      await redis.set(cacheKey, JSON.stringify(airports), "EX", 14400);
    }

    res.status(200).json({ airports });
  } catch (error) {
    console.error("Error fetching airports:", error);

    const isRateLimit = error?.response?.statusCode === 429;

    res.status(isRateLimit ? 429 : 500).json({
      message: isRateLimit
        ? "API rate limit exceeded. Please try again in a few seconds."
        : "Error fetching airports",
      error: error?.message || error?.description || JSON.stringify(error),
    });
  }
};
export default fetchAirport;
