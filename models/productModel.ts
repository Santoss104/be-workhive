import mongoose, { Document, Model, Schema, HydratedDocument } from "mongoose";
import ReviewModel from "./reviewModel";

const priceRegexPattern: RegExp = /^\d{1,12}(\.\d{1,2})?$/;

export interface IProduct extends Document {
  name: string;
  description: string;
  category: mongoose.Schema.Types.ObjectId;
  price: {
    complete_fiture: number;
    basic_fiture: number;
    prototype_fiture: number;
  };
  image: {
    public_id: string;
    url: string;
  };
  thumbnail: {
    public_id: string;
    url: string;
  };
  tags: string[];
  specifications?: string[];
  purchased: number;
  rating?: number;
  available: boolean;
  seller: mongoose.Schema.Types.ObjectId;
  calculateRating: () => Promise<void>;
  incrementPurchased: () => Promise<void>;
  toggleAvailability: () => Promise<void>;
}

const productSchema: Schema<IProduct> = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please enter product name"],
    },
    description: {
      type: String,
      required: [true, "Please enter product description"],
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Please select a category"],
    },
    price: {
      complete_fiture: {
        type: Number,
        required: [true, "Please enter complete package price"],
        validate: {
          validator: function (value: number) {
            return priceRegexPattern.test(value.toString());
          },
          message:
            "Please enter a valid price (up to 12 digits and 2 decimal places)",
        },
      },
      basic_fiture: {
        type: Number,
        required: [true, "Please enter basic package price"],
        validate: {
          validator: function (value: number) {
            return priceRegexPattern.test(value.toString());
          },
          message:
            "Please enter a valid price (up to 12 digits and 2 decimal places)",
        },
      },
      prototype_fiture: {
        type: Number,
        required: [true, "Please enter prototype package price"],
        validate: {
          validator: function (value: number) {
            return priceRegexPattern.test(value.toString());
          },
          message:
            "Please enter a valid price (up to 12 digits and 2 decimal places)",
        },
      },
    },
    image: {
      public_id: String,
      url: String,
    },
    thumbnail: {
      public_id: String,
      url: String,
    },
    tags: {
      type: [String],
      required: [true, "Please enter at least one tag"],
    },
    specifications: [String],
    purchased: {
      type: Number,
      default: 0,
    },
    rating: {
      type: Number,
      default: 0,
    },
    available: {
      type: Boolean,
      default: true,
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

productSchema.index({ category: 1, tags: 1 });
productSchema.index({ seller: 1 });
productSchema.index({ name: "text", description: "text" });
productSchema.index({ available: 1 });

productSchema.virtual("reviews", {
  ref: "Review",
  localField: "_id",
  foreignField: "productId",
});

productSchema.virtual("sellerInfo", {
  ref: "User",
  localField: "seller",
  foreignField: "_id",
  justOne: true,
});

productSchema.methods.calculateRating = async function (): Promise<void> {
  const reviews = await ReviewModel.find({ productId: this._id });

  if (reviews.length === 0) {
    this.rating = 0;
    return;
  }

  const totalRating = reviews.reduce((acc, review) => acc + review.rating, 0);
  this.rating = Number((totalRating / reviews.length).toFixed(1));
  await this.save();
};

productSchema.methods.incrementPurchased = async function (): Promise<void> {
  this.purchased += 1;
  await this.save();
};

productSchema.methods.toggleAvailability = async function (): Promise<void> {
  this.available = !this.available;
  await this.save();
};

productSchema.pre("save", async function (next) {
  if (this.isNew) {
    const seller = await mongoose
      .model("User")
      .findById(this.seller)
      .select("role");
    if (seller?.role !== "seller") {
      throw new Error("Only sellers can add products");
    }
  }
  next();
});

productSchema.pre(
  "deleteOne",
  { document: true, query: false },
  async function (this: HydratedDocument<IProduct>) {
    await ReviewModel.deleteMany({ productId: this._id });
    await mongoose.model("Order").deleteMany({ productId: this._id });
    await mongoose.model("Notification").deleteMany({
      relatedId: this._id,
      type: "product",
    });
  }
);

const ProductModel: Model<IProduct> = mongoose.model("Product", productSchema);

export default ProductModel;