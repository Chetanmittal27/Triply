import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { User } from "./models/user.models.js";
import { Trip } from "./models/trip.models.js";

export const createSocketServer = (httpServer) => {
    const io = new Server(httpServer, { cors: { origin: process.env.CORS_ORIGIN || "http://localhost:5173", credentials: true } });
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth?.token || socket.handshake.headers.authorization?.replace("Bearer ", "");
            if (!token) throw new Error("Authentication required");
            const { _id } = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
            const user = await User.findById(_id).select("_id username fullName");
            if (!user) throw new Error("Invalid token");
            socket.user = user; next();
        } catch { next(new Error("Unauthorized")); }
    });
    io.on("connection", (socket) => {
        socket.on("trip:join", async ({ tripId }) => {
            const trip = await Trip.findOne({ _id: tripId, $or: [{ owner: socket.user._id }, { members: socket.user._id }] });
            if (!trip) return socket.emit("trip:error", { message: "You cannot join this trip" });
            socket.join(`trip:${tripId}`); socket.emit("trip:joined", { tripId });
        });
        socket.on("itinerary:changed", async ({ tripId, change }) => {
            const trip = await Trip.findOne({ _id: tripId, $or: [{ owner: socket.user._id }, { members: socket.user._id }] });
            if (trip) socket.to(`trip:${tripId}`).emit("itinerary:changed", { change, changedBy: socket.user });
        });
    });
    return io;
};
