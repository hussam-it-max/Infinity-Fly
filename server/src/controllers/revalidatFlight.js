import redis from "../uitles/Redis.js";
import amadeusServices from "../services/amadeusServices.js";
export const revalidateFlight = async (req, res) => {
  const { offerId, searchId } = req.body;
  if (!offerId || !searchId) {
    return res
      .status(400)
      .json({ message: "offerId and searchId are required" });
  }
  const key = `search_${searchId}`;
  const cachedData = await redis.get(key);
  if (!cachedData) {
    return res
      .status(404)
      .json({ message: "This offer is expired, please search again" });
  }
  const flights = JSON.parse(cachedData);
  const flightOffer = flights.find((f) => f.id === offerId || f.offerId === offerId);
  if (!flightOffer) {
    return res.status(404).json({ message: "Offer not found, please search again" });
  }
  try {
    const confirmedOffer = await amadeusServices.confirmFlightPrice(flightOffer);
    const oldPrice = flightOffer.price.total;
    const newPrice = confirmedOffer.price.total;
    const priceChanged = oldPrice !== newPrice;
    const updatedOffers = flights.map((f) =>
      (f.id === offerId || f.offerId === offerId) ? { ...confirmedOffer, id: confirmedOffer.id || offerId } : f,
    );
    await redis.set(key, JSON.stringify(updatedOffers));
    res.status(200).json({
      flightOffer: confirmedOffer,
      searchId,
      priceChanged,
      message: priceChanged
        ? `Price has changed from ${oldPrice} to ${newPrice}`
        : "Price is still the same, you can proceed to booking",
    });
  } catch (error) {
    console.error("Flight revalidation error:", error);
    return res
      .status(500)
      .json({ message: "this offer is expired, please search again" });
  }
};
