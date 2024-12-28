import { Request, Response, NextFunction } from "express";
import ReviewModel, { IReview } from "../models/reviewModel";
import  ErrorHandler  from "../utils/errorHandler";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";

// Create Review
export const createReview = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { productId, userId, rating, comment } = req.body;

      const newReview = await ReviewModel.create({
        productId,
        userId,
        rating,
        comment,
      });

      res.status(201).json({
        success: true,
        review: newReview,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// Get Reviews By Product ID
export const getReviewsByProductId = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const reviews = await ReviewModel.find({
        productId: req.params.productId,
      });

      res.status(200).json({
        success: true,
        reviews,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);
