import { useState, useEffect } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { searchFlights } from "../services/flightServices";
import { toast } from "react-toastify";
import FlightSearchBar from "../component/FlightSearchBar";
import FlightCard from "../component/FlightCard";
import FlightDetailsDrawer from "../component/FlightDetailsDrawer";
import { getAirportCity } from "../utils/flightHelpers";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlane } from "@fortawesome/free-solid-svg-icons";
import styles from "./flights.module.css";

export default function SearchFlights() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [flights, setFlights] = useState([]);
  const [searchId, setSearchId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [visibleCount, setVisibleCount] = useState(10);
  const [selectedFlight, setSelectedFlight] = useState(null);

  const originLocationCode = searchParams.get("originLocationCode");
  const destinationLocationCode = searchParams.get("destinationLocationCode");
  const departureDate = searchParams.get("departureDate");
  const adults = searchParams.get("adults");
  const children = searchParams.get("children");
  const infants = searchParams.get("infants");
  const travelClass = searchParams.get("travelClass");
  const nonStop = searchParams.get("nonStop") === "true";
  const tripType = searchParams.get("tripType");
  const returnDate = searchParams.get("returnDate");

  const searchParamsObj = {
    originLocationCode,
    destinationLocationCode,
    departureDate,
    returnDate,
    adults,
    children,
    infants,
    travelClass,
    nonStop,
    tripType,
  };

  useEffect(() => {
    const fetchFlights = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = {
          originLocationCode,
          destinationLocationCode,
          departureDate,
          adults: parseInt(adults || 1),
          children: parseInt(children || 0),
          infants: parseInt(infants || 0),
          travelClass,
          nonStop,
        };

        if (tripType === "roundtrip" && returnDate) {
          params.returnDate = returnDate;
        }

        const result = await searchFlights(params);

        if (result && result.data) {
          const data = result.data;
          const flightList = data.flights || data;
          const flightsArray = Array.isArray(flightList) ? flightList : [];
          setFlights(flightsArray);
          setSearchId(data.searchId || null);
          setVisibleCount(10);
          if (flightsArray.length === 0) {
            toast.info("No flights found for the selected criteria");
          }
        }
      } catch (err) {
        const errorMsg = err?.message || "Failed to search flights";
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    if (originLocationCode && destinationLocationCode && departureDate) {
      fetchFlights();
    } else {
      setError("Missing required search parameters");
    }
  }, [
    originLocationCode,
    destinationLocationCode,
    departureDate,
    adults,
    children,
    infants,
    travelClass,
    nonStop,
    tripType,
    returnDate,
  ]);

  const handleSelectFlight = (flight) => {
    setSelectedFlight(flight);
  };

  const handleCloseDrawer = () => setSelectedFlight(null);

  const handleBookFlight = (flight) => {
    if (!searchId) {
      toast.error("Session expired. Please search again.");
      return;
    }
    setSelectedFlight(null);
    const q = new URLSearchParams({
      offerId: flight.offerId || flight.id,
      searchId,
      adults: adults || 1,
      children: children || 0,
      infants: infants || 0,
    });
    navigate(`/booking?${q.toString()}`);
  };

  useEffect(() => {
    if (selectedFlight) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [selectedFlight]);


  const fromCity = getAirportCity(originLocationCode);
  const toCity = getAirportCity(destinationLocationCode);

  return (
    <div className={styles.page}>
      <div className={styles.banner}>
        <div className={styles.bannerContent}>
          <Link to="/" className={styles.breadcrumb}>Home</Link>
          <span className={styles.breadcrumbSep}>/</span>
          <span className={styles.breadcrumbCurrent}>Flight Search</span>
          <h1 className={styles.bannerTitle}>
            <FontAwesomeIcon icon={faPlane} className={styles.bannerIcon} />
            Your flight search
          </h1>
          <p className={styles.bannerSubtitle}>
            Compare options and choose the best flight for your trip.
          </p>
          <div className={styles.searchInBanner}>
            <FlightSearchBar params={searchParamsObj} compact />
          </div>
        </div>
      </div>
      <div className={styles.container}>

        {originLocationCode && destinationLocationCode && departureDate && (
          <div className={styles.summary}>
            <span className={styles.summaryRoute}>
              {fromCity} ({originLocationCode}) → {toCity} ({destinationLocationCode})
            </span>
            <span className={styles.summaryDates}>
              {departureDate}
              {returnDate && ` – ${returnDate}`}
            </span>
            <span className={styles.summaryMeta}>
              {adults} adult{adults > 1 ? "s" : ""}
              {parseInt(children || 0) > 0 && `, ${children} child`}
              {parseInt(infants || 0) > 0 && `, ${infants} infant`}
              {" · "}
              {travelClass?.replace("_", " ")}
              {nonStop && " · Non-stop"}
            </span>
          </div>
        )}

        {loading && (
          <div className={styles.loading}>
            <div className={styles.spinner} />
            <p>Searching for the best flights...</p>
          </div>
        )}

        {error && !loading && (
          <div className={styles.error}>
            <p>{error}</p>
            <span>Try adjusting your search above.</span>
          </div>
        )}

        {!loading && flights.length > 0 && (
          <section className={styles.results}>
            <h2 className={styles.resultsTitle}>
              {flights.length} flight{flights.length !== 1 ? "s" : ""} found
            </h2>
            <div className={styles.cards}>
              {flights.slice(0, visibleCount).map((flight, index) => (
                <FlightCard
                  key={flight.offerId || index}
                  flight={flight}
                  onSelect={handleSelectFlight}
                />
              ))}
            </div>
            {visibleCount < flights.length && (
              <button
                className={styles.loadMore}
                onClick={() => setVisibleCount((prev) => Math.min(prev + 10, flights.length))}
              >
                Show more flights ({flights.length - visibleCount} remaining)
              </button>
            )}
          </section>
        )}

        {!loading && flights.length === 0 && !error && originLocationCode && destinationLocationCode && departureDate && (
          <div className={styles.empty}>
            <p>No flights found for this search.</p>
            <span>Modify your dates or route above to try again.</span>
          </div>
        )}

        {selectedFlight && (
          <FlightDetailsDrawer
            flight={selectedFlight}
            searchId={searchId}
            onClose={handleCloseDrawer}
            onBook={handleBookFlight}
          />
        )}
      </div>
    </div>
  );
}
