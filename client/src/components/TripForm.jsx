import { useState } from "react";

const emptyTrip = {
  title: "",
  destination: "",
  startDate: "",
  endDate: "",
  description: "",
  budgetLimit: "",
};

const toDateInput = (value) => (value ? new Date(value).toISOString().slice(0, 10) : "");

export default function TripForm({ onSave, onCancel, initial, submitLabel = "Save trip" }) {
  const [form, setForm] = useState(
    initial
      ? { ...emptyTrip, ...initial, startDate: toDateInput(initial.startDate), endDate: toDateInput(initial.endDate) }
      : emptyTrip
  );
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const fields = ["title", "destination", "startDate", "endDate", "description", "budgetLimit"];
  const required = ["title", "destination", "startDate", "endDate"];
  const statuses = ["Not Started", "In Progress", "Completed"];

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    if (form.endDate < form.startDate) {
      setError("End date can't be before the start date.");
      return;
    }
    setSaving(true);
    const payload = {
      title: form.title,
      destination: form.destination,
      startDate: form.startDate,
      endDate: form.endDate,
      description: form.description || "",
      budgetLimit: form.budgetLimit === "" ? 0 : Number(form.budgetLimit),
    };
    if (initial) payload.status = form.status || "Not Started";
    try {
      await onSave(payload);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="trip-form" onSubmit={submit}>
      {fields.map((key) => (
        <label key={key}>
          {key.replace(/([A-Z])/g, " $1")}
          {key === "description" ? (
            <textarea
              value={form[key] || ""}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              rows={2}
            />
          ) : (
            <input
              required={required.includes(key)}
              type={key.includes("Date") ? "date" : key === "budgetLimit" ? "number" : "text"}
              min={key === "budgetLimit" ? 0 : undefined}
              value={form[key] || ""}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
            />
          )}
        </label>
      ))}
      {initial && (
        <label>
          Status
          <select value={form.status || "Not Started"} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            {statuses.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
      )}
      {error && <p className="error">{error}</p>}
      <div className="form-actions">
        <button disabled={saving}>{saving ? "Saving…" : submitLabel}</button>
        {onCancel && (
          <button type="button" className="link" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
