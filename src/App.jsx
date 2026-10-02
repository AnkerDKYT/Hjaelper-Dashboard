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

  const [publicStats, setPublicStats] = useState({});
  const [publicStatsLoading, setPublicStatsLoading] = useState(false);
  const [publicStatsError, setPublicStatsError] = useState("");
  const [publicLastUpdated, setPublicLastUpdated] = useState(null);

  const [selectedServer, setSelectedServer] = useState(null);
  const [leavingServer, setLeavingServer] = useState(false);

  // ==========================================================
  // CHECK LOGIN
  // ==========================================================

  useEffect(() => {
    async function loadUser() {
      try {
        const response = await fetch(`${API}/auth/me`, {
          credentials: "include",
        });

        const data = await response.json();

        if (data.authenticated && data.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error(err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  // ==========================================================
  // LOAD PUBLIC STATS
  // ==========================================================

  async function loadPublicStats() {
    try {
      setPublicStatsLoading(true);
      setPublicStatsError("");

      const response = await fetch(`${API}/api/public/stats`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Kunne ikke hente offentlig statistik."
        );
      }

      setPublicStats(data);
      setPublicLastUpdated(new Date());
    } catch (err) {
      console.error(err);

      setPublicStatsError(
        err.message || "Kunne ikke hente offentlig statistik."
      );
    } finally {
      setPublicStatsLoading(false);
    }
  }

  // ==========================================================
  // PUBLIC PAGES
  // ==========================================================

  function openPublicStats() {
    setPage("public-stats");
    loadPublicStats();
  }

  function openPublicStatus() {
    setPage("public-status");
    loadPublicStats();
  }

  function openRoadmap() {
    setPage("roadmap");
  }

  // ==========================================================
  // LOAD ADMIN DASHBOARD
  // ==========================================================

  async function loadDashboard() {
    try {
      setError("");

      const [
        statusRes,
        statsRes,
        cogsRes,
        serversRes,
      ] = await Promise.all([
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

      if (statusRes.ok) {
        setStatus(await statusRes.json());
      }

      if (statsRes.ok) {
        setStats(await statsRes.json());
      }

      if (cogsRes.ok) {
        setCogs(await cogsRes.json());
      }

      if (serversRes.ok) {
        const serverData = await serversRes.json();

        setServers(serverData);

        if (selectedServer) {
          const stillExists = (serverData.servers || []).some(
            (server) => server.id === selectedServer.id
          );

          if (!stillExists) {
            setSelectedServer(null);
          }
        }
      }
    } catch (err) {
      console.error(err);
      setError("Kunne ikke hente data fra API'et.");
    }
  }

  // ==========================================================
  // ADMIN AUTO REFRESH
  // ==========================================================

  useEffect(() => {
    if (!user) return;

    loadDashboard();

    const interval = setInterval(loadDashboard, 10000);

    return () => clearInterval(interval);
  }, [user]);

  // ==========================================================
  // PUBLIC AUTO REFRESH
  // ==========================================================

  useEffect(() => {
    if (
      page !== "public-stats" &&
      page !== "public-status"
    ) {
      return;
    }

    const interval = setInterval(loadPublicStats, 10000);

    return () => clearInterval(interval);
  }, [page]);

  // ==========================================================
  // ADMIN LOGIN
  // ==========================================================

  function adminLogin() {
    window.location.href = `${API}/auth/discord`;
  }

  // ==========================================================
  // LOGOUT
  // ==========================================================

  async function logout() {
    try {
      await fetch(`${API}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error(err);
    }

    setUser(null);
    setSelectedServer(null);
    setPage("overview");
  }

  // ==========================================================
  // RELOAD COGS
  // ==========================================================

  async function reloadCogs() {
    try {
      setError("");

      const response = await fetch(`${API}/api/reload-cogs`, {
        method: "POST",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Kunne ikke reloade Cogs."
        );
      }

      await loadDashboard();
    } catch (err) {
      console.error(err);

      setError(
        err.message || "Kunne ikke reloade Cogs."
      );
    }
  }

  // ==========================================================
  // LEAVE SERVER
  // ==========================================================

  async function leaveServer() {
    if (!selectedServer) return;

    const serverName = selectedServer.name;
    const serverId = selectedServer.id;

    const confirmed = window.confirm(
      `Er du sikker på, at Hjælper skal forlade "${serverName}"?\n\nServer ID: ${serverId}`
    );

    if (!confirmed) return;

    try {
      setLeavingServer(true);
      setError("");

      const response = await fetch(
        `${API}/api/servers/${serverId}/leave`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      let data = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        throw new Error(
          data.detail ||
            data.message ||
            `Kunne ikke fjerne Hjælper fra serveren. HTTP ${response.status}`
        );
      }

      setSelectedServer(null);
      setPage("servers");

      await loadDashboard();

      alert(
        data.message ||
          `✅ Hjælper har forladt "${serverName}".`
      );
    } catch (err) {
      console.error("❌ Leave server fejl:", err);

      setError(
        err.message ||
          "Kunne ikke fjerne Hjælper fra serveren."
      );

      alert(
        `❌ ${
          err.message ||
          "Kunne ikke fjerne Hjælper fra serveren."
        }`
      );
    } finally {
      setLeavingServer(false);
    }
  }

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
  // PUBLIC ROADMAP
  // ==========================================================

  if (!user && page === "roadmap") {
    return (
      <div className="home">
        <div
          className="home-card"
          style={{
            maxWidth: "850px",
          }}
        >
          <div className="home-logo">🚀</div>

          <div className="eyebrow">
            HJÆLPER ROADMAP
          </div>

          <h1>
            Hvad kommer <span>næste?</span>
          </h1>

          <p>
            Et lille kig på de næste to
            updates til Hjælper.
          </p>

          <div className="roadmap">

            <div className="roadmap-card active">

              <div className="roadmap-header">

                <div>
                  <span className="roadmap-version">
                    V2.1
                  </span>

                  <h2>
                    Next Update
                  </h2>
                </div>

                <span className="roadmap-status active">
                  🟡 Under udvikling
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
                  🟡 Flere forbedringer
                </div>

                <div>
                  🟡 Nye muligheder
                </div>

                <div>
                  🟡 Forbedret oplevelse
                </div>

                <div>
                  👀 Noget nyt...
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
                  ⚪ Planlagt
                </span>

              </div>

              <div className="roadmap-progress">

                <div
                  className="roadmap-progress-bar"
                  style={{
                    width: "8%",
                  }}
                />

              </div>

              <div className="roadmap-items">

                <div>
                  ⚪ Nye features
                </div>

                <div>
                  ⚪ Flere muligheder
                </div>

                <div>
                  👀 Mere bliver afsløret senere
                </div>

              </div>

            </div>

          </div>

          <div className="roadmap-note">

            <span>👀</span>

            <div>
              <b>
                Det er kun et sneak peek.
              </b>

              <p>
                Ikke alle kommende detaljer
                bliver vist her endnu.
              </p>
            </div>

          </div>

          <button
            className="login"
            onClick={() => {
              setPage("overview");
            }}
            style={{
              marginTop: "16px",
            }}
          >
            <span>
              ← Tilbage til login
            </span>

            <span>→</span>
          </button>

          <button
            className="login"
            onClick={openPublicStats}
            style={{
              marginTop: "9px",
            }}
          >
            <span>
              📊 Statistik
            </span>

            <span>→</span>
          </button>

          <button
            className="login"
            onClick={openPublicStatus}
            style={{
              marginTop: "9px",
            }}
          >
            <span>
              🟢 Status
            </span>

            <span>→</span>
          </button>

        </div>
      </div>
    );
  }

  // ==========================================================
  // PUBLIC STATUS
  // ==========================================================

  if (!user && page === "public-status") {
    const botOnline = publicStats.online === true;

    const cogCount = publicStats.cogs ?? 0;
    const serverCount = publicStats.servers ?? 0;
    const commandCount = publicStats.commands ?? 0;

    return (
      <div className="home">
        <div
          className="home-card"
          style={{
            maxWidth: "1100px",
          }}
        >
          <div className="home-logo">
            {botOnline ? "🟢" : "🔴"}
          </div>

          <div className="eyebrow">
            HJÆLPER SYSTEM STATUS
          </div>

          <h1>
            Offentlig <span>Status</span>
          </h1>

          <p>
            Se den aktuelle status for
            Hjælper og systemerne bag
            dashboardet.
          </p>

          {publicStatsError && (
            <div className="error">
              <span>{publicStatsError}</span>

              <button
                onClick={() =>
                  setPublicStatsError("")
                }
              >
                ×
              </button>
            </div>
          )}

          {publicStatsLoading &&
          !publicStats.servers ? (
            <div
              style={{
                padding: "30px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: "40px",
                  marginBottom: "10px",
                }}
              >
                ⏳
              </div>

              <p>Henter status...</p>
            </div>
          ) : (
            <>
              <div className="cards">

                <Card
                  icon={botOnline ? "🟢" : "🔴"}
                  title="Bot"
                  value={
                    botOnline
                      ? "Online"
                      : "Offline"
                  }
                />

                <Card
                  icon="🌐"
                  title="API"
                  value={
                    publicStatsError
                      ? "Fejl"
                      : "Online"
                  }
                />

                <Card
                  icon="🖥️"
                  title="Servere"
                  value={serverCount}
                />

                <Card
                  icon="⚡"
                  title="Commands"
                  value={commandCount}
                />

                <Card
                  icon="🧩"
                  title="Cogs"
                  value={cogCount}
                />

              </div>

              <div className="columns">

                <Panel title="🟢 Systemstatus">

                  <Info
                    name="Discord Bot"
                    value={
                      botOnline
                        ? "🟢 Online"
                        : "🔴 Offline"
                    }
                  />

                  <Info
                    name="Dashboard API"
                    value={
                      publicStatsError
                        ? "🔴 Fejl"
                        : "🟢 Online"
                    }
                  />

                  <Info
                    name="Commands"
                    value={`${commandCount} synced`}
                  />

                  <Info
                    name="Cogs"
                    value={`${cogCount} loaded`}
                  />

                </Panel>

                <Panel title="📊 Aktuel drift">

                  <Info
                    name="Bot"
                    value={
                      publicStats.name ||
                      "Hjælper"
                    }
                  />

                  <Info
                    name="Servere"
                    value={serverCount}
                  />

                  <Info
                    name="Discord-brugere"
                    value={publicStats.users ?? 0}
                  />

                  <Info
                    name="Status"
                    value={
                      botOnline
                        ? "🟢 Alle systemer OK"
                        : "🔴 Bot offline"
                    }
                  />

                </Panel>

              </div>

              <div
                style={{
                  marginTop: "16px",
                  padding: "14px",
                  textAlign: "center",
                  color: "#62697b",
                  fontSize: "10px",
                  background: "#0c0f18",
                  border:
                    "1px solid rgba(255,255,255,.05)",
                  borderRadius: "9px",
                }}
              >
                Sidst opdateret:{" "}
                {publicLastUpdated
                  ? publicLastUpdated.toLocaleTimeString(
                      "da-DK"
                    )
                  : "venter..."}
                <br />
                Opdateres automatisk hvert
                10. sekund.
              </div>
            </>
          )}

          <div
            style={{
              display: "flex",
              gap: "8px",
              marginTop: "16px",
            }}
          >
            <button
              className="login"
              onClick={() => {
                setPage("overview");
                setPublicStatsError("");
              }}
            >
              <span>
                ← Tilbage til login
              </span>

              <span>→</span>
            </button>

            <button
              className="login"
              onClick={openPublicStats}
            >
              <span>📊 Statistik</span>

              <span>→</span>
            </button>
          </div>

          <button
            className="login"
            onClick={openRoadmap}
            style={{
              marginTop: "9px",
            }}
          >
            <span>🚀 Roadmap</span>

            <span>→</span>
          </button>

          <button
            className="login"
            onClick={adminLogin}
            style={{
              marginTop: "9px",
            }}
          >
            <span>🔐 Admin Login</span>

            <span>→</span>
          </button>

          <div className="login-note">
            Status er offentlig og kræver
            ikke login.
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================
  // PUBLIC STATS
  // ==========================================================

  if (!user && page === "public-stats") {
    const publicPanelUsers =
      publicStats.panel_users ||
      publicStats.dashboard_users ||
      {};

    return (
      <div className="home">
        <div
          className="home-card"
          style={{
            maxWidth: "1100px",
          }}
        >
          <div className="home-logo">📊</div>

          <div className="eyebrow">
            HJÆLPER STATISTIK
          </div>

          <h1>
            Offentlig <span>Statistik</span>
          </h1>

          <p>
            Se statistik for Hjælper
            uden at logge ind.
          </p>

          {publicStatsError && (
            <div className="error">
              <span>{publicStatsError}</span>

              <button
                onClick={() =>
                  setPublicStatsError("")
                }
              >
                ×
              </button>
            </div>
          )}

          {publicStatsLoading &&
          !publicStats.servers ? (
            <div
              style={{
                padding: "30px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: "40px",
                  marginBottom: "10px",
                }}
              >
                ⏳
              </div>

              <p>Henter statistik...</p>
            </div>
          ) : (
            <>
              <div className="cards">

                <Card
                  icon={
                    publicStats.online
                      ? "🟢"
                      : "🔴"
                  }
                  title="Bot status"
                  value={
                    publicStats.online
                      ? "Online"
                      : "Offline"
                  }
                />

                <Card
                  icon="🖥️"
                  title="Servere"
                  value={publicStats.servers ?? 0}
                />

                <Card
                  icon="👥"
                  title="Discord-brugere"
                  value={publicStats.users ?? 0}
                />

                <Card
                  icon="⚡"
                  title="Commands"
                  value={publicStats.commands ?? 0}
                />

                <Card
                  icon="🧩"
                  title="Cogs"
                  value={publicStats.cogs ?? 0}
                />

              </div>

              <div className="columns">

                <Panel title="📊 Panelbrugere">

                  <Info
                    name="I dag"
                    value={
                      publicPanelUsers.today ??
                      publicStats.panel_users_today ??
                      0
                    }
                  />

                  <Info
                    name="Denne uge"
                    value={
                      publicPanelUsers.week ??
                      publicStats.panel_users_week ??
                      0
                    }
                  />

                  <Info
                    name="Dette år"
                    value={
                      publicPanelUsers.year ??
                      publicStats.panel_users_year ??
                      0
                    }
                  />

                  <Info
                    name="I alt"
                    value={
                      publicPanelUsers.total ??
                      publicStats.panel_users_total ??
                      0
                    }
                  />

                </Panel>

                <Panel title="🤖 Hjælper">

                  <Info
                    name="Status"
                    value={
                      publicStats.online
                        ? "🟢 Online"
                        : "🔴 Offline"
                    }
                  />

                  <Info
                    name="Bot"
                    value={
                      publicStats.name ||
                      "Hjælper"
                    }
                  />

                  <Info
                    name="Servere"
                    value={
                      publicStats.servers ?? 0
                    }
                  />

                  <Info
                    name="Cogs"
                    value={
                      publicStats.cogs ?? 0
                    }
                  />

                </Panel>

              </div>
            </>
          )}

          <div
            style={{
              display: "flex",
              gap: "8px",
              marginTop: "16px",
            }}
          >
            <button
              className="login"
              onClick={() => {
                setPage("overview");
                setPublicStatsError("");
              }}
            >
              <span>
                ← Tilbage til login
              </span>

              <span>→</span>
            </button>

            <button
              className="login"
              onClick={openPublicStatus}
            >
              <span>🟢 Status</span>

              <span>→</span>
            </button>
          </div>

          <button
            className="login"
            onClick={openRoadmap}
            style={{
              marginTop: "9px",
            }}
          >
            <span>🚀 Roadmap</span>

            <span>→</span>
          </button>

          <button
            className="login"
            onClick={adminLogin}
            style={{
              marginTop: "9px",
            }}
          >
            <span>🔐 Admin Login</span>

            <span>→</span>
          </button>

          <div className="login-note">
            Statistikken opdateres automatisk.
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================
  // LOGIN
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
            Velkommen til{" "}
            <span>Hjælper</span>
          </h1>

          <p>
            Administrer din Discord-bot
            fra ét simpelt dashboard.
          </p>

          {error && (
            <div className="error">

              <span>{error}</span>

              <button
                onClick={() =>
                  setError("")
                }
              >
                ×
              </button>

            </div>
          )}

          <button
            className="login"
            onClick={adminLogin}
          >
            <span>🔐 Admin Login</span>

            <span>→</span>
          </button>

          <button
            className="login"
            onClick={openPublicStats}
            style={{
              marginTop: "9px",
            }}
          >
            <span>📊 Se Statistik</span>

            <span>→</span>
          </button>

          <button
            className="login"
            onClick={openPublicStatus}
            style={{
              marginTop: "9px",
            }}
          >
            <span>🟢 Status</span>

            <span>→</span>
          </button>

          <button
            className="login"
            onClick={openRoadmap}
            style={{
              marginTop: "9px",
            }}
          >
            <span>🚀 Roadmap</span>

            <span>→</span>
          </button>

          <button
            className="login disabled"
            disabled
          >
            <span>👤 Bruger Login</span>

            <small>Kommer snart</small>
          </button>

          <div className="login-note">
            Admin Login bruger Discord OAuth
          </div>

        </div>
      </div>
    );
  }

  // ==========================================================
  // ADMIN USER
  // ==========================================================

  const displayName =
    user.global_name ||
    user.username ||
    "Admin";

  const isOwner =
    user.role === "owner";

  let avatarUrl =
    "https://cdn.discordapp.com/embed/avatars/0.png";

  if (user.avatar && user.id) {
    const extension =
      user.avatar.startsWith("a_")
        ? "gif"
        : "png";

    avatarUrl =
      `https://cdn.discordapp.com/avatars/` +
      `${user.id}/${user.avatar}.${extension}?size=128`;
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

  // ==========================================================
  // PANEL USER STATS
  // ==========================================================

  const dashboardUsers =
    stats.dashboard_users || {};

  const panelUsersToday =
    stats.panel_users_today ??
    dashboardUsers.today ??
    0;

  const panelUsersWeek =
    stats.panel_users_week ??
    dashboardUsers.week ??
    0;

  const panelUsersYear =
    stats.panel_users_year ??
    dashboardUsers.year ??
    0;

  const panelUsersTotal =
    stats.panel_users_total ??
    dashboardUsers.total ??
    0;

  // ==========================================================
  // ADMIN DASHBOARD
  // ==========================================================

  return (
    <div className="dashboard">

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

        <nav>

          {navigation.map(
            ([id, icon, name]) => (
              <button
                key={id}
                className={
                  page === id
                    ? "nav active"
                    : "nav"
                }
                onClick={() => {
                  setPage(id);
                  setSelectedServer(null);
                  setError("");
                }}
              >
                <i>{icon}</i>

                {name}
              </button>
            )
          )}

        </nav>

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

              <b>{displayName}</b>

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

      <main>

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

        <section className="content">

          {error && (
            <div className="error">

              <span>{error}</span>

              <button
                onClick={() =>
                  setError("")
                }
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
              <div className="title">

                <div>

                  <h1>🏠 Overview</h1>

                  <p>
                    Velkommen tilbage til
                    Hjælper Admin Panel.
                  </p>

                </div>

                <button
                  className="refresh"
                  onClick={loadDashboard}
                >
                  🔄 Opdater
                </button>

              </div>

              <div className="cards">

                <Card
                  icon="🤖"
                  title="Bot status"
                  value="Online"
                />

                <Card
                  icon="🖥️"
                  title="Servere"
                  value={servers.count ?? 0}
                />

                <Card
                  icon="👥"
                  title="Discord-brugere"
                  value={stats.users ?? 0}
                />

                <Card
                  icon="⚡"
                  title="Commands"
                  value={stats.commands ?? 0}
                />

                <Card
                  icon="🧩"
                  title="Cogs"
                  value={
                    cogs.count ??
                    cogs.cogs?.length ??
                    0
                  }
                />

              </div>

              <div className="columns">

                <Panel title="📊 Panelbrugere">

                  <Info
                    name="I dag"
                    value={panelUsersToday}
                  />

                  <Info
                    name="Denne uge"
                    value={panelUsersWeek}
                  />

                  <Info
                    name="Dette år"
                    value={panelUsersYear}
                  />

                  <Info
                    name="I alt"
                    value={panelUsersTotal}
                  />

                </Panel>

                <Panel title="⚡ Hurtige handlinger">

                  <div className="actions">

                    <button
                      onClick={() =>
                        setPage("bot")
                      }
                    >
                      🤖 Bot
                    </button>

                    <button
                      onClick={() =>
                        setPage("stats")
                      }
                    >
                      📊 Stats
                    </button>

                    <button
                      onClick={() =>
                        setPage("cogs")
                      }
                    >
                      🧩 Cogs
                    </button>

                    <button
                      onClick={() =>
                        setPage("servers")
                      }
                    >
                      🖥️ Servere
                    </button>

                    <button
                      onClick={() =>
                        setPage("system")
                      }
                    >
                      ⚙️ System
                    </button>

                    <button
                      onClick={reloadCogs}
                    >
                      🔄 Reload Cogs
                    </button>

                  </div>

                </Panel>

              </div>

              <div className="columns">

                <Panel title="📊 System">

                  <Info
                    name="Bot"
                    value="Hjælper"
                  />

                  <Info
                    name="Hosting"
                    value="Wispbyte"
                  />

                  <Info
                    name="Frontend"
                    value="Vercel"
                  />

                  <Info
                    name="API"
                    value="Online"
                  />

                </Panel>

              </div>
            </>
          )}

          {/* ==================================================
              BOT
          ================================================== */}

          {page === "bot" && (
            <>
              <Title
                title="🤖 Bot"
                text="Information om Hjælper."
              />

              <Panel title="Bot information">

                <Info
                  name="Navn"
                  value={
                    status.bot_name ||
                    status.name ||
                    "Hjælper"
                  }
                />

                <Info
                  name="Bot ID"
                  value={
                    status.bot_id ||
                    status.id ||
                    "Ukendt"
                  }
                />

                <Info
                  name="Status"
                  value="🟢 Online"
                />

                <Info
                  name="Servere"
                  value={servers.count ?? 0}
                />

                <Info
                  name="Discord-brugere"
                  value={stats.users ?? 0}
                />

              </Panel>
            </>
          )}

          {/* ==================================================
              STATS
          ================================================== */}

          {page === "stats" && (
            <>
              <div className="title">

                <div>

                  <h1>📊 Statistik</h1>

                  <p>
                    Statistik for Hjælper
                    Dashboardet.
                  </p>

                </div>

                <button
                  className="refresh"
                  onClick={loadDashboard}
                >
                  🔄 Opdater
                </button>

              </div>

              <div className="cards">

                <Card
                  icon="👤"
                  title="Panel i dag"
                  value={panelUsersToday}
                />

                <Card
                  icon="📅"
                  title="Panel denne uge"
                  value={panelUsersWeek}
                />

                <Card
                  icon="📈"
                  title="Panel dette år"
                  value={panelUsersYear}
                />

                <Card
                  icon="👥"
                  title="Panel i alt"
                  value={panelUsersTotal}
                />

              </div>

              <div className="columns">

                <Panel title="📊 Panelbrugere">

                  <Info
                    name="I dag"
                    value={panelUsersToday}
                  />

                  <Info
                    name="Denne uge"
                    value={panelUsersWeek}
                  />

                  <Info
                    name="Dette år"
                    value={panelUsersYear}
                  />

                  <Info
                    name="I alt"
                    value={panelUsersTotal}
                  />

                </Panel>

                <Panel title="🤖 Bot-statistik">

                  <Info
                    name="Servere"
                    value={
                      stats.servers ??
                      servers.count ??
                      0
                    }
                  />

                  <Info
                    name="Discord-brugere"
                    value={stats.users ?? 0}
                  />

                  <Info
                    name="Commands"
                    value={stats.commands ?? 0}
                  />

                  <Info
                    name="Cogs"
                    value={
                      stats.cogs ??
                      cogs.count ??
                      0
                    }
                  />

                </Panel>

              </div>

              <div className="columns">

                <Panel title="ℹ️ Om statistikken">

                  <p className="panel-description">
                    Panel-statistikken tæller
                    unikke Discord-brugere,
                    som har logget ind på
                    Hjælper Dashboardet.
                  </p>

                  <p className="panel-description">
                    Den samme bruger tælles
                    kun én gang pr. dag.
                  </p>

                </Panel>

              </div>
            </>
          )}

          {/* ==================================================
              COGS
          ================================================== */}

          {page === "cogs" && (
            <>
              <Title
                title="🧩 Cogs"
                text="Administrer bot-moduler."
              />

              <Panel title="Loaded Cogs">

                <button
                  className="primary top-button"
                  onClick={reloadCogs}
                >
                  🔄 Reload Cogs
                </button>

                <div className="list">

                  {(cogs.cogs || []).map(
                    (cog) => (
                      <div
                        className="list-item"
                        key={cog.name}
                      >

                        <b>{cog.name}</b>

                        <span>
                          🟢 Loaded
                        </span>

                      </div>
                    )
                  )}

                  {!cogs.cogs?.length && (
                    <div className="empty">
                      🧩 Ingen Cogs fundet.
                    </div>
                  )}

                </div>

              </Panel>
            </>
          )}

          {/* ==================================================
              SERVERS
          ================================================== */}

          {page === "servers" &&
            !selectedServer && (
              <>
                <Title
                  title="🖥️ Servere"
                  text="Alle Discord-servere som Hjælper er tilsluttet."
                />

                <Panel title="Discord-servere">

                  <div className="server-list">

                    {(servers.servers || []).map(
                      (server) => (
                        <button
                          type="button"
                          className="server server-button"
                          key={server.id}
                          onClick={() => {
                            setSelectedServer(server);
                            setError("");
                          }}
                        >

                          {server.icon ? (
                            <img
                              src={server.icon}
                              alt=""
                            />
                          ) : (
                            <div className="server-icon">
                              🖥️
                            </div>
                          )}

                          <div className="server-name">

                            <b>
                              {server.name}
                            </b>

                            <span>
                              ID: {server.id}
                            </span>

                          </div>

                          <div className="members">
                            👥{" "}
                            {server.members ?? 0}
                          </div>

                          <div className="server-arrow">
                            →
                          </div>

                        </button>
                      )
                    )}

                    {!servers.servers?.length && (
                      <div className="empty">
                        🖥️ Ingen servere fundet.
                      </div>
                    )}

                  </div>

                </Panel>
              </>
            )}

          {/* ==================================================
              SERVER DETAILS
          ================================================== */}

          {page === "servers" &&
            selectedServer && (
              <>
                <div className="title">

                  <div>

                    <h1>
                      🖥️ Serverdetaljer
                    </h1>

                    <p>
                      Administrer Hjælper
                      på denne server.
                    </p>

                  </div>

                  <button
                    className="refresh"
                    onClick={() => {
                      setSelectedServer(null);
                      setError("");
                    }}
                  >
                    ← Tilbage
                  </button>

                </div>

                <Panel title="Server information">

                  <div className="server-detail-header">

                    {selectedServer.icon ? (
                      <img
                        className="server-detail-icon"
                        src={selectedServer.icon}
                        alt=""
                      />
                    ) : (
                      <div className="server-detail-icon server-icon">
                        🖥️
                      </div>
                    )}

                    <div>

                      <h2>
                        {selectedServer.name}
                      </h2>

                      <p>
                        Hjælper er medlem
                        af serveren
                      </p>

                    </div>

                  </div>

                  <div className="server-detail-info">

                    <Info
                      name="Servernavn"
                      value={selectedServer.name}
                    />

                    <Info
                      name="Server ID"
                      value={selectedServer.id}
                    />

                    <Info
                      name="Medlemmer"
                      value={
                        selectedServer.members ?? 0
                      }
                    />

                    <Info
                      name="Serverejer ID"
                      value={
                        selectedServer.owner_id ||
                        "Ukendt"
                      }
                    />

                    <Info
                      name="Bot status"
                      value="🟢 Hjælper er online"
                    />

                  </div>

                  <div className="danger-zone">

                    <div>

                      <h3>
                        🚪 Fjern Hjælper
                      </h3>

                      <p>
                        Dette får Hjælper
                        til at forlade
                        denne Discord-server.
                      </p>

                    </div>

                    <button
                      type="button"
                      className="danger-button"
                      onClick={leaveServer}
                      disabled={leavingServer}
                    >
                      {leavingServer
                        ? "⏳ Fjerner..."
                        : "🚪 Fjern Hjælper"}
                    </button>

                  </div>

                </Panel>
              </>
            )}

          {/* ==================================================
              LOGS
          ================================================== */}

          {page === "logs" && (
            <>
              <Title
                title="📜 Logs"
                text="Seneste events fra Hjælper."
              />

              <Panel title="System Events">

                <div className="list">

                  <div className="log">
                    🟢 API forbindelse

                    <span>
                      Online
                    </span>
                  </div>

                  <div className="log">
                    🤖 Bot status

                    <span>
                      Online
                    </span>
                  </div>

                  <div className="log">
                    🧩 Cogs

                    <span>
                      Loaded
                    </span>
                  </div>

                </div>

              </Panel>
            </>
          )}

          {/* ==================================================
              SYSTEM
          ================================================== */}

          {page === "system" && (
            <>
              <Title
                title="⚙️ System"
                text="Information om systemet bag Hjælper."
              />

              <Panel title="System information">

                <Info
                  name="Bot"
                  value="Hjælper"
                />

                <Info
                  name="Bot hosting"
                  value="Wispbyte"
                />

                <Info
                  name="Frontend"
                  value="Vercel"
                />

                <Info
                  name="API"
                  value="Online"
                />

                <Info
                  name="Cogs"
                  value={
                    cogs.count ??
                    cogs.cogs?.length ??
                    0
                  }
                />

                <Info
                  name="Servere"
                  value={servers.count ?? 0}
                />

                <Info
                  name="Panelbrugere i alt"
                  value={panelUsersTotal}
                />

              </Panel>
            </>
          )}

        </section>
      </main>
    </div>
  );
}


// ============================================================
// CARD
// ============================================================

function Card({
  icon,
  title,
  value,
}) {
  return (
    <div className="card">

      <div className="card-icon">
        {icon}
      </div>

      <div>

        <span>{title}</span>

        <b>{value}</b>

      </div>

    </div>
  );
}


// ============================================================
// PANEL
// ============================================================

function Panel({
  title,
  children,
}) {
  return (
    <div className="panel">

      <div className="panel-title">
        {title}
      </div>

      {children}

    </div>
  );
}


// ============================================================
// INFO
// ============================================================

function Info({
  name,
  value,
}) {
  return (
    <div className="info">

      <span>{name}</span>

      <b>{value}</b>

    </div>
  );
}


// ============================================================
// TITLE
// ============================================================

function Title({
  title,
  text,
}) {
  return (
    <div className="title">

      <div>

        <h1>{title}</h1>

        <p>{text}</p>

      </div>

    </div>
  );
}
