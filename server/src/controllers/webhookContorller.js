import Stripe from "stripe";
import dotenv from "dotenv";
import pool from "../db/index.js";

dotenv.config();

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

export const stripeWebhook = async (req, res) => {
  if (!stripe || !webhookSecret) {
    return res.status(500).json({ message: "Stripe webhook is not configured." });
  }

  const signature = req.headers["stripe-signature"];
  if (!signature) {
    return res.status(400).json({ message: "Missing Stripe signature header." });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
  } catch (error) {
    console.error("Webhook signature error:", error?.message || error);
    return res.status(400).json({ message: "Invalid Stripe signature." });
  }

  const paymentIntent = event?.data?.object;
  const bookingId = Number(paymentIntent?.metadata?.bookingId);
  const paymentIntentId = paymentIntent?.id;
  if (!Number.isInteger(bookingId) || !paymentIntentId) {
    return res.status(200).json({ received: true });
  }

  try {
    if (event.type === "payment_intent.succeeded") {
      await pool.query(
        `UPDATE bookings
         SET status='PAID', updated_at=NOW()
         WHERE id=$1 AND status IN ('PENDING','PAYMENT_PENDING')`,
        [bookingId],
      );
      await pool.query(
        `UPDATE payments
         SET status='SUCCESS', paid_at=NOW()
         WHERE booking_id=$1 AND transaction_id=$2`,
        [bookingId, paymentIntentId],
      );
      return res.status(200).json({ received: true });
    }

    if (event.type === "payment_intent.payment_failed") {
      await pool.query(
        `UPDATE bookings
         SET status='FAILED', updated_at=NOW()
         WHERE id=$1 AND status='PAYMENT_PENDING'`,
        [bookingId],
      );
      await pool.query(
        `UPDATE payments
         SET status='FAILED'
         WHERE booking_id=$1 AND transaction_id=$2`,
        [bookingId, paymentIntentId],
      );
      return res.status(200).json({ received: true });
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return res.status(500).json({ message: "Webhook processing failed." });
  }
};