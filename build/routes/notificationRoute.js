import express from "express";
import { createNotification, getNotificationsByUserId, } from "../controllers/notificationController";
import { isAutheticated } from "../middleware/authMiddleware";
const notificationRouter = express.Router();
// Create a new notification (only admins can create notifications)
notificationRouter.post("/create", isAutheticated, createNotification);
// Get notifications for a user (only authenticated users can view their notifications)
notificationRouter.get("/user/:userId", isAutheticated, getNotificationsByUserId);
export default notificationRouter;
