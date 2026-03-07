import { useState, useEffect } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlane,
  faSuitcase,
  faChair,
  faShieldHalved,
} from "@fortawesome/free-solid-svg-icons";
import { revalidateFlight } from "../services/flightServices";
import { getAirportCity, formatTime, parseDuration, formatPrice } from "../utils/flightHelpers";
import styles from "./BookingOffer.module.css";

const FARE_PACKAGES = [
  {
    id: "light",
    name: "Light",
    tagline: "Best price",
    priceModifier: 0,
    features: [
      { text: "Hand luggage only", icon: faSuitcase },
      { text: "No changes allowed", icon: faShieldHalved },
      { text: "Non-refundable", icon: faShieldHalved },
    ],
    recommended: false,
  },
  {
    id: "inclusif",
    name: "Inclusif",
    tagline: "Most popular",
    priceModifier: 0.12,
    features: [
      { text: "1 checked bag (23kg)", icon: faSuitcase },
      { text: "Seat selection", icon: faChair },
      { text: "Date change with fee", icon: faShieldHalved },
    ],
    recommended: true,
  },
  {
    id: "inclusif_plus",
    name: "Inclusif Plus",
    tagline: "Full flexibility",
    priceModifier: 0.25,
    features: [
      { text: "2 checked bags (23kg each)", icon: faSuitcase },
      { text: "Priority boarding", icon: faPlane },
      { text: "Free changes & refund", icon: faShieldHalved },
    ],
    recommended: false,
  },
];

export default function BookingOffer() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const offerId = searchParams.get("offerId");
  const searchId = searchParams.get("searchId");
  const adults = parseInt(searchParams.get("adults") || "1", 10);
  const children = parseInt(searchParams.get("children") || "0", 10);
  const infants = parseInt(searchParams.get("infants") || "0", 10);
  const [validatedOffer, setValidatedOffer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [priceChanged, setPriceChanged] = useState(false);

  useEffect(() => {
    if (!offerId || !searchId) {
      setError("Missing offer or session. Please search again.");
      setLoading(false);
      return;
    }

    const validate = async () => {
      try {
        const result = await revalidateFlight({ offerId, searchId });
        if (result?.data) {
          setValidatedOffer(result.data.flightOffer);
          if (result.data.priceChanged) {
            setPriceChanged(true);
            toast.info(result.data.message);
          }
        }
      } catch (err) {
        setError(err?.message || "Offer expired. Please search again.");
      } finally {
        setLoading(false);
      }
    };

    validate();
  }, [offerId, searchId]);

  const handleSelectOffer = (pkg) => {
    const q = new URLSearchParams({ offerId, searchId, fare: pkg.id });
    if (adults > 0) q.set("adults", String(adults));
    if (children > 0) q.set("children", String(children));
    if (infants > 0) q.set("infants", String(infants));
    navigate(`/booking/passengers?${q.toString()}`);
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Validating your flight...</p>
        </div>
      </div>
    );
  }

  if (error || !validatedOffer) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.error}>
            <h2>Unable to continue</h2>
            <p>{error}</p>
            <Link to="/flights" className={styles.backBtn}>Search again</Link>
          </div>
        </div>
      </div>
    );
  }

  const basePrice = parseFloat(validatedOffer?.price?.total || 0);
  const currency = validatedOffer?.price?.currency || "EUR";
  const outbound = validatedOffer.itineraries?.[0];
  const returnLeg = validatedOffer.itineraries?.[1];
  const dep = outbound?.segments?.[0]?.departure;
  const arr = outbound?.segments?.[outbound.segments?.length - 1]?.arrival;

  return (
    <div className={styles.page}>
      <div className={styles.banner}>
        <Link to="/" className={styles.breadcrumb}>Home</Link>
        <span className={styles.breadcrumbSep}>/</span>
        <span className={styles.breadcrumbSep}>Flights</span>
        <span className={styles.breadcrumbSep}>/</span>
        <span className={styles.breadcrumbCurrent}>Select your fare</span>
        <h1 className={styles.title}>
          <FontAwesomeIcon icon={faPlane} className={styles.titleIcon} />
          Choose your fare
        </h1>
        <div className={styles.flightSummary}>
          <span>{getAirportCity(dep?.iataCode)} ({dep?.iataCode})</span>
          <span className={styles.arrow}>→</span>
          <span>{getAirportCity(arr?.iataCode)} ({arr?.iataCode})</span>
        </div>
        {priceChanged && (
          <p className={styles.priceAlert}>Price has been updated. New price shown below.</p>
        )}
      </div>

      <div className={styles.container}>
        <div className={styles.cards}>
          {FARE_PACKAGES.map((pkg) => {
            const price = basePrice * (1 + pkg.priceModifier);
            return (
              <div
                key={pkg.id}
                className={`${styles.card} ${pkg.recommended ? styles.recommended : ""}`}
              >
                {pkg.recommended && <span className={styles.badge}>Recommended</span>}
                <h3 className={styles.cardTitle}>{pkg.name}</h3>
                <p className={styles.tagline}>{pkg.tagline}</p>
                <div className={styles.price}>{formatPrice(price, currency)}</div>
                <p className={styles.priceLabel}>per person</p>
                <ul className={styles.features}>
                  {pkg.features.map((f, i) => (
                    <li key={i}>
                      <FontAwesomeIcon icon={f.icon} className={styles.featureIcon} />
                      {f.text}
                    </li>
                  ))}
                </ul>
                <button
                  className={styles.selectBtn}
                  onClick={() => handleSelectOffer(pkg)}
                >
                  Select {pkg.name}
                </button>
              </div>
            );
          })}
        </div>

        <div className={styles.flightDetails}>
          <h3>Flight details</h3>
          <div className={styles.detailRow}>
            <span>Outbound</span>
            <span>
              {formatTime(dep?.at)} {dep?.iataCode} → {formatTime(arr?.at)} {arr?.iataCode}
            </span>
          </div>
          {returnLeg && (
            <div className={styles.detailRow}>
              <span>Return</span>
              <span>
                {formatTime(returnLeg.segments?.[0]?.departure?.at)} →{" "}
                {formatTime(returnLeg.segments?.[returnLeg.segments?.length - 1]?.arrival?.at)}
              </span>
            </div>
          )}
          <div className={styles.detailRow}>
            <span>Duration</span>
            <span>{parseDuration(outbound?.duration)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
