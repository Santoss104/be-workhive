import express from "express";
import {
  createCategory,
  getAllCategories,
  getCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/categoryController";
import { isAutheticated, authorizeRoles } from "../middleware/authMiddleware";

const categoryRouter = express.Router();

categoryRouter.get("/", getAllCategories);
categoryRouter.get("/:id", getCategory);

categoryRouter.post(
  "/create",
  isAutheticated,
  authorizeRoles("admin"),
  createCategory
);
categoryRouter.put(
  "/:id",
  isAutheticated,
  authorizeRoles("admin"),
  updateCategory
);
categoryRouter.delete(
  "/:id",
  isAutheticated,
  authorizeRoles("admin"),
  deleteCategory
);

export default categoryRouter;