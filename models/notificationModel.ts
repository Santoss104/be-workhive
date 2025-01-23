import mongoose, { Document, Model, Schema } from "mongoose";
import { IUser } from "./userModel";

export interface INotification extends Document {
  userId: mongoose.Schema.Types.ObjectId;
  title: string;
  message: string;
  type: "order" | "payment" | "review" | "system" | "other";
  isRead: boolean;
  link?: string;
  notificationDate: Date;
  relatedId?: mongoose.Schema.Types.ObjectId;
  markAsRead: () => Promise<void>;
}

interface INotificationModel extends Model<INotification> {
  createNotification(
    userId: mongoose.Schema.Types.ObjectId,
    title: string,
    message: string,
    type: "order" | "payment" | "review" | "system" | "other",
    relatedId?: mongoose.Schema.Types.ObjectId,
    link?: string
  ): Promise<INotification>;

  markAllAsRead(userId: mongoose.Schema.Types.ObjectId): Promise<void>;
  cleanOldNotifications(days?: number): Promise<void>;
}

const notificationSchema: Schema<INotification> = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },
    title: {
      type: String,
      required: [true, "Notification title is required"],
      trim: true,
    },
    message: {
      type: String,
      required: [true, "Notification message is required"],
      trim: true,
    },
    type: {
      type: String,
      enum: ["order", "payment", "review", "system", "other"],
      required: [true, "Notification type is required"],
      index: true,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    link: {
      type: String,
      trim: true,
    },
    notificationDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    relatedId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "type",
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
    },
    toObject: {
      virtuals: true,
    },
  }
);

notificationSchema.index({ userId: 1, isRead: 1 });
notificationSchema.index({ userId: 1, notificationDate: -1 });
notificationSchema.index({ userId: 1, type: 1 });

notificationSchema.virtual("relatedDocument", {
  refPath: "type",
  localField: "relatedId",
  foreignField: "_id",
  justOne: true,
});

notificationSchema.pre("save", async function (next) {
  if (this.isNew) {
    const user = await mongoose.model("User").findById(this.userId);
    if (!user) {
      throw new Error("User not found");
    }
  }
  next();
});

notificationSchema.statics.createNotification = async function (
  userId: mongoose.Schema.Types.ObjectId,
  title: string,
  message: string,
  type: "order" | "payment" | "review" | "system" | "other",
  relatedId?: mongoose.Schema.Types.ObjectId,
  link?: string
) {
  const notification = await this.create({
    userId,
    title,
    message,
    type,
    relatedId,
    link,
  });

  return notification;
};

notificationSchema.methods.markAsRead = async function () {
  this.isRead = true;
  await this.save();
};

notificationSchema.statics.markAllAsRead = async function (
  userId: mongoose.Schema.Types.ObjectId
) {
  await this.updateMany({ userId, isRead: false }, { $set: { isRead: true } });
};

notificationSchema.statics.cleanOldNotifications = async function (
  days: number = 30
) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  await this.deleteMany({
    notificationDate: { $lt: cutoffDate },
    isRead: true,
  });
};

notificationSchema.post("findOneAndDelete", async function (doc) {
  if (doc) {
    await NotificationModel.deleteMany({ userId: doc._id });
  }
});

const NotificationModel = mongoose.model<INotification, INotificationModel>(
  "Notification",
  notificationSchema
);

export default NotificationModel;