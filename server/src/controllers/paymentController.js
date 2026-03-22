import Stripe from "stripe";
import dotenv from "dotenv";
import pool from "../db/index.js";

dotenv.config();

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

export const createPaymentIntent = async (req, res) => {
  const userId = req.user?.id;
  const bookingId = Number(req.body?.bookingId);

  if (!stripe) {
    return res.status(500).json({ message: "Stripe is not configured on server." });
  }
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  if (!Number.isInteger(bookingId) || bookingId <= 0) {
    return res.status(400).json({ message: "Valid booking id is required." });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const bookingResult = await client.query(
      `SELECT id, user_id, expiration, total_price, currency, status
       FROM bookings
       WHERE id = $1 AND user_id = $2
       FOR UPDATE`,
      [bookingId, userId],
    );
    if (bookingResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Booking not found." });
    }

    const booking = bookingResult.rows[0];
    if (new Date(booking.expiration) < new Date()) {
      await client.query(
        `UPDATE bookings SET status='EXPIRED', updated_at=NOW() WHERE id=$1`,
        [bookingId],
      );
      await client.query("COMMIT");
      return res.status(400).json({ message: "Booking has expired." });
    }

    if (!["PENDING", "PAYMENT_PENDING"].includes(booking.status)) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: `Booking status ${booking.status} cannot be paid.` });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(Number(booking.total_price) * 100),
      currency: String(booking.currency).toLowerCase(),
      metadata: {
        bookingId: String(bookingId),
        userId: String(userId),
      },
      automatic_payment_methods: { enabled: true },
    });

    await client.query(
      `INSERT INTO payments (booking_id, amount, currency, status, method, transaction_id)
       VALUES ($1, $2, $3, 'PENDING', 'UNKNOWN', $4)`,
      [bookingId, booking.total_price, booking.currency, paymentIntent.id],
    );
    await client.query(
      `UPDATE bookings SET status='PAYMENT_PENDING', updated_at=NOW() WHERE id=$1`,
      [bookingId],
    );
    await client.query("COMMIT");

    return res.status(201).json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("createPaymentIntent error:", error);
    return res.status(500).json({ message: "Server error" });
  } finally {
    client.release();
  }
};

export const confirmPayment = async (req, res) => {
  const userId = req.user?.id;
  const bookingId = Number(req.body?.bookingId);
  const paymentIntentId = req.body?.paymentIntentId;

  if (!stripe) {
    return res.status(500).json({ message: "Stripe is not configured on server." });
  }
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  if (!Number.isInteger(bookingId) || bookingId <= 0 || !paymentIntentId) {
    return res.status(400).json({ message: "bookingId and paymentIntentId are required." });
  }

  try {
    const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (intent.status !== "succeeded") {
      return res.status(400).json({ message: "Payment is not completed yet." });
    }
    if (String(intent.metadata?.bookingId) !== String(bookingId)) {
      return res.status(400).json({ message: "Payment does not match booking." });
    }
    if (String(intent.metadata?.userId) !== String(userId)) {
      return res.status(403).json({ message: "Payment does not belong to this user." });
    }

    const bookingResult = await pool.query(
      `SELECT id, status FROM bookings WHERE id=$1 AND user_id=$2`,
      [bookingId, userId],
    );
    if (bookingResult.rowCount === 0) {
      return res.status(404).json({ message: "Booking not found." });
    }

    await pool.query(
      `UPDATE bookings SET status='PAID', updated_at=NOW() WHERE id=$1`,
      [bookingId],
    );
    await pool.query(
      `UPDATE payments
       SET status='SUCCESS', paid_at=NOW()
       WHERE booking_id=$1 AND transaction_id=$2`,
      [bookingId, paymentIntentId],
    );

    return res.status(200).json({ message: "Payment confirmed." });
  } catch (error) {
    console.error("confirmPayment error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
