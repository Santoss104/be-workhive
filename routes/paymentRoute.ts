import express from "express";
import {
  createPayment,
  getPaymentByOrderId,
} from "../controllers/paymentController";
import { isAutheticated } from "../middleware/authMiddleware";

const paymentRouter = express.Router();

// Create a payment (only authenticated users can create payments)
paymentRouter.post("/create", isAutheticated, createPayment);

// Get payment by order ID (only authenticated users can view their payment details)
paymentRouter.get("/order/:orderId", isAutheticated, getPaymentByOrderId);

export default paymentRouter;
