import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { api, API_URL, getToken } from "../api";
import Modal from "./Modal";
import TripForm from "./TripForm";
import ActivityForm from "./ActivityForm";
import ExpenseForm from "./ExpenseForm";
import InviteForm from "./InviteForm";
import GenerateAiForm from "./GenerateAiForm";
import DayForm from "./DayForm";
import Navbar from "./Navbar";
import { formatCurrency } from "../utils";

const typeClass = {
  Sightseeing: "indigo",
  Food: "amber",
  Transport: "blue",
  Hotel: "purple",
  Adventure: "green",
  Other: "gray",
};

const weatherIcon = (code) => {
  if (code === 0) return "☀️";
  if ([1, 2, 3].includes(code)) return "⛅";
  if ([45, 48].includes(code)) return "🌫️";
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "🌧️";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "❄️";
  if ([95, 96, 99].includes(code)) return "⛈️";
  return "🌡️";
};

export default function TripDetail({ tripId, user, back, onNavigate, onLogout }) {
  const [trip, setTrip] = useState(null);
  const [days, setDays] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState(null);
  const [files, setFiles] = useState([]);
  const [weather, setWeather] = useState(null);
  const [weatherError, setWeatherError] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  // modal shapes:
  // "edit" | "invite" | "generate" | "regenerate" | "expense"
  // {type:"activity", day, activity?} | {type:"expense", expense} | {type:"day", day}
  const [modal, setModal] = useState(null);
  const [tab, setTab] = useState("itinerary");
  const socketRef = useRef(null);

  const isOwner = trip && user && String(trip.owner?._id || trip.owner) === String(user._id);
  const ownerId = String(trip?.owner?._id || trip?.owner || "");
  const otherMembers = trip?.members?.filter((m) => String(m._id) !== ownerId) || [];

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
  const loadWeather = () =>
    api(`/trips/${tripId}/weather`)
      .then((w) => {
        setWeather(w);
        setWeatherError("");
      })
      .catch((e) => setWeatherError(e.message));

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

  // Editing a day's description/date, and deleting a whole day (with its
  // activities) -- the backend already supported PATCH/DELETE on itinerary
  // days, but there was no UI for either action.
  const saveDay = (day) => async (form) => {
    await api(`/trips/${tripId}/itinerary/${day._id}`, { method: "PATCH", body: form });
    await loadItinerary();
    notifyItineraryChanged();
    closeModal();
  };

  const deleteDay = async (day) => {
    if (!window.confirm(`Delete Day ${day.dayNumber} and all its activities? This can't be undone.`)) return;
    try {
      await api(`/trips/${tripId}/itinerary/${day._id}`, { method: "DELETE" });
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

  if (!trip) {
    return (
      <main className="page-loading">
        <div className="spinner" />
        <p className="muted">Loading trip…</p>
      </main>
    );
  }

  const spent = summary?.total || 0;
  const budget = trip.budgetLimit || 0;
  const overBudget = budget > 0 && spent > budget;

  return (
    <>
      <Navbar user={user} active="trips" onNavigate={onNavigate} onLogout={onLogout} />
      <main className="page">
        <button className="btn-back" onClick={back}>
          ← All trips
        </button>

        <header className="page-head">
          <div>
            <p className="eyebrow">{trip.destination}</p>
            <h1>{trip.title}</h1>
            {trip.description && <p className="muted">{trip.description}</p>}
          </div>
          <div className="page-head-actions">
            {isOwner && <button className="btn btn-secondary" onClick={() => setModal("edit")}>Edit trip</button>}
            <button className="btn btn-secondary" onClick={shareTrip}>Share</button>
            {isOwner && <button className="btn btn-primary" onClick={() => setModal("invite")}>+ Invite</button>}
          </div>
        </header>

        {notice && <p className="notice">{notice}</p>}
        {error && <p className="error">{error}</p>}

        <div className="member-row">
          <div className="member-row-people">
            <span className="muted">
              With {trip.owner?.fullName || "owner"}
              {otherMembers.length ? ` and ${otherMembers.length} other${otherMembers.length > 1 ? "s" : ""}` : ""}
            </span>
            {otherMembers.length > 0 && (
              <ul className="member-list">
                {otherMembers.map((m) => (
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
          </div>
          {!isOwner && (
            <button className="btn btn-ghost-danger" onClick={leaveTrip}>
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
              {days.length === 0 && <button className="btn btn-secondary" onClick={createDays}>Create itinerary days</button>}
              <button className="btn btn-primary" onClick={() => setModal("generate")} disabled={loading}>
                {loading ? "Generating…" : "✨ Generate with AI"}
              </button>
              {days.length > 0 && (
                <button className="btn btn-ghost" onClick={() => setModal("regenerate")} disabled={loading}>
                  Regenerate with AI
                </button>
              )}
            </div>

            {days.length === 0 && (
              <div className="empty-state">
                <p className="empty-emoji">🗺️</p>
                <p className="muted">No itinerary days yet. Create them manually or let AI plan your trip.</p>
              </div>
            )}

            {days.map((day) => (
              <article className="day-card" key={day._id}>
                <div className="day-card-head">
                  <h2>
                    Day {day.dayNumber} <small>{new Date(day.onDate).toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}</small>
                  </h2>
                  <span className="row-actions">
                    <button className="link" onClick={() => setModal({ type: "day", day })}>Edit day</button>
                    {isOwner && (
                      <button className="link link-danger" onClick={() => deleteDay(day)}>Delete day</button>
                    )}
                  </span>
                </div>
                {day.desc && <p className="muted">{day.desc}</p>}
                {day.activities?.length ? (
                  <ul className="activity-list">
                    {day.activities.map((activity) => (
                      <li key={activity._id}>
                        <div className="activity-line">
                          <span className={`badge badge-${typeClass[activity.type] || "gray"}`}>{activity.type}</span>
                          <strong>{activity.onTime}</strong>
                          <span className="activity-title">{activity.title}</span>
                          <span className="muted">— {activity.location}</span>
                          <span className="row-actions">
                            <button className="link" onClick={() => setModal({ type: "activity", day, activity })}>
                              Edit
                            </button>
                            <button className="link link-danger" onClick={() => deleteActivity(day, activity)}>
                              Delete
                            </button>
                          </span>
                        </div>
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
              <button className="btn btn-primary" onClick={() => setModal("expense")}>+ Add expense</button>
            </div>
            {summary && (
              <div className={`budget-bar ${overBudget ? "over" : ""}`}>
                <p>
                  Spent {formatCurrency(spent)} {budget > 0 && <>of {formatCurrency(budget)} budget</>}
                </p>
                {summary.memberCount > 1 && (
                  <p className="muted small">
                    Equal share: {formatCurrency(summary.perPerson)} per person ({summary.memberCount} members)
                  </p>
                )}
                {budget > 0 && (
                  <div className="bar">
                    <span style={{ width: `${Math.min(100, (spent / budget) * 100)}%` }} />
                  </div>
                )}
                {summary.categories?.length > 0 && (
                  <ul className="category-breakdown">
                    {summary.categories.map((c) => (
                      <li key={c._id}>
                        {c._id}: {formatCurrency(c.total)}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            {expenses.length === 0 ? (
              <div className="empty-state">
                <p className="empty-emoji">💸</p>
                <p className="muted">No expenses logged yet.</p>
              </div>
            ) : (
              <ul className="expense-list">
                {expenses.map((expense) => (
                  <li key={expense._id}>
                    <span className={`badge badge-${typeClass[expense.category] || "gray"}`}>{expense.category}</span>
                    <span className="expense-title">{expense.title}</span>
                    <strong>{formatCurrency(expense.amount)}</strong>
                    {(isOwner || String(expense.addedBy?._id || expense.addedBy) === String(user?._id)) && (
                      <span className="row-actions">
                        <button className="link" onClick={() => setModal({ type: "expense", expense })}>Edit</button>
                        <button className="link link-danger" onClick={() => deleteExpense(expense)}>Delete</button>
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {tab === "files" && (
          <section>
            <div className="section-actions">
              <label className="btn btn-primary file-label">
                + Upload file
                <input type="file" accept="image/*,.pdf" hidden onChange={uploadFile} />
              </label>
            </div>
            {files.length === 0 ? (
              <div className="empty-state">
                <p className="empty-emoji">📎</p>
                <p className="muted">No files uploaded yet.</p>
              </div>
            ) : (
              <ul className="file-list">
                {files.map((file) => (
                  <li key={file._id}>
                    <span className="file-icon">{file.type === "pdf" ? "📄" : "🖼️"}</span>
                    <a href={file.url} target="_blank" rel="noreferrer">
                      {file.name}
                    </a>
                    {(isOwner || String(file.uploadedBy?._id || file.uploadedBy) === String(user?._id)) && (
                      <button className="link link-danger" onClick={() => deleteFile(file)}>Delete</button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {tab === "weather" && (
          <section>
            {weatherError ? (
              <p className="muted">{weatherError}</p>
            ) : weather ? (
              <>
                <h2>{weather.location?.name}</h2>
                {weather.weather?.daily ? (
                  <ul className="weather-list">
                    {weather.weather.daily.time.map((date, i) => (
                      <li key={date}>
                        <span className="weather-icon">{weatherIcon(weather.weather.daily.weather_code[i])}</span>
                        <span>{new Date(date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</span>
                        <strong>
                          {Math.round(weather.weather.daily.temperature_2m_min[i])}°–
                          {Math.round(weather.weather.daily.temperature_2m_max[i])}°F
                        </strong>
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

        {modal?.type === "day" && (
          <Modal title={`Edit Day ${modal.day.dayNumber}`} onClose={closeModal}>
            <DayForm initial={modal.day} onSave={saveDay(modal.day)} onCancel={closeModal} />
          </Modal>
        )}

        {(modal === "expense" || modal?.type === "expense") && (
          <Modal title={modal?.expense ? "Edit expense" : "Add expense"} onClose={closeModal}>
            <ExpenseForm initial={modal?.expense} onSave={saveExpense(modal?.expense)} onCancel={closeModal} />
          </Modal>
        )}
      </main>
    </>
  );
}
