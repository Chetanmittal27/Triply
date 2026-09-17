import { useEffect, useState } from "react";
import { api } from "../api";
import { formatCurrency } from "../utils";

const weatherIcon = (code) => {
  if (code === 0) return "☀️";
  if ([1, 2, 3].includes(code)) return "⛅";
  if ([45, 48].includes(code)) return "🌫️";
  if (
    [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(
      code
    )
  ) {
    return "🌧️";
  }
  if ([71, 73, 75, 77, 85, 86].includes(code)) {
    return "❄️";
  }
  if ([95, 96, 99].includes(code)) {
    return "⛈️";
  }

  return "🌡️";
};

export default function PublicTrip({ shareLink }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api(`/trips/public/${shareLink}`)
      .then(setData)
      .catch((e) => setError(e.message));
  }, [shareLink]);

  if (error) {
    return (
      <main className="page-loading">
        <p className="error">{error}</p>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="page-loading">
        <div className="spinner" />
        <p className="muted">Loading shared trip…</p>
      </main>
    );
  }

  const dailyWeather = data.weather?.weather?.daily;

  return (
    <main className="page public-trip">
      <p className="eyebrow">SHARED TRIP · VIA TRIPLY</p>

      <h1>{data.trip.title}</h1>

      <p className="public-trip-meta">
        📍 {data.trip.destination}

        {data.trip.owner?.fullName && (
          <> · Curated by {data.trip.owner.fullName}</>
        )}
      </p>

      {data.trip.description && (
        <p className="muted">
          {data.trip.description}
        </p>
      )}

      {data.trip.budgetLimit > 0 && (
        <p className="badge badge-indigo">
          Budget: {formatCurrency(data.trip.budgetLimit)}
        </p>
      )}

      {dailyWeather && (
        <section className="trip-section">
          <div className="trip-section-head">
            <h2>
              Weather
              {data.weather.location?.name
                ? ` · ${data.weather.location.name}`
                : ""}
            </h2>
          </div>

          <ul className="weather-list">
            {dailyWeather.time.map((date, i) => (
              <li key={date}>
                <span className="weather-icon">
                  {weatherIcon(
                    dailyWeather.weather_code[i]
                  )}
                </span>

                <span>
                  {new Date(date).toLocaleDateString(
                    undefined,
                    {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    }
                  )}
                </span>

                <strong>
                  {Math.round(
                    dailyWeather.temperature_2m_min[i]
                  )}
                  °–
                  {Math.round(
                    dailyWeather.temperature_2m_max[i]
                  )}
                  °F
                </strong>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="days">
        {data.itinerary.map((day) => (
          <article
            className="day-card"
            key={day._id}
          >
            <h2>
              Day {day.dayNumber}{" "}
              <small>
                {new Date(
                  day.onDate
                ).toLocaleDateString(undefined, {
                  weekday: "long",
                  month: "short",
                  day: "numeric",
                })}
              </small>
            </h2>

            {day.desc && (
              <p className="muted">
                {day.desc}
              </p>
            )}

            <ul className="activity-list">
              {data.activities
                .filter(
                  (activity) =>
                    String(activity.itineraryId) ===
                    String(day._id)
                )
                .map((activity) => (
                  <li key={activity._id}>
                    <div className="activity-line">
                      <strong>
                        {activity.onTime}
                      </strong>

                      <span className="activity-title">
                        {activity.title}
                      </span>

                      <span className="muted">
                        — {activity.location}
                      </span>
                    </div>
                  </li>
                ))}
            </ul>
          </article>
        ))}
      </section>

      <p className="muted small public-trip-footer">
        Made with Triply
      </p>
    </main>
  );
}