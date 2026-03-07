import pool from "./src/db/index.js";

(async () => {
  try {
    const res = await pool.query("SELECT NOW()");
    console.log("Database Time:", res.rows[0]);
    process.exit(0);
  } catch (err) {
    console.error("Database connection error:", err);
    process.exit(1);
  }
})();
