import express from "express";
const app = express();

// dotenv is import so that all the environment variables are loaded before the server starts
import dotenv from "dotenv";
import ConnectDB from "./db/index.js";
dotenv.config({
    path: "./config/.env"
});


const port = process.env.PORT || 2000;

ConnectDB()
.then(() => {
    app.listen(port , () => {
        console.log(`App is listening on the port ${port}`);
    });
})
.catch((error) => {
    console.log("Database Connection Failed..." , error.message);
});