import React, { useEffect, useState } from "react";
import "./style.css";

const API_URL = "http://51.79.44.111:9305";

function App() {
  const [activePage, setActivePage] = useState("dashboard");

  const [status, setStatus] = useState(null);
  const [stats, setStats] = useState(null);
  const [servers, setServers] = useState([]);
  const [cogs, setCogs] = useState([]);

  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [error, setError] = useState(null);

  const loadData = async () => {
    try {
      setError(null);

      const [
        statusResponse,
        statsResponse,
        serversResponse,
        cogsResponse,
      ] = await Promise.all([
        fetch(`${API_URL}/api/status`),
        fetch(`${API_URL}/api/stats`),
        fetch(`${API_URL}/api/servers`),
        fetch(`${API_URL}/api/cogs`),
      ]);

      if (
        !statusResponse.ok ||
        !statsResponse.ok ||
        !serversResponse.ok ||
        !cogsResponse.ok
      ) {
        throw new Error("API'en kunne ikke kontaktes.");
      }

      const statusData = await statusResponse.json();
      const statsData = await statsResponse.json();
      const serversData = await serversResponse.json();
      const cogsData = await cogsResponse.json();

      setStatus(statusData);
      setStats(statsData);
      setServers(serversData.servers || []);
      setCogs(cogsData.cogs || []);

      setLastUpdate(new Date());
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const interval = setInterval(() => {
      loadData();
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const botOnline = status?.bot_connected === true;

  const formatNumber = (number) => {
    if (number === undefined || number === null) {
      return "0";
    }

    return number.toLocaleString("da-DK");
  };

  const formatTime = () => {
    if (!lastUpdate) {
      return "Ikke opdateret endnu";
    }

    return lastUpdate.toLocaleTimeString("da-DK");
  };

  return (
    <div className="app">

      {/* SIDEBAR */}

      <aside className="sidebar">

        <div className="brand">
          <div className="brand-icon">H</div>

          <div>
            <h2>Hjælper</h2>
            <span>Dashboard V2</span>
          </div>
        </div>

        <div className="nav-title">
          ADMIN
        </div>

        <button
          className={`nav-button ${
            activePage === "dashboard" ? "active" : ""
          }`}
          onClick={() => setActivePage("dashboard")}
        >
          <span>🏠</span>
          Dashboard
        </button>

        <button
          className={`nav-button ${
            activePage === "servers" ? "active" : ""
          }`}
          onClick={() => setActivePage("servers")}
        >
          <span>🖥️</span>
          Servere
        </button>

        <button
          className={`nav-button ${
            activePage === "bot" ? "active" : ""
          }`}
          onClick={() => setActivePage("bot")}
        >
          <span>🤖</span>
          Bot
        </button>

        <button
          className={`nav-button ${
            activePage === "system" ? "active" : ""
          }`}
          onClick={() => setActivePage("system")}
        >
          <span>⚙️</span>
          System
        </button>

        <button
          className={`nav-button ${
            activePage === "settings" ? "active" : ""
          }`}
          onClick={() => setActivePage("settings")}
        >
          <span>🔧</span>
          Indstillinger
        </button>

        <div className="sidebar-bottom">

          <div className="connection-status">

            <span
              className={`status-dot ${
                botOnline ? "online" : "offline"
              }`}
            />

            <div>
              <strong>
                {botOnline ? "Bot online" : "Bot offline"}
              </strong>

              <small>
                {botOnline
                  ? "Forbundet til Discord"
                  : "Ingen forbindelse"}
              </small>
            </div>

          </div>

        </div>

      </aside>


      {/* MAIN */}

      <main className="main">

        {/* TOPBAR */}

        <header className="topbar">

          <div>
            <h1>
              {activePage === "dashboard" && "Dashboard"}

              {activePage === "servers" && "Servere"}

              {activePage === "bot" && "Bot"}

              {activePage === "system" && "System"}

              {activePage === "settings" && "Indstillinger"}
            </h1>

            <p>
              Hjælper V2 administration
            </p>
          </div>

          <div className="topbar-actions">

            <div className="api-status">

              <span
                className={`status-dot ${
                  botOnline ? "online" : "offline"
                }`}
              />

              {botOnline
                ? "API forbundet"
                : "API offline"}

            </div>

            <button
              className="refresh-button"
              onClick={loadData}
              disabled={loading}
            >
              🔄 Opdater
            </button>

          </div>

        </header>


        {/* ERROR */}

        {error && (
          <div className="error-box">
            <strong>⚠️ API-fejl</strong>
            <span>{error}</span>
          </div>
        )}


        {/* DASHBOARD */}

        {activePage === "dashboard" && (
          <section className="content">

            <div className="welcome-card">

              <div>
                <span className="eyebrow">
                  HJÆLPER V2
                </span>

                <h2>
                  Velkommen til dashboardet 👋
                </h2>

                <p>
                  Her kan du overvåge din Hjælper-bot
                  og se live information fra Discord.
                </p>
              </div>

              <div className="bot-status-large">

                <span
                  className={`status-dot ${
                    botOnline ? "online" : "offline"
                  }`}
                />

                <div>
                  <strong>
                    {botOnline ? "Online" : "Offline"}
                  </strong>

                  <small>
                    {status?.bot_name || "Hjælper V2"}
                  </small>
                </div>

              </div>

            </div>


            <div className="stats-grid">

              <StatCard
                icon="🤖"
                title="Bot status"
                value={botOnline ? "Online" : "Offline"}
                subtitle={
                  status?.bot_name || "Hjælper V2"
                }
              />

              <StatCard
                icon="🖥️"
                title="Servere"
                value={formatNumber(stats?.servers)}
                subtitle="Discord servere"
              />

              <StatCard
                icon="👥"
                title="Brugere"
                value={formatNumber(stats?.users)}
                subtitle="Samlede medlemmer"
              />

              <StatCard
                icon="🔢"
                title="Commands"
                value={formatNumber(stats?.commands)}
                subtitle="Slash commands"
              />

              <StatCard
                icon="🧩"
                title="Cogs"
                value={formatNumber(stats?.cogs)}
                subtitle="Loaded modules"
              />

              <StatCard
                icon="🌐"
                title="API"
                value={status?.status === "online" ? "Online" : "Offline"}
                subtitle={`Port 9305`}
              />

            </div>


            <div className="section-grid">

              <div className="panel">

                <div className="panel-header">

                  <div>
                    <h3>Discord servere</h3>
                    <p>
                      Servere hvor Hjælper er installeret
                    </p>
                  </div>

                  <button
                    className="small-button"
                    onClick={() => setActivePage("servers")}
                  >
                    Se alle
                  </button>

                </div>

                <div className="server-list">

                  {loading && servers.length === 0 ? (
                    <div className="empty-state">
                      Henter servere...
                    </div>
                  ) : servers.length === 0 ? (
                    <div className="empty-state">
                      Ingen servere fundet.
                    </div>
                  ) : (
                    servers.slice(0, 5).map((server) => (
                      <ServerRow
                        key={server.id}
                        server={server}
                      />
                    ))
                  )}

                </div>

              </div>


              <div className="panel">

                <div className="panel-header">

                  <div>
                    <h3>Loaded Cogs</h3>
                    <p>
                      Aktive moduler i botten
                    </p>
                  </div>

                  <span className="count-badge">
                    {cogs.length}
                  </span>

                </div>

                <div className="cog-list">

                  {cogs.length === 0 ? (
                    <div className="empty-state">
                      Ingen cogs fundet.
                    </div>
                  ) : (
                    cogs.map((cog) => (
                      <div
                        className="cog-row"
                        key={cog.name}
                      >
                        <div className="cog-icon">
                          🧩
                        </div>

                        <div>
                          <strong>
                            {cog.name}
                          </strong>

                          <small>
                            Loaded
                          </small>
                        </div>

                        <span className="loaded-badge">
                          ✓
                        </span>
                      </div>
                    ))
                  )}

                </div>

              </div>

            </div>


            <div className="last-update">
              Sidst opdateret: {formatTime()}
              {" • "}
              Automatisk opdatering hvert 15. sekund
            </div>

          </section>
        )}


        {/* SERVERS */}

        {activePage === "servers" && (
          <section className="content">

            <div className="page-header">

              <div>
                <span className="eyebrow">
                  DISCORD
                </span>

                <h2>
                  Servere
                </h2>

                <p>
                  Alle servere hvor Hjælper V2 er installeret.
                </p>
              </div>

              <div className="page-number">
                {servers.length} servere
              </div>

            </div>


            <div className="server-grid">

              {servers.map((server) => (
                <div
                  className="server-card"
                  key={server.id}
                >

                  <div className="server-card-top">

                    {server.icon ? (
                      <img
                        src={server.icon}
                        alt={server.name}
                        className="server-icon"
                      />
                    ) : (
                      <div className="server-icon-placeholder">
                        🖥️
                      </div>
                    )}

                    <div>
                      <h3>
                        {server.name}
                      </h3>

                      <span>
                        ID: {server.id}
                      </span>
                    </div>

                  </div>

                  <div className="server-info">

                    <div>
                      <span>👥</span>
                      <strong>
                        {formatNumber(server.members)}
                      </strong>
                      <small>
                        medlemmer
                      </small>
                    </div>

                    <div>
                      <span>👑</span>
                      <strong>
                        {server.owner_id || "Ukendt"}
                      </strong>
                      <small>
                        owner ID
                      </small>
                    </div>

                  </div>

                  <button
                    className="server-action"
                    onClick={() =>
                      navigator.clipboard.writeText(
                        String(server.id)
                      )
                    }
                  >
                    📋 Kopiér server-ID
                  </button>

                </div>
              ))}

            </div>

          </section>
        )}


        {/* BOT */}

        {activePage === "bot" && (
          <section className="content">

            <div className="page-header">

              <div>
                <span className="eyebrow">
                  HJÆLPER V2
                </span>

                <h2>
                  Bot
                </h2>

                <p>
                  Information om den aktive Discord-bot.
                </p>
              </div>

            </div>


            <div className="info-grid">

              <InfoCard
                icon="🤖"
                title="Bot"
                value={status?.bot_name || "Ukendt"}
              />

              <InfoCard
                icon="🆔"
                title="Bot ID"
                value={status?.bot_id || "Ukendt"}
              />

              <InfoCard
                icon="🏠"
                title="Servere"
                value={formatNumber(status?.servers)}
              />

              <InfoCard
                icon="📡"
                title="Forbindelse"
                value={botOnline ? "Online" : "Offline"}
              />

            </div>


            <div className="panel">

              <div className="panel-header">

                <div>
                  <h3>Loaded Cogs</h3>
                  <p>
                    Moduler som aktuelt er loaded.
                  </p>
                </div>

              </div>

              <div className="cog-list">

                {cogs.map((cog) => (
                  <div
                    className="cog-row"
                    key={cog.name}
                  >

                    <div className="cog-icon">
                      🧩
                    </div>

                    <div>
                      <strong>
                        {cog.name}
                      </strong>

                      <small>
                        Aktiv
                      </small>
                    </div>

                    <span className="loaded-badge">
                      ✓ Loaded
                    </span>

                  </div>
                ))}

              </div>

            </div>

          </section>
        )}


        {/* SYSTEM */}

        {activePage === "system" && (
          <section className="content">

            <div className="page-header">

              <div>
                <span className="eyebrow">
                  SYSTEM
                </span>

                <h2>
                  System
                </h2>

                <p>
                  Teknisk information om Hjælper V2.
                </p>
              </div>

            </div>


            <div className="stats-grid">

              <StatCard
                icon="🌐"
                title="API"
                value={
                  status?.status === "online"
                    ? "Online"
                    : "Offline"
                }
                subtitle="FastAPI"
              />

              <StatCard
                icon="🔌"
                title="Port"
                value="9305"
                subtitle="API port"
              />

              <StatCard
                icon="🐍"
                title="Python"
                value="3.14"
                subtitle="Python runtime"
              />

              <StatCard
                icon="🤖"
                title="Discord"
                value="2.7.1"
                subtitle="discord.py"
              />

            </div>


            <div className="panel">

              <div className="panel-header">

                <div>
                  <h3>
                    API endpoints
                  </h3>

                  <p>
                    Endpoints dashboardet bruger.
                  </p>
                </div>

              </div>

              <div className="endpoint-list">

                <Endpoint
                  method="GET"
                  path="/api/status"
                />

                <Endpoint
                  method="GET"
                  path="/api/servers"
                />

                <Endpoint
                  method="GET"
                  path="/api/stats"
                />

                <Endpoint
                  method="GET"
                  path="/api/cogs"
                />

              </div>

            </div>

          </section>
        )}


        {/* SETTINGS */}

        {activePage === "settings" && (
          <section className="content">

            <div className="page-header">

              <div>
                <span className="eyebrow">
                  KONFIGURATION
                </span>

                <h2>
                  Indstillinger
                </h2>

                <p>
                  Dashboard-indstillinger kommer her.
                </p>
              </div>

            </div>


            <div className="panel">

              <div className="setting-row">

                <div>
                  <strong>
                    Automatisk opdatering
                  </strong>

                  <small>
                    Dashboardet henter nye data
                    hvert 15. sekund.
                  </small>
                </div>

                <span className="setting-enabled">
                  ✓ Aktiv
                </span>

              </div>


              <div className="setting-row">

                <div>
                  <strong>
                    API forbindelse
                  </strong>

                  <small>
                    {API_URL}
                  </small>
                </div>

                <span
                  className={
                    botOnline
                      ? "setting-enabled"
                      : "setting-disabled"
                  }
                >
                  {botOnline
                    ? "✓ Online"
                    : "✕ Offline"}
                </span>

              </div>


              <div className="setting-row">

                <div>
                  <strong>
                    Dashboard version
                  </strong>

                  <small>
                    Hjælper Dashboard V2
                  </small>
                </div>

                <span className="version-badge">
                  V2
                </span>

              </div>

            </div>

          </section>
        )}

        <footer>
          Hjælper Dashboard • V2
        </footer>

      </main>

    </div>
  );
}


/* ============================================================
   COMPONENTS
============================================================ */

function StatCard({
  icon,
  title,
  value,
  subtitle,
}) {
  return (
    <div className="stat-card">

      <div className="stat-icon">
        {icon}
      </div>

      <div className="stat-content">

        <span>
          {title}
        </span>

        <strong>
          {value}
        </strong>

        <small>
          {subtitle}
        </small>

      </div>

    </div>
  );
}


function ServerRow({ server }) {
  return (
    <div className="server-row">

      {server.icon ? (
        <img
          src={server.icon}
          alt={server.name}
          className="server-row-icon"
        />
      ) : (
        <div className="server-row-icon placeholder">
          🖥️
        </div>
      )}

      <div className="server-row-info">

        <strong>
          {server.name}
        </strong>

        <small>
          {server.members || 0} medlemmer
        </small>

      </div>

      <span className="server-online">
        ●
      </span>

    </div>
  );
}


function InfoCard({
  icon,
  title,
  value,
}) {
  return (
    <div className="info-card">

      <div className="info-card-icon">
        {icon}
      </div>

      <div>
        <span>
          {title}
        </span>

        <strong>
          {value}
        </strong>
      </div>

    </div>
  );
}


function Endpoint({
  method,
  path,
}) {
  return (
    <div className="endpoint-row">

      <span className="method">
        {method}
      </span>

      <code>
        {path}
      </code>

    </div>
  );
}

export default App;
