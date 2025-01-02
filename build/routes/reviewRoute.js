import express from "express";
import { createReview, getReviewsByProductId, } from "../controllers/reviewController";
import { isAutheticated } from "../middleware/authMiddleware";
const reviewRouter = express.Router();
// Create a new review (only authenticated users can leave reviews)
reviewRouter.post("/create", isAutheticated, createReview);
// Get reviews for a product (anyone can view reviews)
reviewRouter.get("/product/:productId", getReviewsByProductId);
export default reviewRouter;
