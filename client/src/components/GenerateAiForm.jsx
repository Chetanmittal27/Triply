import { useState } from "react";

export default function GenerateAiForm({ regenerate, onSave, onCancel }) {
  const [form, setForm] = useState({ interests: "", budgetPerDay: "", travelStyle: "balanced" });
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
      {regenerate && (
        <p className="notice">This replaces the current itinerary's activities with a new AI-generated plan.</p>
      )}
      <label>
        Interests
        <input
          placeholder="beach, food, culture…"
          value={form.interests}
          onChange={(e) => setForm({ ...form, interests: e.target.value })}
        />
      </label>
      <div className="form-row">
        <label>
          Budget per day (₹)
          <input
            type="number"
            min="0"
            value={form.budgetPerDay}
            onChange={(e) => setForm({ ...form, budgetPerDay: e.target.value })}
          />
        </label>
        <label>
          Travel style
          <select value={form.travelStyle} onChange={(e) => setForm({ ...form, travelStyle: e.target.value })}>
            <option value="relaxed">Relaxed</option>
            <option value="balanced">Balanced</option>
            <option value="packed">Packed</option>
          </select>
        </label>
      </div>
      {error && <p className="error">{error}</p>}
      <div className="form-actions">
        <button disabled={saving}>{saving ? "Generating…" : regenerate ? "Regenerate" : "Generate"}</button>
        <button type="button" className="link" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
