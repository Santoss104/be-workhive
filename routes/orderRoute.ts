import express from "express";
import {
  createOrder,
  getAllOrders,
  getUserOrders,
  getOrderById,
  updateOrder,
  deleteOrder,
  updateOrderStatus,
  updateOrderProgress,
} from "../controllers/orderController";
import { isAutheticated, authorizeRoles } from "../middleware/authMiddleware";

const orderRouter = express.Router();

orderRouter.post("/create", isAutheticated, createOrder);
orderRouter.get("/all", isAutheticated, authorizeRoles("admin"), getAllOrders);
orderRouter.get("/user", isAutheticated, getUserOrders);
orderRouter.get("/:id", isAutheticated, getOrderById);
orderRouter.put("/:id", isAutheticated, updateOrder);
orderRouter.delete(
  "/:id",
  isAutheticated,
  authorizeRoles("admin"),
  deleteOrder
);
orderRouter.put("/:id/status", isAutheticated, updateOrderStatus);
orderRouter.put("/:id/progress", isAutheticated, authorizeRoles("seller"), updateOrderProgress);

export default orderRouter;