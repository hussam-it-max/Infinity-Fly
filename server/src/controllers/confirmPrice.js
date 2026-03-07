import redis from "../uitles/Redis.js";
import amadeusServices from "../services/amadeusServices.js";
import pool from "../db/index.js";
export const confirmPrice = async (req, res) => {
  const { pendingOrderId } = req.body;
  if (!pendingOrderId) {
    return res.status(400).json({ message: "pendingOrderId is required" });
  }
  const cachedData = await redis.get(`pending_order:${pendingOrderId}`);
  if (!cachedData) {
    return res
      .status(404)
      .json({ message: "expired session ,your pending order has expired" });
  }
  await redis.del(`pending_order:${pendingOrderId}`);

  const { order, travelers, contact, userId } = JSON.parse(cachedData);
  if (!order || !travelers?.length || !contact?.length || !userId) {
    return res.status(400).json({ message: "Invalid order data" });
  }

  const client = await pool.connect();
  try {
    const pnr =
      order.associatedRecords?.find((r) => r.type === "PNR")?.reference || null;
    const amadeusOrderId = order.id;
    const expiresAt = order.ticketingTimeLimit?.deadline
      ? new Date(order.ticketingTimeLimit.deadline)
      : null;

    if (!pnr || !expiresAt) {
      throw new Error("Missing PNR or ticketing time limit from airline");
    }
    if (new Date() > expiresAt) {
      return res
        .status(410)
        .json({ message: "Session expired. Please search and book again." });
    }
    const finalOffer = order.flightOffers[0];
    const finalPrice = Number(finalOffer.price.total);
    const finalCurrency = finalOffer.price.currency;

    console.log("Order created:", order);
    await client.query("BEGIN");
    const bookingResult = await client.query(
      `INSERT INTO bookings (user_id,pnr,expiration,total_price,currency,amadeus_offer_id) 
                VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
      [userId, pnr, expiresAt, finalPrice, finalCurrency, amadeusOrderId],
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
    return res.status(500).json({ message: "Server error" });
  } finally {
    client.release();
  }
};
