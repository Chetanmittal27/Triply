import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import authRouter from "./routes/auth.routes.js";
import userRouter from "./routes/user.routes.js";
import tripRouter from "./routes/trip.routes.js";
import itineraryRouter from "./routes/itinerary.routes.js";
import activityRouter from "./routes/activity.routes.js";
import expenseRouter from "./routes/expense.routes.js";
import fileRouter from "./routes/file.routes.js";
import weatherRouter from "./routes/weather.routes.js";
dotenv.config();

const app = express();

// Required on Render/behind any reverse proxy, otherwise req.ip is the
// proxy's IP for every request and rate limiting groups all users together.
app.set("trust proxy", 1);

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);

// app.options("*", cors({
//   origin: process.env.CORS_ORIGIN || "http://localhost:5173",
//   credentials: true,
// }));


app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(cookieParser());
app.use("/public", express.static("public"));
app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);
app.use("/api/trips", tripRouter);
app.use("/api/trips", itineraryRouter);
app.use("/api/trips", activityRouter);
app.use("/api/trips", expenseRouter);
app.use("/api/trips", fileRouter);
app.use("/api/trips", weatherRouter);
app.use((req, res) => res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}`, data: null }));
app.use((err, req, res, next) => {
  const status = err.statusCode || err.status || 500;
  res
    .status(status)
    .json({
      statusCode: status,
      data: null,
      message: err.message || "Internal server error",
      errors: err.errors || [],
    });
});
export default app;