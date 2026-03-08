# Infinity Fly

Infinity Fly is a full-stack flight booking platform designed to deliver a realistic booking experience from flight search to reservation management.

It combines a modern responsive frontend with a backend that handles real airline offer validation, booking persistence, session-based authentication, and trip tracking.

---

## Why this project

Infinity Fly is built to simulate a production-style travel workflow:

- Search flights by route/date/passengers/class
- Validate selected offers before booking
- Handle airline price changes safely
- Create and store booking details (PNR, itineraries, segments, passengers)
- Let users access their trips from a personal dashboard

---

## Core Features

### 1) Flight Search
- Search using:
  - Origin and destination airport
  - Departure/return dates
  - Passenger counts (adult/child/infant)
  - Cabin class
  - Non-stop filter
- Search responses are cached in Redis for faster repeated queries.

### 2) Fare Selection
- Users choose between fare packages (Light / Inclusif / Inclusif Plus style UX).
- Booking flow continues with selected offer context.

### 3) Offer Revalidation
Before booking, the backend revalidates selected flight offers to reduce stale-price issues.

### 4) Booking Flow
Users submit:
- Contact details
- Passenger details

Backend creates reservation through airline provider and stores booking data in PostgreSQL:
- Booking record
- Flight snapshot
- Itineraries
- Segments
- Passengers

### 5) Price Change Handling (Validation Safety)
If airline price changes between selection and booking:
- Backend does **not** silently book at a new price.
- It returns a conflict response with old/new price.
- User must explicitly confirm the new price.
- Pending order is temporarily cached with expiration window.

This prevents hidden price mismatch at checkout.

### 6) Authentication
- Register / Login / Logout
