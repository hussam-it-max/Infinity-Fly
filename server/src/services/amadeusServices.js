import Amadeus from "amadeus";
import dotenv from "dotenv";
dotenv.config();

class AmadeusService {
  constructor() {
    this.amadeus = new Amadeus({
      clientId: process.env.AMADEUS_CLIENT_ID,
      clientSecret: process.env.AMADEUS_CLIENT_SECRET,
    });
  }
  async searchFlights(params) {
    const response = await this.amadeus.shopping.flightOffersSearch.get(params);
    return response.data;
  }
  async confirmFlightPrice(offer) {
    const response = await this.amadeus.shopping.flightOffers.pricing.post({
      data: {
        type: "flight-offers-pricing",
        flightOffers: [offer],
      },
    });
    return response.data.flightOffers[0];
  }
  async createFlightOrder({ flightOffer, travelers, contact }) {
    try {
      const contacts = Array.isArray(contact) ? contact : [contact];
      const response = await this.amadeus.booking.flightOrders.post({
        data: {
          type: "flight-order",
          flightOffers: [flightOffer],
          travelers,
          contacts,
          remarks: {
            general: [
              { subType: "GENERAL_MISCELLANEOUS", text: "InfinityFly Booking" },
            ],
          },
        },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
  async deleteFlightOrder(orderId) {
    try {
      await this.amadeus.booking.flightOrder(orderId).delete();
    } catch (error) {
      console.error("Amadeus delete order error:", error?.message || error);
      throw error;
    }
  }
  async fetchAirPort(keyword) {
    try {
      // Trim and normalize the keyword
      const cleanKeyword = keyword.trim().toLowerCase();

      const response = await this.amadeus.referenceData.locations.get({
        keyword: cleanKeyword,
        subType: "AIRPORT", // Only return airports, not cities
      });
      return response.data;
    } catch (error) {
      console.error("Amadeus airport search error:", error?.message || error);
      throw error; // Throw error so it can be caught and handled
    }
  }
  /*handleAmadeusError(error) {
    if (error.ClientError?.response?.Response?.headers) {
      return new Error(error.ClientError?.response?.Response?.headers);
    }
    return new Error("Amadeus service unavailable");
  }*/
}
export default new AmadeusService();
