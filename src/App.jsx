import React, { useState } from "react";
import "./style.css";

export default function App() {
  const [page, setPage] = useState("home");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function login() {
    if (username === "admin" && password === "5378") {
      setError("");
      setPage("admin");
    } else {
      setError("Forkert brugernavn eller adgangskode.");
    }
  }

  function logout() {
    setUsername("");
    setPassword("");
    setError("");
    setPage("home");
  }

  if (page === "admin-login") {
    return (
      <div className="login-page">
        <div className="login-background" />

        <div className="login-card">
          <div className="login-logo">🤖</div>

          <p className="login-label">HJÆLPER</p>

          <h1>Admin Login</h1>

          <p className="login-description">
            Log ind som administrator for at fortsætte.
          </p>

          <label>Brugernavn</label>

          <input
            type="text"
            placeholder="Indtast brugernavn"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <label>Adgangskode</label>

          <input
            type="password"
            placeholder="Indtast adgangskode"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                login();
              }
            }}
          />

          {error && (
            <div className="login-error">
              ❌ {error}
            </div>
          )}

          <button
            className="login-button"
            onClick={login}
          >
            👑 Log ind som Admin
          </button>

          <button
            className="back-button"
            onClick={() => setPage("home")}
          >
            ← Tilbage
          </button>
        </div>
      </div>
    );
  }

  if (page === "admin") {
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
            <button
              className="logout-button"
              onClick={logout}
            >
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
              👑 Administrator
            </div>
          </header>

          <section className="content">
            <div className="welcome-card">
              <div>
                <p className="small-title">
                  ADMINISTRATOR
                </p>

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
                <div className="stat-icon">🤖</div>

                <div>
                  <span>Bot status</span>
                  <strong>Online</strong>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">🌐</div>

                <div>
                  <span>API status</span>
                  <strong>Online</strong>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">🧩</div>

                <div>
                  <span>Cogs</span>
                  <strong>--</strong>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">🖥️</div>

                <div>
                  <span>Servere</span>
                  <strong>--</strong>
                </div>
              </div>
            </div>

            <div className="section-card">
              <div className="section-header">
                <div>
                  <p className="small-title">BOT</p>

                  <h2>Bot administration</h2>
                </div>

                <span className="status-online">
                  ● Online
                </span>
              </div>

              <div className="action-grid">
                <button className="action-button restart">
                  <span>🔄</span>

                  <div>
                    <strong>Genstart bot</strong>
                    <small>Genstart Hjælper</small>
                  </div>
                </button>

                <button className="action-button start">
                  <span>▶️</span>

                  <div>
                    <strong>Start bot</strong>
                    <small>Start Hjælper</small>
                  </div>
                </button>

                <button className="action-button stop">
                  <span>🛑</span>

                  <div>
                    <strong>Stop bot</strong>
                    <small>Stop Hjælper</small>
                  </div>
                </button>

                <button className="action-button">
                  <span>🔃</span>

                  <div>
                    <strong>Reload Cogs</strong>
                    <small>Genindlæs systemer</small>
                  </div>
                </button>
              </div>
            </div>

            <div className="section-card">
              <div className="section-header">
                <div>
                  <p className="small-title">
                    SYSTEM
                  </p>

                  <h2>System information</h2>
                </div>
              </div>

              <div className="system-list">
                <div>
                  <span>Bot</span>
                  <strong>Hjælper V2</strong>
                </div>

                <div>
                  <span>API</span>
                  <strong>FastAPI</strong>
                </div>

                <div>
                  <span>Status</span>
                  <strong className="text-online">
                    Online
                  </strong>
                </div>

                <div>
                  <span>Panel</span>
                  <strong>Vercel</strong>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="home-page">
      <div className="home-background" />

      <main className="home-content">
        <div className="home-logo">
          🤖
        </div>

        <p className="home-label">
          HJÆLPER
        </p>

        <h1>
          Velkommen til <span>Hjælper</span>
        </h1>

        <p className="home-description">
          Log ind for at få adgang til Hjælper.
        </p>

        <div className="login-options">
          <button
            className="login-option admin-option"
            onClick={() => {
              setError("");
              setPage("admin-login");
            }}
          >
            <div className="option-icon">
              👑
            </div>

            <div className="option-text">
              <strong>Admin Login</strong>

              <span>
                Log ind som administrator
              </span>
            </div>

            <div className="option-arrow">
              →
            </div>
          </button>

          <div className="login-option disabled-option">
            <div className="option-icon">
              👤
            </div>

            <div className="option-text">
              <strong>Bruger Login</strong>

              <span>
                Kommer snart!
              </span>
            </div>

            <div className="coming-soon">
              KOMMER SNART
            </div>
          </div>
        </div>

        <p className="footer-text">
          Hjælper V2 • Admin System
        </p>
      </main>
    </div>
  );
}
