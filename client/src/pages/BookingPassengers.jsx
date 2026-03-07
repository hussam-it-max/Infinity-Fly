import { useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faEnvelope } from "@fortawesome/free-solid-svg-icons";
import { bookFlight, confirmPrice, cancelPendingBooking } from "../services/flightServices";
import { formatPrice } from "../utils/flightHelpers";
import styles from "./BookingPassengers.module.css";

export default function BookingPassengers() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const offerId = searchParams.get("offerId");
  const searchId = searchParams.get("searchId");
  const adultsCount = Math.max(1, parseInt(searchParams.get("adults") || "1", 10));
  const childrenCount = Math.max(0, parseInt(searchParams.get("children") || "0", 10));
  const infantsCount = Math.max(0, parseInt(searchParams.get("infants") || "0", 10));

  const buildInitialTravelers = () => {
    const list = [];
    for (let i = 0; i < adultsCount; i++) {
      list.push({ firstName: "", lastName: "", dateOfBirth: "", type: "ADULT" });
    }
    for (let i = 0; i < childrenCount; i++) {
      list.push({ firstName: "", lastName: "", dateOfBirth: "", type: "CHILD" });
    }
    for (let i = 0; i < infantsCount; i++) {
      list.push({ firstName: "", lastName: "", dateOfBirth: "", type: "INFANT" });
    }
    return list.length ? list : [{ firstName: "", lastName: "", dateOfBirth: "", type: "ADULT" }];
  };

  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState(false);
  const [priceChangeModal, setPriceChangeModal] = useState(null);
  const [contact, setContact] = useState({ email: "", phone: "" });
  const [travelers, setTravelers] = useState(buildInitialTravelers);

  const isValid = () => {
    if (!contact.email?.trim() || !contact.phone?.trim()) return false;
    return travelers.every((t) => t.firstName?.trim() && t.lastName?.trim() && t.dateOfBirth);
  };

  const formatTravelersForApi = () => {
    return travelers.map((t, i) => ({
      id: String(i + 1),
      name: { firstName: t.firstName.trim(), lastName: t.lastName.trim() },
      firstName: t.firstName.trim(),
      lastName: t.lastName.trim(),
      dateOfBirth: t.dateOfBirth,
      dateOfBirthFormatted: t.dateOfBirth,
      type: t.type || "ADULT",
      gender: "MALE",
    }));
  };

  const formatContactForApi = () => [
    {
      email: contact.email.trim(),
      phones: [
        {
          deviceType: "MOBILE",
          countryCallingCode: "31",
          number: contact.phone.replace(/\D/g, "").slice(-9)
        },
      ],
    },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid() || !offerId || !searchId) {
      toast.error("Please fill all required fields.");
      return;
    }
    setLoading(true);
    setAuthError(false);
    setPriceChangeModal(null);
    try {
      const result = await bookFlight({
        offerId,
        searchId,
        travelers: formatTravelersForApi(),
        contact: formatContactForApi(),
      });
      if (result?.data?.bookingId) {
        toast.success("Booking confirmed!");
        navigate(`/booking/confirmation?id=${result.data.bookingId}`);
      }
    } catch (err) {
      if (err?.status === 401) {
        setAuthError(true);
      } else if (err?.status === 409 && err?.data?.pendingOrderId) {
        setPriceChangeModal({
          pendingOrderId: err.data.pendingOrderId,
          oldPrice: err.data.oldPrice,
          newPrice: err.data.newPrice,
          currency: err.data.currency,
          travelers: formatTravelersForApi(),
          contact: formatContactForApi(),
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPrice = async () => {
    if (!priceChangeModal?.pendingOrderId) return;
    setLoading(true);
    try {
      const result = await confirmPrice({ pendingOrderId: priceChangeModal.pendingOrderId });
      if (result?.data?.bookingId) {
        setPriceChangeModal(null);
        toast.success("Booking confirmed at new price!");
        navigate(`/booking/confirmation?id=${result.data.bookingId}`);
      }
    } catch (err) {
      if (err?.status === 404 || err?.status === 410) {
        setPriceChangeModal(null);
        toast.error("Session expired. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancelPending = async () => {
    if (!priceChangeModal?.pendingOrderId) return;
    setLoading(true);
    try {
      await cancelPendingBooking({ pendingOrderId: priceChangeModal.pendingOrderId });
      setPriceChangeModal(null);
      toast.info("Pending booking cancelled.");
    } catch {
      setPriceChangeModal(null);
    } finally {
      setLoading(false);
    }
  };

  if (!offerId || !searchId) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.error}>
            <h2>Session expired</h2>
            <p>Please search for flights and try again.</p>
            <Link to="/flights" className={styles.backBtn}>Search flights</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.banner}>
        <Link to="/" className={styles.breadcrumb}>Home</Link>
        <span className={styles.breadcrumbSep}>/</span>
        <span className={styles.breadcrumbSep}>Flights</span>
        <span className={styles.breadcrumbSep}>/</span>
        <span className={styles.breadcrumbCurrent}>Passenger details</span>
        <h1 className={styles.title}>
          <FontAwesomeIcon icon={faUser} className={styles.titleIcon} />
          Passenger details
        </h1>
      </div>

      <div className={styles.container}>
        {authError && (
          <div className={styles.authBanner}>
            <p>Please log in to complete your booking.</p>
            <Link
              to={`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`}
              className={styles.loginLink}
            >
              Log in
            </Link>
            <span className={styles.authOr}> or </span>
            <Link
              to={`/register?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`}
              className={styles.loginLink}
            >
              Create account
            </Link>
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <section className={styles.section}>
            <h3><FontAwesomeIcon icon={faEnvelope} /> Contact</h3>
            <div className={styles.row}>
              <label>Email *</label>
              <input
                type="email"
                value={contact.email}
                onChange={(e) => setContact((c) => ({ ...c, email: e.target.value }))}
                placeholder="you@example.com"
                required
              />
            </div>
            <div className={styles.row}>
              <label>Phone *</label>
              <input
                type="tel"
                value={contact.phone}
                onChange={(e) => setContact((c) => ({ ...c, phone: e.target.value }))}
                placeholder="+31 6 12 34 56 78"
                required
              />
            </div>
          </section>

          <section className={styles.section}>
            <h3><FontAwesomeIcon icon={faUser} /> Passengers</h3>
            {travelers.map((t, i) => (
              <div key={i} className={styles.travelerCard}>
                <h4>Passenger {i + 1} {t.type && t.type !== "ADULT" ? `(${t.type})` : ""}</h4>
                <div className={styles.twoCol}>
                  <div className={styles.row}>
                    <label>First name *</label>
                    <input
                      value={t.firstName}
                      onChange={(e) =>
                        setTravelers((prev) =>
                          prev.map((p, j) =>
                            j === i ? { ...p, firstName: e.target.value } : p
                          )
                        )
                      }
                      placeholder="John"
                      required
                    />
                  </div>
                  <div className={styles.row}>
                    <label>Last name *</label>
                    <input
                      value={t.lastName}
                      onChange={(e) =>
                        setTravelers((prev) =>
                          prev.map((p, j) =>
                            j === i ? { ...p, lastName: e.target.value } : p
                          )
                        )
                      }
                      placeholder="Doe"
                      required
                    />
                  </div>
                </div>
                <div className={styles.row}>
                  <label>Date of birth *</label>
                  <input
                    type="date"
                    value={t.dateOfBirth}
                    onChange={(e) =>
                      setTravelers((prev) =>
                        prev.map((p, j) =>
                          j === i ? { ...p, dateOfBirth: e.target.value } : p
                        )
                      )
                    }
                    required
                  />
                </div>
              </div>
            ))}
          </section>

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={loading || !isValid()}
          >
            {loading ? "Processing..." : "Continue to payment"}
          </button>
        </form>

        {priceChangeModal && (
          <div className={styles.modalOverlay} onClick={() => !loading && handleCancelPending()}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <h3>Price updated</h3>
              <p>The airline has updated the price.</p>
              <div className={styles.modalPrices}>
                <span>Previous: {formatPrice(priceChangeModal.oldPrice, priceChangeModal.currency)}</span>
                <span>New: {formatPrice(priceChangeModal.newPrice, priceChangeModal.currency)}</span>
              </div>
              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={handleCancelPending}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={styles.confirmBtn}
                  onClick={handleConfirmPrice}
                  disabled={loading}
                >
                  {loading ? "Processing..." : "Confirm new price"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
