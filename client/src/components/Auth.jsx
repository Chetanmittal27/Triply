import { useState } from "react";
import { setToken , api } from "../api";

export default function Auth({ onLogin }) {
  const [mode, setMode] = useState("login"); // "login" | "register" | "forgot"
  const [avatar, setAvatar] = useState(null);
  const [form, setForm] = useState({ gender: "Prefer Not To Say" });
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
  const [resending, setResending] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const register = mode === "register";
  const forgot = mode === "forgot";

  const update = (event) =>
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const switchMode = (next) => {
    setMode(next);
    setError("");
    setNotice("");
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");
    const values = Object.fromEntries(new FormData(event.currentTarget).entries());
    setPendingEmail(values.email || "");
    setSubmitting(true);
    try {
      if (forgot) {
        await api("/auth/forgot-password", { method: "POST", body: { email: values.email } });
        setNotice("If an account exists for that email, a reset link has been sent.");
        return;
      }
      if (register) {
        const body = new FormData();
        ["fullName", "username", "mobileNumber", "gender", "email", "password"].forEach((key) =>
          body.append(key, values[key] || "")
        );
        if (avatar) body.append("avatar", avatar);
        await api("/auth/register", { method: "POST", body });
        setNotice("Registered. Check your email to verify the account, then sign in.");
        setMode("login");
        return;
      }
      const data = await api("/auth/login", {
        method: "POST",
        body: { email: values.email, password: values.password },
      });
      if (data.accessToken) setToken(data.accessToken);
      onLogin(data.user || data);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const resendVerification = async () => {
    setResending(true);
    setError("");
    try {
      await api("/auth/resend-verify-email", { method: "POST", body: { email: pendingEmail } });
      setNotice("A new verification email was sent. Check your inbox.");
    } catch (err) {
      setError(err.message);
    } finally {
      setResending(false);
    }
  };

  return (
    <main className="auth">
      <section className="auth-hero">
        <p className="eyebrow">PLAN TOGETHER</p>
        <h1>Triply</h1>
        <p>Build memorable journeys with your people — itineraries, budgets, and files, all in one shared trip.</p>
        <ul className="auth-hero-points">
          <li>✨ AI-generated day-by-day itineraries</li>
          <li>💰 Shared expense tracking &amp; splits</li>
          <li>🔄 Real-time updates with your travel crew</li>
        </ul>
      </section>
      <form className="auth-card" onSubmit={submit} autoComplete={register ? "on" : "current-password"}>
        <h2>{forgot ? "Reset your password" : register ? "Create account" : "Welcome back"}</h2>

        {register && (
          <>
            <input name="fullName" autoComplete="name" placeholder="Full name" required onChange={update} />
            <input name="username" autoComplete="username" placeholder="Username" required onChange={update} />
            <input name="mobileNumber" autoComplete="tel" placeholder="Mobile number" required onChange={update} />
            <select name="gender" value={form.gender} onChange={update}>
              <option>Male</option>
              <option>Female</option>
              <option>Prefer Not To Say</option>
            </select>
            <label className="file-label">
              Profile photo <span className="muted small">(optional)</span>
              <input
                type="file"
                accept="image/png,image/jpeg"
                onChange={(e) => setAvatar(e.target.files[0])}
              />
            </label>
          </>
        )}

        <input name="email" type="email" autoComplete="email" placeholder="Email" required onChange={update} />

        {!forgot && (
          <input
            name="password"
            type="password"
            autoComplete={register ? "new-password" : "current-password"}
            placeholder="Password"
            minLength="8"
            required
            onChange={update}
          />
        )}

        {error && <p className="error">{error}</p>}
        {error?.toLowerCase().includes("verify your email") && (
          <button type="button" className="btn btn-ghost" disabled={resending} onClick={resendVerification}>
            {resending ? "Sending…" : "Resend verification email"}
          </button>
        )}
        {notice && <p className="notice">{notice}</p>}

        <button className="btn btn-primary" disabled={submitting}>
          {submitting ? "Please wait…" : forgot ? "Send reset link" : register ? "Create account" : "Sign in"}
        </button>

        {!forgot && !register && (
          <button type="button" className="btn btn-link" onClick={() => switchMode("forgot")}>
            Forgot password?
          </button>
        )}
        {forgot && (
          <button type="button" className="btn btn-link" onClick={() => switchMode("login")}>
            Back to sign in
          </button>
        )}
        {!forgot && (
          <button type="button" className="btn btn-link" onClick={() => switchMode(register ? "login" : "register")}>
            {register ? "Already have an account? Sign in" : "New here? Create an account"}
          </button>
        )}
      </form>
    </main>
  );
}