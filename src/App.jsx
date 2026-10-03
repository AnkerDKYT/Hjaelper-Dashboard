import React, { useEffect, useState } from "react";
import "./style.css";

const API = "/backend";

export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("login");
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState(null);
  const [cogs, setCogs] = useState([]);
  const [servers, setServers] = useState([]);

  const [selectedServer, setSelectedServer] = useState(null);
  const [removingServer, setRemovingServer] = useState(false);
  const [serverError, setServerError] = useState("");
  const [serverSuccess, setServerSuccess] = useState("");

  const [publicStats, setPublicStats] = useState(null);
  const [publicLoading, setPublicLoading] = useState(false);
  const [publicError, setPublicError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  // ==========================================================
  // AUTH
  // ==========================================================

  async function loadUser() {
    try {
      const response = await fetch(`${API}/auth/me`, {
        credentials: "include",
      });

      if (!response.ok) {
        setUser(null);
        setLoading(false);
        return;
      }

      const data = await response.json();

      if (data.authenticated && data.user) {
        setUser(data.user);

        if (data.user.role === "user") {
          setPage("user-dashboard");
        } else {
          setPage("overview");
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Auth error:", error);
      setUser(null);
    }

    setLoading(false);
  }

  function adminLogin() {
    window.location.href =
      `${API}/auth/discord?login_type=admin`;
  }

  function userLogin() {
    window.location.href =
      `${API}/auth/discord?login_type=user`;
  }

  async function logout() {
    try {
      await fetch(`${API}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch {}

    setUser(null);
    setPage("login");
    setStats(null);
    setCogs([]);
    setServers([]);
    setSelectedServer(null);
  }

  // ==========================================================
  // ROLE HELPERS
  // ==========================================================

  const isOwner =
    user?.role === "owner" ||
    user?.is_owner === true;

  const isManager =
    user?.role === "manager";

  const isAdmin =
    user?.role === "admin";

  const isStaff =
    isOwner ||
    isManager ||
    isAdmin;

  function getRoleText() {
    if (isOwner) return "👑 Ejer";
    if (isManager) return "💼 Manager";
    if (isAdmin) return "🛡️ Admin";
    return "👤 Bruger";
  }

  // ==========================================================
  // DISCORD AVATAR
  // ==========================================================

  function getAvatarUrl() {
    if (!user) return null;

    if (
      typeof user.avatar === "string" &&
      user.avatar.startsWith("http")
    ) {
      return user.avatar;
    }

    if (user.avatar && user.id) {
      const extension = user.avatar.startsWith("a_")
        ? "gif"
        : "png";

      return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${extension}?size=128`;
    }

    if (user.id) {
      try {
        const avatarIndex =
          Number(BigInt(user.id) >> 22n) % 6;

        return `https://cdn.discordapp.com/embed/avatars/${avatarIndex}.png`;
      } catch {}
    }

    return null;
  }

  // ==========================================================
  // SERVER ICON
  // ==========================================================

  function getServerIcon(server) {
    if (!server) return null;

    if (
      typeof server.icon === "string" &&
      server.icon.startsWith("http")
    ) {
      return server.icon;
    }

    return null;
  }

  // ==========================================================
  // ADMIN DATA
  // ==========================================================

  async function loadDashboardData() {
    if (!isStaff) return;

    try {
      const [
        statsResponse,
        cogsResponse,
        serversResponse,
      ] = await Promise.all([
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

      if (statsResponse.ok) {
        setStats(await statsResponse.json());
      }

      if (cogsResponse.ok) {
        const data = await cogsResponse.json();

        setCogs(
          Array.isArray(data.cogs)
            ? data.cogs
            : []
        );
      }

      if (serversResponse.ok) {
        const data = await serversResponse.json();

        setServers(
          Array.isArray(data.servers)
            ? data.servers
            : []
        );
      }
    } catch (error) {
      console.error(
        "Dashboard error:",
        error
      );
    }
  }

  // ==========================================================
  // SERVER DETAILS
  // ==========================================================

  function openServer(server) {
    setServerError("");
    setServerSuccess("");
    setSelectedServer(server);
    setPage("server-details");
  }

  function closeServer() {
    if (removingServer) return;

    setSelectedServer(null);
    setServerError("");
    setServerSuccess("");
    setPage("servers");
  }

  // ==========================================================
  // REMOVE BOT
  // ==========================================================

  async function removeHelperFromServer() {
    if (!selectedServer?.id) return;

    if (
      user?.role !== "owner" &&
      user?.role !== "manager"
    ) {
      setServerError(
        "Kun Ejer og Manager kan fjerne Hjælper fra en server."
      );
      return;
    }

    const serverName =
      selectedServer.name ||
      "denne server";

    const confirmed = window.confirm(
      `Er du sikker på, at Hjælper skal fjernes fra "${serverName}"?`
    );

    if (!confirmed) return;

    try {
      setRemovingServer(true);
      setServerError("");
      setServerSuccess("");

      let response = await fetch(
        `${API}/api/servers/${selectedServer.id}/leave`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      if (response.status === 405) {
        response = await fetch(
          `${API}/api/servers/${selectedServer.id}/leave`,
          {
            method: "DELETE",
            credentials: "include",
          }
        );
      }

      if (!response.ok) {
        let message =
          "Kunne ikke fjerne Hjælper fra serveren.";

        try {
          const data = await response.json();

          if (data.detail) {
            message = data.detail;
          }
        } catch {}

        throw new Error(message);
      }

      setServerSuccess(
        `Hjælper blev fjernet fra ${serverName}.`
      );

      setServers((current) =>
        current.filter(
          (server) =>
            String(server.id) !==
            String(selectedServer.id)
        )
      );

      setTimeout(() => {
        setSelectedServer(null);
        setServerSuccess("");
        setPage("servers");
      }, 1200);
    } catch (error) {
      console.error(
        "Remove server error:",
        error
      );

      setServerError(
        error.message ||
          "Der opstod en fejl."
      );
    } finally {
      setRemovingServer(false);
    }
  }

  // ==========================================================
  // PUBLIC DATA
  // ==========================================================

  async function loadPublicStats() {
    try {
      setPublicLoading(true);
      setPublicError("");

      const response = await fetch(
        `${API}/api/public/stats`
      );

      if (!response.ok) {
        throw new Error(
          "Kunne ikke hente statistik."
        );
      }

      const data =
        await response.json();

      setPublicStats(data);
      setLastUpdated(new Date());
    } catch (error) {
      setPublicError(
        error.message
      );
    } finally {
      setPublicLoading(false);
    }
  }

  // ==========================================================
  // NAVIGATION
  // ==========================================================

  function openStats() {
    setPage("public-stats");
    loadPublicStats();
  }

  function openStatus() {
    setPage("public-status");
    loadPublicStats();
  }

  function openRoadmap() {
    setPage("roadmap");
  }

  function backToLogin() {
    setPage("login");
  }

  // ==========================================================
  // EFFECTS
  // ==========================================================

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (!isStaff) return;

    loadDashboardData();

    const interval = setInterval(() => {
      loadDashboardData();
    }, 15000);

    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    if (
      page !== "public-stats" &&
      page !== "public-status"
    ) {
      return;
    }

    loadPublicStats();

    const interval = setInterval(() => {
      loadPublicStats();
    }, 10000);

    return () => clearInterval(interval);
  }, [page]);

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-box">

          <div className="loading-spinner" />

          <h2>
            Hjælper
          </h2>

          <p>
            Indlæser dashboard...
          </p>

        </div>
      </div>
    );
  }

  // ==========================================================
  // LOGIN
  // ==========================================================

  if (!user && page === "login") {
    return (
      <div className="app">

        <div className="login-page">

          <div className="login-box">

            <div className="login-logo">
              H
            </div>

            <h1>
              Hjælper
            </h1>

            <p>
              Discord bot & dashboard
            </p>

            <button
              className="login"
              onClick={adminLogin}
            >
              <span>
                <span className="discord-icon">
                  ◉
                </span>

                Admin Login
              </span>

              <span>
                →
              </span>
            </button>

            <button
              className="login"
              onClick={userLogin}
              style={{
                marginTop: "9px",
              }}
            >
              <span>
                👤 Bruger Login
              </span>

              <span>
                →
              </span>
            </button>

            <button
              className="login"
              onClick={openStats}
              style={{
                marginTop: "9px",
              }}
            >
              <span>
                📊 Se Statistik
              </span>

              <span>
                →
              </span>
            </button>

            <button
              className="login"
              onClick={openStatus}
              style={{
                marginTop: "9px",
              }}
            >
              <span>
                🟢 Status
              </span>

              <span>
                →
              </span>
            </button>

            <button
              className="login"
              onClick={openRoadmap}
              style={{
                marginTop: "9px",
              }}
            >
              <span>
                🚀 Roadmap
              </span>

              <span>
                →
              </span>
            </button>

            <div className="login-footer">
              Hjælper • 2026
            </div>

          </div>

        </div>

      </div>
    );
  }

  // ==========================================================
  // ROADMAP
  // ==========================================================

  if (!user && page === "roadmap") {
    return (
      <div className="app">

        <div className="public-page">

          <div className="public-topbar">

            <div className="brand">

              <div className="brand-icon">
                H
              </div>

              <div>
                <h1>
                  Hjælper
                </h1>

                <span>
                  Roadmap
                </span>
              </div>

            </div>

            <button
              className="back-button"
              onClick={backToLogin}
            >
              ← Tilbage
            </button>

          </div>

          <div className="roadmap">

            <div className="roadmap-card active">

              <div className="roadmap-header">

                <div>

                  <span className="roadmap-version">
                    V2.1
                  </span>

                  <h2>
                    Privacy Policy
                  </h2>

                </div>

                <span className="roadmap-status active">
                  🟡 Næste update
                </span>

              </div>

              <div className="roadmap-progress">

                <div
                  className="roadmap-progress-bar"
                  style={{
                    width: "35%",
                  }}
                />

              </div>

              <div className="roadmap-items">

                <div>
                  🔒 Privacy Policy
                </div>

                <div>
                  📄 Tydelig information om data og privatliv
                </div>

                <div>
                  🛡️ Mere gennemsigtighed omkring Hjælper
                </div>

              </div>

            </div>

            <div className="roadmap-card">

              <div className="roadmap-header">

                <div>

                  <span className="roadmap-version">
                    V2.2
                  </span>

                  <h2>
                    Coming Soon
                  </h2>

                </div>

                <span className="roadmap-status">
                  🔒 Hemmelig
                </span>

              </div>

              <div className="roadmap-items">

                <div>
                  ✨ Nye features
                </div>

                <div>
                  ⚡ Flere muligheder
                </div>

                <div>
                  👀 Mere bliver afsløret senere
                </div>

              </div>

            </div>

            <div className="roadmap-note">
              👀 Ikke alt bliver afsløret på forhånd.
              Nogle features bliver først vist,
              når de er klar.
            </div>

          </div>

        </div>

      </div>
    );
  }

  // ==========================================================
  // PUBLIC STATUS
  // ==========================================================

  if (
    !user &&
    page === "public-status"
  ) {

    const online =
      publicStats?.status === "online" ||
      publicStats?.bot_status === "online" ||
      publicStats?.bot_online === true;

    return (
      <div className="app">

        <div className="public-page">

          <div className="public-topbar">

            <div className="brand">

              <div className="brand-icon">
                H
              </div>

              <div>

                <h1>
                  Hjælper
                </h1>

                <span>
                  Offentlig status
                </span>

              </div>

            </div>

            <button
              className="back-button"
              onClick={backToLogin}
            >
              ← Login
            </button>

          </div>

          <div className="public-content">

            <div className="public-title">

              <span className="eyebrow">
                SYSTEM STATUS
              </span>

              <h2>
                Aktuel drift
              </h2>

              <p>
                Her kan du se den aktuelle status for Hjælper.
              </p>

            </div>

            {publicLoading &&
            !publicStats ? (

              <div className="public-loading">

                <div className="loading-spinner" />

                <p>
                  Henter status...
                </p>

              </div>

            ) : publicError ? (

              <div className="error-box">
                ❌ {publicError}
              </div>

            ) : (

              <>

                <div className="public-status-grid">

                  <div className="public-status-card">

                    <div className="status-icon">
                      🤖
                    </div>

                    <div>

                      <span>
                        Bot
                      </span>

                      <strong
                        className={
                          online
                            ? "status-online"
                            : "status-offline"
                        }
                      >
                        {online
                          ? "Online"
                          : "Offline"}
                      </strong>

                    </div>

                  </div>

                  <div className="public-status-card">

                    <div className="status-icon">
                      🌐
                    </div>

                    <div>

                      <span>
                        API
                      </span>

                      <strong className="status-online">
                        Online
                      </strong>

                    </div>

                  </div>

                  <div className="public-status-card">

                    <div className="status-icon">
                      🖥️
                    </div>

                    <div>

                      <span>
                        Servere
                      </span>

                      <strong>
                        {publicStats?.servers ?? 0}
                      </strong>

                    </div>

                  </div>

                  <div className="public-status-card">

                    <div className="status-icon">
                      ⚡
                    </div>

                    <div>

                      <span>
                        Commands
                      </span>

                      <strong>
                        {publicStats?.commands ?? 0}
                      </strong>

                    </div>

                  </div>

                  <div className="public-status-card">

                    <div className="status-icon">
                      🧩
                    </div>

                    <div>

                      <span>
                        Cogs
                      </span>

                      <strong>
                        {publicStats?.cogs ?? 0}
                      </strong>

                    </div>

                  </div>

                </div>

                <div className="public-info-box">

                  <h3>
                    🟢 Systemstatus
                  </h3>

                  <p>
                    Hjælper dashboard og API overvåges løbende.
                  </p>

                </div>

                {lastUpdated && (

                  <div className="last-updated">

                    Sidst opdateret:{" "}

                    {lastUpdated.toLocaleTimeString(
                      "da-DK"
                    )}

                  </div>

                )}

              </>

            )}

          </div>

        </div>

      </div>
    );
  }

  // ==========================================================
  // PUBLIC STATS
  // ==========================================================

  if (
    !user &&
    page === "public-stats"
  ) {

    return (
      <div className="app">

        <div className="public-page">

          <div className="public-topbar">

            <div className="brand">

              <div className="brand-icon">
                H
              </div>

              <div>

                <h1>
                  Hjælper
                </h1>

                <span>
                  Offentlig statistik
                </span>

              </div>

            </div>

            <button
              className="back-button"
              onClick={backToLogin}
            >
              ← Login
            </button>

          </div>

          <div className="public-content">

            <div className="public-title">

              <span className="eyebrow">
                STATISTIK
              </span>

              <h2>
                Hjælper Statistik
              </h2>

              <p>
                Offentlig statistik for Hjælper.
              </p>

            </div>

            {publicLoading &&
            !publicStats ? (

              <div className="public-loading">

                <div className="loading-spinner" />

                <p>
                  Henter statistik...
                </p>

              </div>

            ) : publicError ? (

              <div className="error-box">
                ❌ {publicError}
              </div>

            ) : (

              <>

                <div className="stats-grid">

                  <div className="stat-card">

                    <span>
                      🟢 Bot status
                    </span>

                    <strong>
                      {publicStats?.status === "online" ||
                      publicStats?.bot_status === "online" ||
                      publicStats?.bot_online === true
                        ? "Online"
                        : "Offline"}
                    </strong>

                  </div>

                  <div className="stat-card">

                    <span>
                      🖥️ Servere
                    </span>

                    <strong>
                      {publicStats?.servers ?? 0}
                    </strong>

                  </div>

                  <div className="stat-card">

                    <span>
                      👥 Discord-brugere
                    </span>

                    <strong>
                      {publicStats?.users ?? 0}
                    </strong>

                  </div>

                  <div className="stat-card">

                    <span>
                      ⚡ Commands
                    </span>

                    <strong>
                      {publicStats?.commands ?? 0}
                    </strong>

                  </div>

                  <div className="stat-card">

                    <span>
                      🧩 Cogs
                    </span>

                    <strong>
                      {publicStats?.cogs ?? 0}
                    </strong>

                  </div>

                </div>

                <div className="public-panel-users">

                  <div className="public-section-title">

                    <span className="eyebrow">
                      PANEL
                    </span>

                    <h3>
                      Panelbrugere
                    </h3>

                  </div>

                  <div className="stats-grid">

                    <div className="stat-card">

                      <span>
                        📅 I dag
                      </span>

                      <strong>
                        {publicStats?.panel_users_today ??
                          publicStats?.dashboard_users?.today ??
                          0}
                      </strong>

                    </div>

                    <div className="stat-card">

                      <span>
                        📆 Denne uge
                      </span>

                      <strong>
                        {publicStats?.panel_users_week ??
                          publicStats?.dashboard_users?.week ??
                          0}
                      </strong>

                    </div>

                    <div className="stat-card">

                      <span>
                        🗓️ Dette år
                      </span>

                      <strong>
                        {publicStats?.panel_users_year ??
                          publicStats?.dashboard_users?.year ??
                          0}
                      </strong>

                    </div>

                    <div className="stat-card">

                      <span>
                        👤 I alt
                      </span>

                      <strong>
                        {publicStats?.panel_users_total ??
                          publicStats?.dashboard_users?.total ??
                          0}
                      </strong>

                    </div>

                  </div>

                </div>

                {lastUpdated && (

                  <div className="last-updated">

                    Sidst opdateret:{" "}

                    {lastUpdated.toLocaleTimeString(
                      "da-DK"
                    )}

                  </div>

                )}

                <button
                  className="login"
                  onClick={openStatus}
                  style={{
                    marginTop: "20px",
                  }}
                >
                  <span>
                    🟢 Se Status
                  </span>

                  <span>
                    →
                  </span>
                </button>

              </>

            )}

          </div>

        </div>

      </div>
    );
  }

  // ==========================================================
  // USER DASHBOARD
  // ==========================================================

  if (
    user &&
    user.role === "user"
  ) {

    return (
      <div className="app dashboard">

        <aside className="sidebar">

          <div className="sidebar-brand">

            <div className="brand-icon">
              H
            </div>

            <div>

              <h2>
                Hjælper
              </h2>

              <span>
                Bruger Dashboard
              </span>

            </div>

          </div>

          <nav>

            <button
              className={
                page === "user-dashboard"
                  ? "nav-item active"
                  : "nav-item"
              }
              onClick={() =>
                setPage("user-dashboard")
              }
            >

              <span>
                🏠
              </span>

              <span>
                Dashboard
              </span>

            </button>

          </nav>

          <div className="sidebar-bottom">

            <div className="user-mini">

              <div className="user-avatar">

                {getAvatarUrl() ? (

                  <img
                    src={getAvatarUrl()}
                    alt=""
                    onError={(event) => {
                      try {
                        const avatarIndex =
                          Number(
                            BigInt(user.id) >> 22n
                          ) % 6;

                        event.currentTarget.src =
                          `https://cdn.discordapp.com/embed/avatars/${avatarIndex}.png`;
                      } catch {
                        event.currentTarget.style.display =
                          "none";
                      }
                    }}
                  />

                ) : (
                  "👤"
                )}

              </div>

              <div className="user-info">

                <strong>
                  {user?.username || "Bruger"}
                </strong>

                <span>
                  👤 Bruger
                </span>

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

        <main className="main">

          <header className="topbar">

            <div>

              <h1>
                Bruger Dashboard
              </h1>

              <span>
                Hjælper V2
              </span>

            </div>

            <div className="topbar-user">
              👤 Bruger
            </div>

          </header>

          <div className="content">

            <div className="page-heading">

              <span className="eyebrow">
                BRUGER DASHBOARD
              </span>

              <h2>
                Velkommen, {user?.username || "Bruger"} 👋
              </h2>

              <p>
                Du er logget ind på Hjælper som bruger.
              </p>

            </div>

            <div className="stats-grid">

              <div className="stat-card">

                <span>
                  👤 Konto
                </span>

                <strong>
                  Bruger
                </strong>

              </div>

              <div className="stat-card">

                <span>
                  🟢 Login
                </span>

                <strong>
                  Aktiv
                </strong>

              </div>

              <div className="stat-card">

                <span>
                  💬 Discord
                </span>

                <strong>
                  Forbundet
                </strong>

              </div>

            </div>

            <div className="info-card">

              <div>

                <span>
                  Discord-brugernavn
                </span>

                <strong>
                  {user?.username || "Ukendt"}
                </strong>

              </div>

              <div>

                <span>
                  Konto-ID
                </span>

                <strong>
                  {user?.id || "Ukendt"}
                </strong>

              </div>

              <div>

                <span>
                  Rolle
                </span>

                <strong>
                  👤 Bruger
                </strong>

              </div>

            </div>

            <div className="public-info-box">

              <h3>
                👋 Velkommen til Hjælper
              </h3>

              <p>
                Dit bruger-dashboard er klar.
                Flere brugerfunktioner kommer senere.
              </p>

            </div>

          </div>

        </main>

      </div>
    );
  }

  // ==========================================================
  // ADMIN NAVIGATION
  // ==========================================================

  const navigation = [
    ["overview", "🏠", "Overview"],
    ["bot", "🤖", "Bot"],
    ["stats", "📊", "Stats"],
    ["cogs", "🧩", "Cogs"],
    ["servers", "🖥️", "Servere"],
    ["logs", "📜", "Logs"],
    ["system", "⚙️", "System"],
  ];

  const visibleNavigation =
    navigation.filter(([id]) => {

      if (id === "system") {
        return isOwner || isManager;
      }

      return true;
    });

  // ==========================================================
  // ADMIN PANEL
  // ==========================================================

  return (
    <div className="app dashboard">

      <aside className="sidebar">

        <div className="sidebar-brand">

          <div className="brand-icon">
            H
          </div>

          <div>

            <h2>
              Hjælper
            </h2>

            <span>
              Dashboard
            </span>

          </div>

        </div>

        <nav>

          {visibleNavigation.map(
            ([id, icon, label]) => (

              <button
                key={id}
                className={
                  page === id
                    ? "nav-item active"
                    : "nav-item"
                }
                onClick={() => {
                  setSelectedServer(null);
                  setServerError("");
                  setServerSuccess("");
                  setPage(id);
                }}
              >

                <span>
                  {icon}
                </span>

                <span>
                  {label}
                </span>

              </button>

            )
          )}

        </nav>

        <div className="sidebar-bottom">

          <div className="user-mini">

            <div className="user-avatar">

              {getAvatarUrl() ? (

                <img
                  src={getAvatarUrl()}
                  alt=""
                  onError={(event) => {

                    try {

                      const avatarIndex =
                        Number(
                          BigInt(user.id) >> 22n
                        ) % 6;

                      event.currentTarget.src =
                        `https://cdn.discordapp.com/embed/avatars/${avatarIndex}.png`;

                    } catch {

                      event.currentTarget.style.display =
                        "none";

                    }

                  }}
                />

              ) : (
                "👤"
              )}

            </div>

            <div className="user-info">

              <strong>
                {user?.username || "Bruger"}
              </strong>

              <span>
                {getRoleText()}
              </span>

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

      <main className="main">

        <header className="topbar">

          <div>

            <h1>
              {page === "server-details"
                ? selectedServer?.name || "Server"
                : visibleNavigation.find(
                    ([id]) => id === page
                  )?.[2] || "Dashboard"}
            </h1>

            <span>
              {page === "server-details"
                ? "Server detaljer"
                : "Hjælper V2"}
            </span>

          </div>

          <div className="topbar-user">
            {getRoleText()}
          </div>

        </header>

        <div className="content">

          {/* ==================================================
              OVERVIEW
          ================================================== */}

          {page === "overview" && (

            <div>

              <div className="page-heading">

                <span className="eyebrow">
                  OVERVIEW
                </span>

                <h2>
                  Velkommen tilbage 👋
                </h2>

                <p>
                  Her får du et hurtigt overblik over Hjælper.
                </p>

              </div>

              <div className="stats-grid">

                <div className="stat-card">

                  <span>
                    🟢 Status
                  </span>

                  <strong>
                    Online
                  </strong>

                </div>

                <div className="stat-card">

                  <span>
                    🖥️ Servere
                  </span>

                  <strong>
                    {stats?.servers ?? 0}
                  </strong>

                </div>

                <div className="stat-card">

                  <span>
                    👥 Brugere
                  </span>

                  <strong>
                    {stats?.users ?? 0}
                  </strong>

                </div>

                <div className="stat-card">

                  <span>
                    ⚡ Commands
                  </span>

                  <strong>
                    {stats?.commands ?? 0}
                  </strong>

                </div>

                <div className="stat-card">

                  <span>
                    🧩 Cogs
                  </span>

                  <strong>
                    {stats?.cogs ?? 0}
                  </strong>

                </div>

              </div>

            </div>

          )}

          {/* ==================================================
              BOT
          ================================================== */}

          {page === "bot" && (

            <div>

              <div className="page-heading">

                <span className="eyebrow">
                  BOT
                </span>

                <h2>
                  Hjælper Bot
                </h2>

                <p>
                  Information om Discord-botten.
                </p>

              </div>

              <div className="info-card">

                <div>

                  <span>
                    Navn
                  </span>

                  <strong>
                    {stats?.bot_name || "Hjælper"}
                  </strong>

                </div>

                <div>

                  <span>
                    Status
                  </span>

                  <strong className="status-online">
                    🟢 Online
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

              </div>

            </div>

          )}

          {/* ==================================================
              STATS
          ================================================== */}

          {page === "stats" && (

            <div>

              <div className="page-heading">

                <span className="eyebrow">
                  STATISTIK
                </span>

                <h2>
                  Dashboard Statistik
                </h2>

                <p>
                  Statistik for brugen af Hjælper-panelet.
                </p>

              </div>

              <div className="stats-grid">

                <div className="stat-card">

                  <span>
                    📅 Panelbrugere i dag
                  </span>

                  <strong>
                    {stats?.panel_users_today ??
                      stats?.dashboard_users?.today ??
                      0}
                  </strong>

                </div>

                <div className="stat-card">

                  <span>
                    📆 Panelbrugere denne uge
                  </span>

                  <strong>
                    {stats?.panel_users_week ??
                      stats?.dashboard_users?.week ??
                      0}
                  </strong>

                </div>

                <div className="stat-card">

                  <span>
                    🗓️ Panelbrugere dette år
                  </span>

                  <strong>
                    {stats?.panel_users_year ??
                      stats?.dashboard_users?.year ??
                      0}
                  </strong>

                </div>

                <div className="stat-card">

                  <span>
                    👤 Panelbrugere i alt
                  </span>

                  <strong>
                    {stats?.panel_users_total ??
                      stats?.dashboard_users?.total ??
                      0}
                  </strong>

                </div>

              </div>

            </div>

          )}

          {/* ==================================================
              COGS
          ================================================== */}

          {page === "cogs" && (

            <div>

              <div className="page-heading">

                <span className="eyebrow">
                  COGS
                </span>

                <h2>
                  Cogs
                </h2>

                <p>
                  Loaded extensions i Hjælper.
                </p>

              </div>

              <div className="list-card">

                {cogs.length === 0 ? (

                  <div className="empty">
                    Ingen cogs fundet.
                  </div>

                ) : (

                  cogs.map(
                    (cog, index) => (

                      <div
                        className="list-row"
                        key={index}
                      >

                        <span>
                          🧩
                        </span>

                        <strong>
                          {typeof cog === "string"
                            ? cog
                            : cog.name ||
                              cog.cog ||
                              "Ukendt"}
                        </strong>

                        <span className="status-online">
                          Loaded
                        </span>

                      </div>

                    )
                  )

                )}

              </div>

            </div>

          )}

          {/* ==================================================
              SERVERS
          ================================================== */}

          {page === "servers" && (

            <div>

              <div className="page-heading">

                <span className="eyebrow">
                  SERVERE
                </span>

                <h2>
                  Discord Servere
                </h2>

                <p>
                  Klik på en server for at åbne serverens side.
                </p>

              </div>

              {serverError && (
                <div className="error-box">
                  ❌ {serverError}
                </div>
              )}

              {serverSuccess && (
                <div className="success-box">
                  ✅ {serverSuccess}
                </div>
              )}

              <div className="list-card">

                {servers.length === 0 ? (

                  <div className="empty">
                    Ingen servere fundet.
                  </div>

                ) : (

                  servers.map(
                    (server, index) => (

                      <button
                        className="server-row"
                        key={
                          server.id ||
                          index
                        }
                        onClick={() =>
                          openServer(server)
                        }
                      >

                        <span className="server-icon">

                          {getServerIcon(server) ? (

                            <img
                              src={getServerIcon(server)}
                              alt=""
                              onError={(event) => {
                                event.currentTarget.style.display =
                                  "none";
                              }}
                            />

                          ) : (
                            "🖥️"
                          )}

                        </span>

                        <span className="server-main">

                          <strong>
                            {server.name ||
                              "Ukendt server"}
                          </strong>

                          <small>
                            ID:{" "}
                            {server.id ||
                              "Ukendt"}
                          </small>

                        </span>

                        <span className="server-members">

                          {server.members ??
                            server.member_count ??
                            0}{" "}
                          brugere

                        </span>

                        <span className="server-arrow">
                          →
                        </span>

                      </button>

                    )
                  )

                )}

              </div>

            </div>

          )}

          {/* ==================================================
              SERVER DETAILS
          ================================================== */}

          {page === "server-details" &&
            selectedServer && (

              <div className="server-details-page">

                <button
                  className="back-button"
                  onClick={closeServer}
                  disabled={removingServer}
                >
                  ← Tilbage til servere
                </button>

                <div className="server-hero">

                  <div className="server-hero-icon">

                    {getServerIcon(selectedServer) ? (

                      <img
                        src={getServerIcon(selectedServer)}
                        alt=""
                        onError={(event) => {
                          event.currentTarget.style.display =
                            "none";
                        }}
                      />

                    ) : (

                      <span>
                        🖥️
                      </span>

                    )}

                  </div>

                  <div className="server-hero-info">

                    <span className="eyebrow">
                      DISCORD SERVER
                    </span>

                    <h2>
                      {selectedServer.name ||
                        "Ukendt server"}
                    </h2>

                    <p>
                      Hjælper er tilføjet til denne server.
                    </p>

                  </div>

                </div>

                {serverSuccess && (
                  <div className="success-box">
                    ✅ {serverSuccess}
                  </div>
                )}

                {serverError && (
                  <div className="error-box">
                    ❌ {serverError}
                  </div>
                )}

                <div className="server-detail-grid">

                  <div className="server-detail-card">

                    <span>
                      👥 Medlemmer
                    </span>

                    <strong>
                      {selectedServer.members ??
                        selectedServer.member_count ??
                        0}
                    </strong>

                    <small>
                      Discord-brugere på serveren
                    </small>

                  </div>

                  <div className="server-detail-card">

                    <span>
                      🆔 Server ID
                    </span>

                    <strong className="server-id">
                      {selectedServer.id ||
                        "Ukendt"}
                    </strong>

                    <small>
                      Discord Guild ID
                    </small>

                  </div>

                  <div className="server-detail-card">

                    <span>
                      🤖 Hjælper
                    </span>

                    <strong className="status-online">
                      🟢 Tilsluttet
                    </strong>

                    <small>
                      Botten er medlem af serveren
                    </small>

                  </div>

                </div>

                {(isOwner || isManager) && (

                  <div className="server-danger-card">

                    <div>

                      <span className="eyebrow">
                        SERVER HANDLING
                      </span>

                      <h3>
                        Fjern Hjælper
                      </h3>

                      <p>
                        Dette får Hjælper til at forlade
                        serveren. Handlingen kan ikke
                        fortrydes fra dashboardet.
                      </p>

                    </div>

                    <button
                      className="danger-button"
                      onClick={
                        removeHelperFromServer
                      }
                      disabled={removingServer}
                    >
                      {removingServer
                        ? "⏳ Fjerner..."
                        : "🔴 Fjern Hjælper"}
                    </button>

                  </div>

                )}

              </div>

            )}

          {/* ==================================================
              LOGS
          ================================================== */}

          {page === "logs" && (

            <div>

              <div className="page-heading">

                <span className="eyebrow">
                  LOGS
                </span>

                <h2>
                  Logs
                </h2>

                <p>
                  System- og botlogs.
                </p>

              </div>

              <div className="info-card">

                <div>
                  🟢 Hjælper er online
                </div>

                <div>
                  🧩 Cogs er indlæst
                </div>

                <div>
                  🌐 API er online
                </div>

              </div>

            </div>

          )}

          {/* ==================================================
              SYSTEM
          ================================================== */}

          {page === "system" &&
            (isOwner || isManager) && (

              <div>

                <div className="page-heading">

                  <span className="eyebrow">
                    SYSTEM
                  </span>

                  <h2>
                    System
                  </h2>

                  <p>
                    Information om Hjælper-systemet.
                  </p>

                </div>

                <div className="stats-grid">

                  <div className="stat-card">

                    <span>
                      🤖 Bot
                    </span>

                    <strong>
                      Online
                    </strong>

                  </div>

                  <div className="stat-card">

                    <span>
                      🌐 API
                    </span>

                    <strong>
                      Online
                    </strong>

                  </div>

                  <div className="stat-card">

                    <span>
                      🧩 Cogs
                    </span>

                    <strong>
                      {stats?.cogs ?? 0}
                    </strong>

                  </div>

                  <div className="stat-card">

                    <span>
                      🖥️ Servere
                    </span>

                    <strong>
                      {stats?.servers ?? 0}
                    </strong>

                  </div>

                </div>

              </div>

            )}

        </div>

      </main>

    </div>
  );
}
