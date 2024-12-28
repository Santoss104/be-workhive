import express from "express";
import {
  activateUser,
  deleteUser,
  getAllUsers,
  getUserInfo,
  loginUser,
  logoutUser,
  registrationUser,
  socialAuth,
  updatePassword,
  updateProfilePicture,
  updateUserInfo,
  updateUserRole,
  forgotPassword,
  forgotPasswordUser,
  newPassword,
  becomeSeller,
} from "../controllers/userController";
import { authorizeRoles, isAutheticated } from "../middleware/authMiddleware";

const userRouter = express.Router();

userRouter.post("/registration", registrationUser);

userRouter.post("/activate-user", activateUser);

userRouter.post("/login", loginUser);

userRouter.get("/logout", isAutheticated, logoutUser);

userRouter.get("/me", isAutheticated, getUserInfo);

userRouter.post("/social-auth", socialAuth);

userRouter.put("/update-user-info", isAutheticated, updateUserInfo); 

userRouter.put("/update-user-password", isAutheticated, updatePassword);

userRouter.put("/update-user-avatar", isAutheticated, updateProfilePicture);

userRouter.post("/forgot-password", forgotPassword);

userRouter.post("/forgot-password-user", forgotPasswordUser);

userRouter.put("/new-forgot-password", newPassword);


userRouter.get(
  "/get-users",
  isAutheticated,
  getAllUsers
);

userRouter.put(
  "/update-user",
  isAutheticated,
  updateUserRole
);

userRouter.delete(
  "/delete-user/:id",
  isAutheticated,
  deleteUser
);

userRouter.put(
  "/become-seller",
  isAutheticated,
  becomeSeller
);

export default userRouter;