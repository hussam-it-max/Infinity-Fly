import express from "express";
import cors from "cors";
import authRouter from "./routes/authRoutes.js";
import searchFlightsRouter from "./routes/searchFlightsRoutes.js";
import bookingRouter from "./routes/bookingRoutes.js";
import revalidateRouter from "./routes/revalidateRoute.js";
import cookieParser from "cookie-parser";
import fetchAirportRouter from "./routes/fetchAirportRoutes.js";
const app = express();
// Middleware - allow credentials for cookies (login/register)
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use("/api/auth", authRouter);
app.use("/api/airports", fetchAirportRouter);
app.use("/api/flights", searchFlightsRouter);
app.use("/api/booking", bookingRouter);
app.use("/api/revalidate", revalidateRouter);
// test route

export default app;
