import mongoose, { Document, Model, Schema } from "mongoose";
import { IUser } from "./userModel";

// Interface untuk Ulasan
interface IReview extends Document {
  user: mongoose.Schema.Types.ObjectId;
  rating: number;
  comment: string;
  date: Date;
}

// Interface untuk Produk
export interface IProduct extends Document {
  name: string;
  description: string;
  category: string;
  image: {
    public_id: string;
    url: string;
  };
  price: number;
  thumbnail: { public_id: string; url: string };
  tags: string[];
  type: "service" | "product";
  specifications?: string[];
  reviews: IReview[];
  purchased: number;
  rating?: number;
  available: boolean;
  seller: mongoose.Schema.Types.ObjectId;
}

const reviewSchema = new Schema<IReview>(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    rating: { type: Number, required: true },
    comment: { type: String },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const productSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    image: {
      public_id: String,
      url: String,
    },
    price: { type: Number, required: true },
    thumbnail: {
      public_id: { type: String },
      url: { type: String },
    },
    tags: { type: [String], required: true },
    type: { type: String, enum: ["service", "product"], required: true },
    specifications: [String],
    reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: "Review" }],
    purchased: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
    available: { type: Boolean, default: true },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// Metode untuk menghitung rating produk
productSchema.methods.calculateRating = function (): void {
  if (this.reviews.length === 0) return;

  const totalRating = this.reviews.reduce(
    (acc: number, review: IReview) => acc + review.rating,
    0
  );
  this.rating = totalRating / this.reviews.length;
  this.save();
};

// Middleware untuk memastikan bahwa hanya seller yang bisa menambahkan produk
productSchema.pre("save", async function (next) {
  // Populate seller untuk mengakses role
  const seller = await mongoose
    .model("User")
    .findById(this.seller)
    .select("role");

  if (seller?.role !== "seller") {
    throw new Error("Only sellers can add products.");
  }

  next();
});

const ProductModel: Model<IProduct> = mongoose.model("Product", productSchema);

export default ProductModel;