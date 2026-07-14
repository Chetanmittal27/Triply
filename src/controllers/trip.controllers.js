import crypto from "crypto";
import { Trip } from "../models/trip.models.js";
import { Itinerary } from "../models/itinerary.models.js";
import { Activity } from "../models/activity.models.js";
import { Expense } from "../models/expense.models.js";
import { File } from "../models/file.models.js";
import { User } from "../models/user.models.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { getTripForMember, getTripForOwner } from "../utils/tripAccess.js";

const dateRange = (start, end) => {
    const dates = [];
    const cursor = new Date(start); cursor.setUTCHours(0, 0, 0, 0);
    const last = new Date(end); last.setUTCHours(0, 0, 0, 0);
    if (cursor > last) throw new ApiError(400, "endDate must be on or after startDate");
    while (cursor <= last) { dates.push(new Date(cursor)); cursor.setUTCDate(cursor.getUTCDate() + 1); }
    return dates;
};

export const createTrip = asyncHandler(async (req, res) => {
    const { title, description, destination, startDate, endDate, coverPhoto, budgetLimit } = req.body;
    if (!title || !destination || !startDate || !endDate) throw new ApiError(400, "title, destination, startDate and endDate are required");
    dateRange(startDate, endDate);
    const trip = await Trip.create({ title, description, destination, startDate, endDate, coverPhoto, budgetLimit, owner: req.user._id, members: [req.user._id] });
    res.status(201).json(new ApiResponse(201, trip, "Trip created successfully"));
});

export const getAllTrips = asyncHandler(async (req, res) => {
    const trips = await Trip.find({ $or: [{ owner: req.user._id }, { members: req.user._id }] }).sort({ startDate: 1 }).populate("owner", "username fullName avatar");
    res.json(new ApiResponse(200, trips, "Trips fetched successfully"));
});

export const getTripById = asyncHandler(async (req, res) => {
    await getTripForMember(req.params.id, req.user._id);
    const trip = await Trip.findById(req.params.id).populate("owner members", "username fullName avatar email");
    res.json(new ApiResponse(200, trip, "Trip fetched successfully"));
});

export const updateTrip = asyncHandler(async (req, res) => {
    const trip = await getTripForOwner(req.params.id, req.user._id);
    const allowed = ["title", "description", "destination", "startDate", "endDate", "coverPhoto", "budgetLimit", "status"];
    for (const key of allowed) if (req.body[key] !== undefined) trip[key] = req.body[key];
    if (trip.isModified("startDate") || trip.isModified("endDate")) dateRange(trip.startDate, trip.endDate);
    await trip.save();
    res.json(new ApiResponse(200, trip, "Trip updated successfully"));
});

export const deleteTrip = asyncHandler(async (req, res) => {
    const trip = await getTripForOwner(req.params.id, req.user._id);
    const itineraries = await Itinerary.find({ tripId: trip._id }).select("_id");
    await Promise.all([Activity.deleteMany({ itineraryId: { $in: itineraries.map((item) => item._id) } }), Itinerary.deleteMany({ tripId: trip._id }), Expense.deleteMany({ tripId: trip._id }), File.deleteMany({ tripId: trip._id }), trip.deleteOne()]);
    res.json(new ApiResponse(200, {}, "Trip deleted successfully"));
});

export const inviteMember = asyncHandler(async (req, res) => {
    const trip = await getTripForOwner(req.params.id, req.user._id);
    const { email, userId } = req.body;
    if (!email && !userId) throw new ApiError(400, "email or userId is required");
    const user = await User.findOne(email ? { email: email.toLowerCase() } : { _id: userId });
    if (!user) throw new ApiError(404, "User not found");
    if (!trip.members.some((member) => member.equals(user._id))) trip.members.push(user._id);
    await trip.save();
    res.json(new ApiResponse(200, trip, "Member invited successfully"));
});

export const removeMember = asyncHandler(async (req, res) => {
    const trip = await getTripForOwner(req.params.id, req.user._id);
    if (trip.owner.equals(req.params.userId)) throw new ApiError(400, "The trip owner cannot be removed");
    trip.members = trip.members.filter((member) => !member.equals(req.params.userId));
    await trip.save(); res.json(new ApiResponse(200, trip, "Member removed successfully"));
});

export const leaveTrip = asyncHandler(async (req, res) => {
    const trip = await getTripForMember(req.params.id, req.user._id);
    if (trip.owner.equals(req.user._id)) throw new ApiError(400, "The trip owner cannot leave; transfer or delete the trip instead");
    trip.members = trip.members.filter((member) => !member.equals(req.user._id)); await trip.save();
    res.json(new ApiResponse(200, {}, "You left the trip"));
});

export const generateShareLink = asyncHandler(async (req, res) => {
    const trip = await getTripForOwner(req.params.id, req.user._id);
    trip.shareLink = crypto.randomBytes(24).toString("hex"); await trip.save();
    res.json(new ApiResponse(200, { shareLink: trip.shareLink }, "Share link generated"));
});

export const getPublicTrip = asyncHandler(async (req, res) => {
    const trip = await Trip.findOne({ shareLink: req.params.shareLink }).select("-members").populate("owner", "username fullName avatar");
    if (!trip) throw new ApiError(404, "Public trip not found");
    const itinerary = await Itinerary.find({ tripId: trip._id }).sort({ dayNumber: 1 });
    const activities = await Activity.find({ itineraryId: { $in: itinerary.map((item) => item._id) } }).sort({ onTime: 1 });
    res.json(new ApiResponse(200, { trip, itinerary, activities }, "Public trip fetched successfully"));
});
