import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { apiPost } from "../services/api.js";
import styles from "./paymentForm.module.css";

export default function PaymentForm({ clientSecret, bookingId, successRedirect = "/" }) {
  const navigate = useNavigate();
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const cardOptions = {
    style: {
      base: {
        fontSize: "16px",
        color: "#0f172a",
        fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
        "::placeholder": {
          color: "#94a3b8",
        },
      },
      invalid: {
        color: "#b91c1c",
      },
    },
    hidePostalCode: false,
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements || !clientSecret || loading) return;

    setLoading(true);
    setError(null);
    try {
      const cardElement = elements.getElement(CardElement);
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        },
      });

      if (stripeError) {
        setError(stripeError.message || "Payment failed");
        return;
      }

      if (paymentIntent?.status !== "succeeded") {
        setError("Payment was not completed. Please try again.");
        return;
      }

      await apiPost("/payment/confirm-payment", {
        bookingId,
        paymentIntentId: paymentIntent.id,
      });

      toast.success("Payment successful!");
      const nextPath =
        typeof successRedirect === "string" && successRedirect.startsWith("/")
          ? successRedirect
          : "/";
      navigate(nextPath, { replace: true });
    } catch (err) {
      setError(err?.message || "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <h2 className={styles.title}>Complete your payment</h2>
      <p className={styles.subtitle}>Your card details are encrypted and secure.</p>

      <label className={styles.label}>Card details</label>
      <div className={styles.cardBox}>
        <CardElement options={cardOptions} />
      </div>

      {error && <p className={styles.error}>{error}</p>}
      <button type="submit" disabled={loading || !stripe} className={styles.button}>
        {loading ? "Processing..." : "Pay Now"}
      </button>
      <p className={styles.note}>By continuing, your booking will be marked as paid.</p>
    </form>
  );
}