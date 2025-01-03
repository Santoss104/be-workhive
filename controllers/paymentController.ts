import { Request, Response, NextFunction } from "express";
import PaymentModel, { IPayment } from "../models/paymentModel";
import  ErrorHandler  from "../utils/errorHandler";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";

// Create Payment
export const createPayment = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        orderId,
        paymentMethod,
        amountPaid,
        paymentDate,
        paymentStatus,
        transactionId,
      } = req.body;

      const newPayment = await PaymentModel.create({
        orderId,
        paymentMethod,
        amountPaid,
        paymentDate,
        paymentStatus,
        transactionId,
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

// Get Payment By Order ID
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
