import { v2 as cloudinary } from "cloudinary";
import { app } from "./app";
import connectDB from "./utils/db";
import dotenv from "dotenv";
import swaggerDocs from "./setupSwagger";
dotenv.config();
// cloudinary config
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_SECRET_KEY,
});
// Define port with fallback
const PORT = process.env.PORT;
// create server
app.listen(PORT, () => {
    console.log(`Server is connected with port ${PORT}`);
    swaggerDocs(app, Number(PORT));
    connectDB();
});
