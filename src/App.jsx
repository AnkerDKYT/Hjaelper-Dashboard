import { useEffect, useState } from "react";
import "./style.css";

const API_BASE = "/backend";

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState("overview");

  const [status, setStatus] = useState(null);
  const [stats, setStats] = useState(null);
  const [cogs, setCogs] = useState(null);
  const [servers, setServers] = useState(null);
  const [loading, setLoading] = useState(false);

  async function checkAuth() {
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        credentials: "include",
      });

      if (!res.ok) {
        setUser(null);
        return;
      }

      const data = await res.json();
      setUser(data);
    } catch {
      setUser(null);
    } finally {
      setAuthLoading(false);
    }
  }

  async function loadData() {
    if (!user) return;

    setLoading(true);

    try {
      const [statusRes, statsRes, cogsRes, serversRes] =
        await Promise.all([
          fetch(`${API_BASE}/api/status`, { credentials: "include" }),
          fetch(`${API_BASE}/api/stats`, { credentials: "include" }),
          fetch(`${API_BASE}/api/cogs`, { credentials: "include" }),
          fetch(`${API_BASE}/api/servers`, { credentials: "include" }),
        ]);

      if (statusRes.ok) setStatus(await statusRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
      if (cogsRes.ok) setCogs(await cogsRes.json());
      if (serversRes.ok) setServers(await serversRes.json());
    } catch {
      setError("Kunne ikke hente data fra API'et.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    checkAuth();

    const params = new URLSearchParams(window.location.search);

    if (params.get("auth") === "denied") {
      setError("❌ Du har ikke adgang til admin-panelet.");
      window.history.replaceState({}, "", "/");
    }

    if (params.get("auth") === "error") {
      setError("❌ Der opstod en fejl under admin-login.");
      window.history.replaceState({}, "", "/");
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    loadData();

    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, [user]);

  async function reloadCogs() {
    try {
      const res = await fetch(`${API_BASE}/api/reload-cogs`, {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) {
        setError("❌ Kunne ikke reloade Cogs.");
        return;
      }

      await loadData();
    } catch {
      setError("❌ API-forbindelsen fejlede.");
    }
  }

  function adminLogin() {
    window.location.href = `${API_BASE}/auth/discord`;
  }

  async function logout() {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        credentials: "include",
      });
    } catch {}

    setUser(null);
    setPage("overview");
  }

  const isOwner = user?.role === "owner";
  const roleName = isOwner ? "Ejer" : "Admin";
  const roleIcon = isOwner ? "👑" : "🛡️";

  if (authLoading) {
    return (
      <div className="app">
        <div className="loading-screen">
          <div className="loading-spinner">⏳</div>
          <h2>Hjælper</h2>
          <p>Indlæser...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="app">
        <div className="login-page">
          <div className="login-card">
            <div className="login-icon">🤖</div>

            <h1>Hjælper</h1>
            <p>Admin Panel</p>

            {error && <div className="error-box">{error}</div>}

            <button className="login-button" onClick={adminLogin}>
              🔐 Admin Login
            </button>

            <span className="login-subtitle">
              Log ind som administrator
            </span>

            <button className="disabled-login" disabled>
              👤 Bruger Login
            </button>

            <span className="login-subtitle">Kommer snart</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">🤖</div>
          <div>
            <strong>Hjælper</strong>
            <span>Admin Panel</span>
          </div>
        </div>

        <nav>
          <button
            className={page === "overview" ? "active" : ""}
            onClick={() => setPage("overview")}
          >
            🏠 <span>Overview</span>
          </button>

          <button
            className={page === "bot" ? "active" : ""}
            onClick={() => setPage("bot")}
          >
            🤖 <span>Bot</span>
          </button>

          <button
            className={page === "cogs" ? "active" : ""}
            onClick={() => setPage("cogs")}
          >
            🧩 <span>Cogs</span>
          </button>

          <button
            className={page === "servers" ? "active" : ""}
            onClick={() => setPage("servers")}
          >
            🖥️ <span>Servere</span>
          </button>

          <button
            className={page === "logs" ? "active" : ""}
            onClick={() => setPage("logs")}
          >
            📜 <span>Logs</span>
          </button>

          <button
            className={page === "system" ? "active" : ""}
            onClick={() => setPage("system")}
          >
            ⚙️ <span>System</span>
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className="user-box">
            <div className="user-avatar">{roleIcon}</div>

            <div>
              <strong>{user.username || "Admin"}</strong>
              <span>{roleName}</span>
            </div>
          </div>

          <button className="logout-button" onClick={logout}>
            🚪 Log ud
          </button>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <h2>Hjælper Admin Panel</h2>
            <span>Administrer din Discord-bot</span>
          </div>

          <div className="topbar-right">
            <div className="role-badge">
              {roleIcon} {roleName}
            </div>

            <div className="online-badge">
              <span className="online-dot" />
              Online
            </div>
          </div>
        </header>

        <div className="content">
          {error && (
            <div className="error-box top-error">
              {error}
              <button onClick={() => setError("")}>✕</button>
            </div>
          )}

          {page === "overview" && (
            <div className="page">
              <div className="page-header">
                <div>
                  <h1>🏠 Overview</h1>
                  <p>Velkommen tilbage til Hjælper Admin Panel.</p>
                </div>

                <button
                  className="secondary-button"
                  onClick={loadData}
                  disabled={loading}
                >
                  {loading ? "⏳" : "🔄"} Opdater
                </button>
              </div>

              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">🤖</div>
                  <div>
                    <span>Bot status</span>
                    <strong>
                      {status?.status === "online"
                        ? "Online"
                        : "Offline"}
                    </strong>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">🖥️</div>
                  <div>
                    <span>Servere</span>
                    <strong>{servers?.count ?? stats?.servers ?? 0}</strong>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">👥</div>
                  <div>
                    <span>Brugere</span>
                    <strong>{stats?.users ?? 0}</strong>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">⚡</div>
                  <div>
                    <span>Commands</span>
                    <strong>{stats?.commands ?? 0}</strong>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">🧩</div>
                  <div>
                    <span>Cogs</span>
                    <strong>{cogs?.cogs?.length ?? cogs?.count ?? 0}</strong>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">🌐</div>
                  <div>
                    <span>API</span>
                    <strong>Online</strong>
                  </div>
                </div>
              </div>

              <div className="dashboard-grid">
                <div className="panel">
                  <div className="panel-header">
                    <h2>Hurtige handlinger</h2>
                  </div>

                  <div className="quick-actions">
                    <button onClick={() => setPage("bot")}>
                      🤖 Bot
                    </button>

                    <button onClick={() => setPage("cogs")}>
                      🧩 Cogs
                    </button>

                    <button onClick={() => setPage("servers")}>
                      🖥️ Servere
                    </button>

                    <button onClick={() => setPage("system")}>
                      ⚙️ System
                    </button>

                    <button onClick={reloadCogs}>
                      🔄 Reload Cogs
                    </button>
                  </div>
                </div>

                <div className="panel">
                  <div className="panel-header">
                    <h2>System</h2>
                  </div>

                  <div className="info-list">
                    <div>
                      <span>Bot</span>
                      <strong>{status?.bot_name || "Hjælper"}</strong>
                    </div>

                    <div>
                      <span>API</span>
                      <strong>Online</strong>
                    </div>

                    <div>
                      <span>Frontend</span>
                      <strong>Vercel</strong>
                    </div>

                    <div>
                      <span>Bot hosting</span>
                      <strong>Wispbyte</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {page === "bot" && (
            <div className="page">
              <div className="page-header">
                <div>
                  <h1>🤖 Bot</h1>
                  <p>Information om Hjælper.</p>
                </div>

                <button
                  className="secondary-button"
                  onClick={loadData}
                >
                  🔄 Opdater
                </button>
              </div>

              <div className="panel">
                <div className="panel-header">
                  <h2>Bot information</h2>
                </div>

                <div className="info-list">
                  <div>
                    <span>Navn</span>
                    <strong>{status?.bot_name || "Hjælper"}</strong>
                  </div>

                  <div>
                    <span>Bot ID</span>
                    <strong>{status?.bot_id || "Ukendt"}</strong>
                  </div>

                  <div>
                    <span>Status</span>
                    <strong>
                      {status?.status === "online"
                        ? "🟢 Online"
                        : "🔴 Offline"}
                    </strong>
                  </div>

                  <div>
                    <span>Servere</span>
                    <strong>{servers?.count ?? 0}</strong>
                  </div>

                  <div>
                    <span>Brugere</span>
                    <strong>{stats?.users ?? 0}</strong>
                  </div>
                </div>

                <button className="primary-button" onClick={reloadCogs}>
                  🔄 Reload Cogs
                </button>
              </div>
            </div>
          )}

          {page === "cogs" && (
            <div className="page">
              <div className="page-header">
                <div>
                  <h1>🧩 Cogs</h1>
                  <p>Administrer bot-moduler.</p>
                </div>

                <button
                  className="primary-button"
                  onClick={reloadCogs}
                >
                  🔄 Reload Cogs
                </button>
              </div>

              <div className="panel">
                <div className="panel-header">
                  <h2>Loaded Cogs</h2>
                  <span>
                    {cogs?.cogs?.length ?? cogs?.count ?? 0}
                  </span>
                </div>

                <div className="cog-list">
                  {cogs?.cogs?.length ? (
                    cogs.cogs.map((cog) => (
                      <div className="cog-item" key={cog.name || cog}>
                        <div>
                          <strong>{cog.name || cog}</strong>
                          <span>
                            {cog.loaded === false
                              ? "🔴 Unloaded"
                              : "🟢 Loaded"}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="empty-state">
                      🧩 Ingen Cogs fundet.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {page === "servers" && (
            <div className="page">
              <div className="page-header">
                <div>
                  <h1>🖥️ Servere</h1>
                  <p>Alle Discord-servere som Hjælper er i.</p>
                </div>

                <button
                  className="secondary-button"
                  onClick={loadData}
                >
                  🔄 Opdater
                </button>
              </div>

              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">🖥️</div>
                  <div>
                    <span>Discord-servere</span>
                    <strong>{servers?.count ?? 0}</strong>
                  </div>
                </div>
              </div>

              <div className="panel">
                <div className="panel-header">
                  <h2>Servere</h2>
                  <span>{servers?.count ?? 0}</span>
                </div>

                <div className="server-list">
                  {servers?.servers?.length ? (
                    servers.servers.map((server) => (
                      <div className="server-card" key={server.id}>
                        <div className="server-left">
                          {server.icon ? (
                            <img
                              src={server.icon}
                              alt=""
                              className="server-icon"
                            />
                          ) : (
                            <div className="server-icon server-placeholder">
                              🖥️
                            </div>
                          )}

                          <div className="server-info">
                            <strong>{server.name}</strong>
                            <span>ID: {server.id}</span>
                          </div>
                        </div>

                        <div className="server-members">
                          👥 {server.members ?? 0}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="empty-state">
                      🖥️ Ingen servere fundet.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {page === "logs" && (
            <div className="page">
              <div className="page-header">
                <div>
                  <h1>📜 Logs</h1>
                  <p>Seneste events fra Hjælper.</p>
                </div>
              </div>

              <div className="panel">
                <div className="panel-header">
                  <h2>System Events</h2>
                </div>

                <div className="log-list">
                  <div className="log-item">
                    <span>🟢</span>
                    <div>
                      <strong>API forbindelse</strong>
                      <small>API'et er online.</small>
                    </div>
                  </div>

                  <div className="log-item">
                    <span>🤖</span>
                    <div>
                      <strong>Bot status</strong>
                      <small>
                        {status?.status === "online"
                          ? "Hjælper er online."
                          : "Hjælper er offline."}
                      </small>
                    </div>
                  </div>

                  <div className="log-item">
                    <span>🧩</span>
                    <div>
                      <strong>Cogs</strong>
                      <small>
                        {cogs?.cogs?.length ?? 0} Cogs loaded.
                      </small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {page === "system" && (
            <div className="page">
              <div className="page-header">
                <div>
                  <h1>⚙️ System</h1>
                  <p>Information om systemet bag Hjælper.</p>
                </div>
              </div>

              <div className="panel">
                <div className="panel-header">
                  <h2>System information</h2>
                </div>

                <div className="info-list">
                  <div>
                    <span>Bot</span>
                    <strong>Hjælper</strong>
                  </div>

                  <div>
                    <span>Bot status</span>
                    <strong>
                      {status?.status === "online"
                        ? "🟢 Online"
                        : "🔴 Offline"}
                    </strong>
                  </div>

                  <div>
                    <span>API</span>
                    <strong>🟢 Online</strong>
                  </div>

                  <div>
                    <span>Frontend</span>
                    <strong>Vercel</strong>
                  </div>

                  <div>
                    <span>Bot hosting</span>
                    <strong>Wispbyte</strong>
                  </div>

                  <div>
                    <span>Cogs</span>
                    <strong>{cogs?.cogs?.length ?? 0}</strong>
                  </div>

                  <div>
                    <span>Servere</span>
                    <strong>{servers?.count ?? 0}</strong>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
