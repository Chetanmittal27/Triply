import { useEffect, useState } from "react";
import { api } from "../api";
import TripForm from "./TripForm";

const statusClass = { "Not Started": "gray", "In Progress": "indigo", Completed: "green" };

export default function Trips({ openTrip, onLogout }) {
  const [trips, setTrips] = useState([]);
  const [create, setCreate] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api("/trips")
      .then(setTrips)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const save = async (form) => {
    await api("/trips", { method: "POST", body: form });
    setCreate(false);
    load();
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this trip and its itinerary? This can't be undone.")) return;
    try {
      await api(`/trips/${id}`, { method: "DELETE" });
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <main>
      <header>
        <div>
          <p className="eyebrow">YOUR JOURNEYS</p>
          <h1>Trips</h1>
        </div>
        <div>
          <button onClick={() => setCreate(!create)}>{create ? "Close form" : "+ New trip"}</button>
          <button className="link" onClick={onLogout}>
            Sign out
          </button>
        </div>
      </header>

      {create && <TripForm onSave={save} onCancel={() => setCreate(false)} submitLabel="Create trip" />}
      {error && <p className="error">{error}</p>}

      {loading ? (
        <p className="muted">Loading trips…</p>
      ) : trips.length === 0 ? (
        <p className="muted">No trips yet — start by creating one.</p>
      ) : (
        <section className="grid">
          {trips.map((trip) => (
            <article className="trip-card" key={trip._id}>
              <button className="trip-card-body" onClick={() => openTrip(trip)}>
                <span className={`badge ${statusClass[trip.status] || "gray"}`}>{trip.status}</span>
                <small>
                  {new Date(trip.startDate).toLocaleDateString()} – {new Date(trip.endDate).toLocaleDateString()}
                </small>
                <h2>{trip.title}</h2>
                <p>{trip.destination}</p>
              </button>
              <button className="link" onClick={() => remove(trip._id)}>
                Delete
              </button>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
