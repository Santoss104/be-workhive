import { Request, Response, NextFunction } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import ErrorHandler from "../utils/errorHandler";
import { redis } from "../utils/redis";
import CategoryModel, { ICategory } from "../models/categoryModel";

interface CategoryResponse {
  success: boolean;
  message?: string;
  category?: ICategory;
  categories?: ICategory[];
}

export const createCategory = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const { name } = req.body;

    if (!name?.trim()) {
      return next(new ErrorHandler("Please enter category name", 400));
    }

    const existingCategory = await CategoryModel.findByName(name);
    if (existingCategory) {
      return next(new ErrorHandler("Category already exists", 400));
    }

    const category = await CategoryModel.create({ name: name.trim() });

    await redis.set(
      `category:${category._id}`,
      JSON.stringify(category),
      "EX",
      24 * 60 * 60
    );

    const response: CategoryResponse = {
      success: true,
      message: "Category created successfully",
      category,
    };

    res.status(201).json(response);
  }
);

export const getAllCategories = CatchAsyncError(
  async (_req: Request, res: Response) => {
    const categories = await CategoryModel.find().sort({ createdAt: -1 });

    const response: CategoryResponse = {
      success: true,
      categories,
    };

    res.status(200).json(response);
  }
);

export const getCategory = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const cachedCategory = await redis.get(`category:${id}`);
    if (cachedCategory) {
      const response: CategoryResponse = {
        success: true,
        category: JSON.parse(cachedCategory),
      };
      return res.status(200).json(response);
    }

    const category = await CategoryModel.findById(id);
    if (!category) {
      return next(new ErrorHandler("Category not found", 404));
    }

    await redis.set(
      `category:${id}`,
      JSON.stringify(category),
      "EX",
      24 * 60 * 60
    );

    const response: CategoryResponse = {
      success: true,
      category,
    };

    res.status(200).json(response);
  }
);

export const updateCategory = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const { name } = req.body;
    const { id } = req.params;

    if (!name?.trim()) {
      return next(new ErrorHandler("Please enter category name", 400));
    }

    const category = await CategoryModel.findById(id);
    if (!category) {
      return next(new ErrorHandler("Category not found", 404));
    }

    const existingCategory = await CategoryModel.findOne({
      _id: { $ne: id },
      name: { $regex: new RegExp(`^${name}$`, "i") },
    });

    if (existingCategory) {
      return next(new ErrorHandler("Category name already exists", 400));
    }

    category.name = name.trim();
    await category.save();

    await redis.set(
      `category:${id}`,
      JSON.stringify(category),
      "EX",
      24 * 60 * 60
    );

    const response: CategoryResponse = {
      success: true,
      message: "Category updated successfully",
      category,
    };

    res.status(200).json(response);
  }
);

export const deleteCategory = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const category = await CategoryModel.findById(id);
    if (!category) {
      return next(new ErrorHandler("Category not found", 404));
    }

    await category.deleteOne();

    await redis.del(`category:${id}`);

    const response: CategoryResponse = {
      success: true,
      message: "Category deleted successfully",
    };

    res.status(200).json(response);
  }
);