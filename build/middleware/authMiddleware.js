import { CatchAsyncError } from "./catchAsyncErrors";
import ErrorHandler from "../utils/errorHandler";
import jwt from "jsonwebtoken";
import { redis } from "../utils/redis";
import { updateAccessToken } from "../controllers/userController";
// authenticated user
export const isAutheticated = CatchAsyncError(async (req, res, next) => {
    const access_token = req.headers["access-token"] || req.cookies.access_token;
    if (!access_token) {
        return next(new ErrorHandler("Please login to access this resource", 400));
    }
    const decoded = jwt.decode(access_token);
    if (!decoded) {
        return next(new ErrorHandler("access token is not valid", 400));
    }
    // check if the access token is expired
    if (decoded.exp && decoded.exp <= Date.now() / 1000) {
        try {
            await updateAccessToken(req, res, next);
        }
        catch (error) {
            return next(error);
        }
    }
    else {
        const user = await redis.get(decoded.id);
        if (!user) {
            return next(new ErrorHandler("Please login to access this resource", 400));
        }
        req.user = JSON.parse(user);
        next();
    }
});
// validate user role
export const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user?.role || '')) {
            return next(new ErrorHandler(`Role: ${req.user?.role} is not allowed to access this resource`, 403));
        }
        next();
    };
};
