import { useState } from "react";

const categories = ["Food", "Transport", "Hotel", "Shopping", "Adventure", "Other"];

export default function ExpenseForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || { title: "", amount: "", category: "Other" });
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
      await onSave({ ...form, amount });
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
      {error && <p className="error">{error}</p>}
      <div className="form-actions">
        <button disabled={saving}>{saving ? "Saving…" : "Save expense"}</button>
        <button type="button" className="link" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
