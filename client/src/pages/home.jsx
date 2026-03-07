import { useEffect } from "react";
import NavBar from "./navBar";
import HeroSection from "./heroSection";
import Searchbox from "../component/searchBox";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faPlaneDeparture,
    faClock,
    faShieldHalved,
    faHeadset,
    faEnvelope,
    faPhone,
    faLocationDot,
} from "@fortawesome/free-solid-svg-icons";
import styles from "./home.module.css";

const HomePage = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <>
            <NavBar/>
            <HeroSection/>
            <Searchbox/>

            <section id="about" className={styles.sectionWrap}>
                <div className={styles.sectionHeader}>
                    <p className={styles.kicker}>About Us</p>
                    <h2>Travel made simple, fast, and reliable</h2>
                    <p>
                        Infinity Fly helps travelers compare routes, pick the right fare, and book with confidence.
                        We focus on a clear experience from search to trip management.
                    </p>
                </div>

                <div className={styles.featuresGrid}>
                    <article className={styles.featureCard}>
                        <FontAwesomeIcon icon={faPlaneDeparture} className={styles.featureIcon} />
                        <h3>Smart Flight Choices</h3>
                        <p>Compare practical flight options with transparent details and a smooth booking flow.</p>
                    </article>
                    <article className={styles.featureCard}>
                        <FontAwesomeIcon icon={faClock} className={styles.featureIcon} />
                        <h3>Fast Booking Process</h3>
                        <p>Less friction, fewer steps, and quick confirmations so you can plan your trip faster.</p>
                    </article>
                    <article className={styles.featureCard}>
                        <FontAwesomeIcon icon={faShieldHalved} className={styles.featureIcon} />
                        <h3>Secure Experience</h3>
                        <p>Secure sessions and protected account actions across booking and trip management pages.</p>
                    </article>
                    <article className={styles.featureCard}>
                        <FontAwesomeIcon icon={faHeadset} className={styles.featureIcon} />
                        <h3>Traveler Support</h3>
                        <p>Clear status updates and easy access to your bookings when you need to check details.</p>
                    </article>
                </div>
            </section>

            <section id="contact" className={styles.sectionWrap}>
                <div className={styles.sectionHeader}>
                    <p className={styles.kicker}>Contact</p>
                    <h2>Need help with your booking?</h2>
                    <p>Our team is here to help with your trip details, booking questions, and account support.</p>
                </div>

                <div className={styles.contactGrid}>
                    <div className={styles.contactCard}>
                        <div className={styles.contactRow}>
                            <FontAwesomeIcon icon={faEnvelope} />
                            <span>support@infinityfly.com</span>
                        </div>
                        <div className={styles.contactRow}>
                            <FontAwesomeIcon icon={faPhone} />
                            <span>+31 20 123 45 67</span>
                        </div>
                        <div className={styles.contactRow}>
                            <FontAwesomeIcon icon={faLocationDot} />
                            <span>Amsterdam, Netherlands</span>
                        </div>
                    </div>

                    <div className={styles.contactInfo}>
                        <h3>Support hours</h3>
                        <p>Monday - Friday: 08:00 - 20:00</p>
                        <p>Saturday - Sunday: 10:00 - 18:00</p>
                        <a className={styles.contactBtn} href="mailto:support@infinityfly.com">
                            Contact support
                        </a>
                    </div>
                </div>
            </section>
        </>
    );
};

export default HomePage;