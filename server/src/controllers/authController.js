import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import pool from "../db/index.js";
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
export const registerUser = async (req, res) => {
  const { name, email, password, phone } = req.body;
  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ message: " Name, email and password are required" });
  }
  const emailRegex = /\S+@\S+\.\S+/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: "Invalid email format" });
  }
  const { rowCount } = await pool.query(`SELECT id FROM users WHERE email=$1`, [
    email,
  ]);
  if (rowCount > 0) {
    return res.status(409).json({ message: "Email already registered" });
  }
  try {
    const hashedPassword = await bcrypt.hash(password, 12);
    const phoneVal = phone && String(phone).trim() ? String(phone).trim() : null;
    const result = await pool.query(
      `INSERT INTO users (name,email,password,phone) VALUES ($1,$2,$3,$4)`,
      [name, email, hashedPassword, phoneVal],
    );
    const newUser = result.rows[0];
    res
      .status(201)
      .json({ message: "User registered successfully", user: newUser });
  } catch (error) {
    console.error("Registration error:", error);
    // Handle specific PostgreSQL errors
    const code = error?.code;
    if (code === "42P01") {
      return res.status(500).json({
        message: "Database not set up. Please run: psql -d your_db -f server/src/db/init.sql",
      });
    }
    if (code === "23514") {
      return res.status(400).json({ message: "Invalid phone format. Use numbers, spaces, dashes, or leave empty." });
    }
    // In development, return the actual error for debugging
    const msg = process.env.NODE_ENV === "production"
      ? "Server error"
      : (error?.message || "Server error");
    return res.status(500).json({ message: msg });
  }
};
export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }
  try {
    const result = await pool.query(
      `SELECT id,name,email,password FROM users WHERE email=$1`,
      [email],
    );
    if (result.rowCount === 0) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    const user = result.rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: "7d",
    });
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    };
    res.cookie("token", token, cookieOptions);

    res.status(200).json({ message: "Login successful" });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const logoutUser = async (req, res) => {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
  };

  res.clearCookie("token", cookieOptions);
  return res.status(200).json({ message: "Logout successful" });
};

export const getCurrentUser = async (req, res) => {
  return res.status(200).json({
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
    },
  });
};
