import mongoose, { Document, Model, Schema } from "mongoose";

export interface IReview extends Document {
  productId: mongoose.Schema.Types.ObjectId;
  userId: mongoose.Schema.Types.ObjectId;
  orderId: mongoose.Schema.Types.ObjectId;
  rating: number;
  comment: string;
  reviewDate: Date;
}

const reviewSchema: Schema<IReview> = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product is required"],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: [true, "Order is required"],
    },
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot exceed 5"],
    },
    comment: {
      type: String,
      required: [true, "Review comment is required"],
    },
    reviewDate: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

reviewSchema.index({ productId: 1, userId: 1 }, { unique: true });

reviewSchema.pre("save", async function (next) {
  if (this.isNew) {
    const order = await mongoose.model("Order").findOne({
      _id: this.orderId,
      userId: this.userId,
      productId: this.productId,
      status: "Completed",
    });

    if (!order) {
      throw new Error("You can only review products from completed orders");
    }
  }
  next();
});

reviewSchema.post("save", async function () {
  const product = await mongoose.model("Product").findById(this.productId);
  if (product) {
    await product.calculateRating();
  }
});

const ReviewModel: Model<IReview> = mongoose.model("Review", reviewSchema);

export default ReviewModel;