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
  transactions: Array<{
    productId: mongoose.Schema.Types.ObjectId;
    amount: number;
    status: "pending" | "completed" | "cancelled";
    date: Date;
    paymentMethod: string;
  }>;
  orders: Array<{
    orderId: mongoose.Schema.Types.ObjectId;
    productId: mongoose.Schema.Types.ObjectId;
    quantity: number;
    status: "pending" | "completed" | "cancelled";
    totalPrice: number;
    orderDate: Date;
  }>;
  tasks: Array<{
    taskId: mongoose.Schema.Types.ObjectId;
    description: string;
    status: string;
  }>;
  comparePassword: (password: string) => Promise<boolean>;
  generateOTP: () => string;
  SignAccessToken: () => string;
  SignRefreshToken: () => string;
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
    transactions: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        amount: Number,
        status: {
          type: String,
          enum: ["pending", "completed", "cancelled"],
          default: "pending",
        },
        date: { type: Date, default: Date.now },
        paymentMethod: { type: String, required: true },
      },
    ],
    orders: [
      {
        orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        quantity: { type: Number, required: true },
        status: {
          type: String,
          enum: ["pending", "completed", "cancelled"],
          default: "pending",
        },
        totalPrice: { type: Number, required: true },
        orderDate: { type: Date, default: Date.now },
      },
    ],
    tasks: [
      {
        taskId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
        description: String,
        status: String,
      },
    ],
  },
  { timestamps: true }
);

// Hash Password before saving
userSchema.pre<IUser>("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// sign access token
userSchema.methods.SignAccessToken = function () {
  return jwt.sign({ id: this._id }, process.env.ACCESS_TOKEN || '', {
    expiresIn: "5m",
  });
};

// sign refresh token
userSchema.methods.SignRefreshToken = function () {
  return jwt.sign({ id: this._id }, process.env.REFRESH_TOKEN || '', {
    expiresIn: "3d",
  });
};

// compare password
userSchema.methods.comparePassword = async function (
  enteredPassword: string
): Promise<boolean> {
  return await bcrypt.compare(enteredPassword, this.password);
};

const userModel: Model<IUser> = mongoose.model("User", userSchema);

export default userModel;