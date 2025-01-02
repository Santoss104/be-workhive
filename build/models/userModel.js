import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
dotenv.config();
const emailRegexPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please enter your name"],
    },
    email: {
        type: String,
        required: [true, "Please enter your email"],
        validate: {
            validator: function (value) {
                return emailRegexPattern.test(value);
            },
            message: "please enter a valid email",
        },
        unique: true,
    },
    password: {
        type: String,
        minlength: [6, "Password must be at least 6 characters"],
        select: false,
    },
    avatar: {
        public_id: String,
        url: String,
    },
    role: {
        type: String,
        enum: ["user", "seller", "admin"],
        default: "user",
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    transactions: [
        {
            productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
            amount: Number,
            status: {
                type: String,
                enum: ["pending", "completed", "cancelled"],
                default: "pending",
            },
            date: { type: Date, default: Date.now },
            paymentMethod: { type: String, required: true },
        },
    ],
    orders: [
        {
            orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
            productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
            quantity: { type: Number, required: true },
            status: {
                type: String,
                enum: ["pending", "completed", "cancelled"],
                default: "pending",
            },
            totalPrice: { type: Number, required: true },
            orderDate: { type: Date, default: Date.now },
        },
    ],
    tasks: [
        {
            taskId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
            description: String,
            status: String,
        },
    ],
}, { timestamps: true });
// Hash Password before saving
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) {
        next();
    }
    this.password = await bcrypt.hash(this.password, 10);
    next();
});
// sign access token
userSchema.methods.SignAccessToken = function () {
    return jwt.sign({ id: this._id }, process.env.ACCESS_TOKEN || '', {
        expiresIn: "5m",
    });
};
// sign refresh token
userSchema.methods.SignRefreshToken = function () {
    return jwt.sign({ id: this._id }, process.env.REFRESH_TOKEN || '', {
        expiresIn: "3d",
    });
};
// compare password
userSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};
const userModel = mongoose.model("User", userSchema);
export default userModel;
