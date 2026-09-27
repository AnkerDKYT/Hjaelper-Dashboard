import React, { useEffect, useState } from "react";
import "./style.css";

const API = "http://51.79.44.111:9305";

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

      const results = await Promise.all([
        fetch(`${API}/api/status`),
        fetch(`${API}/api/stats`),
        fetch(`${API}/api/servers`),
        fetch(`${API}/api/cogs`)
      ]);

      if (results.some(r => !r.ok)) throw new Error("API'en kunne ikke kontaktes.");

      const [s, st, sv, c] = await Promise.all(
        results.map(r => r.json())
      );

      setStatus(s);
      setStats(st);
      setServers(sv.servers || []);
      setCogs(c.cogs || []);
    } catch (e) {
      console.error(e);
      setError("Kunne ikke forbinde til Hjælper API.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (page === "dashboard") {
      loadAPI();
      const timer = setInterval(loadAPI, 15000);
      return () => clearInterval(timer);
    }
  }, [page]);

  const login = () => {
    if (code === "5378") {
      setError("");
      setCode("");
      setPage("servers");
    } else {
      setError("Forkert admin-kode.");
    }
  };

  const online = status?.bot_connected === true;

  if (page === "login") {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="logo">H</div>
          <h1>Hjælper</h1>
          <p className="subtitle">Dashboard V2</p>

          <div className="login-section">
            <h2>🔐 Admin adgang</h2>
            <p>Indtast din midlertidige admin-kode.</p>

            <input
              type="password"
              placeholder="Admin kode"
              value={code}
              onChange={e => setCode(e.target.value)}
              onKeyDown={e => e.key === "Enter" && login()}
            />

            <button className="primary" onClick={login}>
              🔓 Fortsæt
            </button>

            {error && <div className="error">{error}</div>}
          </div>

          <div className="divider">
            <span>eller</span>
          </div>

          <button className="disabled-button" disabled>
            🔵 Log ind
          </button>

          <small className="coming">Kommer snart</small>
        </div>
      </div>
    );
  }

  if (page === "servers") {
    return (
      <div className="server-page">
        <div className="server-header">
          <div>
            <span className="eyebrow">HJÆLPER V2</span>
            <h1>Vælg server</h1>
            <p>Vælg hvilken Discord-server du vil administrere.</p>
          </div>

          <button className="logout" onClick={() => setPage("login")}>
            Log ud
          </button>
        </div>

        {loading && <div className="loading">Henter servere...</div>}

        {error && <div className="error-box">{error}</div>}

        <div className="servers">
          {servers.map(s => (
            <button
              className="server-card"
              key={s.id}
              onClick={() => {
                setServer(s);
                setPage("dashboard");
              }}
            >
              {s.icon ? (
                <img src={s.icon} alt="" />
              ) : (
                <div className="server-placeholder">🖥️</div>
              )}

              <div>
                <strong>{s.name}</strong>
                <small>{s.members || 0} medlemmer</small>
              </div>

              <span>›</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">H</div>
          <div>
            <strong>Hjælper</strong>
            <small>Dashboard V2</small>
          </div>
        </div>

        <button
          className={page === "dashboard" ? "nav active" : "nav"}
          onClick={() => setPage("dashboard")}
        >
          🏠 Dashboard
        </button>

        <button className="nav" onClick={() => setPage("servers")}>
          🖥️ Servere
        </button>

        <button className="nav">🎫 Tickets</button>
        <button className="nav">🛡️ Moderation</button>
        <button className="nav">👋 Server</button>
        <button className="nav">⚙️ Indstillinger</button>

        <div className="sidebar-bottom">
          <span className={online ? "dot online" : "dot"} />
          {online ? "Bot online" : "Bot offline"}
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <h1>Dashboard</h1>
            <p>{server?.name || "Hjælper V2 administration"}</p>
          </div>

          <div className="actions">
            <span className={online ? "api online-text" : "api"}>
              ● {online ? "API forbundet" : "API offline"}
            </span>

            <button onClick={loadAPI} disabled={loading}>
              🔄 Opdater
            </button>
          </div>
        </header>

        {error && <div className="error-box">{error}</div>}

        <section className="content">
          <div className="welcome">
            <div>
              <span className="eyebrow">HJÆLPER V2</span>
              <h2>Velkommen 👋</h2>
              <p>Her kan du administrere og overvåge Hjælper.</p>
            </div>

            <div className="bot-state">
              <span className={online ? "dot online" : "dot"} />
              <div>
                <strong>{online ? "Online" : "Offline"}</strong>
                <small>{status?.bot_name || "Hjælper"}</small>
              </div>
            </div>
          </div>

          <div className="stats">
            <Card icon="🤖" title="Bot" value={online ? "Online" : "Offline"} />
            <Card icon="🖥️" title="Servere" value={stats?.servers ?? 0} />
            <Card icon="👥" title="Brugere" value={stats?.users ?? 0} />
            <Card icon="🔢" title="Commands" value={stats?.commands ?? 0} />
            <Card icon="🧩" title="Cogs" value={stats?.cogs ?? 0} />
            <Card icon="🌐" title="API" value={status?.status === "online" ? "Online" : "Offline"} />
          </div>

          <div className="columns">
            <Panel title="Discord servere">
              {servers.map(s => (
                <div className="row" key={s.id}>
                  {s.icon ? (
                    <img src={s.icon} alt="" />
                  ) : (
                    <div className="mini-icon">🖥️</div>
                  )}

                  <div>
                    <strong>{s.name}</strong>
                    <small>{s.members || 0} medlemmer</small>
                  </div>
                </div>
              ))}
            </Panel>

            <Panel title="Loaded Cogs">
              {cogs.map(c => (
                <div className="row" key={c.name}>
                  <div className="mini-icon">🧩</div>

                  <div>
                    <strong>{c.name}</strong>
                    <small>Loaded</small>
                  </div>

                  <span className="loaded">✓</span>
                </div>
              ))}
            </Panel>
          </div>
        </section>

        <footer>Hjælper Dashboard • V2</footer>
      </main>
    </div>
  );
}

function Card({ icon, title, value }) {
  return (
    <div className="card">
      <div className="card-icon">{icon}</div>
      <div>
        <small>{title}</small>
        <strong>{value}</strong>
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

export default App;
