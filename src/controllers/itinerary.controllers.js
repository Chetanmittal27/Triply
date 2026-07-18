import { Itinerary } from "../models/itinerary.models.js";
import { Activity } from "../models/activity.models.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { getTripForMember, getTripForOwner } from "../utils/tripAccess.js";

const buildDays = (start, end) => {
  const days = [],
    cursor = new Date(start),
    last = new Date(end);
  cursor.setUTCHours(0, 0, 0, 0);
  last.setUTCHours(0, 0, 0, 0);
  if (cursor > last) throw new ApiError(400, "Invalid trip dates");
  for (let dayNumber = 1; cursor <= last; dayNumber += 1) {
    days.push({ dayNumber, onDate: new Date(cursor) });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return days;
};

export const createItinerary = asyncHandler(async (req, res) => {
  const trip = await getTripForMember(req.params.id, req.user._id);
  const days = buildDays(trip.startDate, trip.endDate);
  await Itinerary.bulkWrite(
    days.map((day) => ({
      updateOne: {
        filter: { tripId: trip._id, dayNumber: day.dayNumber },
        update: { $setOnInsert: { ...day, tripId: trip._id } },
        upsert: true,
      },
    }))
  );
  const itinerary = await Itinerary.find({ tripId: trip._id }).sort({
    dayNumber: 1,
  });
  res
    .status(201)
    .json(new ApiResponse(201, itinerary, "Itinerary created successfully"));
});

export const getItinerary = asyncHandler(async (req, res) => {
  await getTripForMember(req.params.id, req.user._id);
  const itinerary = await Itinerary.find({ tripId: req.params.id })
    .sort({ dayNumber: 1 })
    .lean();
  const activities = await Activity.find({
    itineraryId: { $in: itinerary.map((day) => day._id) },
  })
    .sort({ onTime: 1 })
    .lean();
  const result = itinerary.map((day) => ({
    ...day,
    activities: activities.filter(
      (activity) => String(activity.itineraryId) === String(day._id)
    ),
  }));
  res.json(new ApiResponse(200, result, "Itinerary fetched successfully"));
});

export const updateItinerary = asyncHandler(async (req, res) => {
  await getTripForMember(req.params.tripId, req.user._id);
  const itinerary = await Itinerary.findOne({
    _id: req.params.itineraryId,
    tripId: req.params.tripId,
  });
  if (!itinerary) throw new ApiError(404, "Itinerary day not found");
  if (req.body.desc !== undefined) itinerary.desc = req.body.desc;
  if (req.body.onDate !== undefined) itinerary.onDate = req.body.onDate;
  await itinerary.save();
  res.json(new ApiResponse(200, itinerary, "Itinerary updated successfully"));
});

export const deleteItinerary = asyncHandler(async (req, res) => {
  await getTripForOwner(req.params.tripId, req.user._id);
  const itinerary = await Itinerary.findOne({
    _id: req.params.itineraryId,
    tripId: req.params.tripId,
  });
  if (!itinerary) throw new ApiError(404, "Itinerary day not found");
  await Activity.deleteMany({ itineraryId: itinerary._id });
  await itinerary.deleteOne();
  res.json(new ApiResponse(200, {}, "Itinerary day deleted successfully"));
});

// Pinned to a specific, stable free model rather than OpenRouter's
// "openrouter/free" auto-router. The auto-router silently swaps the
// underlying model per request, which makes the "return ONLY valid JSON"
// instruction unreliable across calls. Override with OPENROUTER_MODEL
// in .env if this model is ever retired -- check openrouter.ai/models
// (filter: price = free) for a current replacement.
const DEFAULT_AI_MODEL = "meta-llama/llama-3.3-70b-instruct:free";

const requestAiPlan = async (trip, preferences) => {
  const stripQuotes = (value) => value?.trim().replace(/^["']|["']$/g, "");
  const apiKey = stripQuotes(process.env.OPENROUTER_API_KEY);
  if (!apiKey || apiKey.startsWith("your_"))
    throw new ApiError(
      503,
      "AI itinerary generation is not configured. Set a real OPENROUTER_API_KEY in .env and restart the server."
    );
  const days = buildDays(trip.startDate, trip.endDate);
  const prompt = `Create a practical ${days.length}-day trip itinerary for ${trip.destination}. Interests: ${preferences.interests || "general sightseeing"}. Daily budget: ${preferences.budgetPerDay || "unspecified"}. Travel style: ${preferences.travelStyle || "balanced"}. Return ONLY valid JSON, no markdown fences, no commentary: {"days":[{"dayNumber":1,"description":"...","activities":[{"title":"...","description":"...","location":"...","time":"09:00","type":"Sightseeing"}]}]}. Use each day exactly once.`;
  let response;
  try {
    response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": process.env.FRONTEND_URL || "http://localhost:5173",
        "X-Title": "Triply",
      },
      body: JSON.stringify({
        model: stripQuotes(process.env.OPENROUTER_MODEL) || DEFAULT_AI_MODEL,
        temperature: 0.3,
        max_tokens: 4000,
        messages: [{ role: "user", content: prompt }],
      }),
    });
  } catch {
    throw new ApiError(503, "AI provider is unreachable");
  }
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    // Surface the real reason instead of a generic failure -- invalid/
    // revoked key, rate limit, or unknown model all return different
    // messages here and are worth showing to the user/owner.
    if (response.status === 401)
      throw new ApiError(
        401,
        "AI provider rejected the API key. Check OPENROUTER_API_KEY."
      );
    if (response.status === 429)
      throw new ApiError(
        429,
        "AI provider rate limit reached. Try again in a minute."
      );
    throw new ApiError(
      502,
      payload.error?.message || "AI provider request failed"
    );
  }
  const text = payload.choices?.[0]?.message?.content;
  if (!text) throw new ApiError(502, "AI provider returned no itinerary");
  let plan;
  try {
    plan = JSON.parse(text.replace(/^```json\s*|\s*```$/g, "").trim());
  } catch {
    throw new ApiError(
      502,
      "AI returned an invalid itinerary. Try generating again."
    );
  }
  if (!Array.isArray(plan?.days) || plan.days.length === 0) {
    throw new ApiError(
      502,
      "AI returned an unexpected format. Try generating again."
    );
  }
  return plan;
};
const saveAiPlan = async (trip, plan, userId, replace) => {
  const itinerary = await Itinerary.find({ tripId: trip._id }).sort({
    dayNumber: 1,
  });
  if (itinerary.length === 0) {
    const days = buildDays(trip.startDate, trip.endDate);
    await Itinerary.insertMany(
      days.map((day) => ({ ...day, tripId: trip._id }))
    );
    return saveAiPlan(trip, plan, userId, replace);
  }
  if (replace)
    await Activity.deleteMany({
      itineraryId: { $in: itinerary.map((day) => day._id) },
    });
  const byDay = new Map(itinerary.map((day) => [day.dayNumber, day]));
  const inserts = (plan.days || [])
    .flatMap((day) =>
      (day.activities || []).map((activity) => ({
        itineraryId: byDay.get(day.dayNumber)?._id,
        title: activity.title,
        desc: activity.description || "",
        location: activity.location || trip.destination,
        onTime: activity.time || "09:00",
        type: [
          "Sightseeing",
          "Food",
          "Transport",
          "Hotel",
          "Adventure",
          "Other",
        ].includes(activity.type)
          ? activity.type
          : "Other",
        updatedBy: userId,
      }))
    )
    .filter((activity) => activity.itineraryId && activity.title);
  if (inserts.length) await Activity.insertMany(inserts);
  return itinerary;
};

const generateAi = (replace) =>
  asyncHandler(async (req, res) => {
    const trip = await getTripForMember(req.params.id, req.user._id);
    const plan = await requestAiPlan(trip, req.body);
    const itinerary = await saveAiPlan(trip, plan, req.user._id, replace);
    res.json(
      new ApiResponse(
        200,
        { itinerary, plan },
        replace
          ? "Itinerary regenerated successfully"
          : "Itinerary generated successfully"
      )
    );
  });

export const generateAiItinerary = generateAi(false);
export const regenerateAiItinerary = generateAi(true);
