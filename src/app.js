import express from "express";
import cors from "cors"
import cookieParser from "cookie-parser";

const app = express();

app.use(cors({
    origin: "http://localhost:4000",
    credentials: true
}));

// server will accept json data and max size of json body is 10kb
app.use(express.json({limit: "10kb"}));

// converts form data into javascipt object that can be accessed using req.body
app.use(express.urlencoded({limit: "10kb"}));

// makes use of cookies easy in application
app.use(cookieParser());

//exposes files in a directory over HTTP
express.static("public/temp")



// Routes
import userRouter from "./routes/user.routes.js"

app.use("/api/users" , userRouter);

export default app;