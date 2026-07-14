import mongoose from "mongoose";
import { DB_NAME } from "../contants.js";

const ConnectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, { dbName: DB_NAME, serverSelectionTimeoutMS: 10000, connectTimeoutMS: 10000 });
        console.log("MongoDB connected successfully");
        console.log("Host:", mongoose.connection.host);
        console.log("Database:", mongoose.connection.name);
    } catch (error) {
        console.error("Database connection failed:", error.message);
        throw error;
    }
};

export default ConnectDB;
