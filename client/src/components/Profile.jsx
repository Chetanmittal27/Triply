import { useState } from "react";
import { api } from "../api";
import Navbar from "./Navbar";

export default function Profile({ user, setUser, onNavigate, onLogout }) {
  const [form, setForm] = useState({
    fullName: user.fullName || "",
    mobileNumber: user.mobileNumber || "",
    gender: user.gender || "Prefer Not To Say",
  });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [uploading, setUploading] = useState("");

  const [profileError, setProfileError] = useState("");
  const [profileNotice, setProfileNotice] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordNotice, setPasswordNotice] = useState("");
  const [photoError, setPhotoError] = useState("");

  const saveProfile = async (event) => {
    event.preventDefault();
    setProfileError("");
    setProfileNotice("");
    setSavingProfile(true);
    try {
      const updated = await api("/users/me", { method: "PATCH", body: form });
      setUser(updated);
      setProfileNotice("Profile updated successfully.");
    } catch (err) {
      setProfileError(err.message);
    } finally {
      setSavingProfile(false);
    }
  };

  const changePassword = async (event) => {
    event.preventDefault();
    setPasswordError("");
    setPasswordNotice("");
    if (passwordForm.newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("New passwords don't match.");
      return;
    }
    setSavingPassword(true);
    try {
      await api("/users/me/password", {
        method: "PATCH",
        body: { currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword },
      });
      setPasswordNotice("Password changed. Please sign in again.");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setTimeout(onLogout, 1500);
    } catch (err) {
      setPasswordError(err.message);
    } finally {
      setSavingPassword(false);
    }
  };

  const uploadPhoto = (field, endpoint) => async (event) => {
    const file = event.target.files[0];
    event.target.value = "";
    if (!file) return;
    setPhotoError("");
    setUploading(field);
    const body = new FormData();
    body.append(field, file);
    try {
      const updated = await api(endpoint, { method: "PATCH", body });
      setUser(updated);
    } catch (err) {
      setPhotoError(err.message);
    } finally {
      setUploading("");
    }
  };

  return (
    <>
      <Navbar user={user} active="profile" onNavigate={onNavigate} onLogout={onLogout} />
      <main className="page">
        <div className="cover-banner">
          <img
            src={user.coverImage?.url || ""}
            alt=""
            className={`cover-img ${!user.coverImage?.url ? "cover-img-empty" : ""}`}
          />
          <label className="btn btn-light cover-edit-btn">
            {uploading === "coverImage" ? "Uploading…" : "Change cover photo"}
            <input type="file" accept="image/png,image/jpeg" hidden onChange={uploadPhoto("coverImage", "/users/me/cover-image")} />
          </label>
        </div>

        <header className="profile-head">
          <div className="profile-avatar-wrap">
            <img
              src={user.avatar?.url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName)}`}
              alt=""
              className="avatar avatar-lg"
            />
            <label className="avatar-edit-btn" title="Change profile photo">
              {uploading === "avatar" ? "…" : "✎"}
              <input type="file" accept="image/png,image/jpeg" hidden onChange={uploadPhoto("avatar", "/users/me/avatar")} />
            </label>
          </div>
          <div>
            <p className="eyebrow">YOUR ACCOUNT</p>
            <h1>{user.fullName}</h1>
            <p className="muted">@{user.username} · {user.email}</p>
          </div>
        </header>

        {photoError && <p className="error">{photoError}</p>}

        <section className="grid grid-2">
          <div className="panel">
            <h2>Personal details</h2>
            <form className="stack-form" onSubmit={saveProfile}>
              <label>
                Full name
                <input required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
              </label>
              <label>
                Mobile number
                <input required value={form.mobileNumber} onChange={(e) => setForm({ ...form, mobileNumber: e.target.value })} />
              </label>
              <label>
                Gender
                <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Prefer Not To Say</option>
                </select>
              </label>
              {profileError && <p className="error">{profileError}</p>}
              {profileNotice && <p className="notice">{profileNotice}</p>}
              <div className="form-actions">
                <button className="btn btn-primary" disabled={savingProfile}>
                  {savingProfile ? "Saving…" : "Save changes"}
                </button>
              </div>
            </form>
          </div>

          <div className="panel">
            <h2>Change password</h2>
            <form className="stack-form" onSubmit={changePassword}>
              <label>
                Current password
                <input
                  type="password"
                  required
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                />
              </label>
              <label>
                New password
                <input
                  type="password"
                  required
                  minLength="8"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                />
              </label>
              <label>
                Confirm new password
                <input
                  type="password"
                  required
                  minLength="8"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                />
              </label>
              {passwordError && <p className="error">{passwordError}</p>}
              {passwordNotice && <p className="notice">{passwordNotice}</p>}
              <div className="form-actions">
                <button className="btn btn-primary" disabled={savingPassword}>
                  {savingPassword ? "Saving…" : "Change password"}
                </button>
              </div>
            </form>
          </div>
        </section>
      </main>
    </>
  );
}
