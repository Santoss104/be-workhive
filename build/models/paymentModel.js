import mongoose, { Schema } from "mongoose";
const paymentSchema = new Schema({
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
}, { timestamps: true });
const PaymentModel = mongoose.model("Payment", paymentSchema);
export default PaymentModel;
