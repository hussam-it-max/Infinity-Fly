import amadeusServices from "../services/amadeusServices.js";
import redis from "../uitles/Redis.js";
import normalizeFlightOffers from "../uitles/normalizedFlights.js";
import { v4 as uuid4 } from "uuid";

const SEARCH_CACHE_TTL_SECONDS = 1800; // 30 minutes
const SEARCH_SESSION_TTL_SECONDS = 1800; // 30 minutes
const DEFAULT_MAX_RESULTS = 30;
const MAX_RESULTS_CAP = 50;

export const searchFlight = async (req, res) => {
  const totalStart = Date.now();
  const {
    originLocationCode,
    destinationLocationCode,
    departureDate,
    returnDate,
    nonStop,
    adults,
    children,
    infants,
    travelClass,
    max,
  } = req.query;

  // Validate required fields
  if (!originLocationCode || !destinationLocationCode || !departureDate) {
    return res.status(400).json({
      message:
        "originLocationCode, destinationLocationCode, and departureDate are required",
    });
  }

  // Validate and convert passengers
  const adultCount = parseInt(adults) || 1;
  const childCount = parseInt(children) || 0;
  const infantCount = parseInt(infants) || 0;

  if (adultCount < 1) {
    return res.status(400).json({
      message: "At least one adult passenger is required",
    });
  }

  const requestedMax = parseInt(max, 10);
  const maxResults = Number.isFinite(requestedMax) && requestedMax > 0
    ? Math.min(requestedMax, MAX_RESULTS_CAP)
    : DEFAULT_MAX_RESULTS;

  const cachedKey = `search_${originLocationCode}_${destinationLocationCode}_${departureDate}_${returnDate ?? "oneway"}_ADT${adultCount}_CHD${childCount}_INF${infantCount}_${travelClass ?? "ECONOMY"}_${nonStop === "true" ? "1" : "0"}_MAX${maxResults}`;

  const cachedData = await redis.get(cachedKey);
  if (cachedData) {
    const normalizeStart = Date.now();
    const flights = JSON.parse(cachedData);
    const normalizedFlights = normalizeFlightOffers(flights);
    const normalizeMs = Date.now() - normalizeStart;
    const searchId = uuid4();
    await redis.set(`search_${searchId}`, JSON.stringify(flights), "EX", SEARCH_SESSION_TTL_SECONDS);
    const totalMs = Date.now() - totalStart;
    console.log(`[flights.search] cache_hit=1 count=${flights.length} normalize_ms=${normalizeMs} total_ms=${totalMs}`);
    return res
      .status(200)
      .json({ flights: normalizedFlights, searchId });
  }

  try {
    const requestData = {
      originLocationCode,
      destinationLocationCode,
      departureDate,
      ...(returnDate && { returnDate }),
      adults: adultCount,
      ...(childCount > 0 && { children: childCount }),
      ...(infantCount > 0 && { infants: infantCount }),
      nonStop: nonStop === "true",
      travelClass: travelClass ?? "ECONOMY",
      max: maxResults,
    };

    const amadeusStart = Date.now();
    const flights = await amadeusServices.searchFlights(requestData);
    const amadeusCallMs = Date.now() - amadeusStart;

    // Check if response is an error (has .response property from Amadeus error)
    if (
      !flights ||
      flights.response ||
      !Array.isArray(flights) ||
      flights.length === 0
    ) {
      return res
        .status(404)
        .json({ message: "No flights found for the given criteria" });
    }

    const normalizeStart = Date.now();
    const normalizedFlights = normalizeFlightOffers(flights);
    const normalizeMs = Date.now() - normalizeStart;

    const searchId = uuid4();
    await Promise.all([
      redis.set(`search_${searchId}`, JSON.stringify(flights), "EX", SEARCH_SESSION_TTL_SECONDS),
      redis.set(cachedKey, JSON.stringify(flights), "EX", SEARCH_CACHE_TTL_SECONDS),
    ]);

    const totalMs = Date.now() - totalStart;
    console.log(
      `[flights.search] cache_hit=0 count=${flights.length} amadeus_call_ms=${amadeusCallMs} normalize_ms=${normalizeMs} total_ms=${totalMs}`,
    );

    res.status(200).json({ flights: normalizedFlights, searchId });
  } catch (error) {
    console.error("Flight search error:", error);
    const isRateLimit = error?.response?.statusCode === 429;
    return res.status(isRateLimit ? 429 : 500).json({
      message: isRateLimit
        ? "API rate limit exceeded. Please try again in a few seconds."
        : "Server error searching flights",
      error: error?.message || error?.description || JSON.stringify(error),
    });
  }
};
