import { useEffect, useState } from "react";
import { api } from "../api";

export default function PublicTrip({ shareLink }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api(`/trips/public/${shareLink}`).then(setData).catch((e) => setError(e.message));
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

  return (
    <main className="page public-trip">
      <p className="eyebrow">SHARED TRIP · VIA TRIPLY</p>
      <h1>{data.trip.title}</h1>
      <p className="public-trip-meta">
        📍 {data.trip.destination}
        {data.trip.owner?.fullName && <> · Curated by {data.trip.owner.fullName}</>}
      </p>
      {data.trip.description && <p className="muted">{data.trip.description}</p>}
      {data.trip.budgetLimit > 0 && (
        <p className="badge badge-indigo">Budget: ₹{data.trip.budgetLimit.toLocaleString()}</p>
      )}

      <section className="days">
        {data.itinerary.map((day) => (
          <article className="day-card" key={day._id}>
            <h2>
              Day {day.dayNumber} <small>{new Date(day.onDate).toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}</small>
            </h2>
            {day.desc && <p className="muted">{day.desc}</p>}
            <ul className="activity-list">
              {data.activities
                .filter((a) => String(a.itineraryId) === String(day._id))
                .map((a) => (
                  <li key={a._id}>
                    <div className="activity-line">
                      <strong>{a.onTime}</strong>
                      <span className="activity-title">{a.title}</span>
                      <span className="muted">— {a.location}</span>
                    </div>
                  </li>
                ))}
            </ul>
          </article>
        ))}
      </section>

      <p className="muted small public-trip-footer">Made with Triply — plan your own trip at triply.app</p>
    </main>
  );
}
