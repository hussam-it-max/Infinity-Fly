import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import { bookFlight } from "../controllers/booking.js";
import { confirmPrice } from "../controllers/confirmPrice.js";
import { cancelPendingBooking } from "../controllers/canclePendingBook.js";
import { getMyTrips } from "../controllers/myTrips.js";

const bookingRouter = express.Router();
bookingRouter.get("/my-trips", authenticateToken, getMyTrips);
bookingRouter.post("/book", authenticateToken, bookFlight);
bookingRouter.post("/confirm-price", authenticateToken, confirmPrice);
bookingRouter.post("/cancel-pending", authenticateToken, cancelPendingBooking);
export default bookingRouter;
