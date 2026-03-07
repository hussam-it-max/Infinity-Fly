import styles from "./navbar.module.css";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlaneDeparture, faBars, faXmark } from "@fortawesome/free-solid-svg-icons";
import { getCurrentUser, logout } from "../services/authServices";
import { toast } from "react-toastify";

const NavBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen((prev) => !prev);
  };
  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 900) setIsMenuOpen(false);
    };
    const handleEscape = (e) => {
      if (e.key === "Escape") setIsMenuOpen(false);
    };
    window.addEventListener("resize", handleResize);
    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const checkAuth = async () => {
      try {
        await getCurrentUser();
        if (!cancelled) setIsAuthenticated(true);
      } catch {
        if (!cancelled) setIsAuthenticated(false);
      } finally {
        if (!cancelled) setAuthChecked(true);
      }
    };

    checkAuth();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logout();
      setIsAuthenticated(false);
      setIsMenuOpen(false);
      toast.success("Logged out successfully");
      navigate("/", { replace: true });
    } catch {
      toast.error("Could not log out. Please try again.");
    } finally {
      setLoggingOut(false);
    }
  };

  const handleSectionLink = (sectionId) => {
    closeMenu();
    if (location.pathname !== "/") {
      navigate(`/#${sectionId}`);
      return;
    }
    const section = document.getElementById(sectionId);
    if (section) section.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <header className={styles.header}>
      <Link to="/" className={styles.logo} onClick={closeMenu}>
        <FontAwesomeIcon icon={faPlaneDeparture} className={styles.logoIcon} />
        <span className={styles.logoText}>Infinity Fly</span>
      </Link>

      <button
        type="button"
        className={styles.menuToggle}
        onClick={toggleMenu}
        aria-label={isMenuOpen ? "Close menu" : "Open menu"}
        aria-expanded={isMenuOpen}
      >
        <FontAwesomeIcon icon={isMenuOpen ? faXmark : faBars} />
      </button>

      <nav className={`${styles.navbar} ${isMenuOpen ? styles.active : ""}`}>
        <ul>
          <li>
            <NavLink to="/" onClick={closeMenu}>
              Home
            </NavLink>
          </li>
          <li>
            <NavLink to="/flights" onClick={closeMenu}>
              Flights
            </NavLink>
          </li>
          <li>
            <NavLink to="/my-trips" onClick={closeMenu}>
              My Trips
            </NavLink>
          </li>
          <li>
            <button
              type="button"
              className={styles.navLinkBtn}
              onClick={() => handleSectionLink("about")}
            >
              About
            </button>
          </li>
          <li>
            <button
              type="button"
              className={styles.navLinkBtn}
              onClick={() => handleSectionLink("contact")}
            >
              Contact
            </button>
          </li>
        </ul>
        {authChecked && (
          isAuthenticated ? (
            <button
              type="button"
              className={`${styles.navBtn} ${styles.mobileLogin} ${styles.navBtnReset}`}
              onClick={handleLogout}
              disabled={loggingOut}
            >
              {loggingOut ? "Logging out..." : "Logout"}
            </button>
          ) : (
            <Link to="/login" className={`${styles.navBtn} ${styles.mobileLogin}`} onClick={closeMenu}>
              Log In
            </Link>
          )
        )}
      </nav>

      {authChecked && (
        isAuthenticated ? (
          <button
            type="button"
            className={`${styles.navBtn} ${styles.desktopLogin} ${styles.navBtnReset}`}
            onClick={handleLogout}
            disabled={loggingOut}
          >
            {loggingOut ? "Logging out..." : "Logout"}
          </button>
        ) : (
          <Link to="/login" className={`${styles.navBtn} ${styles.desktopLogin}`}>
            Log In
          </Link>
        )
      )}
    </header>
  );
};

export default NavBar;