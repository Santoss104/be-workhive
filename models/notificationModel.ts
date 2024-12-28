import mongoose, { Document, Model, Schema } from "mongoose";
import { IUser } from "./userModel";

export interface INotification extends Document {
  userId: mongoose.Schema.Types.ObjectId;
  message: string;
  isRead: boolean;
  notificationDate: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    notificationDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const NotificationModel: Model<INotification> = mongoose.model(
  "Notification",
  notificationSchema
);

export default NotificationModel;