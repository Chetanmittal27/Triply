import { useState } from "react";

const types = ["Sightseeing", "Food", "Transport", "Hotel", "Adventure", "Other"];

export default function ActivityForm({ destination, initial, onSave, onCancel }) {
  const [form, setForm] = useState(
    initial || { title: "", desc: "", location: destination || "", onTime: "09:00", type: "Sightseeing" }
  );
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      await onSave(form);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="stack-form" onSubmit={submit}>
      <label>
        Title
        <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
      </label>
      <label>
        Location
        <input required value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
      </label>
      <div className="form-row">
        <label>
          Time
          <input
            required
            type="time"
            value={form.onTime}
            onChange={(e) => setForm({ ...form, onTime: e.target.value })}
          />
        </label>
        <label>
          Type
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            {types.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
      </div>
      <label>
        Notes
        <textarea rows={2} value={form.desc || ""} onChange={(e) => setForm({ ...form, desc: e.target.value })} />
      </label>
      {error && <p className="error">{error}</p>}
      <div className="form-actions">
        <button disabled={saving}>{saving ? "Saving…" : "Save activity"}</button>
        <button type="button" className="link" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
