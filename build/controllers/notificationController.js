import NotificationModel from "../models/notificationModel";
import ErrorHandler from "../utils/errorHandler";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
// Create Notification
export const createNotification = CatchAsyncError(async (req, res, next) => {
    try {
        const { userId, message } = req.body;
        const newNotification = await NotificationModel.create({
            userId,
            message,
            isRead: false,
            notificationDate: new Date(),
        });
        res.status(201).json({
            success: true,
            notification: newNotification,
        });
    }
    catch (error) {
        return next(new ErrorHandler(error.message, 400));
    }
});
// Get Notifications By User ID
export const getNotificationsByUserId = CatchAsyncError(async (req, res, next) => {
    try {
        const notifications = await NotificationModel.find({
            userId: req.params.userId,
        });
        res.status(200).json({
            success: true,
            notifications,
        });
    }
    catch (error) {
        return next(new ErrorHandler(error.message, 400));
    }
});
