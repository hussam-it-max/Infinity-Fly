import { useSearchParams, Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleCheck } from "@fortawesome/free-solid-svg-icons";
import styles from "./BookingConfirmation.module.css";

export default function BookingConfirmation() {
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get("id");

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.card}>
          <FontAwesomeIcon icon={faCircleCheck} className={styles.icon} />
          <h1>Booking confirmed</h1>
          <p>Your flight has been reserved successfully.</p>
          {bookingId && (
            <p className={styles.bookingId}>Reference: #{bookingId}</p>
          )}
          <Link to="/flights" className={styles.btn}>Search more flights</Link>
          <Link to="/" className={styles.link}>Back to home</Link>
        </div>
      </div>
    </div>
  );
}
