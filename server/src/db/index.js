import { Pool } from "pg";
import dotenv from "dotenv";
dotenv.config();
const connectionString = process.env.DATABASE_URL;

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
});
pool.on("connect", () => {
  console.log("Connected to the database");
});
export default pool;
