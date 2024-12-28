import { Request, Response, NextFunction } from "express";
import ProductModel from "../models/productModel";

// create product
export const createProductService = async (data: any) => {
  // Hapus CatchAsyncError karena error handling sudah di controller
  const product = await ProductModel.create(data);
  return product; // Langsung return product
};

// Get All Product
export const getProductService = async (res: Response) => {
  const products = await ProductModel.find().sort({ createdAt: -1 });

  res.status(201).json({
    success: true,
    products,
  });
};
