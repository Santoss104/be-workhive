import { Request, Response, NextFunction } from "express";
import cloudinary from "cloudinary";
import ProductModel from "../models/productModel";
import { redis } from "../utils/redis";
import ErrorHandler from "../utils/errorHandler";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import NotificationModel from "../models/notificationModel";
import {
  createProductService,
  getProductService,
} from "../services/productService";

// Create Product
export const createProduct = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (req.user?.role !== "seller") {
        return next(new ErrorHandler("Only sellers can create products", 403));
      }

      // Validate price data
      const { complete_fiture, basic_fiture, prototype_fiture } =
        req.body.price;
      if (!complete_fiture || !basic_fiture || !prototype_fiture) {
        return next(new ErrorHandler("All price fields are required", 400));
      }

      const data = {
        ...req.body,
        seller: req.user._id,
        price: {
          complete_fiture: Number(complete_fiture),
          basic_fiture: Number(basic_fiture),
          prototype_fiture: Number(prototype_fiture),
        },
      };

      if (data.image) {
        const imageUpload =
          data.image.startsWith("data:image") || data.image.startsWith("http")
            ? await cloudinary.v2.uploader.upload(data.image, {
                folder: "image products",
                width: 500,
                crop: "scale",
              })
            : null;

        if (imageUpload) {
          data.image = {
            public_id: imageUpload.public_id,
            url: imageUpload.secure_url,
          };
        }
      }

      if (data.thumbnail) {
        const thumbnailUpload =
          data.thumbnail.startsWith("data:image") ||
          data.thumbnail.startsWith("http")
            ? await cloudinary.v2.uploader.upload(data.thumbnail, {
                folder: "thumbnail products",
                width: 150,
                crop: "scale",
              })
            : null;

        if (thumbnailUpload) {
          data.thumbnail = {
            public_id: thumbnailUpload.public_id,
            url: thumbnailUpload.secure_url,
          };
        }
      }

      const product = await createProductService(data);

      await NotificationModel.createNotification(
        req.user._id,
        "Product Created",
        `Your product "${product.name}" has been created successfully`,
        "system"
      );

      res.status(201).json({
        success: true,
        product,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

export const validatePrice = (price: any): { isValid: boolean; error?: string } => {
  const { complete_fiture, basic_fiture, prototype_fiture } = price;
  const fields = [
    { value: complete_fiture, name: 'complete_fiture' },
    { value: basic_fiture, name: 'basic_fiture' },
    { value: prototype_fiture, name: 'prototype_fiture' }
  ];

  for (const field of fields) {
    if (!field.value) {
      return { isValid: false, error: `${field.name} required is true` };
    }
    if (isNaN(Number(field.value)) || Number(field.value) < 0) {
      return {
        isValid: false,
        error: `${field.name} must be a positive number`,
      };
    }
  }
  return { isValid: true };
};


// Update Product
export const updateProduct = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const product = await ProductModel.findById(req.params.id);
      if (!product) {
        return next(new ErrorHandler("Product not found", 404));
      }

      if (product.seller.toString() !== req.user?._id.toString()) {
        return next(
          new ErrorHandler("You can only update your own products", 403)
        );
      }

      if (req.body.price) {
        const priceValidation = validatePrice(req.body.price);
        if (!priceValidation.isValid) {
          return next(
            new ErrorHandler(priceValidation.error || "Invalid price", 400)
          );
        }
        // Konversi ke number
        req.body.price = {
          complete_fiture: Number(req.body.price.complete_fiture),
          basic_fiture: Number(req.body.price.basic_fiture),
          prototype_fiture: Number(req.body.price.prototype_fiture),
        };
      }

      // Handle image update
      if (req.body.image && product.image?.public_id) {
        await cloudinary.v2.uploader.destroy(product.image.public_id);
        const imageUpload = await cloudinary.v2.uploader.upload(
          req.body.image,
          {
            folder: "image products",
            width: 500,
            crop: "scale",
          }
        );
        req.body.image = {
          public_id: imageUpload.public_id,
          url: imageUpload.secure_url,
        };
      }

      // Handle thumbnail update
      if (req.body.thumbnail && product.thumbnail?.public_id) {
        await cloudinary.v2.uploader.destroy(product.thumbnail.public_id);
        const thumbnailUpload = await cloudinary.v2.uploader.upload(
          req.body.thumbnail,
          {
            folder: "thumbnail products",
            width: 150,
            crop: "scale",
          }
        );
        req.body.thumbnail = {
          public_id: thumbnailUpload.public_id,
          url: thumbnailUpload.secure_url,
        };
      }

      Object.assign(product, req.body);
      await product.save();
      await redis.set(`product_${product._id}`, JSON.stringify(product));

      res.status(200).json({
        success: true,
        product,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// Toggle Product Availability
export const toggleProductAvailability = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const product = await ProductModel.findById(req.params.id);

      if (!product) {
        return next(new ErrorHandler("Product not found", 404));
      }

      if (product.seller.toString() !== req.user?._id.toString()) {
        return next(new ErrorHandler("Unauthorized", 403));
      }

      await product.toggleAvailability();

      await redis.set(`product_${product._id}`, JSON.stringify(product));

      res.status(200).json({
        success: true,
        available: product.available,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// Get Seller Products
export const getSellerProducts = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      const cacheKey = `seller_products_${req.user?._id}_${page}_${limit}`;
      const cachedResult = await redis.get(cacheKey);

      if (cachedResult) {
        return res.status(200).json(JSON.parse(cachedResult));
      }

      if (!req.user?._id) {
        return next(new ErrorHandler("User not found", 404));
      }

      const [products, total] = await Promise.all([
        ProductModel.find({ seller: req.user._id })
          .populate("category")
          .populate("reviews")
          .skip(skip)
          .limit(limit),
        ProductModel.countDocuments({ seller: req.user?._id }),
      ]);

      const result = {
        success: true,
        products,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          total,
        },
      };

      await redis.set(cacheKey, JSON.stringify(result), "EX", 3600);
      res.status(200).json(result);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// Search Products
export const searchProducts = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;
      const { query, category, tags, type, minPrice, maxPrice } = req.query;

      const filter: any = {};
      if (query) {
        filter.$or = [
          { name: { $regex: query, $options: "i" } },
          { description: { $regex: query, $options: "i" } },
        ];
      }
      if (category) filter.category = category;
      if (tags) {
      const tagArray = Array.isArray(tags)
        ? tags
        : typeof tags === "string"
        ? tags.split(",")
        : [];
        filter.tags = { $in: tagArray };
      }
      if (type) filter.type = type;
      if (minPrice || maxPrice) {
        filter.price = {};
        if (minPrice) filter.price.$gte = Number(minPrice);
        if (maxPrice) filter.price.$lte = Number(maxPrice);
      }

      const cacheKey = `search_${JSON.stringify(filter)}_${page}_${limit}`;
      const cachedResult = await redis.get(cacheKey);

      if (cachedResult) {
        return res.status(200).json(JSON.parse(cachedResult));
      }

      const [products, total] = await Promise.all([
        ProductModel.find(filter)
          .populate("category")
          .populate("sellerInfo", "name avatar rating")
          .populate("reviews")
          .skip(skip)
          .limit(limit),
        ProductModel.countDocuments(filter),
      ]);

      const result = {
        success: true,
        products,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          total,
        },
      };

      await redis.set(cacheKey, JSON.stringify(result), "EX", 3600);
      res.status(200).json(result);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// Get All Products
export const getAllProducts = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      const cacheKey = `all_products_${page}_${limit}`;
      const cachedResult = await redis.get(cacheKey);

      if (cachedResult) {
        return res.status(200).json(JSON.parse(cachedResult));
      }

      const [products, total] = await Promise.all([
        ProductModel.find()
          .populate("category")
          .populate("sellerInfo", "name avatar rating")
          .populate("reviews")
          .skip(skip)
          .limit(limit),
        ProductModel.countDocuments(),
      ]);

      const result = {
        success: true,
        products,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          total,
        },
      };

      await redis.set(cacheKey, JSON.stringify(result), "EX", 3600);
      res.status(200).json(result);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// Get Products by Category
export const getProductsByCategory = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { categoryId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      const cacheKey = `category_products_${categoryId}_${page}_${limit}`;
      const cachedResult = await redis.get(cacheKey);

      if (cachedResult) {
        return res.status(200).json(JSON.parse(cachedResult));
      }

      const [products, total] = await Promise.all([
        ProductModel.find({ category: categoryId })
          .populate("category")
          .populate("sellerInfo", "name avatar rating")
          .populate("reviews")
          .skip(skip)
          .limit(limit),
        ProductModel.countDocuments({ category: categoryId }),
      ]);

      const result = {
        success: true,
        products,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          total,
        },
      };

      await redis.set(cacheKey, JSON.stringify(result), "EX", 3600);
      res.status(200).json(result);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);