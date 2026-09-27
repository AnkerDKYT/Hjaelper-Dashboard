import React, { useState } from "react";

const ADMIN_CODE = "5378";

const demoServers = [
  {
    id: "123456789012345678",
    name: "AnkerSMP",
    members: 128,
    status: "Online",
  },
  {
    id: "987654321098765432",
    name: "Hjælper Community",
    members: 74,
    status: "Online",
  },
  {
    id: "555555555555555555",
    name: "Test Server",
    members: 31,
    status: "Online",
  },
];

const menuItems = [
  ["overview", "📊", "Oversigt"],
  ["servers", "🖥️", "Servere"],
  ["bot", "🤖", "Bot"],
  ["system", "📜", "System"],
  ["users", "👤", "Brugere"],
  ["settings", "⚙️", "Indstillinger"],
];

export default function App() {
  const [page, setPage] = useState("home");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [activePage, setActivePage] = useState("overview");
  const [search, setSearch] = useState("");

  function checkCode() {
    if (code === ADMIN_CODE) {
      setError("");
      setCode("");
      setPage("dashboard");
    } else {
      setError("❌ Forkert admin-kode");
      setCode("");
    }
  }

  function logout() {
    setPage("home");
    setActivePage("overview");
  }

  if (page === "home") {
    return (
      <div className="admin-page">
        <div className="admin-card">
          <div className="bot-icon">🤖</div>

          <h1>Hjælper</h1>

          <div className="buttons">
            <button
              className="admin-button"
              onClick={() => setPage("login")}
            >
              🔐 Admin adgang
            </button>

            <button className="login-button" disabled>
              🔵 Log ind
              <span>Kommer snart</span>
            </button>
          </div>
        </div>

        <div className="version">
          Hjælper Dashboard • V1
        </div>
      </div>
    );
  }

  if (page === "login") {
    return (
      <div className="admin-page">
        <div className="admin-card">
          <div className="bot-icon">🔐</div>

          <h1>Admin adgang</h1>

          <p className="muted">
            Indtast admin-koden for at fortsætte.
          </p>

          <input
            className="code-input"
            type="password"
            value={code}
            maxLength={4}
            placeholder="Admin-kode"
            onChange={(e) => {
              setCode(e.target.value);
              setError("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") checkCode();
            }}
          />

          {error && <div className="error">{error}</div>}

          <div className="buttons">
            <button className="admin-button" onClick={checkCode}>
              🔓 Fortsæt
            </button>

            <button
              className="login-button back-button"
              onClick={() => {
                setPage("home");
                setCode("");
                setError("");
              }}
            >
              ← Tilbage
            </button>
          </div>
        </div>

        <div className="version">
          Hjælper Dashboard • V1
        </div>
      </div>
    );
  }

  const filteredServers = demoServers.filter((server) =>
    `${server.name} ${server.id}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">🤖</div>

          <div>
            <strong>Hjælper</strong>
            <span>Admin Panel</span>
          </div>
        </div>

        <div className="sidebar-menu">
          {menuItems.map(([id, icon, label]) => (
            <button
              key={id}
              className={activePage === id ? "menu-item active" : "menu-item"}
              onClick={() => setActivePage(id)}
            >
              <span>{icon}</span>
              {label}
            </button>
          ))}
        </div>

        <div className="sidebar-bottom">
          <button className="logout-button" onClick={logout}>
            🚪 Log ud
          </button>

          <div className="sidebar-version">
            Hjælper V1.0
          </div>
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="topbar">
          <div>
            <h1>
              {activePage === "overview" && "📊 Oversigt"}
              {activePage === "servers" && "🖥️ Servere"}
              {activePage === "bot" && "🤖 Bot"}
              {activePage === "system" && "📜 System"}
              {activePage === "users" && "👤 Brugere"}
              {activePage === "settings" && "⚙️ Indstillinger"}
            </h1>

            <p>Velkommen til Hjælper Admin Panel.</p>
          </div>

          <div className="status-pill">
            <span></span>
            Online
          </div>
        </header>

        {activePage === "overview" && (
          <>
            <section className="stats-grid">
              <Stat icon="🖥️" title="Servere" value="3" />
              <Stat icon="👥" title="Medlemmer" value="233" />
              <Stat icon="🔢" title="Commands" value="4" />
              <Stat icon="🎫" title="Åbne tickets" value="0" />
              <Stat icon="🧩" title="Loaded cogs" value="2" />
              <Stat icon="⚠️" title="Warnings" value="0" />
            </section>

            <section className="content-grid">
              <div className="panel">
                <div className="panel-header">
                  <h2>📡 Bot-status</h2>
                </div>

                <div className="status-list">
                  <StatusRow label="Status" value="Online" />
                  <StatusRow label="Latency" value="42 ms" />
                  <StatusRow label="Uptime" value="2 dage, 4 timer" />
                  <StatusRow label="Version" value="Hjælper V1" />
                  <StatusRow label="Discord.py" value="2.7.1" />
                </div>
              </div>

              <div className="panel">
                <div className="panel-header">
                  <h2>🧩 Loaded cogs</h2>
                </div>

                <div className="cog-list">
                  <div>📦 `general.py` <span>Loaded</span></div>
                  <div>🎫 `tickets.py` <span>Loaded</span></div>
                </div>
              </div>
            </section>
          </>
        )}

        {activePage === "servers" && (
          <section className="panel full-panel">
            <div className="panel-header server-header">
              <div>
                <h2>🖥️ Hjælper servere</h2>
                <p>{demoServers.length} servere</p>
              </div>

              <input
                className="server-search"
                placeholder="🔎 Søg efter navn eller server-ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="server-list">
              {filteredServers.map((server) => (
                <div className="server-card" key={server.id}>
                  <div className="server-avatar">
                    {server.name.charAt(0)}
                  </div>

                  <div className="server-info">
                    <h3>{server.name}</h3>
                    <p>🆔 {server.id}</p>
                    <p>👥 {server.members} medlemmer</p>
                  </div>

                  <div className="server-actions">
                    <span className="online-text">
                      🟢 {server.status}
                    </span>

                    <button className="danger-button">
                      🚪 Fjern bot
                    </button>
                  </div>
                </div>
              ))}

              {filteredServers.length === 0 && (
                <div className="empty">
                  🔎 Ingen servere fundet.
                </div>
              )}
            </div>
          </section>
        )}

        {activePage === "bot" && (
          <section className="panel full-panel">
            <div className="panel-header">
              <h2>🤖 Bot-kontrol</h2>
            </div>

            <div className="action-grid">
              <AdminAction icon="🔄" title="Genstart bot" />
              <AdminAction icon="📡" title="Se bot-status" />
              <AdminAction icon="🔢" title="Se antal commands" />
              <AdminAction icon="🧩" title="Se loaded cogs" />
            </div>
          </section>
        )}

        {activePage === "system" && (
          <section className="panel full-panel">
            <div className="panel-header">
              <h2>📜 System</h2>
            </div>

            <div className="action-grid">
              <AdminAction icon="📜" title="Se logs" />
              <AdminAction icon="🐛" title="Se fejl" />
              <AdminAction icon="🔔" title="Se warnings" />
              <AdminAction icon="🗑️" title="Ryd gamle logs" />
              <AdminAction icon="📝" title="Admin audit-log" />
            </div>
          </section>
        )}

        {activePage === "users" && (
          <section className="panel full-panel">
            <div className="panel-header">
              <h2>👤 Brugere</h2>
            </div>

            <div className="stats-grid">
              <Stat icon="👤" title="Bot-brugere" value="233" />
              <Stat icon="📊" title="Aktive brugere" value="187" />
              <Stat icon="📈" title="Brug i dag" value="64" />
            </div>
          </section>
        )}

        {activePage === "settings" && (
          <section className="panel full-panel">
            <div className="panel-header">
              <h2>⚙️ Globale bot-indstillinger</h2>
            </div>

            <div className="settings-list">
              <Setting name="Maintenance Mode" value="Fra" />
              <Setting name="Auto error logging" value="Til" />
              <Setting name="Debug Mode" value="Fra" />
              <Setting name="Global Commands" value="Til" />
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function Stat({ icon, title, value }) {
  return (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>

      <div>
        <span>{title}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function StatusRow({ label, value }) {
  return (
    <div className="status-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function AdminAction({ icon, title }) {
  return (
    <button className="admin-action">
      <span>{icon}</span>
      <strong>{title}</strong>
    </button>
  );
}

function Setting({ name, value }) {
  return (
    <div className="setting-row">
      <span>{name}</span>
      <strong>{value}</strong>
    </div>
  );
}
