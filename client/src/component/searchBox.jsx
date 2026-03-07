import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./searchBox.module.css";
import { toast } from "react-toastify";
import airportsData from "../data/airports.json";

const MAX_SUGGESTIONS = 20;

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
      const country = (a.address?.countryName || "").toLowerCase();
      const match =
        code.startsWith(k) ||
        code.includes(k) ||
        name.includes(k) ||
        city.includes(k) ||
        country.includes(k);
      if (match) seen.add(a.iataCode);
      return match;
    })
    .slice(0, MAX_SUGGESTIONS);
}

function AirportInput({
  name,
  placeholder,
  value,
  suggestions,
  isOpen,
  onInputChange,
  onSelect,
  onFocus,
  dropdownRef,
}) {
  const listboxId = `${name}-airport-listbox`;

  return (
    <div className={styles.autoWrapper} ref={dropdownRef}>
      <input
        type="text"
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onInputChange(e.target.value)}
        onFocus={onFocus}
        autoComplete="off"
        role="combobox"
        aria-expanded={isOpen}
        aria-autocomplete="list"
        aria-controls={isOpen ? listboxId : undefined}
      />
      {isOpen && suggestions.length > 0 && (
        <ul className={styles.autoDropdown} role="listbox" id={listboxId}>
          {suggestions.map((airport) => (
            <li
              key={airport.iataCode}
              role="option"
              aria-selected="false"
              tabIndex={0}
              onClick={() => onSelect(airport)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onSelect(airport);
              }}
            >
              <strong>{airport.name}</strong>
              <span>
                {airport.address?.cityName}, {airport.address?.countryName} ({airport.iataCode})
              </span>
            </li>
          ))}
        </ul>
      )}
      {isOpen && suggestions.length === 0 && value.trim().length >= 2 && (
        <div className={styles.noSuggestions}>No airports found</div>
      )}
    </div>
  );
}

const SearchBox = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useState({
    origin: "",
    originLabel: "",
    destination: "",
    destinationLabel: "",
    departureDate: "",
    returnDate: "",
    nonStop: false,
    passengers: { adult: 1, children: 0, infant: 0 },
    travelClass: "ECONOMY",
  });
  const [activeInput, setActiveInput] = useState(null);
  const [typeTrip, setTypeTrip] = useState("roundtrip");
  const [isOpen, setIsOpen] = useState(false);
  const [tempPassengers, setTempPassengers] = useState(searchParams.passengers);
  const [tempClass, setTempClass] = useState(searchParams.travelClass);
  const dropdownRef = useRef(null);
  const originDropdownRef = useRef(null);
  const destDropdownRef = useRef(null);

  const originSuggestions = useMemo(
    () =>
      activeInput === "origin"
        ? searchAirports(searchParams.originLabel)
        : [],
    [activeInput, searchParams.originLabel]
  );

  const destSuggestions = useMemo(
    () =>
      activeInput === "destination"
        ? searchAirports(searchParams.destinationLabel)
        : [],
    [activeInput, searchParams.destinationLabel]
  );

  const handleOriginInput = useCallback((value) => {
    setActiveInput("origin");
    setSearchParams((prev) => ({
      ...prev,
      originLabel: value,
      origin: "",
    }));
  }, []);

  const handleDestInput = useCallback((value) => {
    setActiveInput("destination");
    setSearchParams((prev) => ({
      ...prev,
      destinationLabel: value,
      destination: "",
    }));
  }, []);

  const selectOrigin = useCallback((airport) => {
    setSearchParams((prev) => ({
      ...prev,
      origin: airport.iataCode,
      originLabel: `${airport.address?.cityName || airport.name} (${airport.iataCode})`,
    }));
    setActiveInput(null);
  }, []);

  const selectDestination = useCallback((airport) => {
    setSearchParams((prev) => ({
      ...prev,
      destination: airport.iataCode,
      destinationLabel: `${airport.address?.cityName || airport.name} (${airport.iataCode})`,
    }));
    setActiveInput(null);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        originDropdownRef.current?.contains(e.target) ||
        destDropdownRef.current?.contains(e.target) ||
        dropdownRef.current?.contains(e.target)
      )
        return;
      setIsOpen(false);
      setActiveInput(null);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === "origin" || name === "destination") return;
    setSearchParams((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const totalPassengers =
    tempPassengers.adult + tempPassengers.children + tempPassengers.infant;

  const handleSearch = () => {
    if (!searchParams.origin || !searchParams.destination) {
      toast.error("Please select origin and destination airports from the list");
      return;
    }
    if (!searchParams.departureDate) {
      toast.error("Please select departure date");
      return;
    }
    if (typeTrip === "roundtrip" && !searchParams.returnDate) {
      toast.error("Please select return date for round trip");
      return;
    }
    if (searchParams.passengers.adult < 1) {
      toast.error("At least one adult passenger is required");
      return;
    }

    const queryParams = new URLSearchParams({
      originLocationCode: searchParams.origin,
      destinationLocationCode: searchParams.destination,
      departureDate: searchParams.departureDate,
      adults: searchParams.passengers.adult,
      children: searchParams.passengers.children,
      infants: searchParams.passengers.infant,
      travelClass: searchParams.travelClass,
      nonStop: searchParams.nonStop,
      tripType: typeTrip,
    });
    if (typeTrip === "roundtrip" && searchParams.returnDate) {
      queryParams.append("returnDate", searchParams.returnDate);
    }

    navigate(`/flights?${queryParams.toString()}`);
  };

  return (
    <div className={styles.searchBox}>
      <div className={styles.tripType}>
        <label>
          <input
            type="radio"
            value="oneWay"
            checked={typeTrip === "oneWay"}
            onChange={(e) => setTypeTrip(e.target.value)}
          />
          One Way
        </label>
        <label>
          <input
            type="radio"
            value="roundtrip"
            checked={typeTrip === "roundtrip"}
            onChange={(e) => setTypeTrip(e.target.value)}
          />
          Round Trip
        </label>
        <label>
          <input
            type="radio"
            value="multiCity"
            checked={typeTrip === "multiCity"}
            onChange={(e) => setTypeTrip(e.target.value)}
          />
          Multi City
        </label>
        <label className={styles.checkbox}>
          <input
            type="checkbox"
            name="nonStop"
            checked={searchParams.nonStop}
            onChange={handleInputChange}
          />
          Non Stop
        </label>
      </div>

      <div className={styles.searchFields}>
        <AirportInput
          name="origin"
          placeholder="From (city or airport code)"
          value={searchParams.originLabel}
          suggestions={originSuggestions}
          isOpen={activeInput === "origin"}
          onInputChange={handleOriginInput}
          onSelect={selectOrigin}
          onFocus={() => setActiveInput("origin")}
          dropdownRef={originDropdownRef}
        />

        <AirportInput
          name="destination"
          placeholder="To (city or airport code)"
          value={searchParams.destinationLabel}
          suggestions={destSuggestions}
          isOpen={activeInput === "destination"}
          onInputChange={handleDestInput}
          onSelect={selectDestination}
          onFocus={() => setActiveInput("destination")}
          dropdownRef={destDropdownRef}
        />

        <input
          type="date"
          name="departureDate"
          value={searchParams.departureDate}
          onChange={handleInputChange}
          min={new Date().toISOString().split("T")[0]}
        />

        {typeTrip !== "oneWay" && (
          <input
            type="date"
            name="returnDate"
            value={searchParams.returnDate}
            onChange={handleInputChange}
            min={searchParams.departureDate || new Date().toISOString().split("T")[0]}
          />
        )}

        <div className={styles.passengerWrapper} ref={dropdownRef}>
          <div
            className={styles.passengerInput}
            onClick={() => {
              setTempPassengers(searchParams.passengers);
              setTempClass(searchParams.travelClass);
              setIsOpen(true);
            }}
          >
            {totalPassengers} Passengers · {tempClass}
          </div>

          {isOpen && (
            <div
              className={styles.dropdown}
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
                          [type]: Math.max(0, prev[type] - 1),
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
              <button
                className={styles.confirmBtn}
                onClick={() => {
                  setSearchParams((prev) => ({
                    ...prev,
                    passengers: tempPassengers,
                    travelClass: tempClass,
                  }));
                  setIsOpen(false);
                }}
              >
                Confirm
              </button>
            </div>
          )}
        </div>

        <button className={styles.searchBtn} onClick={handleSearch}>
          Search Flights
        </button>
      </div>
    </div>
  );
};

export default SearchBox;
