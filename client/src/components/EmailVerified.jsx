export default function EmailVerified() {
  const params = new URLSearchParams(window.location.search);
  const status = params.get("status");
  const message = params.get("message");

  const copy =
    {
      success: "Your email is verified. You can sign in now.",
      already: "This account is already verified. You can sign in.",
      error: message || "This verification link is invalid or expired.",
    }[status] || "Unknown verification status.";

  return (
    <main className="auth">
      <section>
        <p className="eyebrow">TRIPLY</p>
        <h1>Email verification</h1>
      </section>
      <p className={status === "error" ? "error" : "notice"}>{copy}</p>
      <button onClick={() => { window.location.href = "/"; }}>Go to sign in</button>
    </main>
  );
}