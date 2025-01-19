import { Request, Response, NextFunction } from "express";
import userModel, { IUser } from "../models/userModel";
import ErrorHandler from "../utils/errorHandler";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import jwt, { JwtPayload, Secret } from "jsonwebtoken";
import ejs from "ejs";
import path from "path";
import sendMail from "../utils/sendMail";
import { sendToken } from "../utils/jwt";
import { redis } from "../utils/redis";
import { fileURLToPath } from "url";

// register user
interface IRegistrationBody {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  avatar?: string;
}

export const registrationUser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, email, password, confirmPassword } = req.body;

      if (password !== confirmPassword) {
        return next(new ErrorHandler("Passwords do not match", 400));
      }

      const isEmailExist = await userModel.findOne({ email });
      if (isEmailExist) {
        return next(new ErrorHandler("Email already exist", 400));
      }

      const user: IRegistrationBody = {
        name,
        email,
        password,
        confirmPassword,
      };

      const activationToken = createActivationToken(user);
      const activationCode = activationToken.activationCode;

      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);

      const data = { user: { name: user.name }, activationCode };
      const html = await ejs.renderFile(
        path.join(__dirname, "../mails/activationMail.ejs"),
        data
      );

      try {
        await sendMail({
          email: user.email,
          subject: "Activate your account",
          template: "activationMail.ejs",
          data,
        });

        res.status(201).json({
          success: true,
          message: `Please check your email: ${user.email} to activate your account!`,
          activationToken: activationToken.token,
        });
      } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
      }
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

interface IActivationToken {
  token: string;
  activationCode: string;
}

export const createActivationToken = (user: any): IActivationToken => {
  const activationCode = Math.floor(1000 + Math.random() * 9000).toString();

  const token = jwt.sign(
    {
      user,
      activationCode,
    },
    process.env.ACTIVATION_SECRET as Secret,
    {
      expiresIn: "5m",
    }
  );

  return { token, activationCode };
};

// activate user
interface IActivationRequest {
  activation_token: string;
  activation_code: string;
}

export const activateUser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { activation_token, activation_code } =
        req.body as IActivationRequest;

      const newUser: { user: IUser; activationCode: string } = jwt.verify(
        activation_token,
        process.env.ACTIVATION_SECRET as string
      ) as { user: IUser; activationCode: string };

      if (newUser.activationCode !== activation_code) {
        return next(new ErrorHandler("Invalid activation code", 400));
      }

      const { name, email, password } = newUser.user;

      const existUser = await userModel.findOne({ email });

      if (existUser) {
        return next(new ErrorHandler("Email already exist", 400));
      }
      const user = await userModel.create({
        name,
        email,
        password,
      });

      res.status(201).json({
        success: true,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// Login user
interface ILoginRequest {
  email: string;
  password: string;
}

export const loginUser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body as ILoginRequest;

      if (!email || !password) {
        return next(new ErrorHandler("Please enter email and password", 400));
      }

      const user = await userModel.findOne({ email }).select("+password");

      if (!user) {
        return next(new ErrorHandler("Invalid email or password", 400));
      }

      const isPasswordMatch = await user.comparePassword(password);
      if (!isPasswordMatch) {
        return next(new ErrorHandler("Invalid email or password", 400));
      }

      sendToken(user, 200, res);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// logout user
export const logoutUser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.cookie("access_token", "", { maxAge: 1 });
      res.cookie("refresh_token", "", { maxAge: 1 });
      const userId = req.user?._id || "";
      redis.del(userId);

      res.status(200).json({
        success: true,
        message: "Logged out successfully",
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// social auth
interface ISocialAuthBody {
  email: string;
  name: string;
  avatar: string;
}

export const socialAuth = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, name, avatar } = req.body as ISocialAuthBody;
      const user = await userModel.findOne({ email });
      if (!user) {
        const newUser = await userModel.create({ email, name, avatar });
        sendToken(newUser, 200, res);
      } else {
        sendToken(user, 200, res);
      }
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// forgot password with OTP
interface IForgotPasswordBody {
  email?: string;
}

export const forgotPassword = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email } = req.body as IForgotPasswordBody;

      const user = await userModel.findOne({ email });
      if (!user) {
        return next(new ErrorHandler("User not found", 404));
      }

      const passwordResetToken = createOTPToken(user);
      const passwordResetCode = passwordResetToken.passwordResetCode;

      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);

      const data = { user: { name: user.name }, passwordResetCode };

      await sendMail({
        email: user.email,
        subject: "Reset Password OTP",
        template: "forgotPasswordOTPMail.ejs",
        data,
      });

      res.status(200).json({
        success: true,
        message: `OTP sent to: ${user.email}`,
        passwordResetToken: passwordResetToken.token,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

interface IResetPasswordToken {
  token: string;
  passwordResetCode: string;
}

export const createOTPToken = (user: any): IResetPasswordToken => {
  const passwordResetCode = Math.floor(1000 + Math.random() * 9000).toString();

  const token = jwt.sign(
    {
      user,
      passwordResetCode,
    },
    process.env.FORGOT_SECRET as Secret,
    {
      expiresIn: "5m",
    }
  );

  return { token, passwordResetCode };
};

// verify forgot password OTP
interface IForgotPasswordRequest {
  forgot_token: string;
  forgot_code: string;
}

export const forgotPasswordUser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { forgot_token, forgot_code } = req.body as IForgotPasswordRequest;

      const decoded = jwt.verify(
        forgot_token,
        process.env.FORGOT_SECRET as string
      ) as { user: IUser; passwordResetCode: string };

      if (decoded.passwordResetCode !== forgot_code) {
        return next(new ErrorHandler("Invalid OTP", 400));
      }

      const user = await userModel.findById(decoded.user._id);
      if (!user) {
        return next(new ErrorHandler("User not found", 404));
      }

      res.status(200).json({
        success: true,
        userId: user._id,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// set new password
interface INewPassword {
  newPassword: string;
  userId: string;
}

export const newPassword = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { newPassword, userId } = req.body as INewPassword;

      const user = await userModel.findById(userId).select("+password");
      if (!user) {
        return next(new ErrorHandler("User not found", 404));
      }

      user.password = newPassword;
      await user.save();

      res.status(200).json({
        success: true,
        message: "Password updated successfully",
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// update access token
export const updateAccessToken = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const refresh_token = req.headers["refresh-token"] as string;
      const decoded = jwt.verify(
        refresh_token,
        process.env.REFRESH_TOKEN as string
      ) as JwtPayload;

      const message = "Could not refresh token";
      if (!decoded) {
        return next(new ErrorHandler(message, 400));
      }
      const session = await redis.get(decoded.id as string);

      if (!session) {
        return next(
          new ErrorHandler("Please login for access this resources!", 400)
        );
      }

      const user = JSON.parse(session);

      req.user = user;

      await redis.set(user._id, JSON.stringify(user), "EX", 604800);

      return next();
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);