import { useEffect, useState } from "react";
import { api, setToken } from "./api";
import "./styles.css";
import Auth from "./components/Auth";
import Trips from "./components/Trips";
import TripDetail from "./components/TripDetail";
import PublicTrip from "./components/PublicTrip";
import ResetPassword from "./components/ResetPassword";
import EmailVerified from "./components/EmailVerified";

export default function App() {
  const [user, setUser] = useState(null);
  const [tripId, setTripId] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);

  const publicMatch = window.location.pathname.match(/^\/public\/(.+)$/);
  const isResetPassword = window.location.pathname === "/reset-password";
  const isEmailVerified = window.location.pathname === "/email-verified";

  useEffect(() => {
    if (publicMatch || isResetPassword || isEmailVerified || !localStorage.getItem("triply_access_token")) {
      setCheckingSession(false);
      return;
    }
    api("/users/me")
      .then(setUser)
      .catch(() => setToken(null))
      .finally(() => setCheckingSession(false));
  }, []);

  const logout = async () => {
    try {
      await api("/auth/logout", { method: "POST" });
    } catch {
      // ignore -- we're logging out locally regardless
    }
    setToken(null);
    setUser(null);
  };

  if (publicMatch) return <PublicTrip shareLink={publicMatch[1]} />;
  if (isResetPassword) return <ResetPassword />;
  if (isEmailVerified) return <EmailVerified />;
  if (checkingSession) return <main><p className="muted">Loading...</p></main>;
  if (!user) return <Auth onLogin={setUser} />;
  if (tripId) return <TripDetail tripId={tripId} user={user} back={() => setTripId(null)} />;
  return <Trips openTrip={(trip) => setTripId(trip._id)} onLogout={logout} />;
}