/**
 * Run this script to create booking-related tables if they don't exist.
 * Usage: node server/src/db/setupBooking.js (from project root)
 * Or: npm run setup-booking (from server folder)
 */
import "dotenv/config";
import pool from "./index.js";

const SQL = `
-- Create enum types if not exist
DO $$ BEGIN
  CREATE TYPE booking_status AS ENUM ('PENDING','PAYMENT_PENDING','PAID','CONFIRMED','FAILED');
EXCEPTION WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN
  ALTER TYPE booking_status ADD VALUE 'EXPIRED';
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE passenger_type AS ENUM ('ADULT','CHILD','INFANT');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE ticket_status AS ENUM ('ISSUED','CANCELLED','REFUNDED');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('PENDING','SUCCESS','FAILED');
EXCEPTION WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN
  ALTER TYPE payment_status ADD VALUE 'REFUNDED';
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_method AS ENUM ('CREDIT_CARD','DEBIT_CARD','PAYPAL','BANK_TRANSFER');
EXCEPTION WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN
  ALTER TYPE payment_method ADD VALUE 'UNKNOWN';
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id SERIAL PRIMARY KEY,
  pnr VARCHAR(20) UNIQUE NOT NULL,
  expiration TIMESTAMP NOT NULL,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  total_price NUMERIC(10,2) NOT NULL,
  currency VARCHAR(3) NOT NULL,
  status booking_status DEFAULT 'PENDING',
  amadeus_offer_id VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Flight snapshots
CREATE TABLE IF NOT EXISTS flight_snapshots (
  id SERIAL PRIMARY KEY,
  booking_id INT REFERENCES bookings(id) ON DELETE CASCADE,
  snapshot JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Itineraries
CREATE TABLE IF NOT EXISTS itineraries (
  id SERIAL PRIMARY KEY,
  booking_id INT REFERENCES bookings(id) ON DELETE CASCADE,
  type VARCHAR(30) NOT NULL,
  origin VARCHAR(10) NOT NULL,
  destination VARCHAR(10) NOT NULL,
  duration INTERVAL NOT NULL,
  stops INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Segments
CREATE TABLE IF NOT EXISTS segments (
  id SERIAL PRIMARY KEY,
  itinerary_id INT REFERENCES itineraries(id) ON DELETE CASCADE,
  departure_airport CHAR(3) NOT NULL,
  arrival_airport CHAR(3) NOT NULL,
  departure_time TIMESTAMP NOT NULL,
  arrival_time TIMESTAMP NOT NULL,
  airline_code CHAR(2) NOT NULL,
  flight_number VARCHAR(10) NOT NULL,
  aircraft VARCHAR(20),
  duration INTERVAL NOT NULL,
  segment_order INT NOT NULL
);

-- Passengers
CREATE TABLE IF NOT EXISTS passengers (
  id SERIAL PRIMARY KEY,
  booking_id INT REFERENCES bookings(id) ON DELETE CASCADE,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  type_passenger passenger_type NOT NULL,
  date_of_birth DATE NOT NULL,
  nationality CHAR(3)
);

-- Keep existing databases aligned with current schema
ALTER TABLE passengers
  DROP COLUMN IF EXISTS passport_number;

-- Tickets
CREATE TABLE IF NOT EXISTS tickets (
  id SERIAL PRIMARY KEY,
  booking_id INT REFERENCES bookings(id) ON DELETE CASCADE,
  passenger_id INT REFERENCES passengers(id) ON DELETE CASCADE,
  segment_id INT REFERENCES segments(id) ON DELETE CASCADE,
  status ticket_status NOT NULL DEFAULT 'ISSUED',
  ticket_number VARCHAR(20) UNIQUE NOT NULL,
  seat_number VARCHAR(5),
  fare_class VARCHAR(5)
);

-- Payments
CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  booking_id INT REFERENCES bookings(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  currency CHAR(3) NOT NULL,
  status payment_status DEFAULT 'PENDING',
  method payment_method NOT NULL,
  transaction_id VARCHAR(100),
  paid_at TIMESTAMP
);
`;

async function setup() {
  try {
    await pool.query(SQL);
    console.log("Booking tables ready.");
  } catch (err) {
    console.error("Setup failed:", err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

setup();
