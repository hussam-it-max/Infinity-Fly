import jwt from "jsonwebtoken";
import pool from "../db/index.js";
import dotenv from "dotenv";
dotenv.config();
export const authenticateToken = async (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ message: "invalid credentials" });
  }
  try {
    const decode = jwt.verify(token, process.env.JWT_SECRET);
    const result = await pool.query(
      `SELECT id,name,email FROM users WHERE id=$1`,
      [decode.id],
    );
    if (result.rowCount === 0) {
      return res.status(401).json({ message: "invalid credentials" });
    }
    req.user = result.rows[0];
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(401).json({ message: "invalid credentials" });
  }
};
