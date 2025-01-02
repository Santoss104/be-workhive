import express from "express";
import { createOrder, getAllOrders, getOrderById, updateOrder, deleteOrder, } from "../controllers/orderController";
import { isAutheticated, authorizeRoles } from "../middleware/authMiddleware";
const orderRouter = express.Router();
// Create a new order (only authenticated users can place orders)
orderRouter.post("/create", isAutheticated, createOrder);
// Get all orders (only admin can access all orders)
orderRouter.get("/", isAutheticated, authorizeRoles("admin"), getAllOrders);
// Get a specific order by ID (authenticated users can see their own orders)
orderRouter.get("/:id", isAutheticated, getOrderById);
// Update an order by ID (only admin can update order status)
orderRouter.put("/:id", isAutheticated, authorizeRoles("admin"), updateOrder);
// Delete an order by ID (only admin can delete orders)
orderRouter.delete("/:id", isAutheticated, authorizeRoles("admin"), deleteOrder);
export default orderRouter;
