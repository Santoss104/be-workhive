import ProductModel from "../models/productModel";
// create product
export const createProductService = async (data) => {
    const product = await ProductModel.create(data);
    return product;
};
// Get All Product
export const getProductService = async (res) => {
    const products = await ProductModel.find().sort({ createdAt: -1 });
    res.status(201).json({
        success: true,
        products,
    });
};
