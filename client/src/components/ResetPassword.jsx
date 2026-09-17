import { useState } from "react";
import { api } from "../api";

export default function ResetPassword() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    if (!token) {
      setError("This reset link is missing its token.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setSubmitting(true);
    try {
      await api("/auth/reset-password", { method: "POST", body: { token, password } });
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="auth auth-single">
      <div className="auth-card status-card">
        <p className="eyebrow">TRIPLY</p>
        <h1>Reset password</h1>
        {done ? (
          <>
            <p className="notice">Password reset successfully. You can sign in now.</p>
            <button className="btn btn-secondary" onClick={() => { window.location.href = "/"; }}>
              Go to sign in
            </button>
          </>
        ) : (
          <form className="stack-form" onSubmit={submit}>
            <label>
              New password
              <input type="password" minLength="8" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </label>
            <label>
              Confirm password
              <input type="password" minLength="8" required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            </label>
            {error && <p className="error">{error}</p>}
            <div className="form-actions">
              <button className="btn btn-primary" disabled={submitting}>{submitting ? "Saving…" : "Reset password"}</button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
