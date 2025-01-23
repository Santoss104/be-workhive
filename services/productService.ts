import { Request, Response, NextFunction } from "express";
import ProductModel from "../models/productModel";

// create product
export const createProductService = async (data: any) => {
  const productData = {
    ...data,
    price: {
      complete_fiture: data.price.complete_fiture,
      basic_fiture: data.price.basic_fiture,
      prototype_fiture: data.price.prototype_fiture,
    },
  };

  const product = await ProductModel.create(productData);
  return product;
};

// Get All Product
export const getProductService = async (res: Response) => {
  const products = await ProductModel.find().sort({ createdAt: -1 });

  res.status(201).json({
    success: true,
    products,
  });
};
