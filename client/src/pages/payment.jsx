import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { apiPost } from "../services/api.js";
import PaymentForm from "../component/paymentForm.jsx";
import styles from "./payment.module.css";

const publishableKey =
  process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY ||
  process.env.PUBLIC_STRIPE_PUBLISHABLE_KEY;

export default function Payment() {
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get("bookingId");
  const returnTo = searchParams.get("returnTo") || "/";
  const [clientSecret, setClientSecret] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const stripePromise = useMemo(() => {
    if (!publishableKey) return null;
    return loadStripe(publishableKey);
  }, []);

  useEffect(() => {
    const createPaymentIntent = async () => {
      if (!bookingId) {
        setError("Missing booking id. Open payment from your trip details page.");
        setLoading(false);
        return;
      }
      if (!publishableKey) {
        setError("Stripe is not configured on the client.");
        setLoading(false);
        return;
      }

      try {
        const response = await apiPost("/payment/create-payment-intent", { bookingId });
        setClientSecret(response?.data?.clientSecret || null);
        setError(null);
      } catch (err) {
        setError(err?.message || "Failed to start payment");
      } finally {
        setLoading(false);
      }
    };

    createPaymentIntent();
  }, [bookingId]);

  if (error) {
    return (
      <>
        <div className="error">{error}</div>
        <Link to="/">Back to home</Link>
      </>
    );
  }

  if (loading) {
    return (
      <div className={styles.loading}>
        Loading...
        <div className={styles.spinner} />
      </div>
    );
  }

  if (!clientSecret || !stripePromise) {
    return (
      <>
        <div className="error">Unable to initialize payment.</div>
        <Link to="/">Back to home</Link>
      </>
    );
  }

  return (
    <div className={styles.page}>
      <Elements stripe={stripePromise} options={{ clientSecret }}>
        <PaymentForm
          clientSecret={clientSecret}
          bookingId={bookingId}
          successRedirect={returnTo}
        />
      </Elements>
    </div>
  );
}

