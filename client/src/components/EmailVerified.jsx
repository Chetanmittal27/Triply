import { useState } from "react";
import { api } from "../api";

export default function EmailVerified() {
  const params = new URLSearchParams(window.location.search);
  const status = params.get("status");
  const message = params.get("message");

  const [email, setEmail] = useState("");
  const [resending, setResending] = useState(false);
  const [resendNotice, setResendNotice] = useState("");
  const [resendError, setResendError] = useState("");

  const copy =
    {
      success: "Your email is verified. You can sign in now.",
      already: "This account is already verified. You can sign in.",
      error: message || "This verification link is invalid or expired.",
    }[status] || "Unknown verification status.";

  const icon = status === "error" ? "⚠️" : status === "already" ? "✅" : status === "success" ? "🎉" : "❓";

  const resend = async (event) => {
    event.preventDefault();
    setResendError("");
    setResendNotice("");
    setResending(true);
    try {
      await api("/auth/resend-verify-email", { method: "POST", body: { email } });
      setResendNotice("A new verification email has been sent. Check your inbox.");
    } catch (err) {
      setResendError(err.message);
    } finally {
      setResending(false);
    }
  };

  return (
    <main className="auth auth-single">
      <div className="auth-card status-card">
        <p className="eyebrow">TRIPLY</p>
        <p className="status-icon">{icon}</p>
        <h1>Email verification</h1>
        <p className={status === "error" ? "error" : "notice"}>{copy}</p>

        {status === "error" && (
          <form className="stack-form" onSubmit={resend}>
            <label>
              Resend verification email to
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            {resendError && <p className="error">{resendError}</p>}
            {resendNotice && <p className="notice">{resendNotice}</p>}
            <button className="btn btn-primary" disabled={resending}>
              {resending ? "Sending…" : "Resend verification email"}
            </button>
          </form>
        )}

        <button className="btn btn-secondary" onClick={() => { window.location.href = "/"; }}>
          Go to sign in
        </button>
      </div>
    </main>
  );
}
