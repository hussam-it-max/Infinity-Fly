import { getAirportCity, formatTime, parseDuration, formatPrice } from "../utils/flightHelpers";
import styles from "./FlightCard.module.css";

export default function FlightCard({ flight, onSelect }) {
  const outbound = flight.itineraries?.[0];
  const returnLeg = flight.itineraries?.[1];

  const renderLeg = (itinerary, label) => {
    if (!itinerary) return null;
    const segs = itinerary.segments || [];
    const dep = segs[0]?.departure;
    const arr = segs[segs.length - 1]?.arrival;
    const legStops = segs.length - 1;
    const carrier = segs[0]?.carrierCode;
    const number = segs[0]?.number;

    return (
      <div className={styles.leg}>
        <span className={styles.legLabel}>{label}</span>
        <div className={styles.legContent}>
          <div className={styles.timeBlock}>
            <span className={styles.time}>{formatTime(dep?.at)}</span>
            <span className={styles.airport}>{dep?.iataCode}</span>
            <span className={styles.city}>{getAirportCity(dep?.iataCode)}</span>
          </div>
          <div className={styles.durationBlock}>
            <div className={styles.durationLine} />
            <span className={styles.duration}>{parseDuration(itinerary.duration)}</span>
            <span className={styles.stops}>
              {legStops === 0 ? "Non-stop" : `${legStops} stop${legStops > 1 ? "s" : ""}`}
            </span>
          </div>
          <div className={styles.timeBlock}>
            <span className={styles.time}>{formatTime(arr?.at)}</span>
            <span className={styles.airport}>{arr?.iataCode}</span>
            <span className={styles.city}>{getAirportCity(arr?.iataCode)}</span>
          </div>
        </div>
        {carrier && (
          <span className={styles.flightNo}>{carrier} {number}</span>
        )}
      </div>
    );
  };

  return (
    <div className={styles.card}>
      <div className={styles.legs}>
        {renderLeg(outbound, "Outbound")}
        {returnLeg && renderLeg(returnLeg, "Return")}
      </div>
      <div className={styles.priceBlock}>
        <div className={styles.price}>{formatPrice(flight.price, flight.currency)}</div>
        <span className={styles.priceLabel}>total</span>
        <button className={styles.selectBtn} onClick={() => onSelect?.(flight)}>
          Select
        </button>
      </div>
    </div>
  );
}
