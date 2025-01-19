import express from "express";
import {
  getUserInfo,
  updatePassword,
  updateProfilePicture,
  updateUserInfo,
  getAllUsers,
  updateUserRole,
  deleteUser,
  becomeSeller,
} from "../controllers/userController";
import { authorizeRoles, isAutheticated } from "../middleware/authMiddleware";

const userRouter = express.Router();

// User profile routes
userRouter.get("/me", isAutheticated, getUserInfo);
userRouter.put("/update-info", isAutheticated, updateUserInfo);
userRouter.put("/update-password", isAutheticated, updatePassword);
userRouter.put("/update-avatar", isAutheticated, updateProfilePicture);
userRouter.put("/become-seller", isAutheticated, becomeSeller);

// Admin routes
userRouter.get("/all-users", isAutheticated, authorizeRoles("admin"), getAllUsers);
userRouter.put("/update-role", isAutheticated, authorizeRoles("admin"), updateUserRole);
userRouter.delete("/delete/:id", isAutheticated, authorizeRoles("admin"), deleteUser);

export default userRouter;