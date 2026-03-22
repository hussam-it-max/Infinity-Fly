import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import { createPaymentIntent, confirmPayment } from "../controllers/paymentController.js";

const paymentRouter = express.Router();

// Keep legacy typo route for compatibility with old frontend links.
paymentRouter.post("/creat-payment-intent", authenticateToken, createPaymentIntent);
paymentRouter.post("/create-payment-intent", authenticateToken, createPaymentIntent);
paymentRouter.post("/confirm-payment", authenticateToken, confirmPayment);

export default paymentRouter;