import { Request, Response, NextFunction } from "express";
import OrderModel, { validStatusTransitions } from "../models/orderModel";
import ProductModel from "../models/productModel";
import  ErrorHandler  from "../utils/errorHandler";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";

// Create Order
export const createOrder = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { productId, packageType } = req.body;

      const product = await ProductModel.findById(productId);
      if (!product) {
        return next(new ErrorHandler("Product not found", 404));
      }

      const priceKey = `${packageType}_fiture` as keyof typeof product.price;
      if (!(priceKey in product.price)) {
        return next(new ErrorHandler("Invalid package type", 400));
      }

      const expectedAmount = product.price[priceKey];
      const now = new Date();
      const transactionId = `TRX${now.getFullYear()}${String(
        now.getMonth() + 1
      ).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}${String(
        now.getHours()
      ).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}`;

      const orderData = {
        productId,
        userId: req.user?._id,
        packageType,
        totalAmount: expectedAmount,
        serviceFee: 150000,
        adminFee: 3000,
        status: "Unpaid",
        transactionId,
      };

      const order = await OrderModel.create(orderData);
      await order.populate("product");

      res.status(201).json({
        success: true,
        order,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// Update Order Status
export const updateOrderStatus = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { status } = req.body;
      const order = await OrderModel.findById(req.params.id);

      if (!order) {
        return next(new ErrorHandler("Order not found", 404));
      }

      if (status === "Completed" && order.status === "Processing") {
        if (order.userId.toString() !== req.user?._id.toString()) {
          return next(
            new ErrorHandler("Only the buyer can mark as completed", 403)
          );
        }
      } else if (req.user?.role !== "admin") {
        return next(
          new ErrorHandler("Only admin can update other statuses", 403)
        );
      }

      const validNextStatuses = validStatusTransitions[order.status] || [];
      if (!validNextStatuses.includes(status)) {
        return next(
          new ErrorHandler(
            `Invalid status transition from ${order.status} to ${status}`,
            400
          )
        );
      }

      if (status === "Completed") {
        if (!order.deliveryDate) {
          order.deliveryDate = new Date();
        }
        order.progress = 100;
      } else if (status === "Failed") {
        order.progress = order.progress || 0;
      }

      order.status = status;
      await order.save();

      res.status(200).json({
        success: true,
        order: await order.populate("product"),
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// Update Order Progress
export const updateOrderProgress = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { progress } = req.body;
      const order = await OrderModel.findById(req.params.id);
      
      if (!order) {
        return next(new ErrorHandler("Order not found", 404));
      }

      if (req.user?.role !== "admin") {
        return next(new ErrorHandler("Only admin can update progress", 403));
      }

      if (order.status !== "Processing") {
        return next(new ErrorHandler("Can only update progress for processing orders", 400));
      }

      order.progress = progress;
      await order.save();

      res.status(200).json({
        success: true,
        order: await order.populate("product"),
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
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      const filter: any = {};
      if (req.query.status) filter.status = req.query.status;
      if (req.query.packageType) filter.packageType = req.query.packageType;

      const [orders, total] = await Promise.all([
        OrderModel.find(filter)
          .populate("product")
          .populate("buyer", "name email")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        OrderModel.countDocuments(filter),
      ]);

      res.status(200).json({
        success: true,
        orders,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          total,
        },
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

export const getUserOrders = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      const [orders, total] = await Promise.all([
        OrderModel.find({ userId: req.user?._id })
          .populate("product")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        OrderModel.countDocuments({ userId: req.user?._id }),
      ]);

      res.status(200).json({
        success: true,
        orders,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          total,
        },
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
      const order = await OrderModel.findById(req.params.id)
        .populate("product")
        .populate("buyer", "name email")
        .populate("review");

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
      const order = await OrderModel.findById(req.params.id);
      if (!order) {
        return next(new ErrorHandler("Order not found", 404));
      }

      if (
        req.user?.role !== "admin" &&
        order.userId.toString() !== req.user?._id.toString()
      ) {
        return next(
          new ErrorHandler("Not authorized to update this order", 403)
        );
      }

      const updatedOrder = await OrderModel.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      ).populate("product");

      res.status(200).json({
        success: true,
        order: updatedOrder,
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