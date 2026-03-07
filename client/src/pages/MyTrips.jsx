import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlane, faSuitcase } from "@fortawesome/free-solid-svg-icons";
import { getMyTrips } from "../services/flightServices";
import { getAirportCity, formatDate, formatPrice } from "../utils/flightHelpers";
import NavBar from "./navBar";
import styles from "./MyTrips.module.css";

export default function MyTrips() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getMyTrips();
        if (res?.data?.trips) setTrips(res.data.trips);
      } catch (err) {
        if (err?.status === 401) {
          navigate(`/login?redirect=${encodeURIComponent("/my-trips")}`);
        } else {
          setError(err?.message || "Failed to load trips");
        }
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [navigate]);

  if (loading) {
    return (
      <>
        <NavBar />
        <div className={styles.page}>
          <div className={styles.loading}>
            <div className={styles.spinner} />
            <p>Loading your trips...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <NavBar />
      <div className={styles.page}>
        <div className={styles.container}>
          <h1 className={styles.title}>
            <FontAwesomeIcon icon={faSuitcase} className={styles.titleIcon} />
            My trips
          </h1>

          {error && (
            <div className={styles.error}>
              <p>{error}</p>
            </div>
          )}

          {!error && trips.length === 0 && (
            <div className={styles.empty}>
              <FontAwesomeIcon icon={faPlane} className={styles.emptyIcon} />
              <p>You have no trips yet</p>
              <Link to="/flights" className={styles.searchBtn}>Search flights</Link>
            </div>
          )}

          {!error && trips.length > 0 && (
            <div className={styles.tripList}>
              {trips.map((trip) => {
                const snap = trip.snapshot;
                const out = snap?.itineraries?.[0];
                const dep = out?.segments?.[0]?.departure;
                const arr = out?.segments?.[out.segments?.length - 1]?.arrival;
                const route = dep && arr
                  ? `${getAirportCity(dep.iataCode)} (${dep.iataCode}) → ${getAirportCity(arr.iataCode)} (${arr.iataCode})`
                  : "—";
                const date = dep?.at ? formatDate(dep.at) : "—";

                return (
                  <Link
                    key={trip.id}
                    to={`/my-trips/${trip.id}`}
                    className={styles.tripCard}
                  >
                    <div className={styles.tripRoute}>{route}</div>
                    <div className={styles.tripMeta}>
                      <span>PNR: {trip.pnr}</span>
                      <span>{date}</span>
                      <span>{formatPrice(trip.total_price, trip.currency)}</span>
                    </div>
                    <span className={styles.tripStatus}>{trip.status}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
