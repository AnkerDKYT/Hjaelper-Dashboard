import React, { useState } from "react";
import "./style.css";

export default function App() {
  const [page, setPage] = useState("home");
  const [adminLoggedIn, setAdminLoggedIn] = useState(false);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function openAdminLogin() {
    setError("");
    setUsername("");
    setPassword("");
    setPage("admin-login");
  }

  function adminLogin(event) {
    event.preventDefault();

    if (username === "admin" && password === "5378") {
      setAdminLoggedIn(true);
      setError("");
      setPage("admin-panel");
      return;
    }

    setError("Forkert brugernavn eller adgangskode.");
  }

  function logout() {
    setAdminLoggedIn(false);
    setUsername("");
    setPassword("");
    setError("");
    setPage("home");
  }

  if (page === "admin-panel" && adminLoggedIn) {
    return (
      <div className="app">
        <aside className="sidebar">
          <div className="logo">
            <div className="logo-icon">🤖</div>

            <div>
              <h2>Hjælper</h2>
              <span>Admin Panel</span>
            </div>
          </div>

          <nav className="navigation">
            <button className="nav-item active">
              <span>📊</span>
              Overview
            </button>

            <button className="nav-item">
              <span>🤖</span>
              Bot
            </button>

            <button className="nav-item">
              <span>🧩</span>
              Cogs
            </button>

            <button className="nav-item">
              <span>📜</span>
              Logs
            </button>

            <button className="nav-item">
              <span>⚙️</span>
              System
            </button>
          </nav>

          <div className="sidebar-bottom">
            <button className="logout-button" onClick={logout}>
              🚪 Log ud
            </button>
          </div>
        </aside>

        <main className="main-content">
          <header className="topbar">
            <div>
              <p className="small-title">HJÆLPER</p>
              <h1>Admin Panel</h1>
            </div>

            <div className="admin-badge">
              <span>👑</span>
              Administrator
            </div>
          </header>

          <section className="content">
            <div className="welcome-card">
              <div>
                <p className="small-title">ADMINISTRATOR</p>

                <h2>
                  Velkommen til Hjælper Admin Panel 👋
                </h2>

                <p>
                  Herfra kan du administrere Hjælper-botten.
                </p>
              </div>

              <div className="welcome-icon">
                🤖
              </div>
            </div>

            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">
                  🤖
                </div>

                <div>
                  <span>Bot status</span>
                  <strong>Online</strong>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">
                  🌐
                </div>

                <div>
                  <span>API status</span>
                  <strong>Online</strong>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">
                  🧩
