import { useState } from "react";

export default function App() {
  const [page, setPage] = useState("dashboard");

  const pages = {
    dashboard: {
      title: "Dashboard",
      icon: "🏠",
      text: "Velkommen til Hjælper Dashboard!"
    },
    tickets: {
      title: "Tickets",
      icon: "🎫",
      text: "Administrer dit ticket-system."
    },
    moderation: {
      title: "Moderation",
      icon: "🛡️",
      text: "Moderationsindstillinger kommer snart."
    },
    server: {
      title: "Server",
      icon: "👋",
      text: "Administrer serverens indstillinger."
    },
    settings: {
      title: "Indstillinger",
      icon: "⚙️",
      text: "Dashboard-indstillinger."
    }
  };

  const current = pages[page];

  return (
    <div className="dashboard">

      <aside className="sidebar">
        <div className="logo">
          🤖 <span>Hjælper</span>
        </div>

        <div className="menu">
          <button
            className={page === "dashboard" ? "active" : ""}
            onClick={() => setPage("dashboard")}
          >
            🏠 Dashboard
          </button>

          <button
            className={page === "tickets" ? "active" : ""}
            onClick={() => setPage("tickets")}
          >
            🎫 Tickets
          </button>

          <button
            className={page === "moderation" ? "active" : ""}
            onClick={() => setPage("moderation")}
          >
            🛡️ Moderation
          </button>

          <button
            className={page === "server" ? "active" : ""}
            onClick={() => setPage("server")}
          >
            👋 Server
          </button>

          <button
            className={page === "settings" ? "active" : ""}
            onClick={() => setPage("settings")}
          >
            ⚙️ Indstillinger
          </button>
        </div>

        <div className="sidebar-bottom">
          <span>Hjælper V1</span>
        </div>
      </aside>

      <main className="content">
        <header>
          <div>
            <p className="small-title">HJÆLPER DASHBOARD</p>
            <h1>
              {current.icon} {current.title}
            </h1>
          </div>

          <div className="status">
            <span></span>
            Bot online
          </div>
        </header>

        <section className="welcome-card">
          <h2>{current.text}</h2>
          <p>
            Dette dashboard bliver stedet, hvor du kan
            administrere Hjælper og dine Discord-servere.
          </p>
        </section>

        {page === "dashboard" && (
          <section className="cards">

            <div className="card">
              <div className="card-icon">🤖</div>
              <h3>Hjælper</h3>
              <p>Botten er klar.</p>
              <strong>Online</strong>
            </div>

            <div className="card">
              <div className="card-icon">🎫</div>
              <h3>Tickets</h3>
              <p>Ticket-system</p>
              <strong>Aktiv</strong>
            </div>

            <div className="card">
              <div className="card-icon">⚙️</div>
              <h3>Indstillinger</h3>
              <p>Server-konfiguration</p>
              <strong>Dashboard</strong>
            </div>

          </section>
        )}

        {page === "tickets" && (
          <section className="settings-box">
            <h2>🎫 Ticket-system</h2>
            <p>
              Her kommer indstillinger til kategorier,
              staff-roller, ticket-kanaler og spørgsmål.
            </p>

            <button className="primary">
              Administrer tickets
            </button>
          </section>
        )}

        {page === "moderation" && (
          <section className="settings-box">
            <h2>🛡️ Moderation</h2>
            <p>
              Her kommer AutoMod, warnings, logs og
              andre moderation-funktioner.
            </p>
          </section>
        )}

        {page === "server" && (
          <section className="settings-box">
            <h2>👋 Server</h2>
            <p>
              Her kommer velkomstbeskeder, autorole,
              forslag og andre serverindstillinger.
            </p>
          </section>
        )}

        {page === "settings" && (
          <section className="settings-box">
            <h2>⚙️ Indstillinger</h2>
            <p>
              Her kommer dashboardets generelle
              indstillinger.
            </p>
          </section>
        )}

      </main>
    </div>
  );
}
