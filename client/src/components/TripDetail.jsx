import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { api, API_URL, getToken } from "../api";
import Modal from "./Modal";
import TripForm from "./TripForm";
import ActivityForm from "./ActivityForm";
import ExpenseForm from "./ExpenseForm";
import InviteForm from "./InviteForm";
import GenerateAiForm from "./GenerateAiForm";

const typeClass = {
  Sightseeing: "indigo",
  Food: "amber",
  Transport: "blue",
  Hotel: "purple",
  Adventure: "green",
  Other: "gray",
};

export default function TripDetail({ tripId, user, back }) {
  const [trip, setTrip] = useState(null);
  const [days, setDays] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState(null);
  const [files, setFiles] = useState([]);
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [modal, setModal] = useState(null); // "edit" | "invite" | "generate" | "regenerate" | {type:"activity", day} | "expense"
  const [tab, setTab] = useState("itinerary");
  const socketRef = useRef(null);

  const isOwner = trip && user && String(trip.owner?._id || trip.owner) === String(user._id);

  const loadTrip = () => api(`/trips/${tripId}`).then(setTrip).catch((e) => setError(e.message));
  const loadItinerary = () => api(`/trips/${tripId}/itinerary`).then(setDays).catch((e) => setError(e.message));
  const loadExpenses = () =>
    Promise.all([api(`/trips/${tripId}/expenses`), api(`/trips/${tripId}/expenses/summary`)])
      .then(([list, sum]) => {
        setExpenses(list);
        setSummary(sum);
      })
      .catch((e) => setError(e.message));
  const loadFiles = () => api(`/trips/${tripId}/files`).then(setFiles).catch((e) => setError(e.message));
  const loadWeather = () => api(`/trips/${tripId}/weather`).then(setWeather).catch((e) => setError(e.message));

  useEffect(() => {
    loadTrip();
    loadItinerary();
    loadExpenses();
    loadFiles();
    loadWeather();
  }, [tripId]);

  // Live itinerary updates: join the trip's room and refresh when a
  // trip-mate changes something, or notify them when we do.
  useEffect(() => {
    const socket = io(API_URL.replace(/\/api\/?$/, ""), { auth: { token: getToken() } });
    socketRef.current = socket;
    socket.emit("trip:join", { tripId });
    socket.on("itinerary:changed", ({ changedBy } = {}) => {
      if (!changedBy || String(changedBy._id) !== String(user._id)) {
        loadItinerary();
      }
    });
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [tripId]);

  const notifyItineraryChanged = () => {
    socketRef.current?.emit("itinerary:changed", { tripId, change: "updated" });
  };

  const closeModal = () => setModal(null);

  const saveTripEdit = async (form) => {
    await api(`/trips/${tripId}`, { method: "PATCH", body: form });
    await loadTrip();
    closeModal();
  };

  const shareTrip = async () => {
    try {
      const result = await api(`/trips/${tripId}/share-link`, { method: "POST" });
      const url = `${window.location.origin}/public/${result.shareLink}`;
      await navigator.clipboard?.writeText(url);
      setNotice(`Share link copied to clipboard: ${url}`);
    } catch (e) {
      setError(e.message);
    }
  };

  const invite = async (email) => {
    await api(`/trips/${tripId}/members`, { method: "POST", body: { email } });
    await loadTrip();
    setNotice("Member added.");
    closeModal();
  };

  const removeMember = async (memberId) => {
    if (!window.confirm("Remove this member from the trip?")) return;
    try {
      await api(`/trips/${tripId}/members/${memberId}`, { method: "DELETE" });
      await loadTrip();
    } catch (e) {
      setError(e.message);
    }
  };

  const leaveTrip = async () => {
    if (!window.confirm("Leave this trip?")) return;
    try {
      await api(`/trips/${tripId}/leave`, { method: "POST" });
      back();
    } catch (e) {
      setError(e.message);
    }
  };

  const createDays = async () => {
    try {
      await api(`/trips/${tripId}/itinerary`, { method: "POST" });
      await loadItinerary();
      notifyItineraryChanged();
    } catch (e) {
      setError(e.message);
    }
  };

  const runGenerate = (regenerate) => async (form) => {
    setLoading(true);
    try {
      await api(`/trips/${tripId}/itinerary/${regenerate ? "regenerate-ai" : "generate-ai"}`, {
        method: "POST",
        body: form,
      });
      await loadItinerary();
      notifyItineraryChanged();
      closeModal();
    } finally {
      setLoading(false);
    }
  };

  const saveActivity = (day, existing) => async (form) => {
    if (existing) {
      await api(`/trips/${tripId}/itinerary/${day._id}/activities/${existing._id}`, { method: "PATCH", body: form });
    } else {
      await api(`/trips/${tripId}/itinerary/${day._id}/activities`, { method: "POST", body: form });
    }
    await loadItinerary();
    notifyItineraryChanged();
    closeModal();
  };

  const deleteActivity = async (day, activity) => {
    if (!window.confirm(`Delete "${activity.title}"?`)) return;
    try {
      await api(`/trips/${tripId}/itinerary/${day._id}/activities/${activity._id}`, { method: "DELETE" });
      await loadItinerary();
      notifyItineraryChanged();
    } catch (e) {
      setError(e.message);
    }
  };

  const saveExpense = (existing) => async (form) => {
    if (existing) {
      await api(`/trips/${tripId}/expenses/${existing._id}`, { method: "PATCH", body: form });
    } else {
      await api(`/trips/${tripId}/expenses`, { method: "POST", body: form });
    }
    await loadExpenses();
    closeModal();
  };

  const deleteExpense = async (expense) => {
    if (!window.confirm(`Delete expense "${expense.title}"?`)) return;
    try {
      await api(`/trips/${tripId}/expenses/${expense._id}`, { method: "DELETE" });
      await loadExpenses();
    } catch (e) {
      setError(e.message);
    }
  };

  const uploadFile = async (event) => {
    const file = event.target.files[0];
    event.target.value = "";
    if (!file) return;
    const body = new FormData();
    body.append("file", file);
    try {
      await api(`/trips/${tripId}/files`, { method: "POST", body });
      await loadFiles();
    } catch (e) {
      setError(e.message);
    }
  };

  const deleteFile = async (file) => {
    if (!window.confirm(`Delete "${file.name}"?`)) return;
    try {
      await api(`/trips/${tripId}/files/${file._id}`, { method: "DELETE" });
      await loadFiles();
    } catch (e) {
      setError(e.message);
    }
  };

  if (!trip) return <main><p className="muted">Loading trip…</p></main>;

  const spent = summary?.total || 0;
  const budget = trip.budgetLimit || 0;
  const overBudget = budget > 0 && spent > budget;

  return (
    <main>
      <button className="link" onClick={back}>
        ← All trips
      </button>

      <header>
        <div>
          <p className="eyebrow">{trip.destination}</p>
          <h1>{trip.title}</h1>
          <p>{trip.description}</p>
        </div>
        <div>
          <button onClick={() => setModal("edit")}>Edit</button>
          <button onClick={shareTrip}>Share</button>
          {isOwner && <button onClick={() => setModal("invite")}>Invite</button>}
        </div>
      </header>

      {notice && <p className="notice">{notice}</p>}
      {error && <p className="error">{error}</p>}

      <div className="member-row">
        <span className="muted">
          With {trip.owner?.fullName || "owner"}
          {trip.members?.length ? ` and ${trip.members.length} other${trip.members.length > 1 ? "s" : ""}` : ""}
        </span>
        {trip.members?.length > 0 && (
          <ul className="member-list">
            {trip.members.map((m) => (
              <li key={m._id}>
                {m.fullName}
                {isOwner && (
                  <button className="icon-btn" onClick={() => removeMember(m._id)} aria-label="Remove member">
                    ×
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
        {!isOwner && (
          <button className="link" onClick={leaveTrip}>
            Leave trip
          </button>
        )}
      </div>

      <nav className="tabs">
        {["itinerary", "expenses", "files", "weather"].map((t) => (
          <button key={t} className={`tab ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>
            {t[0].toUpperCase() + t.slice(1)}
          </button>
        ))}
      </nav>

      {tab === "itinerary" && (
        <section className="days">
          <div className="section-actions">
            {days.length === 0 && <button onClick={createDays}>Create itinerary days</button>}
            <button onClick={() => setModal("generate")} disabled={loading}>
              {loading ? "Generating…" : "Generate with AI"}
            </button>
            {days.length > 0 && (
              <button className="link" onClick={() => setModal("regenerate")} disabled={loading}>
                Regenerate with AI
              </button>
            )}
          </div>

          {days.map((day) => (
            <article key={day._id}>
              <h2>
                Day {day.dayNumber} <small>{new Date(day.onDate).toLocaleDateString()}</small>
              </h2>
              {day.desc && <p className="muted">{day.desc}</p>}
              {day.activities?.length ? (
                <ul className="activity-list">
                  {day.activities.map((activity) => (
                    <li key={activity._id}>
                      <span className={`badge ${typeClass[activity.type] || "gray"}`}>{activity.type}</span>
                      <strong>{activity.onTime}</strong> {activity.title} — {activity.location}
                      <span className="row-actions">
                        <button className="link" onClick={() => setModal({ type: "activity", day, activity })}>
                          Edit
                        </button>
                        <button className="link" onClick={() => deleteActivity(day, activity)}>
                          Delete
                        </button>
                      </span>
                      {activity.desc && <p className="muted small">{activity.desc}</p>}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="muted">No activities yet.</p>
              )}
              <button className="link" onClick={() => setModal({ type: "activity", day })}>
                + Add activity
              </button>
            </article>
          ))}
        </section>
      )}

      {tab === "expenses" && (
        <section>
          <div className="section-actions">
            <button onClick={() => setModal("expense")}>+ Add expense</button>
          </div>
          {summary && (
            <div className={`budget-bar ${overBudget ? "over" : ""}`}>
              <p>
                Spent ₹{spent.toLocaleString()} {budget > 0 && <>of ₹{budget.toLocaleString()} budget</>}
              </p>
              {budget > 0 && (
                <div className="bar">
                  <span style={{ width: `${Math.min(100, (spent / budget) * 100)}%` }} />
                </div>
              )}
              {summary.categories?.length > 0 && (
                <ul className="category-breakdown">
                  {summary.categories.map((c) => (
                    <li key={c._id}>
                      {c._id}: ₹{c.total.toLocaleString()}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          {expenses.length === 0 ? (
            <p className="muted">No expenses logged yet.</p>
          ) : (
            <ul className="expense-list">
              {expenses.map((expense) => (
                <li key={expense._id}>
                  <span className={`badge ${typeClass[expense.category] || "gray"}`}>{expense.category}</span>
                  {expense.title}: ₹{expense.amount.toLocaleString()}
                  <span className="row-actions">
                    <button className="link" onClick={() => setModal({ type: "expense", expense })}>
                      Edit
                    </button>
                    <button className="link" onClick={() => deleteExpense(expense)}>
                      Delete
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {tab === "files" && (
        <section>
          <div className="section-actions">
            <label className="link file-label">
              Upload file
              <input type="file" accept="image/*,.pdf" hidden onChange={uploadFile} />
            </label>
          </div>
          {files.length === 0 ? (
            <p className="muted">No files uploaded yet.</p>
          ) : (
            <ul className="file-list">
              {files.map((file) => (
                <li key={file._id}>
                  <a href={file.url} target="_blank" rel="noreferrer">
                    {file.name}
                  </a>
                  <button className="link" onClick={() => deleteFile(file)}>
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {tab === "weather" && (
        <section>
          {weather ? (
            <>
              <h2>{weather.location?.name}</h2>
              {weather.weather?.daily ? (
                <ul className="weather-list">
                  {weather.weather.daily.time.map((date, i) => (
                    <li key={date}>
                      {new Date(date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}:{" "}
                      {Math.round(weather.weather.daily.temperature_2m_min[i])}°–
                      {Math.round(weather.weather.daily.temperature_2m_max[i])}°
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="muted">Forecast loaded for your destination.</p>
              )}
            </>
          ) : (
            <p className="muted">Loading weather…</p>
          )}
        </section>
      )}

      {modal === "edit" && (
        <Modal title="Edit trip" onClose={closeModal}>
          <TripForm initial={trip} onSave={saveTripEdit} onCancel={closeModal} submitLabel="Save changes" />
        </Modal>
      )}

      {modal === "invite" && (
        <Modal title="Invite a member" onClose={closeModal}>
          <InviteForm onSave={invite} onCancel={closeModal} />
        </Modal>
      )}

      {(modal === "generate" || modal === "regenerate") && (
        <Modal title={modal === "regenerate" ? "Regenerate itinerary" : "Generate itinerary with AI"} onClose={closeModal}>
          <GenerateAiForm regenerate={modal === "regenerate"} onSave={runGenerate(modal === "regenerate")} onCancel={closeModal} />
        </Modal>
      )}

      {modal?.type === "activity" && (
        <Modal title={modal.activity ? "Edit activity" : "Add activity"} onClose={closeModal}>
          <ActivityForm
            destination={trip.destination}
            initial={modal.activity}
            onSave={saveActivity(modal.day, modal.activity)}
            onCancel={closeModal}
          />
        </Modal>
      )}

      {modal === "expense" || modal?.type === "expense" ? (
        <Modal title={modal?.expense ? "Edit expense" : "Add expense"} onClose={closeModal}>
          <ExpenseForm initial={modal?.expense} onSave={saveExpense(modal?.expense)} onCancel={closeModal} />
        </Modal>
      ) : null}
    </main>
  );
}