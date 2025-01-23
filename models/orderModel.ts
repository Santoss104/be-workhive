import mongoose, { Document, Model, Schema } from "mongoose";

export interface IOrder extends Document {
  productId: mongoose.Schema.Types.ObjectId;
  userId: mongoose.Schema.Types.ObjectId;
  paymentId?: mongoose.Schema.Types.ObjectId;
  packageType: "complete" | "basic" | "prototype";
  status: "Unpaid" | "Processing" | "Completed" | "Cancelled" | "Failed";
  progress: number;
  deliveryDate?: Date;
  serviceFee: number;
  adminFee: number;
  totalAmount: number;
  transactionId: string;
}

const orderSchema: Schema<IOrder> = new mongoose.Schema(
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
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
    },
    packageType: {
      type: String,
      enum: ["complete", "basic", "prototype"],
      required: [true, "Package type is required"],
    },
    status: {
      type: String,
      enum: ["Unpaid", "Processing", "Completed", "Cancelled", "Failed"],
      default: "Unpaid",
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    deliveryDate: {
      type: Date,
    },
    serviceFee: {
      type: Number,
      default: 150000
    },
    adminFee: {
      type: Number,
      default: 3000
    },
    totalAmount: {
      type: Number,
      required: [true, "Total amount is required"],
      validate: {
        validator: (value: number) =>
          value > 0 && /^\d+(\.\d{1,2})?$/.test(value.toString()),
        message: "Invalid total amount format",
      },
    },
    transactionId: {
      type: String,
      unique: true,
      required: true,
    },
  },
  { timestamps: true }
);

orderSchema.index({ userId: 1, status: 1 });
orderSchema.index({ productId: 1 });
orderSchema.index({ paymentId: 1 });
orderSchema.index({ createdAt: -1 });

orderSchema.virtual("product", {
  ref: "Product",
  localField: "productId",
  foreignField: "_id",
  justOne: true,
});

orderSchema.virtual("buyer", {
  ref: "User",
  localField: "userId",
  foreignField: "_id",
  justOne: true,
});

orderSchema.virtual("review", {
  ref: "Review",
  localField: "_id",
  foreignField: "orderId",
  justOne: true,
});

export const validStatusTransitions: Record<string, string[]> = {
  Unpaid: ["Processing", "Cancelled"],
  Processing: ["Completed", "Failed"],
  Completed: [],
  Cancelled: [],
  Failed: [],
};

orderSchema.pre("save", async function (next) {
  if (this.isModified("status") && !this.isNew) {
    const oldOrder = await OrderModel.findById(this._id);
    const validNextStatuses =
      validStatusTransitions[oldOrder?.status || ""] || [];

    if (!validNextStatuses.includes(this.status)) {
      throw new Error(
        `Invalid status transition from ${oldOrder?.status} to ${this.status}`
      );
    }
  }
  next();
});

const OrderModel: Model<IOrder> = mongoose.model("Order", orderSchema);

export default OrderModel;