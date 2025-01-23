import mongoose, { Document, Model, Schema } from "mongoose";

interface BankTransferDetails {
  bankName: "BRI" | "BNI";
  accountNumber: string;
  accountHolderName: string;
}

interface EWalletDetails {
  provider: "DANA" | "LinkAja" | "ShopeePay" | "OVO" | "GoPay";
  phoneNumber: string;
}

interface CardDetails {
  type: "VISA" | "Mastercard";
  lastFourDigits: string;
  expiryMonth: number;
  expiryYear: number;
}

interface QRISDetails {
  merchantName: string;
}

export interface IPayment extends Document {
  orderId: mongoose.Schema.Types.ObjectId;
  userId: mongoose.Schema.Types.ObjectId;
  paymentMethod: "BANK_TRANSFER" | "E_WALLET" | "CARD" | "QRIS";
  paymentDetails:
    | BankTransferDetails
    | EWalletDetails
    | CardDetails
    | QRISDetails;
  amountPaid: number;
  serviceFee: number;
  adminFee: number;
  totalAmount: number;
  paymentDate: Date;
  paymentStatus: "Pending" | "Completed" | "Failed";
  transactionId: string;
}

const bankTransferDetailsSchema = new mongoose.Schema({
  bankName: {
    type: String,
    enum: ["BRI", "BNI"],
    required: true,
  },
  accountNumber: {
    type: String,
    required: true,
  },
  accountHolderName: {
    type: String,
    required: true,
  },
});

const eWalletDetailsSchema = new mongoose.Schema({
  provider: {
    type: String,
    enum: ["DANA", "LinkAja", "ShopeePay", "OVO", "GoPay"],
    required: true,
  },
  phoneNumber: {
    type: String,
    required: true,
  },
});

const cardDetailsSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["VISA", "Mastercard"],
    required: true,
  },
  lastFourDigits: {
    type: String,
    required: true,
    minlength: 4,
    maxlength: 4,
  },
  expiryMonth: {
    type: Number,
    required: true,
    min: 1,
    max: 12,
  },
  expiryYear: {
    type: Number,
    required: true,
  },
});

const qrisDetailsSchema = new mongoose.Schema({
  merchantName: {
    type: String,
    required: true,
  },
});

const paymentSchema: Schema<IPayment> = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: [true, "Order is required"],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
    },
    paymentMethod: {
      type: String,
      enum: ["BANK_TRANSFER", "E_WALLET", "CARD", "QRIS"],
      required: [true, "Payment method is required"],
    },
    paymentDetails: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      validate: {
        validator: function (details: any) {
          switch (this.paymentMethod) {
            case "BANK_TRANSFER":
              return (
                details.bankName &&
                details.accountNumber &&
                details.accountHolderName
              );
            case "E_WALLET":
              return details.provider && details.phoneNumber;
            case "CARD":
              return (
                details.type &&
                details.lastFourDigits &&
                details.expiryMonth &&
                details.expiryYear
              );
            case "QRIS":
              return details.merchantName;
            default:
              return false;
          }
        },
        message: "Invalid payment details for the selected payment method",
      },
    },
    amountPaid: {
      type: Number,
      required: [true, "Amount is required"],
    },
    serviceFee: {
      type: Number,
      required: [true, "Service fee is required"],
    },
    adminFee: {
      type: Number,
      required: [true, "Admin fee is required"],
    },
    totalAmount: {
      type: Number,
    },
    paymentDate: {
      type: Date,
      default: Date.now,
    },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Completed", "Failed"],
      default: "Pending",
    },
    transactionId: {
      type: String,
      required: [true, "Transaction ID is required"],
      unique: true,
    },
  },
  { timestamps: true }
);

paymentSchema.pre("save", function (next) {
  this.totalAmount = this.amountPaid + this.serviceFee + this.adminFee;
  next();
});

paymentSchema.post("save", async function () {
  await mongoose.model("Order").findByIdAndUpdate(
    this.orderId,
    {
      status: "Processing",
      paymentId: this._id,
    },
    { new: true }
  );
});

paymentSchema.index({ orderId: 1 });
paymentSchema.index({ userId: 1 });
paymentSchema.index({ transactionId: 1 }, { unique: true });

const PaymentModel: Model<IPayment> = mongoose.model("Payment", paymentSchema);

export default PaymentModel;