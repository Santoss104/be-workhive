import mongoose, { Document, Model, Schema } from "mongoose";
import { IUser } from "./userModel";
import { IProduct } from "./productModel";

export interface IOrder extends Document {
  productId: mongoose.Schema.Types.ObjectId;
  userId: mongoose.Schema.Types.ObjectId; 
  payment_info: {
    paymentMethod: string;
    amountPaid: number;
    paymentDate: Date;
    paymentStatus: string;
    transactionId: string;
  };
  status: string;
  progress?: number;
  deliveryDate?: Date;
  totalAmount: number;
}

const orderSchema = new Schema<IOrder>(
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
    payment_info: {
      paymentMethod: { type: String, required: true },
      amountPaid: { type: Number, required: true },
      paymentDate: { type: Date, required: true },
      paymentStatus: { type: String, required: true },
      transactionId: { type: String, required: true },
    },
    status: {
      type: String,
      enum: ["Pending", "Completed", "Cancelled", "Failed"],
      default: "Pending",
      required: true,
    },
    progress: { type: Number, default: 0 },
    deliveryDate: { type: Date },
    totalAmount: { type: Number, required: true },
  },
  { timestamps: true }
);

const OrderModel: Model<IOrder> = mongoose.model("Order", orderSchema);

export default OrderModel;