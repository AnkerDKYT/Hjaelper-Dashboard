import React, { useEffect, useState } from "react";
import "./style.css";

const API = "/backend";

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState("overview");
  const [error, setError] = useState("");

  const [status, setStatus] = useState({});
  const [stats, setStats] = useState({});
  const [cogs, setCogs] = useState({});
  const [servers, setServers] = useState({});

  // ==========================================================
  // HENT DASHBOARD DATA
  // ==========================================================

  const loadDashboard = async () => {
    try {
      const requests = await Promise.all([
        fetch(`${API}/api/status`, {
          credentials: "include",
        }),

        fetch(`${API}/api/stats`, {
          credentials: "include",
        }),

        fetch(`${API}/api/cogs`, {
          credentials: "include",
        }),

        fetch(`${API}/api/servers`, {
          credentials: "include",
        }),
      ]);

      const [statusResponse, statsResponse, cogsResponse, serversResponse] =
        requests;

      if (statusResponse.ok) {
        setStatus(await statusResponse.json());
      }

      if (statsResponse.ok) {
        setStats(await statsResponse.json());
      }

      if (cogsResponse.ok) {
        setCogs(await cogsResponse.json());
      }

      if (serversResponse.ok) {
        setServers(await serversResponse.json());
      }
    } catch (err) {
      console.error(err);
      setError("Kunne ikke hente data fra API'et.");
    }
  };

  // ==========================================================
  // HENT LOGGET BRUGER
  // ==========================================================

  useEffect(() => {
    const loadUser = async () => {
      try {
        const response = await fetch(`${API}/auth/me`, {
          credentials: "include",
        });

        if (!response.ok) {
          setUser(null);
          return;
        }

        const data = await response.json();

        console.log("Hjælper bruger:", data);

        if (!data.authenticated || !data.user) {
          setUser(null);
          return;
        }

        setUser(data.user);
      } catch (err) {
        console.error(err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  // ==========================================================
  // DASHBOARD REFRESH
  // ==========================================================

  useEffect(() => {
    if (!user) return;

    loadDashboard();

    const interval = setInterval(() => {
      loadDashboard();
    }, 10000);

    return () => clearInterval(interval);
  }, [user]);

  // ==========================================================
  // LOGIN
  // ==========================================================

  const adminLogin = () => {
    window.location.href = `${API}/auth/discord`;
  };

  // ==========================================================
  // LOGOUT
  // ==========================================================

  const logout = async () => {
    try {
      await fetch(`${API}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error(err);
    }

    setUser(null);
    setPage("overview");
  };

  // ==========================================================
  // RELOAD COGS
  // ==========================================================

  const reloadCogs = async () => {
    try {
      setError("");

      const response = await fetch(`${API}/api/reload-cogs`, {
        method: "POST",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Reload fejlede.");
      }

      await loadDashboard();
    } catch (err) {
      console.error(err);
      setError(err.message || "Kunne ikke reloade Cogs.");
    }
  };

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-logo">🤖</div>
        <h2>Hjælper</h2>
        <p>Indlæser Admin Panel...</p>
      </div>
    );
  }

  // ==========================================================
  // LOGIN SIDE
  // ==========================================================

  if (!user) {
    return (
      <div className="home">
        <div className="home-card">

          <div className="home-logo">
            🤖
          </div>

          <div className="eyebrow">
            HJÆLPER ADMIN PANEL
          </div>

          <h1>
            Velkommen til <span>Hjælper</span>
          </h1>

          <p>
            Administrer din Discord-bot fra ét simpelt dashboard.
          </p>

          {error && (
            <div className="error">
              <span>{error}</span>

              <button onClick={() => setError("")}>
                ×
              </button>
            </div>
          )}

          {/* ADMIN LOGIN */}

          <button
            className="login"
            onClick={adminLogin}
          >
            <span>
              🔐 Admin Login
            </span>

            <span>
              →
            </span>
          </button>

          {/* BRUGER LOGIN */}

          <button
            className="login disabled"
            disabled
          >
            <span>
              👤 Bruger Login
            </span>

            <small>
              Kommer snart
            </small>
          </button>

          <div className="login-note">
            Admin Login bruger Discord OAuth
          </div>

        </div>
      </div>
    );
  }

  // ==========================================================
  // BRUGER DATA
  // ==========================================================

  const displayName =
    user.global_name ||
    user.username ||
    "Admin";

  const isOwner =
    user.role === "owner";

  const roleName =
    user.role_name ||
    (isOwner ? "Ejer" : "Admin");

  // ==========================================================
  // DISCORD AVATAR
  // ==========================================================

  let avatarUrl =
    "https://cdn.discordapp.com/embed/avatars/0.png";

  if (user.avatar && user.id) {
    const extension = user.avatar.startsWith("a_")
      ? "gif"
      : "png";

    avatarUrl =
      `https://cdn.discordapp.com/avatars/` +
      `${user.id}/${user.avatar}.${extension}?size=128`;
  }

  // ==========================================================
  // NAVIGATION
  // ==========================================================

  const navigation = [
    ["overview", "🏠", "Overview"],
    ["bot", "🤖", "Bot"],
    ["cogs", "🧩", "Cogs"],
    ["servers", "🖥️", "Servere"],
    ["logs", "📜", "Logs"],
    ["system", "⚙️", "System"],
  ];

  // ==========================================================
  // DASHBOARD
  // ==========================================================

  return (
    <div className="dashboard">

      {/* SIDEBAR */}

      <aside className="sidebar">

        <div className="brand">

          <div className="brand-logo">
            🤖
          </div>

          <div>
            <b>Hjælper</b>
            <span>Admin Panel</span>
          </div>

        </div>

        {/* NAVIGATION */}

        <nav>
          {navigation.map(([id, icon, name]) => (
            <button
              key={id}
              className={
                page === id
                  ? "nav active"
                  : "nav"
              }
              onClick={() => setPage(id)}
            >
              <i>{icon}</i>
              {name}
            </button>
          ))}
        </nav>

        {/* PROFIL */}

        <div className="sidebar-bottom">

          <div className="profile">

            <img
              className="profile-avatar"
              src={avatarUrl}
              alt="Discord avatar"
              onError={(event) => {
                event.currentTarget.src =
                  "https://cdn.discordapp.com/embed/avatars/0.png";
              }}
            />

            <div className="profile-info">

              <b>
                {displayName}
              </b>

              <span>
                {isOwner
                  ? "👑 Ejer"
                  : "🛡️ Admin"}
              </span>

            </div>

          </div>

          <button
            className="logout"
            onClick={logout}
          >
            🚪 Log ud
          </button>

        </div>

      </aside>

      {/* MAIN */}

      <main>

        {/* HEADER */}

        <header>

          <div>
            <h2>
              Hjælper Admin Panel
            </h2>

            <p>
              Administrer din Discord-bot
            </p>
          </div>

          <div className="header-right">

            <div className="role">
              {isOwner
                ? "👑 Ejer"
                : "🛡️ Admin"}
            </div>

            <div className="online">
              <span />
              Online
            </div>

          </div>

        </header>

        {/* CONTENT */}

        <section className="content">

          {error && (
            <div className="error">

              <span>
                {error}
              </span>

              <button
                onClick={() => setError("")}
              >
                ×
              </button>

            </div>
          )}

          {/* ==================================================
              OVERVIEW
          ================================================== */}

          {page === "overview" && (
            <>
              <Title
                title="🏠 Overview"
                text="Velkommen tilbage til Hjælper Admin Panel."
                action={
                  <button
                    className="refresh"
                    onClick={loadDashboard}
                  >
                    🔄 Opdater
                  </button>
                }
              />

              <div className="cards">

                <Card

