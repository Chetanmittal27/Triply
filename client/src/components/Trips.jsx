import { useEffect, useState } from "react";
import { api } from "../api";
import TripForm from "./TripForm";
import Navbar from "./Navbar";
import Modal from "./Modal";

const statusClass = {
  "Not Started": "gray",
  "In Progress": "indigo",
  Completed: "green",
};

const isPastTrip = (trip) => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  return (
    trip.status === "Completed" ||
    new Date(trip.endDate) < todayStart
  );
};

function TripCard({ trip, isOwner, onOpen, onDelete }) {
  const pastTrip = isPastTrip(trip);

  const displayStatus = pastTrip ? "Completed" : trip.status;

  return (
    <article className="trip-card">
      <button className="trip-card-body" onClick={onOpen}>
        <div
          className="trip-card-cover"
          style={
            trip.coverPhoto
              ? { backgroundImage: `url(${trip.coverPhoto})` }
              : undefined
          }
        >
          <span
            className={`badge badge-${
              statusClass[displayStatus] || "gray"
            }`}
          >
            {displayStatus}
          </span>
        </div>

        <div className="trip-card-content">
          <small className="trip-card-dates">
            {new Date(trip.startDate).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            })}{" "}
            –{" "}
            {new Date(trip.endDate).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </small>

          <h2>{trip.title}</h2>

          <p className="trip-card-destination">
            📍 {trip.destination}
          </p>
        </div>
      </button>

      {isOwner && (
        <button
          className="btn btn-ghost-danger trip-card-delete"
          onClick={onDelete}
        >
          Delete
        </button>
      )}
    </article>
  );
}

export default function Trips({
  user,
  openTrip,
  onNavigate,
  onLogout,
}) {
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
    await api("/trips", {
      method: "POST",
      body: form,
    });

    setCreate(false);
    load();
  };

  const remove = async (id) => {
    if (
      !window.confirm(
        "Delete this trip and its itinerary? This can't be undone."
      )
    ) {
      return;
    }

    try {
      await api(`/trips/${id}`, {
        method: "DELETE",
      });

      load();
    } catch (e) {
      setError(e.message);
    }
  };

  // Active & Upcoming first (soonest start date first)
  // Past trips most recently finished first.
  const activeTrips = trips
    .filter((trip) => !isPastTrip(trip))
    .sort(
      (a, b) =>
        new Date(a.startDate) - new Date(b.startDate)
    );

  const pastTrips = trips
    .filter(isPastTrip)
    .sort(
      (a, b) =>
        new Date(b.endDate) - new Date(a.endDate)
    );

  const renderGrid = (list, emptyText) =>
    list.length === 0 ? (
      <p className="muted section-empty">{emptyText}</p>
    ) : (
      <section className="grid trip-grid">
        {list.map((trip) => (
          <TripCard
            key={trip._id}
            trip={trip}
            isOwner={
              String(trip.owner?._id || trip.owner) ===
              String(user._id)
            }
            onOpen={() => openTrip(trip)}
            onDelete={() => remove(trip._id)}
          />
        ))}
      </section>
    );

  return (
    <>
      <Navbar
        user={user}
        active="trips"
        onNavigate={onNavigate}
        onLogout={onLogout}
      />

      <main className="page">
        <header className="page-head">
          <div>
            <p className="eyebrow">YOUR JOURNEYS</p>

            <h1>Trips</h1>

            <p className="muted">
              Plan, collaborate, and track every trip in one place.
            </p>
          </div>

          <button
            className="btn btn-primary"
            onClick={() => setCreate(true)}
          >
            + New trip
          </button>
        </header>

        {error && <p className="error">{error}</p>}

        {loading ? (
          <div className="skeleton-grid">
            {[0, 1, 2].map((i) => (
              <div
                className="skeleton-card"
                key={i}
              />
            ))}
          </div>
        ) : trips.length === 0 ? (
          <div className="empty-state">
            <p className="empty-emoji">🧭</p>

            <h2>No trips yet</h2>

            <p className="muted">
              Start planning your first adventure with Triply.
            </p>

            <button
              className="btn btn-primary"
              onClick={() => setCreate(true)}
            >
              Create your first trip
            </button>
          </div>
        ) : (
          <>
            <section className="trip-section">
              <div className="trip-section-head">
                <h2>Active &amp; Upcoming Trips</h2>

                <span className="badge badge-indigo">
                  {activeTrips.length}
                </span>
              </div>

              {renderGrid(
                activeTrips,
                "No active or upcoming trips right now."
              )}
            </section>

            <section className="trip-section">
              <div className="trip-section-head">
                <h2>Past Trips</h2>

                <span className="badge badge-gray">
                  {pastTrips.length}
                </span>
              </div>

              {renderGrid(
                pastTrips,
                "Your finished trips will show up here."
              )}
            </section>
          </>
        )}

        {create && (
          <Modal
            title="Create a new trip"
            onClose={() => setCreate(false)}
          >
            <TripForm
              onSave={save}
              onCancel={() => setCreate(false)}
              submitLabel="Create trip"
            />
          </Modal>
        )}
      </main>
    </>
  );
}