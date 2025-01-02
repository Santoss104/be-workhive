import mongoose, { Schema } from "mongoose";
const reviewSchema = new Schema({
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
}, { timestamps: true });
const ReviewModel = mongoose.model("Review", reviewSchema);
export default ReviewModel;
