import { v2 as cloudinary } from "cloudinary";
import { app } from "./app";
import connectDB from "./utils/db";
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_SECRET_KEY,
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`
    🚀 Server is running!
    🔊 Listening on port ${PORT}
  `);

  connectDB();
});

const gracefulShutdown = () => {
  console.log("Starting graceful shutdown...");
  server.close(() => {
    console.log("Graceful shutdown completed");
    process.exit(0);
  });

  setTimeout(() => {
    console.log("Graceful shutdown timeout, forcing shutdown...");
    process.exit(1);
  }, 30000);
};

process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);