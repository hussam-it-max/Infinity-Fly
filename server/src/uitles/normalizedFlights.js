const normalizeFlightOffers = (flightOffers) => {
  return flightOffers.map((offer) => ({
    offerId: offer.id,
    price: offer.price.total,
    currency: offer.price.currency,
    itineraries: offer.itineraries,
    travelerPricings: offer.travelerPricings,
  }));
};
export default normalizeFlightOffers;
