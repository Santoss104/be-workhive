import dotenv from "dotenv";
import express from "express";
export const app = express();
import cors from "cors";
import cookieParser from "cookie-parser";
import { ErrorMiddleware } from "./middleware/error";
import swaggerUi from "swagger-ui-express";
import swaggerDocs from "./setupSwagger";
import userRouter from "./routes/userRoute";
import productRouter from "./routes/productRoute";
import orderRouter from "./routes/orderRoute";
import notificationRouter from "./routes/notificationRoute";
dotenv.config();
// body parser
app.use(express.json({ limit: "50mb" }));
// cookie parser
app.use(cookieParser());
// cors
app.use(cors({
    origin: process.env.ORIGIN,
}));
// Swagger UI
app.use("/docs", swaggerUi.serve);
app.get("/docs", swaggerUi.setup(swaggerDocs, {
    customCss: ".swagger-ui .topbar { display: none }",
}));
// routes
app.use("/api/v1/users", userRouter);
app.use("/api/v1/products", productRouter);
app.use("/api/v1/orders", orderRouter);
app.use("/api/v1/notifications", notificationRouter);
// testing api
app.get("/test", (req, res, next) => {
    res.status(200).json({
        success: true,
        message: "API is Working",
    });
});
// unknown route
app.all("*", (req, res, next) => {
    const err = new Error(`Route ${req.originalUrl} not found`);
    err.statusCode = 404;
    next(err);
});
// middleware calls
app.use(ErrorMiddleware);
