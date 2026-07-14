import http from "http";
import app from "./app.js";
import dotenv from "dotenv";
import ConnectDB from "./db/index.js";
import { createSocketServer } from "./socket.js";
import { startTripReminderJob } from "./jobs/tripReminder.job.js";
dotenv.config();
const port = process.env.PORT || 2000;
ConnectDB().then(() => { const server = http.createServer(app); createSocketServer(server); startTripReminderJob(); server.listen(port, () => console.log(`Triply API listening on port ${port}`)); }).catch((error) => console.log("Database connection failed:", error.message));
