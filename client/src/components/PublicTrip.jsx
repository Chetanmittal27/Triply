import { useEffect, useState } from "react";
import { api } from "../api";

export default function PublicTrip({ shareLink }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api(`/trips/public/${shareLink}`).then(setData).catch((e) => setError(e.message));
  }, [shareLink]);

  if (error) return <main><p className="error">{error}</p></main>;
  if (!data) return <main><p className="muted">Loading shared trip…</p></main>;

  return (
    <main>
      <p className="eyebrow">SHARED TRIP</p>
      <h1>{data.trip.title}</h1>
      <p>{data.trip.destination}</p>
      <p>{data.trip.description}</p>
      <section className="days">
        {data.itinerary.map((day) => (
          <article key={day._id}>
            <h2>Day {day.dayNumber}</h2>
            <ul>
              {data.activities
                .filter((a) => String(a.itineraryId) === String(day._id))
                .map((a) => (
                  <li key={a._id}>
                    <strong>{a.onTime}</strong> {a.title} — {a.location}
                  </li>
                ))}
            </ul>
          </article>
        ))}
      </section>
    </main>
  );
}
