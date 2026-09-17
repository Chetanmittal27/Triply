export default function Navbar({ user, active, onNavigate, onLogout }) {
  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <button className="brand" onClick={() => onNavigate("trips")}>
          <span className="brand-mark">T</span>
          Triply
        </button>

        <div className="navbar-links">
          <button
            className={`nav-link ${active === "trips" ? "active" : ""}`}
            onClick={() => onNavigate("trips")}
          >
            Trips
          </button>
          <button
            className={`nav-link ${active === "profile" ? "active" : ""}`}
            onClick={() => onNavigate("profile")}
          >
            Profile
          </button>
        </div>

        <div className="navbar-user">
          <button className="user-chip" onClick={() => onNavigate("profile")}>
            <img
              src={user?.avatar?.url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || "T")}`}
              alt=""
              className="avatar avatar-sm"
            />
            <span className="user-chip-name">{user?.fullName}</span>
          </button>
          <button className="btn btn-ghost" onClick={onLogout}>
            Sign out
          </button>
        </div>
      </div>
    </nav>
  );
}
