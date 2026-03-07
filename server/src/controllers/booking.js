import pool from "../db/index.js";
import redis from "../uitles/Redis.js";
import amadeusServices from "../services/amadeusServices.js";
export const bookFlight = async (req, res) => {
  const { id } = req.user;
  const { offerId, travelers, searchId, contact } = req.body;
  if (!searchId || !offerId || !travelers?.length) {
    return res.status(400).json({ message: "Missing required data" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const cachedData = await redis.get(`search_${searchId}`);
    if (!cachedData) {
      return res
        .status(410)
        .json({ message: "Session expired. Search again." });
    }
    const flights = JSON.parse(cachedData);
    const flightOffer = flights.find((f) => f.id === offerId || f.offerId === offerId);
    if (!flightOffer) {
      return res
        .status(404)
        .json({ message: "offer not found, please search again" });
    }
    const order = await amadeusServices.createFlightOrder({
      flightOffer,
      travelers,
      contact,
    });
    const finalOffer = order.flightOffers[0];
    const finalPrice = Number(finalOffer.price.total);
    const finalCurrency = finalOffer.price.currency;
    const oldPrice = Number(flightOffer.price.total);
    if (finalPrice !== oldPrice) {
      await client.query("ROLLBACK");
      await redis.set(
        `pending_order:${order.id}`,
        JSON.stringify({
          order,
          travelers,
          contact,
          userId: id,
        }),
        { EX: 900 },
      );

      return res.status(409).json({
        status: "price_changed",
        message: "Airline updated the price. Please confirm to continue.",
        oldPrice,
        newPrice: finalPrice,
        currency: finalCurrency,
        pendingOrderId: order.id,
      });
    }

    const amadeusOrderId = order.id;
    let pnr =
      order.associatedRecords?.find((r) => r.type === "PNR")?.reference ||
      order.associatedRecords?.[0]?.reference ||
      null;
    let expiresAt = order.ticketingTimeLimit?.deadline
      ? new Date(order.ticketingTimeLimit.deadline)
      : null;

    // Fallback for test/sandbox: use order ID as PNR and 24h default expiry
    if (!pnr && amadeusOrderId) {
      pnr = String(amadeusOrderId).slice(0, 20);
      console.warn("Using order ID as PNR fallback (test env)");
    }
    if (!expiresAt) {
      const d = new Date();
      d.setHours(d.getHours() + 24);
      expiresAt = d;
      console.warn("Using 24h default expiry (test env)");
    }

    if (!pnr) {
      throw new Error("Could not get booking reference from airline. Please try again.");
    }

    console.log("Order created:", order.id);

    const bookingResult = await client.query(
      `INSERT INTO bookings (user_id,pnr,expiration,total_price,currency,amadeus_offer_id) 
                VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
      [id, pnr, expiresAt, finalPrice, finalCurrency, amadeusOrderId],
    );
    const bookingId = bookingResult.rows[0].id;
    await client.query(
      `INSERT INTO flight_snapshots (booking_id,snapshot) VALUES ($1,$2) `,
      [bookingId, finalOffer],
    );

    const sumDurations = (segs) => {
      if (!segs?.length) return "PT0H";
      let totalM = 0;
      for (const s of segs) {
        const d = s?.duration || "";
        const m = d.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
        if (m) totalM += (parseInt(m[1] || 0, 10) * 60) + parseInt(m[2] || 0, 10);
      }
      const h = Math.floor(totalM / 60);
      const min = totalM % 60;
      return `PT${h}H${min}M`;
    };

    for (let i = 0; i < finalOffer.itineraries.length; i++) {
      const itinerary = finalOffer.itineraries[i];
      const duration = itinerary.duration || sumDurations(itinerary.segments) || "PT0H";
      const itinerariesResult = await client.query(
        `INSERT INTO itineraries (booking_id,type,origin,destination,duration,stops)
                    VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
        [
          bookingId,
          i === 0 ? "OUTBOUND" : "RETURN",
          itinerary.segments[0].departure.iataCode,
          itinerary.segments[itinerary.segments.length - 1].arrival.iataCode,
          duration,
          itinerary.segments.length - 1,
        ],
      );
      const itineraryId = itinerariesResult.rows[0].id;
      for (let j = 0; j < itinerary.segments.length; j++) {
        const segment = itinerary.segments[j];
        const segDuration = segment.duration || "PT0H";
        await client.query(
          `INSERT INTO segments (itinerary_id,departure_airport,arrival_airport,departure_time,arrival_time,airline_code,flight_number,aircraft,duration,segment_order)
                        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
          [
            itineraryId,
            segment.departure.iataCode,
            segment.arrival.iataCode,
            segment.departure.at,
            segment.arrival.at,
            segment.carrierCode,
            segment.number,
            segment.aircraft?.code || null,
            segDuration,
            j,
          ],
        );
      }
    }
    for (const traveler of travelers) {
      const firstName = traveler.name?.firstName ?? traveler.firstName;
      const lastName = traveler.name?.lastName ?? traveler.lastName;
      await client.query(
        `INSERT INTO passengers (booking_id,first_name,last_name,type_passenger,date_of_birth,nationality) VALUES ($1,$2,$3,$4,$5,$6)`,
        [
          bookingId,
          firstName,
          lastName,
          traveler.type,
          traveler.dateOfBirth,
          traveler.nationality,
        ],
      );
    }
    await client.query("COMMIT");
    return res
      .status(201)
      .json({ message: "Booking created successfully", bookingId });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Booking error:", error);
    const code = error?.code;
    if (code === "42P01") {
      return res.status(500).json({
        message: "Database not set up. Run: npm run setup-booking (in server folder)",
      });
    }
    // Amadeus API errors - flight no longer available, etc.
    if (code === "ClientError" || error?.response?.statusCode) {
      const amadeusDetail = error?.description?.[0]?.detail || error?.response?.body?.errors?.[0]?.detail;
      const amadeusTitle = error?.description?.[0]?.title || error?.response?.body?.errors?.[0]?.title;
      if (amadeusTitle === "SEGMENT SELL FAILURE" || amadeusDetail?.includes("sell")) {
        return res.status(400).json({
          message: "This flight is no longer available. Please search again and choose another flight.",
        });
      }
      return res.status(400).json({
        message: amadeusDetail || amadeusTitle || "Flight booking failed. Please try another flight.",
      });
    }
    const msg = process.env.NODE_ENV === "production"
      ? "Server error"
      : (error?.message || "Server error");
    return res.status(500).json({ message: msg });
  } finally {
    client.release();
  }
};
