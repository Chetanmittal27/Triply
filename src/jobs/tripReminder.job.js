import cron from "node-cron";
import { Trip } from "../models/trip.models.js";
import { sendEmail } from "../utils/sendEmails.js";

export const startTripReminderJob = () => cron.schedule("0 9 * * *", async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const reminderStart = new Date(today);
    reminderStart.setDate(reminderStart.getDate() + 3);
    reminderStart.setHours(0, 0, 0, 0);

    const reminderEnd = new Date(reminderStart);
    reminderEnd.setDate(reminderEnd.getDate() + 1);
    reminderEnd.setHours(0, 0, 0, 0);

    const trips = await Trip.find({
        startDate: { $gte: reminderStart, $lt: reminderEnd },
        threeDayReminderSentAt: null,
    }).populate("owner members", "email fullName");

    for (const trip of trips) {
        const recipients = [...new Map([trip.owner, ...trip.members].filter(Boolean).map((user) => [String(user._id), user])).values()].map((user) => user.email);
        await Promise.all(recipients.map((to) => sendEmail({
            to,
            subject: `Triply reminder: ${trip.title} starts in 3 days`,
            html: `<h2>${trip.title}</h2><p>Your trip to ${trip.destination} starts on ${new Date(trip.startDate).toLocaleDateString()}.</p>`,
        })));
        trip.threeDayReminderSentAt = new Date();
        await trip.save();
    }

    const now = new Date();
    const activeTrips = await Trip.find({
        startDate: { $lte: now },
        endDate: { $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0) },
    }).populate("owner members", "email fullName");

    for (const trip of activeTrips) {
        const recipients = [...new Map([trip.owner, ...trip.members].filter(Boolean).map((user) => [String(user._id), user])).values()].map((user) => user.email);
        await Promise.all(recipients.map((to) => sendEmail({
            to,
            subject: `Triply reminder: ${trip.title}`,
            html: `<h2>${trip.title}</h2><p>Your trip to ${trip.destination} is currently in progress. Check Triply for today's itinerary and updates.</p>`,
        })));
    }
}, { timezone: process.env.TZ || "Asia/Kolkata" });
