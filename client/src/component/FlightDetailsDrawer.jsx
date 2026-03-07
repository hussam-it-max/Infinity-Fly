import { getAirportCity, formatTime, parseDuration, formatPrice } from "../utils/flightHelpers";
import styles from "./FlightDetailsDrawer.module.css";

function getBaggageInfo(flight) {
  const pricings = flight.travelerPricings || [];
  const segments = pricings[0]?.fareDetailsBySegment || [];
  const firstSeg = segments[0];
  const bags = firstSeg?.includedCheckedBags;
  const carryOn = firstSeg?.carryOnBaggage;
  return { bags, carryOn };
}

export default function FlightDetailsDrawer({ flight, onClose, onBook }) {
  if (!flight) return null;

  const outbound = flight.itineraries?.[0];
  const returnLeg = flight.itineraries?.[1];
  const { bags, carryOn } = getBaggageInfo(flight);

  const renderSegment = (seg) => (
    <div key={seg?.departure?.at} className={styles.segment}>
      <div className={styles.segmentRow}>
        <span className={styles.time}>{formatTime(seg?.departure?.at)}</span>
        <span className={styles.airport}>{seg?.departure?.iataCode}</span>
        <span className={styles.city}>{getAirportCity(seg?.departure?.iataCode)}</span>
      </div>
      <div className={styles.segmentMiddle}>
        <span className={styles.flightInfo}>
          {seg?.carrierCode} {seg?.number}
          {seg?.aircraft?.code && ` · ${seg.aircraft.code}`}
        </span>
        <span className={styles.duration}>{parseDuration(seg?.duration)}</span>
      </div>
      <div className={styles.segmentRow}>
        <span className={styles.time}>{formatTime(seg?.arrival?.at)}</span>
        <span className={styles.airport}>{seg?.arrival?.iataCode}</span>
        <span className={styles.city}>{getAirportCity(seg?.arrival?.iataCode)}</span>
      </div>
    </div>
  );

  const renderItinerary = (it, label) => {
    if (!it) return null;
    const segs = it.segments || [];
    return (
      <div className={styles.itinerary} key={label}>
        <h4>{label}</h4>
        <div className={styles.segments}>
          {segs.map((seg, i) => (
            <div key={i}>
              {renderSegment(seg)}
              {i < segs.length - 1 && (
                <div className={styles.connection}>
                  <span>Layover</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <>
      <div className={styles.overlay} onClick={onClose} aria-hidden="true" />
      <aside className={styles.drawer}>
        <div className={styles.header}>
          <h2>Flight details</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.priceSection}>
            <span className={styles.price}>{formatPrice(flight.price, flight.currency)}</span>
            <span className={styles.priceLabel}>Total price per person</span>
          </div>

          {renderItinerary(outbound, "Outbound")}
          {returnLeg && renderItinerary(returnLeg, "Return")}

          <div className={styles.infoSection}>
            <h4>Baggage</h4>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Checked baggage</span>
                <span className={styles.infoValue}>
                  {bags
                    ? `${bags.quantity || 1} bag${(bags.quantity || 1) > 1 ? "s" : ""}${bags.weight ? ` · ${bags.weight} ${(bags.weightUnit || "KG")}` : ""}`
                    : "See airline policy"}
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Carry-on</span>
                <span className={styles.infoValue}>
                  {carryOn?.quantity
                    ? `${carryOn.quantity} item(s)${carryOn.weight ? ` · ${carryOn.weight} ${carryOn.weightUnit || "KG"}` : ""}`
                    : "1 personal item included"}
                </span>
              </div>
            </div>
          </div>

          <div className={styles.infoSection}>
            <h4>Important information</h4>
            <ul className={styles.bullets}>
              <li>Prices include taxes and fees</li>
              <li>Changes and refunds subject to airline policy</li>
              <li>Please check in online before your flight</li>
            </ul>
          </div>

          <button className={styles.bookBtn} onClick={() => onBook?.(flight)}>
            Continue to booking
          </button>
        </div>
      </aside>
    </>
  );
}
