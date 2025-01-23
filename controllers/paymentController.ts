import { Request, Response, NextFunction } from "express";
import PaymentModel, { IPayment } from "../models/paymentModel";
import OrderModel from "../models/orderModel";
import ErrorHandler from "../utils/errorHandler";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";

// Create Payment
export const createPayment = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        orderId,
        paymentMethod,
        paymentDetails,
        amountPaid,
        serviceFee,
        adminFee,
        transactionId,
      } = req.body;

      const validatePaymentDetails = () => {
        switch (paymentMethod) {
          case "BANK_TRANSFER":
            return (
              ["BRI", "BNI"].includes(paymentDetails.bankName) &&
              paymentDetails.accountNumber &&
              paymentDetails.accountHolderName
            );
          case "E_WALLET":
            return (
              ["DANA", "LinkAja", "ShopeePay", "OVO", "GoPay"].includes(
                paymentDetails.provider
              ) && paymentDetails.phoneNumber
            );
          case "CARD":
            return (
              ["VISA", "Mastercard"].includes(paymentDetails.type) &&
              paymentDetails.lastFourDigits?.length === 4 &&
              paymentDetails.expiryMonth >= 1 &&
              paymentDetails.expiryMonth <= 12 &&
              paymentDetails.expiryYear >= new Date().getFullYear()
            );
          case "QRIS":
            return paymentDetails.merchantName;
          default:
            return false;
        }
      };

      if (!validatePaymentDetails()) {
        return next(new ErrorHandler("Invalid payment details", 400));
      }

      const order = await OrderModel.findById(orderId);
      if (!order) {
        return next(new ErrorHandler("Order not found", 404));
      }

      const newPayment = await PaymentModel.create({
        orderId,
        userId: req.user?._id,
        paymentMethod,
        paymentDetails,
        amountPaid: order.totalAmount,
        serviceFee: order.serviceFee,
        adminFee: order.adminFee,
        paymentStatus: "Completed",
        transactionId: order.transactionId,
        paymentDate: new Date(),
      });

      res.status(201).json({
        success: true,
        payment: newPayment,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// Get Payment By Order ID remains the same
export const getPaymentByOrderId = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const payment = await PaymentModel.findOne({
        orderId: req.params.orderId,
      });

      if (!payment) {
        return next(new ErrorHandler("Payment not found", 404));
      }

      res.status(200).json({
        success: true,
        payment,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }  
);

// Get All Payments
export const getAllPayments = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      const filter: any = {};
      if (req.query.paymentMethod) filter.paymentMethod = req.query.paymentMethod;
      if (req.query.paymentStatus) filter.paymentStatus = req.query.paymentStatus;

      const [payments, total] = await Promise.all([
        PaymentModel.find(filter)
          .populate('orderId')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        PaymentModel.countDocuments(filter)
      ]);

      res.status(200).json({
        success: true,
        payments,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          total
        }
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// Get User Payments
export const getUserPayments = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      const [payments, total] = await Promise.all([
        PaymentModel.find({ userId: req.user?._id })
          .populate('orderId')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        PaymentModel.countDocuments({ userId: req.user?._id })
      ]);

      res.status(200).json({
        success: true,
        payments,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          total
        }
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// Update Payment Status
export const updatePaymentStatus = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { paymentStatus } = req.body;
      
      if (!['Pending', 'Completed', 'Failed'].includes(paymentStatus)) {
        return next(new ErrorHandler('Invalid payment status', 400));
      }

      const payment = await PaymentModel.findById(req.params.id);
      if (!payment) {
        return next(new ErrorHandler('Payment not found', 404));
      }

      if (req.user?.role !== 'admin') {
        return next(new ErrorHandler('Not authorized to update payment status', 403));
      }

      payment.paymentStatus = paymentStatus;
      await payment.save();

      res.status(200).json({
        success: true,
        payment
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// Delete Payment
export const deletePayment = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const payment = await PaymentModel.findById(req.params.id);
      
      if (!payment) {
        return next(new ErrorHandler('Payment not found', 404));
      }

      if (req.user?.role !== 'admin') {
        return next(new ErrorHandler('Not authorized to delete payment', 403));
      }

      await payment.deleteOne();

      res.status(200).json({
        success: true,
        message: 'Payment deleted successfully'
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);