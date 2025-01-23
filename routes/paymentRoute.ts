import express from "express";
import {
  createPayment,
  getPaymentByOrderId,
  getAllPayments,
  getUserPayments,
  updatePaymentStatus,
  deletePayment,
} from "../controllers/paymentController";
import { isAutheticated, authorizeRoles } from "../middleware/authMiddleware";

const paymentRouter = express.Router();

paymentRouter.get("/order/:orderId", getPaymentByOrderId);
paymentRouter.post("/create", isAutheticated, createPayment);
paymentRouter.get("/user", isAutheticated, getUserPayments);
paymentRouter.get(
  "/all",
  isAutheticated,
  authorizeRoles("admin"),
  getAllPayments
);
paymentRouter.patch(
  "/:id/status",
  isAutheticated,
  authorizeRoles("admin"),
  updatePaymentStatus
);
paymentRouter.delete(
  "/:id",
  isAutheticated,
  authorizeRoles("admin"),
  deletePayment
);

export default paymentRouter;