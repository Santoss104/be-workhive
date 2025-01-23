import express from "express";
import {
  createNotification,
  getNotificationsByUserId,
} from "../controllers/notificationController";
import { isAutheticated } from "../middleware/authMiddleware";

const notificationRouter = express.Router();

notificationRouter.post("/create", isAutheticated, createNotification);
notificationRouter.get(
  "/user/:userId",
  isAutheticated,
  getNotificationsByUserId
);

export default notificationRouter;
