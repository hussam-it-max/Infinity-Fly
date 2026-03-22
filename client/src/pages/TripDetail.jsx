import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlane, faUser, faPrint } from "@fortawesome/free-solid-svg-icons";
import { getMyTrips } from "../services/flightServices";
import { getAirportCity, formatTime, parseDuration, formatDate } from "../utils/flightHelpers";
import NavBar from "./navBar";
import styles from "./TripDetail.module.css";

export default function TripDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getMyTrips();
        if (res?.data?.trips) {
          const found = res.data.trips.find((t) => String(t.id) === String(id));
          setTrip(found || null);
        }
      } catch (err) {
        if (err?.status === 401) {
          navigate(`/login?redirect=${encodeURIComponent(`/my-trips/${id}`)}`);
        } else {
          setError(err?.message || "Failed to load trip");
        }
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id, navigate]);

  if (loading) {
    return (
      <>
        <NavBar />
        <div className={styles.page}>
          <div className={styles.loading}>Loading...</div>
        </div>
      </>
    );
  }

  if (error || !trip) {
    return (
      <>
        <NavBar />
        <div className={styles.page}>
          <div className={styles.container}>
            <div className={styles.error}>
              <p>{error || "Trip not found"}</p>
              <Link to="/my-trips">Back to My trips</Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  const snap = trip.snapshot;
  const firstItinerary = snap?.itineraries?.[0];
  const firstDep = firstItinerary?.segments?.[0]?.departure;
  const firstArr = firstItinerary?.segments?.[firstItinerary?.segments?.length - 1]?.arrival;
  const routeLabel = firstDep && firstArr
    ? `${getAirportCity(firstDep.iataCode)} (${firstDep.iataCode}) -> ${getAirportCity(firstArr.iataCode)} (${firstArr.iataCode})`
    : "Your trip";
  const paidStatuses = ["PAID", "CONFIRMED"];
  const isPaidBooking = paidStatuses.includes(String(trip.status || "").toUpperCase());

  const renderSegment = (seg) => (
    <div key={seg?.id || seg?.departure?.at} className={styles.segment}>
      <div className={styles.segRow}>
        <span className={styles.time}>{formatTime(seg?.departure?.at)}</span>
        <span className={styles.airport}>{seg?.departure?.iataCode}</span>
        <span className={styles.city}>{getAirportCity(seg?.departure?.iataCode)}</span>
      </div>
      <div className={styles.segMid}>
        <span className={styles.carrierBadge}>{seg?.carrierCode}</span>
        <span>{seg?.carrierCode} {seg?.number}</span>
        <span>{parseDuration(seg?.duration)}</span>
      </div>
      <div className={styles.segRow}>
        <span className={styles.time}>{formatTime(seg?.arrival?.at)}</span>
        <span className={styles.airport}>{seg?.arrival?.iataCode}</span>
        <span className={styles.city}>{getAirportCity(seg?.arrival?.iataCode)}</span>
      </div>
    </div>
  );

  return (
    <>
      <NavBar />
      <div className={styles.page}>
        <div className={styles.container}>
          <Link to="/my-trips" className={styles.back}>← My trips</Link>

          <div className={styles.hero}>
            <h1>Trip details</h1>
            <p className={styles.route}>{routeLabel}</p>
            <div className={styles.badges}>
              <span className={styles.pnr}>PNR: {trip.pnr}</span>
              <span className={styles.status}>{trip.status}</span>
              <span className={styles.pax}>{trip.passengers?.length || 0} pax</span>
            </div>
            <button className={styles.printBtn} onClick={() => window.print()}>
              <FontAwesomeIcon icon={faPrint} /> Print e-ticket
            </button>
          </div>

          <section className={styles.section}>
            <h2><FontAwesomeIcon icon={faPlane} /> Flight details</h2>
            {snap?.itineraries?.map((it, idx) => (
              <div key={idx} className={styles.itinerary}>
                <h3>{idx === 0 ? "Outbound" : "Return"}</h3>
                {it.segments?.map((seg) => (
                  <div key={seg?.id}>
                    {renderSegment(seg)}
                    {it.segments.indexOf(seg) < it.segments.length - 1 && (
                      <div className={styles.layover}>Layover</div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </section>

          <section className={styles.section}>
            <h2><FontAwesomeIcon icon={faUser} /> Passengers & tickets</h2>
            <div className={styles.ticketGrid}>
              {trip.passengers?.map((p, index) => {
                return (
                  <div key={p.id} className={styles.ticketCard}>
                    <div className={styles.ticketTop}>
                      <div>
                        <p className={styles.ticketLabel}>Passenger {index + 1}</p>
                        <h4>{p.first_name} {p.last_name}</h4>
                        <span className={styles.type}>{p.type_passenger}</span>
                      </div>
                    </div>
                    <div className={styles.ticketMeta}>
                      <span><strong>Ticket:</strong> {p.ticket_number || "Pending issuance"}</span>
                      <span><strong>Seat:</strong> {p.seat_number || "Assigned at check-in"}</span>
                      <span><strong>PNR:</strong> {trip.pnr}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className={styles.hint}>
              Seat and ticket numbers are assigned at check-in when not yet available.
            </p>
          </section>

          <section className={styles.section}>
            <h2>Booking info</h2>
            <div className={styles.info}>
              <span>Booked: {formatDate(trip.created_at)}</span>
              {!isPaidBooking && (
                <span>Expires: {trip.expiration ? new Date(trip.expiration).toLocaleString() : "—"}</span>
              )}
              {!isPaidBooking && (
                <Link
                  to={`/payment?bookingId=${trip.id}&returnTo=${encodeURIComponent(`/my-trips/${trip.id}`)}`}
                  className={styles.payBtn}
                >
                  Pay for your ticket
                </Link>
              )}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
