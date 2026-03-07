import styles from "./heroSection.module.css";
import heroImg from "../assests/images/zz_xmqcxy.webp";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGlobe, faShieldHalved, faClock } from "@fortawesome/free-solid-svg-icons";

const HeroSection =()=>{

    return(
        <section
          className={styles.heroSection}
          style={{
            backgroundImage: `
              linear-gradient(130deg, rgba(15, 23, 42, 0.72), rgba(55, 157, 147, 0.55)),
              url(${heroImg})
            `,
          }}
        >
          <div className={styles.content}>
            <p className={styles.kicker}>Trusted by travelers worldwide</p>
            <h1>Discover your next journey with Infinity Fly</h1>
            <p className={styles.subtitle}>
              Compare prices, choose your fare, and book in minutes with a smooth and secure experience.
            </p>
            <div className={styles.highlights}>
              <span><FontAwesomeIcon icon={faGlobe} /> 120+ destinations</span>
              <span><FontAwesomeIcon icon={faShieldHalved} /> Secure checkout</span>
              <span><FontAwesomeIcon icon={faClock} /> Fast booking flow</span>
            </div>
          </div>
        </section>
    );
}
export default HeroSection;