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
  // LOAD USER
  // ==========================================================

  useEffect(() => {
    async function loadUser() {
      try {
        const response = await fetch(`${API}/auth/me`, {
          credentials: "include",
        });

        const data = await response.json();

        console.log("AUTH:", data);

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
  // LOAD DASHBOARD
  // ==========================================================

  async function loadDashboard() {
    try {
      const [statusRes, statsRes, cogsRes, serversRes] =
        await Promise.all([
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
        setServers(await serversRes.json());
      }
    } catch (err) {
      console.error(err);
      setError("Kunne ikke hente data fra API'et.");
    }
  }

  // ==========================================================
  // AUTO REFRESH
  // ==========================================================

  useEffect(() => {
    if (!user) return;

    loadDashboard();

    const interval = setInterval(loadDashboard, 10000);

    return () => clearInterval(interval);
  }, [user]);

  // ==========================================================
  // LOGIN
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
      setError(err.message);
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
  // LOGIN PAGE
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
            Administrer din Discord-bot
            fra ét simpelt dashboard.
          </p>

          {error && (
            <div className="error">
              <span>{error}</span>

              <button
                onClick={() => setError("")}
              >
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
  // USER
  // ==========================================================

  const displayName =
    user.global_name ||
    user.username ||
    "Admin";

  const isOwner =
    user.role === "owner";

  // ==========================================================
  // AVATAR
  // ==========================================================

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

        {/* USER */}

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
              <div className="title">

                <div>
                  <h1>
                    🏠 Overview
                  </h1>

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
                  title="Brugere"
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

                <Panel title="⚡ Hurtige handlinger">

                  <div className="actions">

                    <button
                      onClick={() => setPage("bot")}
                    >
                      🤖 Bot
                    </button>

                    <button
                      onClick={() => setPage("cogs")}
                    >
                      🧩 Cogs
                    </button>

                    <button
                      onClick={() => setPage("servers")}
                    >
                      🖥️ Servere
                    </button>

                    <button
                      onClick={() => setPage("system")}
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
                    "Hjælper"
                  }
                />

                <Info
                  name="Bot ID"
                  value={
                    status.bot_id ||
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
                  name="Brugere"
                  value={stats.users ?? 0}
                />

              </Panel>
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

                  {(cogs.cogs || []).map((cog) => (
                    <div
                      className="list-item"
                      key={cog.name}
                    >

                      <b>
                        {cog.name}
                      </b>

                      <span>
                        🟢 Loaded
                      </span>

                    </div>
                  ))}

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

          {page === "servers" && (
            <>
              <Title
                title="🖥️ Servere"
                text="Alle Discord-servere som Hjælper er tilsluttet."
              />

              <Panel title="Discord-servere">

                <div className="server-list">

                  {(servers.servers || []).map((server) => (
                    <div
                      className="server"
                      key={server.id}
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
                        👥 {server.members ?? 0}
                      </div>

                    </div>
                  ))}

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
                    <span>Online</span>
                  </div>

                  <div className="log">
                    🤖 Bot status
                    <span>Online</span>
                  </div>

                  <div className="log">
                    🧩 Cogs
                    <span>Loaded</span>
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
                  value={
                    servers.count ?? 0
                  }
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

      <span>
        {name}
      </span>

      <b>
        {value}
      </b>

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
