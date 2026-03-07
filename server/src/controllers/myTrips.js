import pool from "../db/index.js";

export const getMyTrips = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ message: "Please log in to view your trips" });
  }

  try {
    const bookingsResult = await pool.query(
      `SELECT b.id, b.pnr, b.expiration, b.total_price, b.currency, b.status, b.created_at,
              fs.snapshot
       FROM bookings b
       LEFT JOIN flight_snapshots fs ON fs.booking_id = b.id
       WHERE b.user_id = $1
       ORDER BY b.created_at DESC`,
      [userId]
    );

    const bookings = [];
    for (const row of bookingsResult.rows) {
      const passengersResult = await pool.query(
        `SELECT id, first_name, last_name, type_passenger
         FROM passengers
         WHERE booking_id = $1`,
        [row.id]
      );
      let ticketsResult = { rows: [] };
      try {
        ticketsResult = await pool.query(
          `SELECT t.ticket_number, t.seat_number, t.passenger_id
           FROM tickets t
           WHERE t.booking_id = $1`,
          [row.id]
        );
      } catch (err) {
        // Tickets table can be missing in partial DB setups.
        if (err?.code !== "42P01") throw err;
      }
      const ticketsByPassenger = {};
      for (const t of ticketsResult.rows) {
        if (!ticketsByPassenger[t.passenger_id]) {
          ticketsByPassenger[t.passenger_id] = [];
        }
        ticketsByPassenger[t.passenger_id].push({
          ticket_number: t.ticket_number,
          seat_number: t.seat_number,
        });
      }

      bookings.push({
        id: row.id,
        pnr: row.pnr,
        expiration: row.expiration,
        total_price: row.total_price,
        currency: row.currency,
        status: row.status,
        created_at: row.created_at,
        snapshot: row.snapshot,
        passengers: passengersResult.rows.map((p) => ({
          ...p,
          tickets: ticketsByPassenger[p.id] || [],
          ticket_number: (ticketsByPassenger[p.id]?.[0]?.ticket_number) || null,
          seat_number: (ticketsByPassenger[p.id]?.[0]?.seat_number) || null,
        })),
      });
    }

    return res.json({ trips: bookings });
  } catch (error) {
    console.error("My trips error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
