import { useState } from "react";

const categories = ["Food", "Transport", "Hotel", "Shopping", "Adventure", "Other"];

const toDateTimeInput = (value) => {
  const date = value ? new Date(value) : new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export default function ExpenseForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(
    initial
      ? { ...initial, onDateTime: toDateTimeInput(initial.onDateTime) }
      : { title: "", amount: "", category: "Other", onDateTime: toDateTimeInput() }
  );
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    const amount = Number(form.amount);
    if (!Number.isFinite(amount) || amount < 0) {
      setError("Enter a valid amount.");
      return;
    }
    setSaving(true);
    try {
      await onSave({ ...form, amount, onDateTime: form.onDateTime ? new Date(form.onDateTime).toISOString() : undefined });
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
      <div className="form-row">
        <label>
          Amount (₹)
          <input
            required
            type="number"
            min="0"
            step="0.01"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
          />
        </label>
        <label>
          Category
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
      </div>
      <label>
        Date &amp; time
        <input
          type="datetime-local"
          value={form.onDateTime}
          onChange={(e) => setForm({ ...form, onDateTime: e.target.value })}
        />
      </label>
      {error && <p className="error">{error}</p>}
      <div className="form-actions">
        <button className="btn btn-primary" disabled={saving}>{saving ? "Saving…" : "Save expense"}</button>
        <button type="button" className="btn btn-ghost" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
