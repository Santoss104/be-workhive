import express from "express";
import {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} from "../controllers/productController";
import { isAutheticated, authorizeRoles } from "../middleware/authMiddleware";

const productRouter = express.Router();

// Create a new product (only sellers can create)
productRouter.post(
  "/create",
  isAutheticated,
  authorizeRoles("seller"),
  createProduct
);

// Get all products
productRouter.get("/", getAllProducts);

// Get a product by ID
productRouter.get("/:id", getProductById);

// Update a product by ID (only sellers can update their own products)
productRouter.put(
  "/:id",
  isAutheticated,
  authorizeRoles("seller"),
  updateProduct
);

// Delete a product by ID (only sellers can delete their own products)
productRouter.delete(
  "/:id",
  isAutheticated,
  authorizeRoles("seller"),
  deleteProduct
);
 
export default productRouter;