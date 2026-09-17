import { useState } from "react";

const toDateInput = (value) => (value ? new Date(value).toISOString().slice(0, 10) : "");

export default function DayForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState({ desc: initial?.desc || "", onDate: toDateInput(initial?.onDate) });
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
        Date
        <input required type="date" value={form.onDate} onChange={(e) => setForm({ ...form, onDate: e.target.value })} />
      </label>
      <label>
        Day notes
        <textarea
          rows={3}
          placeholder="Optional summary for this day…"
          value={form.desc}
          onChange={(e) => setForm({ ...form, desc: e.target.value })}
        />
      </label>
      {error && <p className="error">{error}</p>}
      <div className="form-actions">
        <button className="btn btn-primary" disabled={saving}>{saving ? "Saving…" : "Save day"}</button>
        <button type="button" className="btn btn-ghost" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
