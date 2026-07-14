import { Activity } from "../models/activity.models.js";
import { Itinerary } from "../models/itinerary.models.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { getTripForMember } from "../utils/tripAccess.js";
const getDay = async (tripId, itineraryId, userId) => {
  await getTripForMember(tripId, userId);
  const day = await Itinerary.findOne({ _id: itineraryId, tripId });
  if (!day) throw new ApiError(404, "Itinerary day not found");
  return day;
};
export const addActivity = asyncHandler(async (req, res) => {
  const day = await getDay(
    req.params.tripId,
    req.params.itineraryId,
    req.user._id,
  );
  const { title, desc, location, onTime, type } = req.body;
  if (!title || !location || !onTime)
    throw new ApiError(400, "title, location and onTime are required");
  const activity = await Activity.create({
    itineraryId: day._id,
    title,
    desc,
    location,
    onTime,
    type,
    updatedBy: req.user._id,
  });
  res
    .status(201)
    .json(new ApiResponse(201, activity, "Activity added successfully"));
});
export const getActivities = asyncHandler(async (req, res) => {
  await getDay(req.params.tripId, req.params.itineraryId, req.user._id);
  const activities = await Activity.find({
    itineraryId: req.params.itineraryId,
  }).sort({ onTime: 1 });
  res.json(new ApiResponse(200, activities, "Activities fetched successfully"));
});
export const updateActivity = asyncHandler(async (req, res) => {
  await getTripForMember(req.params.tripId, req.user._id);
  const activity = await Activity.findOne({
    _id: req.params.activityId,
    itineraryId: req.params.itineraryId,
  });
  if (!activity) throw new ApiError(404, "Activity not found");
  ["title", "desc", "location", "onTime", "type"].forEach((key) => {
    if (req.body[key] !== undefined) activity[key] = req.body[key];
  });
  activity.updatedBy = req.user._id;
  await activity.save();
  res.json(new ApiResponse(200, activity, "Activity updated successfully"));
});
export const deleteActivity = asyncHandler(async (req, res) => {
  await getTripForMember(req.params.tripId, req.user._id);
  const activity = await Activity.findOneAndDelete({
    _id: req.params.activityId,
    itineraryId: req.params.itineraryId,
  });
  if (!activity) throw new ApiError(404, "Activity not found");
  res.json(new ApiResponse(200, {}, "Activity deleted successfully"));
});
