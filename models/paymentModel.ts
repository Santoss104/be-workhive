import mongoose, { Document, Model, Schema } from "mongoose";
import { IOrder } from "./orderModel";

export interface IPayment extends Document {
  orderId: mongoose.Schema.Types.ObjectId;
  paymentMethod: string;
  amountPaid: number;
  paymentDate: Date;
  paymentStatus: string;
  transactionId: string;
}

const paymentSchema = new Schema<IPayment>(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    paymentMethod: { type: String, required: true },
    amountPaid: { type: Number, required: true },
    paymentDate: { type: Date, required: true },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Completed", "Failed"],
      required: true,
    },
    transactionId: { type: String, required: true },
  },
  { timestamps: true }
);

const PaymentModel: Model<IPayment> = mongoose.model("Payment", paymentSchema);

export default PaymentModel;