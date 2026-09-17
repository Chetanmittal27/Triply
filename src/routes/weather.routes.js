import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { getTripForMember } from "../utils/tripAccess.js";

const router = Router();

const geocode = async (query) => {
  let response;
  try {
    response = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`
    );
  } catch {
    return null;
  }
  if (!response.ok) return null;
  const data = await response.json().catch(() => null);
  return data?.results?.[0] || null;
};

router.get("/:tripId/weather", verifyJWT, asyncHandler(async (req, res) => {
  const trip = await getTripForMember(req.params.tripId, req.user._id);
  const destination = trip.destination || "";

  // Destinations are often stored as "City, Country" (e.g. "Goa, India"),
  // but Open-Meteo's geocoder matches best on a plain place name. Try the
  // full string first, then fall back to just the part before the comma.
  const primarySegment = destination.split(",")[0].trim();
  const place =
    (await geocode(destination)) ||
    (primarySegment && primarySegment !== destination ? await geocode(primarySegment) : null);

  if (!place) {
    throw new ApiError(404, `Couldn't find a weather location for "${destination}". Try editing the trip's destination to a single city name.`);
  }

  let weatherResponse;
  try {
    weatherResponse = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`
    );
  } catch {
    throw new ApiError(502, "Weather service is unreachable right now. Try again shortly.");
  }
  if (!weatherResponse.ok) {
    throw new ApiError(502, "Weather service returned an error. Try again shortly.");
  }
  const weather = await weatherResponse.json().catch(() => null);
  if (!weather?.daily) {
    throw new ApiError(502, "Weather service returned no forecast data.");
  }

  res.json(new ApiResponse(200, { location: place, weather }, "Weather fetched successfully"));
}));

export default router;