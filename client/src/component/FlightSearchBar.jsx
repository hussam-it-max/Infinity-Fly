import { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import airportsData from "../data/airports.json";
import { getAirportLabel } from "../utils/flightHelpers";
import styles from "./FlightSearchBar.module.css";

const MAX_SUGGESTIONS = 15;

function searchAirports(keyword) {
  const k = (keyword || "").trim().toLowerCase();
  if (k.length < 2) return [];
  const seen = new Set();
  return airportsData
    .filter((a) => {
      if (!a.iataCode || seen.has(a.iataCode)) return false;
      const code = (a.iataCode || "").toLowerCase();
      const name = (a.name || "").toLowerCase();
      const city = (a.address?.cityName || "").toLowerCase();
      const match = code.includes(k) || name.includes(k) || city.includes(k);
      if (match) seen.add(a.iataCode);
      return match;
    })
    .slice(0, MAX_SUGGESTIONS);
}

function AirportField({ label, value, code, suggestions, isOpen, onInput, onSelect, onFocus, onBlur, fieldRef }) {
  return (
    <div className={styles.field} ref={fieldRef}>
      <label>{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onInput(e.target.value)}
        onFocus={onFocus}
        onBlur={() => setTimeout(onBlur, 200)}
        placeholder="e.g. Amsterdam or AMS"
        autoComplete="off"
      />
      {isOpen && value.trim().length >= 2 && suggestions.length === 0 && (
        <div className={styles.noResults}>No airports found</div>
      )}
      {isOpen && suggestions.length > 0 && (
        <ul className={styles.suggestions}>
          {suggestions.map((a) => (
            <li
              key={a.iataCode}
              onMouseDown={(e) => { e.preventDefault(); onSelect(a); }}
              onClick={() => onSelect(a)}
            >
              {a.address?.cityName} ({a.iataCode})
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function FlightSearchBar({ params = {}, onSearch, compact }) {
  const navigate = useNavigate();
  const [originLabel, setOriginLabel] = useState(params.originLabel ?? (getAirportLabel(params.originLocationCode) || ""));
  const [originCode, setOriginCode] = useState(params.originLocationCode || "");
  const [destLabel, setDestLabel] = useState(params.destLabel ?? (getAirportLabel(params.destinationLocationCode) || ""));
  const [destCode, setDestCode] = useState(params.destinationLocationCode || "");
  const [departureDate, setDepartureDate] = useState(params.departureDate || "");
  const [returnDate, setReturnDate] = useState(params.returnDate || "");
  const [passengers, setPassengers] = useState({
    adult: Number(params.adults) || 1,
    children: Number(params.children) || 0,
    infant: Number(params.infants) || 0,
  });
  const [nonStop, setNonStop] = useState(params.nonStop === "true" || params.nonStop === true);
  const [travelClass, setTravelClass] = useState(params.travelClass || "ECONOMY");
  const [tripType, setTripType] = useState(params.tripType || "roundtrip");
  const [passengerDropdownOpen, setPassengerDropdownOpen] = useState(false);
  const [tempPassengers, setTempPassengers] = useState(passengers);
  const [tempClass, setTempClass] = useState(travelClass);
  const [tempNonStop, setTempNonStop] = useState(nonStop);
  const [activeField, setActiveField] = useState(null);
  const originRef = useRef(null);
  const destRef = useRef(null);
  const passengerRef = useRef(null);

  useEffect(() => {
    setOriginLabel(params.originLabel ?? (getAirportLabel(params.originLocationCode) || ""));
    setOriginCode(params.originLocationCode || "");
    setDestLabel(params.destLabel ?? (getAirportLabel(params.destinationLocationCode) || ""));
    setDestCode(params.destinationLocationCode || "");
    setDepartureDate(params.departureDate || "");
    setReturnDate(params.returnDate || "");
    const p = {
      adult: Number(params.adults) || 1,
      children: Number(params.children) || 0,
      infant: Number(params.infants) || 0,
    };
    setPassengers(p);
    setTempPassengers(p);
    setNonStop(params.nonStop === "true" || params.nonStop === true);
    setTempNonStop(params.nonStop === "true" || params.nonStop === true);
    setTravelClass(params.travelClass || "ECONOMY");
    setTempClass(params.travelClass || "ECONOMY");
    setTripType(params.tripType || "roundtrip");
  }, [params.originLocationCode, params.destinationLocationCode, params.originLabel, params.destLabel, params.departureDate, params.returnDate, params.adults, params.children, params.infants, params.nonStop, params.travelClass, params.tripType]);

  const originSuggestions = useMemo(() => (activeField === "origin" ? searchAirports(originLabel) : []), [activeField, originLabel]);
  const destSuggestions = useMemo(() => (activeField === "dest" ? searchAirports(destLabel) : []), [activeField, destLabel]);

  useEffect(() => {
    const handler = (e) => {
      if (!originRef.current?.contains(e.target) && !destRef.current?.contains(e.target)) setActiveField(null);
      if (!passengerRef.current?.contains(e.target)) setPassengerDropdownOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const totalPassengers = passengers.adult + passengers.children + passengers.infant;
  const classShort = { ECONOMY: "Economy", PREMIUM_ECONOMY: "Premium", BUSINESS: "Business", FIRST: "First" }[travelClass] || travelClass;
  const parts = [`${totalPassengers} pax`, classShort];
  if (nonStop) parts.push("Direct");
  const passengerDisplay = parts.join(" · ");

  const handleSearch = () => {
    const from = originCode || (originSuggestions[0]?.iataCode);
    const to = destCode || (destSuggestions[0]?.iataCode);
    if (!from || !to) {
      toast.error("Please select origin and destination");
      return;
    }
    if (!departureDate) {
      toast.error("Please select departure date");
      return;
    }
    if (tripType === "roundtrip" && !returnDate) {
      toast.error("Please select return date");
      return;
    }
    const q = new URLSearchParams({
      originLocationCode: from,
      destinationLocationCode: to,
      departureDate,
      adults: String(passengers.adult),
      children: String(passengers.children),
      infants: String(passengers.infant),
      travelClass,
      nonStop: String(nonStop),
      tripType,
    });
    if (tripType === "roundtrip" && returnDate) q.set("returnDate", returnDate);
    navigate(`/flights?${q.toString()}`);
    onSearch?.();
  };

  return (
    <div className={`${styles.bar} ${compact ? styles.compact : ""}`}>
      <div className={styles.row}>
        <div className={styles.tripType}>
          {["oneWay", "roundtrip"].map((t) => (
            <label key={t}>
              <input
                type="radio"
                name="trip"
                checked={tripType === t}
                onChange={() => setTripType(t)}
              />
              {t === "roundtrip" ? "Round trip" : "One way"}
            </label>
          ))}
        </div>
      </div>
      <div className={styles.row}>
        <AirportField
          label="From"
          value={originLabel}
          code={originCode}
          suggestions={originSuggestions}
          isOpen={activeField === "origin"}
          onInput={(v) => { setOriginLabel(v); setOriginCode(""); }}
          onSelect={(a) => {
            setOriginLabel(`${a.address?.cityName} (${a.iataCode})`);
            setOriginCode(a.iataCode);
            setActiveField(null);
          }}
          onFocus={() => setActiveField("origin")}
          onBlur={() => setActiveField(null)}
          fieldRef={originRef}
        />
        <AirportField
          label="To"
          value={destLabel}
          code={destCode}
          suggestions={destSuggestions}
          isOpen={activeField === "dest"}
          onInput={(v) => { setDestLabel(v); setDestCode(""); }}
          onSelect={(a) => {
            setDestLabel(`${a.address?.cityName} (${a.iataCode})`);
            setDestCode(a.iataCode);
            setActiveField(null);
          }}
          onFocus={() => setActiveField("dest")}
          onBlur={() => setActiveField(null)}
          fieldRef={destRef}
        />
        <div className={styles.field}>
          <label>Departure</label>
          <input
            type="date"
            value={departureDate}
            onChange={(e) => setDepartureDate(e.target.value)}
            min={new Date().toISOString().split("T")[0]}
          />
        </div>
        {tripType === "roundtrip" && (
          <div className={styles.field}>
            <label>Return</label>
            <input
              type="date"
              value={returnDate}
              onChange={(e) => setReturnDate(e.target.value)}
              min={departureDate || new Date().toISOString().split("T")[0]}
            />
          </div>
        )}
        <div className={`${styles.field} ${passengerDropdownOpen ? styles.passengerDropdownOpen : ""}`} ref={passengerRef}>
          <label>Passengers · Class</label>
          <div
            className={styles.passengerInput}
            onClick={() => {
              setTempPassengers(passengers);
              setTempClass(travelClass);
              setTempNonStop(nonStop);
              setPassengerDropdownOpen(true);
            }}
          >
            {passengerDisplay}
          </div>
          {passengerDropdownOpen && (
            <div
              className={styles.passengerDropdown}
              onClick={(e) => e.stopPropagation()}
            >
              <h4>Passengers</h4>
              {["adult", "children", "infant"].map((type) => (
                <div key={type} className={styles.counterRow}>
                  <span>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                  <div>
                    <button
                      type="button"
                      onClick={() =>
                        setTempPassengers((prev) => ({
                          ...prev,
                          [type]: type === "adult" ? Math.max(1, prev[type] - 1) : Math.max(0, prev[type] - 1),
                        }))
                      }
                    >
                      -
                    </button>
                    <span>{tempPassengers[type]}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setTempPassengers((prev) => ({
                          ...prev,
                          [type]: prev[type] + 1,
                        }))
                      }
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
              <hr />
              <h4>Class</h4>
              <select
                className={styles.classSelect}
                value={tempClass}
                onChange={(e) => setTempClass(e.target.value)}
              >
                <option value="ECONOMY">Economy</option>
                <option value="PREMIUM_ECONOMY">Premium Economy</option>
                <option value="BUSINESS">Business</option>
                <option value="FIRST">First</option>
              </select>
              <div className={styles.checkboxRow}>
                <label>
                  <input
                    type="checkbox"
                    checked={tempNonStop}
                    onChange={(e) => setTempNonStop(e.target.checked)}
                  />
                  Non-stop only
                </label>
              </div>
              <button
                type="button"
                className={styles.confirmBtn}
                onClick={() => {
                  setPassengers(tempPassengers);
                  setTravelClass(tempClass);
                  setNonStop(tempNonStop);
                  setPassengerDropdownOpen(false);
                }}
              >
                Confirm
              </button>
            </div>
          )}
        </div>
        <button className={styles.searchBtn} onClick={handleSearch}>Search</button>
      </div>
    </div>
  );
}
