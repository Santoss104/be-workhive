import express from "express";
import {
  createReview,
  getReviewsByProductId,
} from "../controllers/reviewController";
import { isAutheticated } from "../middleware/authMiddleware";

const reviewRouter = express.Router();

reviewRouter.post("/create", isAutheticated, createReview);
reviewRouter.get("/product/:productId", getReviewsByProductId);

export default reviewRouter;