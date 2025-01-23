import express from "express";
import {
  activateUser,
  loginUser,
  logoutUser,
  registrationUser,
  socialAuth,
  forgotPassword,
  forgotPasswordUser,
  newPassword,
} from "../controllers/authController";
import { isAutheticated } from "../middleware/authMiddleware";

const authRouter = express.Router();

authRouter.post("/registration", registrationUser);
authRouter.post("/activate-user", activateUser);
authRouter.post("/login", loginUser);
authRouter.get("/logout", isAutheticated, logoutUser);
authRouter.post("/social-auth", socialAuth);

authRouter.post("/forgot-password", forgotPassword);
authRouter.post("/forgot-password-verify", forgotPasswordUser);
authRouter.put("/reset-password", newPassword);

export default authRouter;