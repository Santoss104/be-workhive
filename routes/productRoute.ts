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

productRouter.post(
  "/create",
  isAutheticated,
  authorizeRoles("seller"),
  createProduct
);

productRouter.get("/", getAllProducts);

productRouter.get("/:id", getProductById);

productRouter.put(
  "/:id",
  isAutheticated,
  authorizeRoles("seller"),
  updateProduct
);

productRouter.delete(
  "/:id",
  isAutheticated,
  authorizeRoles("seller"),
  deleteProduct
);

export default productRouter;