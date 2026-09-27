import React, { useEffect, useState } from "react";
import "./style.css";

const API_BASE = "/backend";

export default function App() {
  const [page, setPage] = useState("home");

  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [error, setError] = useState("");

  const [status, setStatus] = useState(null);
  const [stats, setStats] = useState(null);
  const [cogs, setCogs] = useState([]);
  const [servers, setServers] = useState([]);

  const [loading, setLoading] = useState(false);
  const [reloadMessage, setReloadMessage] = useState("");

  // ==========================================================
  // CHECK LOGIN
  // ==========================================================

  async function checkAuth() {
    try {
      const response = await fetch(
        `${API_BASE}/auth/me`,
        {
          credentials: "include"
        }
      );

      if (!response.ok) {
        setUser(null);
        setPage("home");
        return;
      }

      const data = await response.json();

      if (data.authenticated && data.user) {
        setUser(data.user);
        setPage("admin");
      } else {
        setUser(null);
        setPage("home");
      }
    } catch (err) {
      console.error(
        "Kunne ikke kontrollere login:",
        err
      );

      setUser(null);
      setPage("home");
    } finally {
      setAuthLoading(false);
    }
  }

  // ==========================================================
  // STARTUP
  // ==========================================================

  useEffect(() => {
    checkAuth();

    const params = new URLSearchParams(
      window.location.search
    );

    const authStatus = params.get("auth");

    if (authStatus === "denied") {
      setError(
        "❌ Din Discord-konto har ikke adgang til admin-panelet."
      );

      window.history.replaceState(
        {},
        document.title,
        window.location.pathname
      );
    }

    if (authStatus === "error") {
      setError(
        "❌ Der opstod en fejl under Discord-login."
      );

      window.history.replaceState(
        {},
        document.title,
        window.location.pathname
      );
    }
  }, []);

  // ==========================================================
  // LOAD API DATA
  // ==========================================================

  async function loadData() {
    try {
      setLoading(true);

      const [
        statusResponse,
        statsResponse,
        cogsResponse,
        serversResponse
      ] = await Promise.all([
        fetch(`${API_BASE}/api/status`, {
          credentials: "include"
        }),

        fetch(`${API_BASE}/api/stats`, {
          credentials: "include"
        }),

        fetch(`${API_BASE}/api/cogs`, {
          credentials: "include"
        }),

        fetch(`${API_BASE}/api/servers`, {
          credentials: "include"
        })
      ]);

      // --------------------------------------------------------
      // LOGIN UDLØBET
      // --------------------------------------------------------

      if (
        statusResponse.status === 401 ||
        statsResponse.status === 401 ||
        cogsResponse.status === 401 ||
        serversResponse.status === 401
      ) {
        setUser(null);
        setPage("home");
        setError(
          "🔐 Din login-session er udløbet. Log ind igen."
        );
        return;
      }

      const statusData =
        await statusResponse.json();

      const statsData =
        await statsResponse.json();

      const cogsData =
        await cogsResponse.json();

      const serversData =
        await serversResponse.json();

      setStatus(statusData);
      setStats(statsData);
      setCogs(cogsData.cogs || []);
      setServers(serversData.servers || []);

    } catch (err) {
      console.error(
        "Kunne ikke hente API-data:",
        err
      );
    } finally {
      setLoading(false);
    }
  }

  // ==========================================================
  // AUTO REFRESH
  // ==========================================================

  useEffect(() => {
    if (
      page !== "admin" &&
      page !== "bot" &&
      page !== "cogs" &&
      page !== "logs" &&
      page !== "system"
    ) {
      return;
    }

    if (!user) {
      return;
    }

    loadData();

    const interval = setInterval(() => {
      loadData();
    }, 10000);

    return () => clearInterval(interval);
  }, [page, user]);

  // ==========================================================
  // DISCORD LOGIN
  // ==========================================================

  function loginWithDiscord() {
    window.location.href =
      `${API_BASE}/auth/discord`;
  }

  // ==========================================================
  // LOGOUT
  // ==========================================================

  async function logout() {
    try {
      await fetch(
        `${API_BASE}/auth/logout`,
        {
          method: "POST",
          credentials: "include"
        }
      );
    } catch (err) {
      console.error(
        "Logout fejlede:",
        err
      );
    }

    setUser(null);
    setStatus(null);
    setStats(null);
    setCogs([]);
    setServers([]);
    setError("");
    setPage("home");
  }

  // ==========================================================
  // RELOAD COGS
  // ==========================================================

  async function reloadCogs() {
    try {
      setReloadMessage(
        "🔄 Genindlæser Cogs..."
      );

      const response = await fetch(
        `${API_BASE}/api/reload-cogs`,
        {
          method: "POST",
          credentials: "include"
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
          "Reload fejlede."
        );
      }

      setReloadMessage(
        `✅ ${
          data.message ||
          "Cogs blev genindlæst."
        }`
      );

      await loadData();

      setTimeout(() => {
        setReloadMessage("");
      }, 5000);

    } catch (err) {
      console.error(err);

      setReloadMessage(
        `❌ ${
          err.message ||
          "Kunne ikke reloade Cogs."
        }`
      );
    }
  }

  // ==========================================================
  // AUTH LOADING
  // ==========================================================

  if (authLoading) {
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
            Kontrollerer login...
          </h1>

          <p className="home-description">
            Vent et øjeblik...
          </p>

        </main>
      </div>
    );
  }

  // ==========================================================
  // ADMIN DASHBOARD
  // ==========================================================

  if (
    user &&
    (
      page === "admin" ||
      page === "bot" ||
      page === "cogs" ||
      page === "logs" ||
      page === "system"
    )
  ) {
    const botOnline =
      status?.bot_connected === true;

    const apiOnline =
      status?.status === "online";

    const isOwner =
      user.role === "owner";

    const roleName =
      isOwner
        ? "Ejer"
        : "Admin";

    const roleIcon =
      isOwner
        ? "👑"
        : "🛡️";

    return (
      <div className="app">

        {/* ==================================================
            SIDEBAR
        ================================================== */}

        <aside className="sidebar">

          <div className="logo">

            <div className="logo-icon">
              🤖
            </div>

            <div>
              <h2>
                Hjælper
              </h2>

              <span>
                Admin Panel
              </span>
            </div>

          </div>

          <nav className="navigation">

            <button
              className={`nav-item ${
                page === "admin"
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                setPage("admin")
              }
            >
              <span>📊</span>
              Overview
            </button>

            <button
              className={`nav-item ${
                page === "bot"
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                setPage("bot")
              }
            >
              <span>🤖</span>
              Bot
            </button>

            <button
              className={`nav-item ${
                page === "cogs"
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                setPage("cogs")
              }
            >
              <span>🧩</span>
              Cogs
            </button>

            <button
              className={`nav-item ${
                page === "logs"
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                setPage("logs")
              }
            >
              <span>📜</span>
              Logs
            </button>

            <button
              className={`nav-item ${
                page === "system"
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                setPage("system")
              }
            >
              <span>⚙️</span>
              System
            </button>

          </nav>

          {/* ==================================================
              USER
          ================================================== */}

          <div className="sidebar-bottom">

            <div
              style={{
                padding: "12px",
                marginBottom: "10px",
                borderRadius: "10px",
                background:
                  "rgba(255,255,255,0.05)"
              }}
            >

              <div
                style={{
                  fontWeight: "600"
                }}
              >
                {roleIcon} {roleName}
              </div>

              <div
                style={{
                  opacity: 0.7,
                  fontSize: "13px",
                  marginTop: "4px"
                }}
              >
                {user.username}
              </div>

            </div>

            <button
              className="logout-button"
              onClick={logout}
            >
              🚪 Log ud
            </button>

          </div>

        </aside>

        {/* ==================================================
            MAIN
        ================================================== */}

        <main className="main-content">

          <header className="topbar">

            <div>

              <p className="small-title">
                HJÆLPER
              </p>

              <h1>
                {page === "admin" &&
                  "Admin Panel"}

                {page === "bot" &&
                  "Bot"}

                {page === "cogs" &&
                  "Cogs"}

                {page === "logs" &&
                  "Logs"}

                {page === "system" &&
                  "System"}
              </h1>

            </div>

            <div className="admin-badge">

              {roleIcon} {roleName}

            </div>

          </header>

          <section className="content">

            {/* ==================================================
                OVERVIEW
            ================================================== */}

            {page === "admin" && (
              <>

                <div className="welcome-card">

                  <div>

                    <p className="small-title">
                      {roleName.toUpperCase()}
                    </p>

                    <h2>
                      Velkommen til Hjælper
                      Admin Panel 👋
                    </h2>

                    <p>
                      Herfra kan du administrere
                      Hjælper-botten.
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

                      <span>
                        Bot status
                      </span>

                      <strong>
                        {loading
                          ? "..."
                          : botOnline
                          ? "Online"
                          : "Offline"}
                      </strong>

                    </div>

                  </div>

                  <div className="stat-card">

                    <div className="stat-icon">
                      🌐
                    </div>

                    <div>

                      <span>
                        API status
                      </span>

                      <strong>
                        {loading
                          ? "..."
                          : apiOnline
                          ? "Online"
                          : "Offline"}
                      </strong>

                    </div>

                  </div>

                  <div className="stat-card">

                    <div className="stat-icon">
                      🧩
                    </div>

                    <div>

                      <span>
                        Cogs
                      </span>

                      <strong>
                        {stats?.cogs ??
                          cogs.length}
                      </strong>

                    </div>

                  </div>

                  <div className="stat-card">

                    <div className="stat-icon">
                      🖥️
                    </div>

                    <div>

                      <span>
                        Servere
                      </span>

                      <strong>
                        {stats?.servers ??
                          servers.length}
                      </strong>

                    </div>

                  </div>

                </div>

                <div className="section-card">

                  <div className="section-header">

                    <div>

                      <p className="small-title">
                        BOT
                      </p>

                      <h2>
                        Bot administration
                      </h2>

                    </div>

                    <span className="status-online">

                      ●{" "}
                      {botOnline
                        ? "Online"
                        : "Offline"}

                    </span>

                  </div>

                  <div className="action-grid">

                    <button
                      className="action-button"
                      onClick={reloadCogs}
                    >

                      <span>
                        🔃
                      </span>

                      <div>

                        <strong>
                          Reload Cogs
                        </strong>

                        <small>
                          Genindlæs
                          bot-systemer
                        </small>

                      </div>

                    </button>

                  </div>

                  {reloadMessage && (
                    <p
                      style={{
                        marginTop: "15px",
                        opacity: 0.9
                      }}
                    >
                      {reloadMessage}
                    </p>
                  )}

                </div>

                <div className="section-card">

                  <div className="section-header">

                    <div>

                      <p className="small-title">
                        SYSTEM
                      </p>

                      <h2>
                        System information
                      </h2>

                    </div>

                  </div>

                  <div className="system-list">

                    <div>
                      <span>
                        Bot
                      </span>

                      <strong>
                        {status?.bot_name ||
                          "Hjælper V2"}
                      </strong>
                    </div>

                    <div>
                      <span>
                        API
                      </span>

                      <strong>
                        FastAPI
                      </strong>
                    </div>

                    <div>
                      <span>
                        Servere
                      </span>

                      <strong>
                        {servers.length}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Brugere
                      </span>

                      <strong>
                        {stats?.users ?? 0}
                      </strong>
                    </div>

                  </div>

                </div>

              </>
            )}

            {/* ==================================================
                BOT
            ================================================== */}

            {page === "bot" && (
              <div className="section-card">

                <div className="section-header">

                  <div>

                    <p className="small-title">
                      BOT
                    </p>

                    <h2>
                      Hjælper Bot
                    </h2>

                  </div>

                  <span className="status-online">

                    ●{" "}
                    {botOnline
                      ? "Online"
                      : "Offline"}

                  </span>

                </div>

                <div className="system-list">

                  <div>
                    <span>
                      Navn
                    </span>

                    <strong>
                      {status?.bot_name ||
                        "Hjælper"}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Bot ID
                    </span>

                    <strong>
                      {status?.bot_id ||
                        "--"}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Servere
                    </span>

                    <strong>
                      {stats?.servers ?? 0}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Brugere
                    </span>

                    <strong>
                      {stats?.users ?? 0}
                    </strong>
                  </div>

                </div>

                <div className="action-grid">

                  <button
                    className="action-button"
                    onClick={reloadCogs}
                  >

                    <span>
                      🔃
                    </span>

                    <div>

                      <strong>
                        Reload Cogs
                      </strong>

                      <small>
                        Genindlæs alle Cogs
                      </small>

                    </div>

                  </button>

                </div>

              </div>
            )}

            {/* ==================================================
                COGS
            ================================================== */}

            {page === "cogs" && (
              <div className="section-card">

                <div className="section-header">

                  <div>

                    <p className="small-title">
                      SYSTEMER
                    </p>

                    <h2>
                      Loaded Cogs
                    </h2>

                  </div>

                  <span className="status-online">
                    {cogs.length} loaded
                  </span>

                </div>

                {cogs.length === 0 ? (

                  <p>
                    Ingen Cogs blev fundet.
                  </p>

                ) : (

                  <div className="system-list">

                    {cogs.map((cog) => (

                      <div
                        key={cog.name}
                      >

                        <span>
                          🧩 {cog.name}
                        </span>

                        <strong className="text-online">
                          {cog.loaded
                            ? "Loaded"
                            : "Offline"}
                        </strong>

                      </div>

                    ))}

                  </div>

                )}

              </div>
            )}

            {/* ==================================================
                LOGS
            ================================================== */}

            {page === "logs" && (
              <div className="section-card">

                <div className="section-header">

                  <div>

                    <p className="small-title">
                      SYSTEM
                    </p>

                    <h2>
                      Logs
                    </h2>

                  </div>

                </div>

                <div className="system-list">

                  <div>

                    <span>
                      API forbindelse
                    </span>

                    <strong className="text-online">
                      Online
                    </strong>

                  </div>

                  <div>

                    <span>
                      API endpoint
                    </span>

                    <strong>
                      /api/status
                    </strong>

                  </div>

                  <div>

                    <span>
                      Cogs endpoint
                    </span>

                    <strong>
                      /api/cogs
                    </strong>

                  </div>

                  <div>

                    <span>
                      Servers endpoint
                    </span>

                    <strong>
                      /api/servers
                    </strong>

                  </div>

                </div>

              </div>
            )}

            {/* ==================================================
                SYSTEM
            ================================================== */}

            {page === "system" && (
              <div className="section-card">

                <div className="section-header">

                  <div>

                    <p className="small-title">
                      SYSTEM
                    </p>

                    <h2>
                      System information
                    </h2>

                  </div>

                </div>

                <div className="system-list">

                  <div>
                    <span>
                      Bot
                    </span>

                    <strong>
                      Hjælper V2
                    </strong>
                  </div>

                  <div>
                    <span>
                      API
                    </span>

                    <strong>
                      FastAPI
                    </strong>
                  </div>

                  <div>
                    <span>
                      Frontend
                    </span>

                    <strong>
                      Vercel
                    </strong>
                  </div>

                  <div>
                    <span>
                      Bot hosting
                    </span>

                    <strong>
                      Wispbyte
                    </strong>
                  </div>

                  <div>
                    <span>
                      Cogs
                    </span>

                    <strong>
                      {cogs.length}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Discord servere
                    </span>

                    <strong>
                      {servers.length}
                    </strong>
                  </div>

                </div>

              </div>
            )}

          </section>

        </main>

      </div>
    );
  }

  // ==========================================================
  // HOME / DISCORD LOGIN
  // ==========================================================

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
          Velkommen til{" "}
          <span>Hjælper</span>
        </h1>

        <p className="home-description">
          Log ind med Discord for at få adgang
          til Hjælper Admin Panel.
        </p>

        {error && (
          <div className="login-error">
            {error}
          </div>
        )}

        <div className="login-options">

          {/* ==================================================
              DISCORD LOGIN
          ================================================== */}

          <button
            className="login-option admin-option"
            onClick={loginWithDiscord}
          >

            <div className="option-icon">
              💬
            </div>

            <div className="option-text">

              <strong>
                Login med Discord
              </strong>

              <span>
                Log ind med din Discord-konto
              </span>

            </div>

            <div className="option-arrow">
              →
            </div>

          </button>

          {/* ==================================================
              USER LOGIN
          ================================================== */}

          <div className="login-option disabled-option">

            <div className="option-icon">
              👤
            </div>

            <div className="option-text">

              <strong>
                Bruger Login
              </strong>

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
