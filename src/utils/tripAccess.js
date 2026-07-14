import { Trip } from "../models/trip.models.js";
import { ApiError } from "./ApiError.js";

export const getTripForMember = async (tripId, userId) => {
    const trip = await Trip.findById(tripId);
    if (!trip) throw new ApiError(404, "Trip not found");
    const isMember = trip.owner.equals(userId) || trip.members.some((member) => member.equals(userId));
    if (!isMember) throw new ApiError(403, "You do not have access to this trip");
    return trip;
};

export const getTripForOwner = async (tripId, userId) => {
    const trip = await getTripForMember(tripId, userId);
    if (!trip.owner.equals(userId)) throw new ApiError(403, "Only the trip owner can do this");
    return trip;
};
