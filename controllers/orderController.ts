import { Request, Response, NextFunction } from "express";
import OrderModel, { IOrder } from "../models/orderModel";
import  ErrorHandler  from "../utils/errorHandler";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";

// Create Order
export const createOrder = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { productId, userId, payment_info, totalAmount, status } = req.body;

      const newOrder = await OrderModel.create({
        productId,
        userId,
        payment_info,
        status,
        totalAmount,
      });

      res.status(201).json({
        success: true,
        order: newOrder,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// Get All Orders
export const getAllOrders = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orders = await OrderModel.find();
      res.status(200).json({
        success: true,
        orders,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// Get Order By ID
export const getOrderById = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const order = await OrderModel.findById(req.params.id);

      if (!order) {
        return next(new ErrorHandler("Order not found", 404));
      }

      res.status(200).json({
        success: true,
        order,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// Update Order
export const updateOrder = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const order = await OrderModel.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      );

      if (!order) {
        return next(new ErrorHandler("Order not found", 404));
      }

      res.status(200).json({
        success: true,
        order,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// Delete Order
export const deleteOrder = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const order = await OrderModel.findByIdAndDelete(req.params.id);

      if (!order) {
        return next(new ErrorHandler("Order not found", 404));
      }

      res.status(200).json({
        success: true,
        message: "Order deleted successfully",
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);