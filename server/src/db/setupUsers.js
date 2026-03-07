/**
 * Run this script to create the users table if it doesn't exist.
 * Usage: node server/src/db/setupUsers.js
 * Make sure DATABASE_URL is set in .env
 */
import "dotenv/config";
import pool from "./index.js";

const CREATE_USERS = `
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(15) CHECK (phone IS NULL OR phone ~ '^\\+?[0-9\\s\\-\\(\\)]+$'),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

async function setup() {
  try {
    await pool.query(CREATE_USERS);
    // Fix phone constraint if old schema rejected NULL
    try {
      await pool.query("ALTER TABLE users DROP CONSTRAINT IF EXISTS users_phone_check");
      await pool.query(`ALTER TABLE users ADD CONSTRAINT users_phone_check
        CHECK (phone IS NULL OR phone ~ '^\\+?[0-9\\s\\-\\(\\)]+$')`);
    } catch (_) { /* constraint may have different name, ignore */ }
    console.log("Users table ready.");
  } catch (err) {
    console.error("Setup failed:", err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

setup();
