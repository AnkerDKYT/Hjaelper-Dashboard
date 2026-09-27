import React, { useEffect, useState } from "react";
import "./style.css";

const API = "/backend";
const ADMIN_CODE = "5378";

function App() {
  const [page, setPage] = useState("login");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [server, setServer] = useState(null);

  const [status, setStatus] = useState(null);
  const [stats, setStats] = useState(null);
  const [servers, setServers] = useState([]);
  const [cogs, setCogs] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadAPI = async () => {
    try {
      setLoading(true);
      setError("");

      const [statusRes, statsRes, serversRes, cogsRes] =
        await Promise.all([
          fetch(`${API}/api/status`),
          fetch(`${API}/api/stats`),
          fetch(`${API}/api/servers`),
          fetch(`${API}/api/cogs`)
        ]);

      if (
        !statusRes.ok ||
        !statsRes.ok ||
        !serversRes.ok ||
        !cogsRes.ok
      ) {
        throw new Error("API fejl");
      }

      const statusData = await statusRes.json();
      const statsData = await statsRes.json();
      const serversData = await serversRes.json();
      const cogsData = await cogsRes.json();

      setStatus(statusData);
      setStats(statsData);
      setServers(serversData.servers || []);
      setCogs(cogsData.cogs || []);
    } catch (err) {
      console.error("API fejl:", err);
      setError("Kunne ikke forbinde til Hjælper API.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (page !== "servers" && page !== "dashboard") return;

    loadAPI();

    const timer = setInterval(loadAPI, 15000);

    return () => clearInterval(timer);
  }, [page]);

  const login = () => {
    if (code === ADMIN_CODE) {
      setCode("");
      setError("");
      setPage("servers");
    } else {
      setError("Forkert admin-kode.");
    }
  };

  const logout = () => {
    setServer(null);
    setCode("");
    setError("");
    setPage("login");
  };

  const selectServer = (selectedServer) => {
    setServer(selectedServer);
    setPage("dashboard");
  };

  const online = status?.bot_connected === true;

  /* =========================
     LOGIN
  ========================= */

  if (page === "login") {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="logo">H</div>

          <h1>Hjælper</h1>
          <p className="subtitle">Dashboard V2</p>

          <div className="login-section">
            <h2>🔐 Admin adgang</h2>

            <p>
              Indtast din midlertidige admin-kode.
            </p>

            <input
              type="password"
              placeholder="Admin kode"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") login();
              }}
            />

            <button
              className="primary"
              onClick={login}
            >
              🔓 Fortsæt
            </button>

            {error && (
              <div className="error">
                {error}
              </div>
            )}
          </div>

          <div className="divider">
            <span>eller</span>
          </div>

          <button
            className="disabled-button"
            disabled
          >
            🔵 Log ind
          </button>

          <small className="coming">
            Kommer snart
          </small>
        </div>
      </div>
    );
  }

  /* =========================
     SERVER SELECT
  ========================= */

  if (page === "servers") {
    return (
      <div className="server-page">
        <div className="server-header">
          <div>
            <span className="eyebrow">
              HJÆLPER V2
            </span>

            <h1>Vælg server</h1>

            <p>
              Vælg hvilken Discord-server du vil
              administrere.
            </p>
          </div>

          <button
            className="logout"
            onClick={logout}
          >
            Log ud
          </button>
        </div>

        {loading && (
          <div className="loading">
            Henter servere...
          </div>
        )}

        {error && (
          <div className="error-box">
            {error}
          </div>
        )}

        {!loading &&
          !error &&
          servers.length === 0 && (
            <div className="loading">
              Ingen servere fundet.
            </div>
          )}

        <div className="servers">
          {servers.map((s) => (
            <button
              className="server-card"
              key={s.id}
              onClick={() => selectServer(s)}
            >
              {s.icon ? (
                <img
                  src={s.icon}
                  alt=""
                />
              ) : (
                <div className="server-placeholder">
                  🖥️
                </div>
              )}

              <div className="server-info">
                <strong>{s.name}</strong>

                <small>
                  {s.members || 0} medlemmer
                </small>
              </div>

              <span className="arrow">
                ›
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  /* =========================
     DASHBOARD
  ========================= */

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">
            H
          </div>

          <div>
            <strong>Hjælper</strong>
            <small>Dashboard V2</small>
          </div>
        </div>

        <button
          className="nav active"
          onClick={() => setPage("dashboard")}
        >
          🏠 Dashboard
        </button>

        <button
          className="nav"
          onClick={() => setPage("servers")}
        >
          🖥️ Servere
        </button>

        <button className="nav">
          🎫 Tickets
        </button>

        <button className="nav">
          🛡️

