import cron from "node-cron";
import { Trip } from "../models/trip.models.js";
import { sendEmail } from "../utils/sendEmails.js";

export const startTripReminderJob = () => cron.schedule("0 9 * * *", async () => {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const end = new Date(start); end.setDate(end.getDate() + 3);
    const trips = await Trip.find({ startDate: { $gte: start, $lt: new Date(end.getTime() + 86400000) }, threeDayReminderSentAt: null }).populate("owner members", "email fullName");
    for (const trip of trips) {
        const recipients = [...new Map([trip.owner, ...trip.members].filter(Boolean).map((user) => [String(user._id), user])).values()].map((user) => user.email);
        await Promise.all(recipients.map((to) => sendEmail({ to, subject: `Triply reminder: ${trip.title} starts in 3 days`, html: `<h2>${trip.title}</h2><p>Your trip to ${trip.destination} starts on ${new Date(trip.startDate).toLocaleDateString()}.</p>` })));
        trip.threeDayReminderSentAt = new Date(); await trip.save();
    }
}, { timezone: process.env.TZ || "Asia/Kolkata" });
