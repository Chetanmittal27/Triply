import { useEffect, useState } from "react";
import { api } from "../api";
import TripForm from "./TripForm";
import Navbar from "./Navbar";
import Modal from "./Modal";

const statusClass = { "Not Started": "gray", "In Progress": "indigo", Completed: "green" };

export default function Trips({ user, openTrip, onNavigate, onLogout }) {
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
    <>
      <Navbar user={user} active="trips" onNavigate={onNavigate} onLogout={onLogout} />
      <main className="page">
        <header className="page-head">
          <div>
            <p className="eyebrow">YOUR JOURNEYS</p>
            <h1>Trips</h1>
            <p className="muted">Plan, collaborate, and track every trip in one place.</p>
          </div>
          <button className="btn btn-primary" onClick={() => setCreate(true)}>
            + New trip
          </button>
        </header>

        {error && <p className="error">{error}</p>}

        {loading ? (
          <div className="skeleton-grid">
            {[0, 1, 2].map((i) => <div className="skeleton-card" key={i} />)}
          </div>
        ) : trips.length === 0 ? (
          <div className="empty-state">
            <p className="empty-emoji">🧭</p>
            <h2>No trips yet</h2>
            <p className="muted">Start planning your first adventure with Triply.</p>
            <button className="btn btn-primary" onClick={() => setCreate(true)}>
              Create your first trip
            </button>
          </div>
        ) : (
          <section className="grid trip-grid">
            {trips.map((trip) => (
              <article className="trip-card" key={trip._id}>
                <button className="trip-card-body" onClick={() => openTrip(trip)}>
                  <div
                    className="trip-card-cover"
                    style={trip.coverPhoto ? { backgroundImage: `url(${trip.coverPhoto})` } : undefined}
                  >
                    <span className={`badge badge-${statusClass[trip.status] || "gray"}`}>{trip.status}</span>
                  </div>
                  <div className="trip-card-content">
                    <small className="trip-card-dates">
                      {new Date(trip.startDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })} –{" "}
                      {new Date(trip.endDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                    </small>
                    <h2>{trip.title}</h2>
                    <p className="trip-card-destination">📍 {trip.destination}</p>
                  </div>
                </button>
                {String(trip.owner?._id || trip.owner) === String(user._id) && (
                  <button className="btn btn-ghost-danger trip-card-delete" onClick={() => remove(trip._id)}>
                    Delete
                  </button>
                )}
              </article>
            ))}
          </section>
        )}

        {create && (
          <Modal title="Create a new trip" onClose={() => setCreate(false)}>
            <TripForm onSave={save} onCancel={() => setCreate(false)} submitLabel="Create trip" />
          </Modal>
        )}
      </main>
    </>
  );
}
