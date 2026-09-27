import { useEffect, useState } from "react";
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

  const load = async () => {
    try {
      const [s, st, c, sv] = await Promise.all([
        fetch(`${API}/api/status`, { credentials: "include" }),
        fetch(`${API}/api/stats`, { credentials: "include" }),
        fetch(`${API}/api/cogs`, { credentials: "include" }),
        fetch(`${API}/api/servers`, { credentials: "include" }),
      ]);

      if (s.ok) setStatus(await s.json());
      if (st.ok) setStats(await st.json());
      if (c.ok) setCogs(await c.json());
      if (sv.ok) setServers(await sv.json());
    } catch {
      setError("Kunne ikke hente data fra API'et.");
    }
  };

  useEffect(() => {
    fetch(`${API}/auth/me`, { credentials: "include" })
      .then(async r => r.ok ? setUser(await r.json()) : setUser(null))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!user) return;
    load();
    const timer = setInterval(load, 10000);
    return () => clearInterval(timer);
  }, [user]);

  const login = () => {
    window.location.href = `${API}/auth/discord`;
  };

  const logout = async () => {
    await fetch(`${API}/auth/logout`, { credentials: "include" });
    setUser(null);
  };

  const reloadCogs = async () => {
    try {
      const r = await fetch(`${API}/api/reload-cogs`, {
        method: "POST",
        credentials: "include",
      });
      if (!r.ok) throw new Error();
      load();
    } catch {
      setError("Kunne ikke reloade Cogs.");
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-logo">🤖</div>
        <h2>Hjælper</h2>
        <p>Indlæser Admin Panel...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="home">
        <div className="home-card">
          <div className="home-logo">🤖</div>
          <div className="eyebrow">HJÆLPER ADMIN PANEL</div>
          <h1>Velkommen til <span>Hjælper</span></h1>
          <p>Administrer din Discord-bot fra ét simpelt dashboard.</p>

          {error && <div className="error">{error}</div>}

          <button className="login" onClick={login}>
            🔐 Admin Login
            <span>→</span>
          </button>

          <div className="login-note">Log ind som administrator</div>

          <button className="login disabled" disabled>
            👤 Bruger Login
            <small>Kommer snart</small>
          </button>
        </div>
      </div>
    );
  }

  const owner = user.role === "owner";

  const nav = [
    ["overview", "🏠", "Overview"],
    ["bot", "🤖", "Bot"],
    ["cogs", "🧩", "Cogs"],
    ["servers", "🖥️", "Servere"],
    ["logs", "📜", "Logs"],
    ["system", "⚙️", "System"],
  ];

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-logo">🤖</div>
          <div>
            <b>Hjælper</b>
            <span>Admin Panel</span>
          </div>
        </div>

        <nav>
          {nav.map(([id, icon, name]) => (
            <button
              key={id}
              className={page === id ? "nav active" : "nav"}
              onClick={() => setPage(id)}
            >
              <i>{icon}</i>
              {name}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="profile">
            <div className="avatar">{owner ? "👑" : "🛡️"}</div>
            <div>
              <b>{user.username || "Admin"}</b>
              <span>{owner ? "Ejer" : "Admin"}</span>
            </div>
          </div>

          <button className="logout" onClick={logout}>🚪 Log ud</button>
        </div>
      </aside>

      <main>
        <header>
          <div>
            <h2>Hjælper Admin Panel</h2>
            <p>Administrer din Discord-bot</p>
          </div>

          <div className="header-right">
            <div className="role">{owner ? "👑 Ejer" : "🛡️ Admin"}</div>
            <div className="online"><span /> Online</div>
          </div>
        </header>

        <section className="content">
          {error && (
            <div className="error">
              {error}
              <button onClick={() => setError("")}>×</button>
            </div>
          )}

          {page === "overview" && (
            <>
              <div className="title">
                <div>
                  <h1>🏠 Overview</h1>
                  <p>Velkommen tilbage til Hjælper Admin Panel.</p>
                </div>
                <button className="refresh" onClick={load}>🔄 Opdater</button>
              </div>

              <div className="cards">
                <Card icon="🤖" title="Bot status" value="Online" />
                <Card icon="🖥️" title="Servere" value={servers.count ?? 0} />
                <Card icon="👥" title="Brugere" value={stats.users ?? 0} />
                <Card icon="⚡" title="Commands" value={stats.commands ?? 0} />
                <Card icon="🧩" title="Cogs" value={cogs.count ?? cogs.cogs?.length ?? 0} />
                <Card icon="🌐" title="API status" value="Online" />
              </div>

              <div className="columns">
                <Panel title="⚡ Hurtige handlinger">
                  <div className="actions">
                    <button onClick={() => setPage("bot")}>🤖 Bot</button>
                    <button onClick={() => setPage("cogs")}>🧩 Cogs</button>
                    <button onClick={() => setPage("servers")}>🖥️ Servere</button>
                    <button onClick={() => setPage("system")}>⚙️ System</button>
                    <button onClick={reloadCogs}>🔄 Reload Cogs</button>
                  </div>
                </Panel>

                <Panel title="📊 System">
                  <Info name="Bot" value="Hjælper" />
                  <Info name="Frontend" value="Vercel" />
                  <Info name="Hosting" value="Wispbyte" />
                  <Info name="API" value="Online" />
                </Panel>
              </div>
            </>
          )}

          {page === "bot" && (
            <>
              <Title title="🤖 Bot" text="Information om Hjælper." />
              <Panel title="Bot information">
                <Info name="Navn" value={status.bot_name || "Hjælper"} />
                <Info name="Bot ID" value={status.bot_id || "Ukendt"} />
                <Info name="Status" value="🟢 Online" />
                <Info name="Servere" value={servers.count ?? 0} />
                <Info name="Brugere" value={stats.users ?? 0} />
                <button className="primary" onClick={reloadCogs}>🔄 Reload Cogs</button>
              </Panel>
            </>
          )}

          {page === "cogs" && (
            <>
              <Title title="🧩 Cogs" text="Administrer bot-moduler." />
              <Panel title="Loaded Cogs">
                <button className="primary top-button" onClick={reloadCogs}>
                  🔄 Reload Cogs
                </button>

                <div className="list">
                  {(cogs.cogs || []).map(c => (
                    <div className="list-item" key={c.name || c}>
                      <b>{c.name || c}</b>
                      <span>🟢 Loaded</span>
                    </div>
                  ))}
                </div>
              </Panel>
            </>
          )}

          {page === "servers" && (
            <>
              <Title
                title="🖥️ Servere"
                text="Alle Discord-servere som Hjælper er tilsluttet."
              />

              <div className="cards">
                <Card icon="🖥️" title="Discord-servere" value={servers.count ?? 0} />
              </div>

              <Panel title="Discord-servere">
                <div className="server-list">
                  {(servers.servers || []).map(server => (
                    <div className="server" key={server.id}>
                      {server.icon ? (
                        <img src={server.icon} alt="" />
                      ) : (
                        <div className="server-icon">🖥️</div>
                      )}

                      <div className="server-name">
                        <b>{server.name}</b>
                        <span>ID: {server.id}</span>
                      </div>

                      <div className="members">
                        👥 {server.members ?? 0}
                      </div>
                    </div>
                  ))}

                  {!servers.servers?.length && (
                    <div className="empty">🖥️ Ingen servere fundet.</div>
                  )}
                </div>
              </Panel>
            </>
          )}

          {page === "logs" && (
            <>
              <Title title="📜 Logs" text="Seneste events fra Hjælper." />
              <Panel title="System Events">
                <div className="list">
                  <div className="log">🟢 API forbindelse <span>Online</span></div>
                  <div className="log">🤖 Bot status <span>Online</span></div>
                  <div className="log">🧩 Cogs <span>Loaded</span></div>
                </div>
              </Panel>
            </>
          )}

          {page === "system" && (
            <>
              <Title title="⚙️ System" text="Information om systemet bag Hjælper." />
              <Panel title="System information">
                <Info name="Bot" value="Hjælper" />
                <Info name="Bot hosting" value="Wispbyte" />
                <Info name="Frontend" value="Vercel" />
                <Info name="API" value="Online" />
                <Info name="Cogs" value={cogs.count ?? cogs.cogs?.length ?? 0} />
                <Info name="Servere" value={servers.count ?? 0} />
              </Panel>
            </>
          )}
        </section>
      </main>
    </div>
  );
}

function Card({ icon, title, value }) {
  return (
    <div className="card">
      <div className="card-icon">{icon}</div>
      <div>
        <span>{title}</span>
        <b>{value}</b>
      </div>
    </div>
  );
}

function Panel({ title, children }) {
  return (
    <div className="panel">
      <div className="panel-title">{title}</div>
      {children}
    </div>
  );
}

function Info({ name, value }) {
  return (
    <div className="info">
      <span>{name}</span>
      <b>{value}</b>
    </div>
  );
}

function Title({ title, text }) {
  return (
    <div className="title">
      <div>
        <h1>{title}</h1>
        <p>{text}</p>
      </div>
    </div>
  );
}
