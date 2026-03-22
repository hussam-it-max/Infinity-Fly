CREATE TABLE IF NOT EXISTS users(
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(15) CHECK (phone IS NULL OR phone ~ '^\+?[0-9\s\-\(\)]+$'),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TYPE booking_status AS ENUM ('PENDING','PAYMENT_PENDING','PAID','CONFIRMED','FAILED');
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
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
);
CREATE TABLE IF NOT EXISTS itineraries(
    id SERIAL PRIMARY KEY,
    booking_id INT REFERENCES bookings(id) ON DELETE CASCADE,
    type VARCHAR(30) NOT NULL,
    origin VARCHAR(10) NOT NULL,
    destination VARCHAR(10) NOT NULL,
    duration INTERVAL NOT NULL,
    stops INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS segments(
    id SERIAL PRIMARY KEY,
    itinerary_id INT REFERENCES itineraries(id) ON DELETE CASCADE,
    departure_airport char(3) NOT NULL,
    arrival_airport CHAR(3) NOT NULL,
    departure_time TIMESTAMP NOT NULL,
    arrival_time TIMESTAMP NOT NULL,
    airline_code CHAR(2) NOT NULL,
    flight_number VARCHAR(10) NOT NULL,
    aircraft VARCHAR(20),
    duration INTERVAL NOT NULL,
    segment_order INT NOT NULL,
);
CREATE TYPE passenger_type AS ENUM ('ADULT','CHILD','INFANT');
CREATE TABLE IF NOT EXISTS passengers(
    id SERIAL PRIMARY KEY,
    booking_id INT REFERENCES bookings(id) ON DELETE CASCADE,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    type_passenger passenger_type NOT NULL,
    date_of_birth DATE NOT NULL,
    nationality CHAR(3),
);
CREATE TYPE payment_status AS ENUM ('PENDING','SUCCESS','FAILED');
ALTER TYPE payment_status ADD VALUE 'REFUNDED';
CREATE TYPE payment_method AS ENUM ('CREDIT_CARD','DEBIT_CARD','PAYPAL','BANK_TRANSFER');
ALTER TYPE payment_method ADD VALUE 'UNKNOWN';
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
CREATE TYPE ticket_status AS ENUM ('ISSUED','CANCELLED','REFUNDED');
CREATE TABLE IF NOT EXISTS tickets(
    id SERIAL PRIMARY KEY,
    booking_id INT REFERENCES bookings(id) ON DELETE CASCADE,
    passenger_id INT REFERENCES passengers(id) ON DELETE CASCADE,
    segment_id INT REFERENCES segments(id) ON DELETE CASCADE,
    status ticket_status NOT NULL  DEFAULT 'ISSUED',
    ticket_number VARCHAR(20) UNIQUE NOT NULL,
    seat_number VARCHAR(5),
    fare_class VARCHAR(5),
);
CREATE TABLE IF NOT EXISTS flight_snapshots(
    id SERIAL PRIMARY KEY,
    booking_id INT REFERENCES bookings(id) ON DELETE CASCADE,
    snapshot JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);





