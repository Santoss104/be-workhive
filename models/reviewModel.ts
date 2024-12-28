import mongoose, { Document, Model, Schema } from "mongoose";
import { IUser } from "./userModel";
import { IProduct } from "./productModel";

export interface IReview extends Document {
  productId: mongoose.Schema.Types.ObjectId;
  userId: mongoose.Schema.Types.ObjectId;
  rating: number;
  comment: string;
  reviewDate: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
    reviewDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const ReviewModel: Model<IReview> = mongoose.model("Review", reviewSchema);

export default ReviewModel;
