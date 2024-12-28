import { Request, Response, NextFunction } from "express";
import cloudinary from "cloudinary";
import ProductModel, { IProduct } from "../models/productModel";
import { redis } from "../utils/redis";
import ErrorHandler from "../utils/errorHandler";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import {
  createProductService,
  getProductService,
} from "../services/productService";

// Create Product
export const createProduct = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        name,
        description,
        category,
        price,
        tags,
        type,
        seller,
        specifications,
        image,
        thumbnail,
      } = req.body;

      // Upload image dan thumbnail ke Cloudinary
      let uploadedImage;
      let uploadedThumbnail;

      if (image) {
        const myCloud = await cloudinary.v2.uploader.upload(image, {
          folder: "products",
          width: 500,
          crop: "scale",
        });

        uploadedImage = {
          public_id: myCloud.public_id,
          url: myCloud.secure_url,
        };
      }

      if (thumbnail) {
        const myCloud = await cloudinary.v2.uploader.upload(thumbnail, {
          folder: "products",
          width: 150,
          crop: "scale",
        });

        uploadedThumbnail = {
          public_id: myCloud.public_id,
          url: myCloud.secure_url,
        };
      }

      // Persiapkan data produk
      const productData = {
        name,
        description,
        category,
        price,
        tags,
        type,
        seller,
        specifications,
        image: uploadedImage,
        thumbnail: uploadedThumbnail,
      };

      // Buat produk menggunakan productService
      const newProduct = await createProductService(productData);

      if (!newProduct) {
        return next(new ErrorHandler("Failed to create product", 400));
      }

      // Simpan ke Redis cache
      await redis.set(`product_${newProduct._id}`, JSON.stringify(newProduct));

      res.status(201).json({
        success: true,
        product: newProduct,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// Update Product
export const updateProduct = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const product = await ProductModel.findById(req.params.id);

      if (!product) {
        return next(new ErrorHandler("Product not found", 404));
      }

      let uploadedImage;
      let uploadedThumbnail;

      // Update image if exists
      if (req.body.image) {
        if (product.image?.public_id) {
          await cloudinary.v2.uploader.destroy(product.image.public_id);
        }

        const result = await cloudinary.v2.uploader.upload(req.body.image, {
          folder: "products",
          width: 500,
          crop: "scale",
        });

        uploadedImage = {
          public_id: result.public_id,
          url: result.secure_url,
        };
        product.image = uploadedImage;
      }

      // Update thumbnail if exists
      if (req.body.thumbnail) {
        if (product.thumbnail?.public_id) {
          await cloudinary.v2.uploader.destroy(product.thumbnail.public_id);
        }

        const result = await cloudinary.v2.uploader.upload(req.body.thumbnail, {
          folder: "products",
          width: 150,
          crop: "scale",
        });

        uploadedThumbnail = {
          public_id: result.public_id,
          url: result.secure_url,
        };
        product.thumbnail = uploadedThumbnail;
      }

      // Update other product fields
      product.name = req.body.name || product.name;
      product.description = req.body.description || product.description;
      product.price = req.body.price || product.price;
      product.category = req.body.category || product.category;
      product.tags = req.body.tags || product.tags;
      product.specifications =
        req.body.specifications || product.specifications;

      await product.save();

      // Update product in Redis
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

// Delete Product
export const deleteProduct = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const product = await ProductModel.findById(req.params.id);

      if (!product) {
        return next(new ErrorHandler("Product not found", 404));
      }

      // Delete image and thumbnail from Cloudinary
      if (product.image?.public_id) {
        await cloudinary.v2.uploader.destroy(product.image.public_id);
      }

      if (product.thumbnail?.public_id) {
        await cloudinary.v2.uploader.destroy(product.thumbnail.public_id);
      }

      await product.deleteOne();

      // Remove product from Redis cache
      await redis.del(`product_${product._id}`);

      res.status(200).json({
        success: true,
        message: "Product deleted successfully",
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// Get Product By ID (From Redis or Database)
export const getProductById = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Check Redis cache for product
      const cachedProduct = await redis.get(`product_${req.params.id}`);

      if (cachedProduct) {
        return res.status(200).json({
          success: true,
          product: JSON.parse(cachedProduct),
        });
      }

      // If not in cache, get product from database
      const product = await ProductModel.findById(req.params.id);

      if (!product) {
        return next(new ErrorHandler("Product not found", 404));
      }

      // Save product to Redis for next access
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

// Get All Products (Using productService)
export const getAllProducts = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Use productService to get all products
      await getProductService(res);;
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);