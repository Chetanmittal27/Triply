import { ApiError } from "./ApiError.js";

const geocode = async (query) => {
  let response;

  try {
    response = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
        query
      )}&count=5&language=en&format=json`
    );
  } catch {
    return null;
  }

  if (!response.ok) return null;

  const data = await response.json().catch(() => null);

  return data?.results?.[0] || null;
};

export const getWeatherForDestination = async (destination) => {
  const destinationName = destination || "";

  const primarySegment = destinationName.split(",")[0].trim();

  const place =
    (await geocode(destinationName)) ||
    (primarySegment && primarySegment !== destinationName
      ? await geocode(primarySegment)
      : null);

  if (!place) {
    throw new ApiError(
      404,
      `Couldn't find a weather location for "${destinationName}". Try editing the trip's destination to a single city name.`
    );
  }

  let weatherResponse;

  try {
    weatherResponse = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&daily=weather_code,temperature_2m_max,temperature_2m_min&temperature_unit=fahrenheit&timezone=auto`
    );
  } catch {
    throw new ApiError(
      502,
      "Weather service is unreachable right now. Try again shortly."
    );
  }

  if (!weatherResponse.ok) {
    throw new ApiError(
      502,
      "Weather service returned an error. Try again shortly."
    );
  }

  const weather = await weatherResponse.json().catch(() => null);

  if (!weather?.daily) {
    throw new ApiError(
      502,
      "Weather service returned no forecast data."
    );
  }

  return {
    location: place,
    weather,
  };
};