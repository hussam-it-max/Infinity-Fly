import cron from "node-cron";
import pool from "../db/index.js";
import amadeusServices from "../services/amadeusServices.js";

/**
 * Runs every 10 minutes to delete expired PENDING reservations.
 * Expired bookings are removed from DB; Amadeus order is cancelled when possible.
 */
export function startExpireReservationsCron() {
  cron.schedule("*/10 * * * *", async () => {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT id, pnr, amadeus_offer_id FROM bookings 
         WHERE status = 'PENDING' AND expiration < NOW()`
      );
      for (const row of result.rows) {
        try {
          await amadeusServices.deleteFlightOrder(row.amadeus_offer_id);
        } catch (e) {
          // Order may already be expired on Amadeus side
          console.warn("Could not delete Amadeus order:", row.amadeus_offer_id, e?.message);
        }
        await client.query(`DELETE FROM bookings WHERE id = $1`, [row.id]);
        console.log("Expired reservation removed:", row.pnr);
      }
    } catch (err) {
      if (err?.code !== "42P01") {
        console.error("Expire reservations cron error:", err);
      }
    } finally {
      client.release();
    }
  });
  console.log("Expire reservations cron started (every 10 min)");
}
