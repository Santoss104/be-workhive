import express from "express";
import { isAutheticated, authorizeRoles } from "../middleware/authMiddleware";
import {
  createProduct,
  updateProduct,
  toggleProductAvailability,
  getSellerProducts,
  searchProducts,
  getAllProducts,
  getProductsByCategory,
} from "../controllers/productController";

const productRouter = express.Router();

productRouter.get("/search", searchProducts);

productRouter.post(
  "/create",
  isAutheticated,
  authorizeRoles("seller"),
  createProduct
);
productRouter.get("/", getAllProducts);
productRouter.get("/category/:categoryId", getProductsByCategory);
productRouter.put(
  "/:id",
  isAutheticated,
  authorizeRoles("seller"),
  updateProduct
);
productRouter.patch(
  "/toggle-availability/:id",
  isAutheticated,
  authorizeRoles("seller"),
  toggleProductAvailability
);
productRouter.get(
  "/seller",
  isAutheticated,
  authorizeRoles("seller"),
  getSellerProducts
);

export default productRouter;