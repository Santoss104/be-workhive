import dotenv from "dotenv";
import mongoose, { Document, Model, Schema } from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

dotenv.config();

const emailRegexPattern: RegExp = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  avatar: {
    public_id: string;
    url: string;
  };
  role: "user" | "seller" | "admin";
  isVerified: boolean;
  orders: Array<{
    orderId: mongoose.Schema.Types.ObjectId;
    productId: mongoose.Schema.Types.ObjectId;
    packageType: "complete" | "basic" | "prototype";
    status: "Pending" | "Processing" | "Completed" | "Cancelled" | "Failed";
    totalPrice: number;
    progress: number;
    orderDate: Date;
  }>;
  notifications?: mongoose.Schema.Types.ObjectId[];
  comparePassword: (password: string) => Promise<boolean>;
  SignAccessToken: () => string;
  SignRefreshToken: () => string;
  upgradeToSeller: () => Promise<void>;
  isSeller: () => boolean;
}

const userSchema: Schema<IUser> = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please enter your name"],
    },
    email: {
      type: String,
      required: [true, "Please enter your email"],
      validate: {
        validator: function (value: string) {
          return emailRegexPattern.test(value);
        },
        message: "please enter a valid email",
      },
      unique: true,
    },
    password: {
      type: String,
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },
    avatar: {
      public_id: String,
      url: String,
    },
    role: {
      type: String,
      enum: ["user", "seller", "admin"],
      default: "user",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    orders: [
      {
        orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        packageType: {
          type: String,
          enum: ["complete", "basic", "prototype"],
          required: true,
        },
        status: {
          type: String,
          enum: ["Pending", "Processing", "Completed", "Cancelled", "Failed"],
          default: "Pending",
        },
        totalPrice: { type: Number, required: true },
        progress: { type: Number, default: 0 },
        orderDate: { type: Date, default: Date.now },
      },
    ],
    notifications: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Notification" },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1 });
userSchema.index({ "orders.status": 1 });

userSchema.virtual("activeOrders", {
  ref: "Order",
  localField: "_id",
  foreignField: "userId",
  match: { status: { $in: ["Pending", "Processing"] } },
});

userSchema.virtual("reviews", {
  ref: "Review",
  localField: "_id",
  foreignField: "userId",
});

userSchema.virtual("products", {
  ref: "Product",
  localField: "_id",
  foreignField: "seller",
  match: function () {
    return this.role === "seller" ? {} : { _id: null };
  },
});

userSchema.virtual("userNotifications", {
  ref: "Notification",
  localField: "_id",
  foreignField: "userId",
});

userSchema.pre<IUser>("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.SignAccessToken = function () {
  return jwt.sign({ id: this._id }, process.env.ACCESS_TOKEN || "", {
    expiresIn: "5m",
  });
};

userSchema.methods.SignRefreshToken = function () {
  return jwt.sign({ id: this._id }, process.env.REFRESH_TOKEN || "", {
    expiresIn: "3d",
  });
};

userSchema.methods.comparePassword = async function (
  enteredPassword: string
): Promise<boolean> {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.upgradeToSeller = async function (): Promise<void> {
  if (this.role === "seller") {
    throw new Error("User is already a seller");
  }

  this.role = "seller";
  await this.save();
};

userSchema.methods.isSeller = function (): boolean {
  return this.role === "seller";
};

userSchema.pre("save", async function (next) {
  if (this.isModified("role") && this.role === "seller") {
  }
  next();
});

const UserModel: Model<IUser> = mongoose.model("User", userSchema);

export default UserModel;