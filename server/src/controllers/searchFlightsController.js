import amadeusServices from "../services/amadeusServices.js";
import redis from "../uitles/Redis.js";
import normalizeFlightOffers from "../uitles/normalizedFlights.js";
import { v4 as uuid4 } from "uuid";
export const searchFlight = async (req, res) => {
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

  const cachedKey = `search_${originLocationCode}_${destinationLocationCode}_${departureDate}_${returnDate ?? "oneway"}_ADT${adultCount}_CHD${childCount}_INF${infantCount}_${travelClass ?? "ECONOMY"}_${nonStop === "true" ? "1" : "0"}`;

  const cachedData = await redis.get(cachedKey);
  if (cachedData) {
    console.log("Returning cached flight search results");
    const flights = JSON.parse(cachedData);
    const searchId = uuid4();
    redis.set(`search_${searchId}`, JSON.stringify(flights), "EX", 600);
    return res
      .status(200)
      .json({ flights: normalizeFlightOffers(flights), searchId });
  } else {
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
      };

      const flights = await amadeusServices.searchFlights(requestData);

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
      console.log("Flight search results:", flights);

      const searchId = uuid4();
      redis.set(`search_${searchId}`, JSON.stringify(flights), "EX", 600);
      redis.set(cachedKey, JSON.stringify(flights), "EX", 600);
      const normalizedFlights = normalizeFlightOffers(flights);
      console.log("Normalized flights:", normalizedFlights);
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
  }
};
