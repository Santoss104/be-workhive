import mongoose, { Schema } from "mongoose";
const notificationSchema = new Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    notificationDate: { type: Date, default: Date.now },
}, { timestamps: true });
const NotificationModel = mongoose.model("Notification", notificationSchema);
export default NotificationModel;
