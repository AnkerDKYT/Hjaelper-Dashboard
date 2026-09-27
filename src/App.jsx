import React, { useState } from "react";

export default function App() {
  const [page, setPage] = useState("dashboard");
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  const [categories, setCategories] = useState([
    { name: "Teknisk hjælp", emoji: "🛠️" },
    { name: "Bug / Fejl", emoji: "🐛" },
    { name: "Køb / Betaling", emoji: "💰" },
    { name: "Andet", emoji: "❓" }
  ]);

  const [newName, setNewName] = useState("");
  const [newEmoji, setNewEmoji] = useState("🎫");

  const pages = {
    dashboard: {
      title: "Dashboard",
      icon: "🏠"
    },
    tickets: {
      title: "Tickets",
      icon: "🎫"
    },
    moderation: {
      title: "Moderation",
      icon: "🛡️"
    },
    server: {
      title: "Server",
      icon: "👋"
    },
    settings: {
      title: "Indstillinger",
      icon: "⚙️"
    }
  };

  const current = pages[page];

  function addCategory() {
    if (!newName.trim()) return;

    setCategories([
      ...categories,
      {
        name: newName.trim(),
        emoji: newEmoji || "🎫"
      }
    ]);

    setNewName("");
    setNewEmoji("🎫");
    setShowCategoryModal(false);
  }

  function removeCategory(index) {
    setCategories(categories.filter((_, i) => i !== index));
  }

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
          Hjælper V1
        </div>

      </aside>

      <main className="content">

        <header>

          <div>
            <p className="small-title">
              HJÆLPER DASHBOARD
            </p>

            <h1>
              {current.icon} {current.title}
            </h1>
          </div>

          <div className="status">
            <span></span>
            Bot online
          </div>

        </header>


        {/* DASHBOARD */}

        {page === "dashboard" && (
          <>
            <section className="welcome-card">
              <h2>
                Velkommen til Hjælper Dashboard!
              </h2>

              <p>
                Dette dashboard bliver stedet, hvor du kan
                administrere Hjælper og dine Discord-servere.
              </p>
            </section>

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
          </>
        )}


        {/* TICKETS */}

        {page === "tickets" && (
          <section className="ticket-page">

            <div className="ticket-header">

              <div>
                <h2>🎫 Ticket-system</h2>

                <p>
                  Administrer hvordan Hjælper håndterer tickets.
                </p>
              </div>

              <div className="ticket-active">
                <span></span>
                Aktiv
              </div>

            </div>


            <div className="ticket-settings">

              <div className="setting-card">

                <h3>📋 Ticket panel</h3>

                <p>
                  Vælg hvor ticket-panelet skal sendes.
                </p>

                <select>
                  <option>#support</option>
                  <option>#tickets</option>
                  <option>#hjælp</option>
                </select>

              </div>


              <div className="setting-card">

                <h3>👥 Staff-rolle</h3>

                <p>
                  Vælg hvilken rolle der skal kunne se tickets.
                </p>

                <select>
                  <option>@Staff</option>
                  <option>@Moderator</option>
                  <option>@Administrator</option>
                </select>

              </div>

            </div>


            <div className="categories-box">

              <div className="categories-header">

                <div>
                  <h3>🏷️ Ticket-kategorier</h3>

                  <p>
                    Kategorier som brugere kan vælge,
                    når de opretter en ticket.
                  </p>
                </div>

                <button
                  className="primary"
                  onClick={() => setShowCategoryModal(true)}
                >
                  + Tilføj kategori
                </button>

              </div>


              <div className="category-list">

                {categories.map((category, index) => (

                  <div
                    className="category-row"
                    key={index}
                  >

                    <div className="category-info">

                      <div className="category-emoji">
                        {category.emoji}
                      </div>

                      <strong>
                        {category.name}
                      </strong>

                    </div>

                    <div className="category-actions">

                      <button
                        className="edit-button"
                      >
                        ✏️
                      </button>

                      <button
                        className="delete-button"
                        onClick={() => removeCategory(index)}
                      >
                        🗑️
                      </button>

                    </div>

                  </div>

                ))}

              </div>

            </div>


            <div className="save-area">

              <button className="primary save-button">
                💾 Gem ændringer
              </button>

            </div>

          </section>
        )}


        {/* OTHER PAGES */}

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


      {/* ADD CATEGORY MODAL */}

      {showCategoryModal && (
        <div
          className="modal-background"
          onClick={() => setShowCategoryModal(false)}
        >

          <div
            className="modal"
            onClick={(event) => event.stopPropagation()}
          >

            <h2>➕ Tilføj ticket-kategori</h2>

            <p>
              Opret en ny kategori til dit ticket-system.
            </p>


            <label>
              Navn
            </label>

            <input
              type="text"
              placeholder="F.eks. Teknisk hjælp"
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
            />


            <label>
              Emoji
            </label>

            <input
              type="text"
              placeholder="🎫"
              value={newEmoji}
              onChange={(event) => setNewEmoji(event.target.value)}
            />


            <div className="modal-buttons">

              <button
                className="cancel-button"
                onClick={() => setShowCategoryModal(false)}
              >
                Annuller
              </button>

              <button
                className="primary"
                onClick={addCategory}
              >
                Tilføj
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}
