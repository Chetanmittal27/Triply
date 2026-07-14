import { useState } from "react";

export default function InviteForm({ onSave, onCancel }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      await onSave(email);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="stack-form" onSubmit={submit}>
      <label>
        Member's email
        <input
          required
          type="email"
          placeholder="friend@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </label>
      {error && <p className="error">{error}</p>}
      <div className="form-actions">
        <button disabled={saving}>{saving ? "Inviting…" : "Invite"}</button>
        <button type="button" className="link" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
