import React, { useEffect, useState } from "react";
import "./style.css";

const API = "/backend";

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState("login");

  const [stats, setStats] = useState(null);
  const [cogs, setCogs] = useState([]);
  const [servers, setServers] = useState([]);

  const [publicStats, setPublicStats] = useState(null);
  const [publicStatus, setPublicStatus] = useState(null);

  const [selectedServer, setSelectedServer] = useState(null);
  const [serverError, setServerError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

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

  const roleLabel =
    user?.role === "owner"
      ? "👑 Ejer"
      : user?.role === "manager"
        ? "💼 Manager"
        : user?.role === "admin"
          ? "🛡️ Admin"
          : "👤 Bruger";

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    loadPublicStats();
    loadPublicStatus();

    const interval = setInterval(() => {
      loadPublicStats();
      loadPublicStatus();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!user) return;

    if (user.role === "user") {
      if (
        page === "login" ||
        page === "overview" ||
        page === "bot" ||
        page === "stats" ||
        page === "cogs" ||
        page === "servers" ||
        page === "logs" ||
        page === "system"
      ) {
        setPage("user-dashboard");
      }
    } else if (isStaff && page === "login") {
      setPage("overview");
    }
  }, [user]);

  useEffect(() => {
    if (isStaff) {
      loadAdminData();
    }
  }, [isStaff]);

  async function loadUser() {
    try {
      const response = await fetch(`${API}/auth/me`, {
        credentials: "include",
      });

      if (!response.ok) {
        setUser(null);
        setPage("login");
        return;
      }

      const data = await response.json();

      if (!data.authenticated) {
        setUser(null);
        setPage("login");
        return;
      }

      setUser(data.user);

      if (data.user?.role === "user") {
        setPage("user-dashboard");
      } else {
        setPage("overview");
      }
    } catch (error) {
      console.error("Kunne ikke hente bruger:", error);
      setUser(null);
      setPage("login");
    } finally {
      setLoading(false);
    }
  }

  async function loadAdminData() {
    try {
      const [statsRes, cogsRes, serversRes] =
        await Promise.all([
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

      if (statsRes.ok) {
        setStats(await statsRes.json());
      }

      if (cogsRes.ok) {
        const data = await cogsRes.json();
        setCogs(data.cogs || []);
      }

      if (serversRes.ok) {
        const data = await serversRes.json();
        setServers(data.servers || []);
      }
    } catch (error) {
      console.error("Fejl ved admin-data:", error);
    }
  }

  async function loadPublicStats() {
    try {
      const response = await fetch(
        `${API}/api/public/stats`
      );

      if (!response.ok) return;

      const data = await response.json();

      setPublicStats(data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Public stats fejl:", error);
    }
  }

  async function loadPublicStatus() {
    try {
      const response = await fetch(
        `${API}/api/public/stats`
      );

      if (!response.ok) return;

      setPublicStatus(await response.json());
    } catch (error) {
      console.error("Public status fejl:", error);
    }
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
    } catch (error) {
      console.error(error);
    }

    setUser(null);
    setPage("login");
    setSelectedServer(null);
  }

  function getAvatarUrl() {
    if (!user?.id) return null;

    if (user.avatar) {
      return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128`;
    }

    return "https://cdn.discordapp.com/embed/avatars/0.png";
  }

  function getServerIcon(server) {
    if (!server?.id || !server?.icon) {
      return null;
    }

    if (server.icon.startsWith("http")) {
      return server.icon;
    }

    return `https://cdn.discordapp.com/icons/${server.id}/${server.icon}.png?size=128`;
  }

  function formatNumber(value) {
    if (
      value === undefined ||
      value === null
    ) {
      return "0";
    }

    return Number(value).toLocaleString("da-DK");
  }

  function formatTime(date) {
    if (!date) {
      return "Ikke opdateret";
    }

    return date.toLocaleTimeString("da-DK", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }

  async function openServer(server) {
    setServerError("");

    try {
      const response = await fetch(
        `${API}/api/servers`,
        {
          credentials: "include",
        }
      );

      if (!response.ok) {
        setServerError(
          "Kunne ikke hente serveren."
        );
        return;
      }

      const data = await response.json();

      const updated =
        (data.servers || []).find(
          item =>
            String(item.id) ===
            String(server.id)
        ) || server;

      setSelectedServer(updated);
      setPage("server-details");
    } catch (error) {
      console.error(error);
      setServerError(
        "Der opstod en fejl."
      );
    }
  }

  async function removeServer(guildId) {
    if (
      user?.role !== "owner" &&
      user?.role !== "manager"
    ) {
      setServerError(
        "Kun Ejer og Manager kan fjerne Hjælper fra en server."
      );
      return;
    }

    if (
      !window.confirm(
        "Er du sikker på, at du vil fjerne Hjælper fra denne server?"
      )
    ) {
      return;
    }

    try {
      const response = await fetch(
        `${API}/api/servers/${guildId}/leave`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setServerError(
          data.detail ||
          "Kunne ikke fjerne Hjælper."
        );
        return;
      }

      setServers(current =>
        current.filter(
          server =>
            String(server.id) !==
            String(guildId)
        )
      );

      setSelectedServer(null);
      setPage("servers");
    } catch (error) {
      console.error(error);
      setServerError(
        "Der opstod en fejl."
      );
    }
  }

  /*
   * =====================================================
   * LOGIN
   * =====================================================
   */

  if (page === "login" && !user) {
    return (
      <div className="login-page">

        <div className="login-box">

          <div className="login-logo">
            ✨
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
                🔐
              </span>

              Admin Login
            </span>

            <span>
              →
            </span>
          </button>

          <button
            className="login"
            style={{
              marginTop: "10px",
              background: "#151b27",
            }}
            onClick={userLogin}
          >
            <span>
              <span className="discord-icon">
                👤
              </span>

              Bruger Login
            </span>

            <span>
              →
            </span>
          </button>

          <button
            className="login"
            style={{
              marginTop: "10px",
              background: "#151b27",
            }}
            onClick={() =>
              setPage("public-stats")
            }
          >
            <span>
              <span className="discord-icon">
                📊
              </span>

              Se Statistik
            </span>

            <span>
              →
            </span>
          </button>

          <button
            className="login"
            style={{
              marginTop: "10px",
              background: "#151b27",
            }}
            onClick={() =>
              setPage("public-status")
            }
          >
            <span>
              <span className="discord-icon">
                🟢
              </span>

              Status
            </span>

            <span>
              →
            </span>
          </button>

          <button
            className="login"
            style={{
              marginTop: "10px",
              background: "#151b27",
            }}
            onClick={() =>
              setPage("roadmap")
            }
          >
            <span>
              <span className="discord-icon">
                🚀
              </span>

              Roadmap
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
    );
  }

  /*
   * =====================================================
   * PUBLIC STATS
   * =====================================================
   */

  if (page === "public-stats") {
    return (
      <div className="public-page">

        <div className="public-topbar">

          <div className="brand">

            <div className="brand-icon">
              ✨
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
            onClick={() =>
              setPage("login")
            }
          >
            ← Tilbage
          </button>

        </div>

        <div className="public-content">

          <div className="public-title">

            <span className="eyebrow">
              STATISTIK
            </span>

            <h2>
              📊 Hjælper Statistik
            </h2>

            <p>
              Offentlig statistik for Hjælper.
            </p>

          </div>

          <div className="stats-grid">

            <div className="stat-card">
              <span>🟢 Bot status</span>
              <strong>
                {publicStats?.online
                  ? "Online"
                  : "Offline"}
              </strong>
            </div>

            <div className="stat-card">
              <span>🖥️ Servere</span>
              <strong>
                {formatNumber(
                  publicStats?.servers
                )}
              </strong>
            </div>

            <div className="stat-card">
              <span>👥 Discord-brugere</span>
              <strong>
                {formatNumber(
                  publicStats?.users
                )}
              </strong>
            </div>

            <div className="stat-card">
              <span>⚡ Commands</span>
              <strong>
                {formatNumber(
                  publicStats?.commands
                )}
              </strong>
            </div>

            <div className="stat-card">
              <span>🧩 Cogs</span>
              <strong>
                {formatNumber(
                  publicStats?.cogs
                )}
              </strong>
            </div>

          </div>

          <div className="public-panel-users">

            <div className="public-section-title">

              <span className="eyebrow">
                PANEL
              </span>

              <h3>
                👤 Panelbrugere
              </h3>

            </div>

            <div className="stats-grid">

              <div className="stat-card">
                <span>📅 I dag</span>
                <strong>
                  {formatNumber(
                    publicStats?.dashboard_users?.today ??
                    publicStats?.panel_users_today
                  )}
                </strong>
              </div>

              <div className="stat-card">
                <span>📆 Denne uge</span>
                <strong>
                  {formatNumber(
                    publicStats?.dashboard_users?.week ??
                    publicStats?.panel_users_week
                  )}
                </strong>
              </div>

              <div className="stat-card">
                <span>🗓️ Dette år</span>
                <strong>
                  {formatNumber(
                    publicStats?.dashboard_users?.year ??
                    publicStats?.panel_users_year
                  )}
                </strong>
              </div>

              <div className="stat-card">
                <span>👤 I alt</span>
                <strong>
                  {formatNumber(
                    publicStats?.dashboard_users?.total ??
                    publicStats?.panel_users_total
                  )}
                </strong>
              </div>

            </div>

          </div>

          <div className="last-updated">
            Sidst opdateret:{" "}
            {formatTime(lastUpdated)}
          </div>

        </div>

      </div>
    );
  }

  /*
   * =====================================================
   * PUBLIC STATUS
   * =====================================================
   */

  if (page === "public-status") {
    return (
      <div className="public-page">

        <div className="public-topbar">

          <div className="brand">

            <div className="brand-icon">
              ✨
            </div>

            <div>
              <h1>
                Hjælper
              </h1>

              <span>
                Systemstatus
              </span>
            </div>

          </div>

          <button
            className="back-button"
            onClick={() =>
              setPage("login")
            }
          >
            ← Tilbage
          </button>

        </div>

        <div className="public-content">

          <div className="public-title">

            <span className="eyebrow">
              STATUS
            </span>

            <h2>
              🟢 Systemstatus
            </h2>

            <p>
              Aktuel status for Hjælper.
            </p>

          </div>

          <div className="public-status-grid">

            <div className="public-status-card">

              <div className="status-icon">
                🤖
              </div>

              <div>
                <span>Bot</span>

                <strong
                  className={
                    publicStatus?.online
                      ? "status-online"
                      : "status-offline"
                  }
                >
                  {publicStatus?.online
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
                <span>API</span>

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
                <span>Servere</span>

                <strong>
                  {formatNumber(
                    publicStatus?.servers
                  )}
                </strong>
              </div>

            </div>

            <div className="public-status-card">

              <div className="status-icon">
                ⚡
              </div>

              <div>
                <span>Commands</span>

                <strong>
                  {formatNumber(
                    publicStatus?.commands
                  )}
                </strong>
              </div>

            </div>

            <div className="public-status-card">

              <div className="status-icon">
                🧩
              </div>

              <div>
                <span>Cogs</span>

                <strong>
                  {formatNumber(
                    publicStatus?.cogs
                  )}
                </strong>
              </div>

            </div>

          </div>

          <div className="public-info-box">

            <h3>
              🛡️ Systemstatus
            </h3>

            <p>
              Hjælper overvåges løbende.
              Status opdateres automatisk.
            </p>

          </div>

          <div className="last-updated">
            Sidst opdateret:{" "}
            {formatTime(lastUpdated)}
          </div>

        </div>

      </div>
    );
  }

  /*
   * =====================================================
   * ROADMAP
   * =====================================================
   */

  if (page === "roadmap") {
    return (
      <div className="public-page">

        <div className="public-topbar">

          <div className="brand">

            <div className="brand-icon">
              🚀
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
            onClick={() =>
              setPage("login")
            }
          >
            ← Tilbage
          </button>

        </div>

        <div className="roadmap">

          <div className="public-title">

            <span className="eyebrow">
              ROADMAP
            </span>

            <h2>
              🚀 Hjælper Roadmap
            </h2>

            <p>
              Vi afslører ikke alt på forhånd 👀
            </p>

          </div>

          <div className="roadmap-card active">

            <div className="roadmap-header">

              <div>

                <div className="roadmap-version">
                  V2.1
                </div>

                <h2>
                  🔒 Privacy Policy
                </h2>

              </div>

              <div className="roadmap-status active">
                Næste update
              </div>

            </div>

            <div className="roadmap-items">

              <div>
                🔒 Tydelig information om data
              </div>

              <div>
                🛡️ Mere gennemsigtighed omkring Hjælper
              </div>

            </div>

          </div>

          <div className="roadmap-card">

            <div className="roadmap-header">

              <div>

                <div className="roadmap-version">
                  V2.2
                </div>

                <h2>
                  ✨ Coming Soon
                </h2>

              </div>

              <div className="roadmap-status">
                Hemmeligt
              </div>

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
            Ikke alt bliver afsløret på forhånd. 👀
          </div>

        </div>

      </div>
    );
  }

  /*
   * =====================================================
   * USER DASHBOARD
   * =====================================================
   */

  if (
    user &&
    user.role === "user" &&
    (
      page === "user-dashboard" ||
      page === "user-privacy" ||
      page === "user-terms" ||
      page === "user-cookies"
    )
  ) {
    return (
      <div className="dashboard">

        <aside className="sidebar">

          <div className="sidebar-brand">

            <div className="brand-icon">
              ✨
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
              className={`nav-item ${
                page === "user-dashboard"
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                setPage("user-dashboard")
              }
            >
              🏠 Dashboard
            </button>

          </nav>

          <div className="sidebar-bottom">

            <button
              className={`nav-item ${
                page === "user-privacy"
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                setPage("user-privacy")
              }
            >
              🔒 Privacy Policy
            </button>

            <button
              className={`nav-item ${
                page === "user-terms"
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                setPage("user-terms")
              }
            >
              📜 Terms of Service
            </button>

            <button
              className={`nav-item ${
                page === "user-cookies"
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                setPage("user-cookies")
              }
            >
              🍪 Cookie Policy
            </button>

            <div className="user-mini">

              <div className="user-avatar">

                <img
                  src={getAvatarUrl()}
                  alt=""
                />

              </div>

              <div className="user-info">

                <strong>
                  {user.username}
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
                {page === "user-dashboard"
                  ? "🏠 Dashboard"
                  : page === "user-privacy"
                    ? "🔒 Privacy Policy"
                    : page === "user-terms"
                      ? "📜 Terms of Service"
                      : "🍪 Cookie Policy"}
              </h1>

              <span>
                Hjælper • Bruger
              </span>

            </div>

            <div className="topbar-user">

              {user.username} • 👤 Bruger

            </div>

          </header>

          <div className="content">

            {page === "user-dashboard" && (
              <>
                <div className="page-heading">

                  <span className="eyebrow">
                    BRUGER
                  </span>

                  <h2>
                    Velkommen, {user.username}! 👋
                  </h2>

                  <p>
                    Dette er dit Hjælper-dashboard.
                  </p>

                </div>

                <div className="info-card">

                  <div>
                    <span>
                      Brugernavn
                    </span>

                    <strong>
                      {user.username}
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

                  <div>
                    <span>
                      Discord ID
                    </span>

                    <strong>
                      {user.id}
                    </strong>
                  </div>

                </div>

                <div className="public-info-box">

                  <h3>
                    ✨ Hjælper
                  </h3>

                  <p>
                    Du er logget ind som almindelig bruger.
                    Admin-funktioner kræver en autoriseret
                    staff-rolle.
                  </p>

                </div>
              </>
            )}

            {page === "user-privacy" && (
              <>
                <div className="page-heading">

                  <span className="eyebrow">
                    PRIVACY
                  </span>

                  <h2>
                    🔒 Privacy Policy
                  </h2>

                  <p>
                    Information om data og privatliv.
                  </p>

                </div>

                <div className="public-info-box">

                  <h3>
                    Hvilke data bruger Hjælper?
                  </h3>

                  <p>
                    Hjælper kan bruge oplysninger fra din
                    Discord-konto, som er nødvendige for
                    login og dashboard-funktioner.
                  </p>

                  <br />

                  <h3>
                    Discord-data
                  </h3>

                  <p>
                    Dette kan blandt andet være Discord ID,
                    brugernavn og avatar.
                  </p>

                  <br />

                  <h3>
                    Formål
                  </h3>

                  <p>
                    Data bruges til login, sessionshåndtering
                    og relevante dashboard-funktioner.
                  </p>

                  <br />

                  <h3>
                    Cookies
                  </h3>

                  <p>
                    Nødvendige cookies kan bruges til
                    sessionshåndtering og login.
                  </p>

                </div>
              </>
            )}

            {page === "user-terms" && (
              <>
                <div className="page-heading">

                  <span className="eyebrow">
                    VILKÅR
                  </span>

                  <h2>
                    📜 Terms of Service
                  </h2>

                  <p>
                    Vilkår for brug af Hjælper.
                  </p>

                </div>

                <div className="public-info-box">

                  <h3>
                    1. Brug af tjenesten
                  </h3>

                  <p>
                    Hjælper skal bruges ansvarligt og i
                    overensstemmelse med gældende regler.
                  </p>

                  <br />

                  <h3>
                    2. Misbrug
                  </h3>

                  <p>
                    Forsøg på at omgå sikkerhed eller
                    forstyrre Hjælper er ikke tilladt.
                  </p>

                  <br />

                  <h3>
                    3. Discord
                  </h3>

                  <p>
                    Brug af Hjælper skal også følge
                    Discords gældende regler.
                  </p>

                  <br />

                  <h3>
                    4. Ændringer
                  </h3>

                  <p>
                    Hjælper kan ændre funktioner og
                    vilkår efter behov.
                  </p>

                </div>
              </>
            )}

            {page === "user-cookies" && (
              <>
                <div className="page-heading">

                  <span className="eyebrow">
                    COOKIES
                  </span>

                  <h2>
                    🍪 Cookie Policy
                  </h2>

                  <p>
                    Information om cookies.
                  </p>

                </div>

                <div className="public-info-box">

                  <h3>
                    Nødvendige cookies
                  </h3>

                  <p>
                    Hjælper kan bruge nødvendige cookies
                    til login og sessionshåndtering.
                  </p>

                  <br />

                  <h3>
                    Tredjepart
                  </h3>

                  <p>
                    Discord bruges blandt andet til
                    login og kontoidentifikation.
                  </p>

                  <br />

                  <h3>
                    Browserindstillinger
                  </h3>

                  <p>
                    Du kan normalt administrere cookies
                    gennem indstillingerne i din browser.
                  </p>

                </div>
              </>
            )}

          </div>

        </main>

      </div>
    );
  }

  /*
   * =====================================================
   * ADMIN DASHBOARD
   * =====================================================
   */

  if (user && isStaff) {
    return (
      <div className="dashboard">

        <aside className="sidebar">

          <div className="sidebar-brand">

            <div className="brand-icon">
              ✨
            </div>

            <div>
              <h2>
                Hjælper
              </h2>

              <span>
                Admin Dashboard
              </span>
            </div>

          </div>

          <nav>

            <button
              className={`nav-item ${
                page === "overview"
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                setPage("overview")
              }
            >
              🏠 Dashboard
            </button>

            <button
              className={`nav-item ${
                page === "bot"
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                setPage("bot")
              }
            >
              🤖 Bot
            </button>

            <button
              className={`nav-item ${
                page === "stats"
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                setPage("stats")
              }
            >
              📊 Stats
            </button>

            <button
              className={`nav-item ${
                page === "cogs"
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                setPage("cogs")
              }
            >
              🧩 Cogs
            </button>

            <button
              className={`nav-item ${
                page === "servers"
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                setPage("servers")
              }
            >
              🖥️ Servere
            </button>

            <button
              className={`nav-item ${
                page === "logs"
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                setPage("logs")
              }
            >
              📜 Logs
            </button>

            {(isOwner || isManager) && (
              <button
                className={`nav-item ${
                  page === "system"
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  setPage("system")
                }
              >
                ⚙️ System
              </button>
            )}

          </nav>

          <div className="sidebar-bottom">

            <div className="user-mini">

              <div className="user-avatar">

                <img
                  src={getAvatarUrl()}
                  alt=""
                />

              </div>

              <div className="user-info">

                <strong>
                  {user.username}
                </strong>

                <span>
                  {roleLabel}
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
                {page === "overview"
                  ? "🏠 Dashboard"
                  : page === "bot"
                    ? "🤖 Bot"
                    : page === "stats"
                      ? "📊 Stats"
                      : page === "cogs"
                        ? "🧩 Cogs"
                        : page === "servers"
                          ? "🖥️ Servere"
                          : page === "server-details"
                            ? "🖥️ Server"
                            : page === "logs"
                              ? "📜 Logs"
                              : "⚙️ System"}
              </h1>

              <span>
                Hjælper V2
              </span>

            </div>

            <div className="topbar-user">
              {roleLabel}
            </div>

          </header>

          <div className="content">

            {page === "overview" && (
              <>
                <div className="page-heading">

                  <span className="eyebrow">
                    OVERVIEW
                  </span>

                  <h2>
                    Velkommen tilbage, {user.username}! 👋
                  </h2>

                  <p>
                    Her er en oversigt over Hjælper.
                  </p>

                </div>

                <div className="stats-grid">

                  <div className="stat-card">
                    <span>🟢 Status</span>

                    <strong>
                      {stats?.online
                        ? "Online"
                        : "Offline"}
                    </strong>
                  </div>

                  <div className="stat-card">
                    <span>🖥️ Servere</span>

                    <strong>
                      {formatNumber(
                        stats?.servers
                      )}
                    </strong>
                  </div>

                  <div className="stat-card">
                    <span>👥 Brugere</span>

                    <strong>
                      {formatNumber(
                        stats?.users
                      )}
                    </strong>
                  </div>

                  <div className="stat-card">
                    <span>⚡ Commands</span>

                    <strong>
                      {formatNumber(
                        stats?.commands
                      )}
                    </strong>
                  </div>

                </div>

                <div className="public-info-box">

                  <h3>
                    🛡️ Din rolle
                  </h3>

                  <p>
                    {roleLabel}
                  </p>

                </div>
              </>
            )}

            {page === "bot" && (
              <>
                <div className="page-heading">

                  <span className="eyebrow">
                    BOT
                  </span>

                  <h2>
                    🤖 Hjælper Bot
                  </h2>

                  <p>
                    Information om botten.
                  </p>

                </div>

                <div className="stats-grid">

                  <div className="stat-card">
                    <span>🟢 Status</span>

                    <strong>
                      {stats?.online
                        ? "Online"
                        : "Offline"}
                    </strong>
                  </div>

                  <div className="stat-card">
                    <span>🖥️ Servere</span>

                    <strong>
                      {formatNumber(
                        stats?.servers
                      )}
                    </strong>
                  </div>

                  <div className="stat-card">
                    <span>⚡ Commands</span>

                    <strong>
                      {formatNumber(
                        stats?.commands
                      )}
                    </strong>
                  </div>

                  <div className="stat-card">
                    <span>🧩 Cogs</span>

                    <strong>
                      {formatNumber(
                        stats?.cogs
                      )}
                    </strong>
                  </div>

                </div>
              </>
            )}

            {page === "stats" && (
              <>
                <div className="page-heading">

                  <span className="eyebrow">
                    STATISTIK
                  </span>

                  <h2>
                    📊 Statistik
                  </h2>

                  <p>
                    Statistik for Hjælper.
                  </p>

                </div>

                <div className="stats-grid">

                  <div className="stat-card">
                    <span>🖥️ Servere</span>
                    <strong>
                      {formatNumber(
                        stats?.servers
                      )}
                    </strong>
                  </div>

                  <div className="stat-card">
                    <span>👥 Discord-brugere</span>
                    <strong>
                      {formatNumber(
                        stats?.users
                      )}
                    </strong>
                  </div>

                  <div className="stat-card">
                    <span>⚡ Commands</span>
                    <strong>
                      {formatNumber(
                        stats?.commands
                      )}
                    </strong>
                  </div>

                  <div className="stat-card">
                    <span>🧩 Cogs</span>
                    <strong>
                      {formatNumber(
                        stats?.cogs
                      )}
                    </strong>
                  </div>

                </div>

                <div className="public-panel-users">

                  <div className="public-section-title">

                    <span className="eyebrow">
                      DASHBOARD
                    </span>

                    <h3>
                      👤 Panelbrugere
                    </h3>

                  </div>

                  <div className="stats-grid">

                    <div className="stat-card">
                      <span>📅 I dag</span>
                      <strong>
                        {formatNumber(
                          stats?.dashboard_users?.today ??
                          stats?.panel_users_today
                        )}
                      </strong>
                    </div>

                    <div className="stat-card">
                      <span>📆 Denne uge</span>
                      <strong>
                        {formatNumber(
                          stats?.dashboard_users?.week ??
                          stats?.panel_users_week
                        )}
                      </strong>
                    </div>

                    <div className="stat-card">
                      <span>🗓️ Dette år</span>
                      <strong>
                        {formatNumber(
                          stats?.dashboard_users?.year ??
                          stats?.panel_users_year
                        )}
                      </strong>
                    </div>

                    <div className="stat-card">
                      <span>👤 I alt</span>
                      <strong>
                        {formatNumber(
                          stats?.dashboard_users?.total ??
                          stats?.panel_users_total
                        )}
                      </strong>
                    </div>

                  </div>

                </div>
              </>
            )}

            {page === "cogs" && (
              <>
                <div className="page-heading">

                  <span className="eyebrow">
                    MODULES
                  </span>

                  <h2>
                    🧩 Cogs
                  </h2>

                  <p>
                    Aktive moduler.
                  </p>

                </div>

                <div className="list-card">

                  {cogs.length === 0 ? (
                    <div className="empty">
                      Ingen cogs fundet.
                    </div>
                  ) : (
                    cogs.map((cog, index) => {

                      const name =
                        typeof cog === "string"
                          ? cog
                          : cog.name ||
                            cog.cog ||
                            `Cog ${index + 1}`;

                      return (
                        <div
                          className="list-row"
                          key={index}
                        >

                          <span>
                            🧩
                          </span>

                          <strong>
                            {name}
                          </strong>

                          <span>
                            🟢 Loaded
                          </span>

                        </div>
                      );
                    })
                  )}

                </div>
              </>
            )}

            {page === "servers" && (
              <>
                <div className="page-heading">

                  <span className="eyebrow">
                    SERVERE
                  </span>

                  <h2>
                    🖥️ Servere
                  </h2>

                  <p>
                    Discord-servere hvor Hjælper er installeret.
                  </p>

                </div>

                {serverError && (
                  <div className="error-box">
                    {serverError}
                  </div>
                )}

                <div className="list-card">

                  {servers.length === 0 ? (
                    <div className="empty">
                      Ingen servere fundet.
                    </div>
                  ) : (
                    servers.map(server => {

                      const icon =
                        getServerIcon(server);

                      return (
                        <button
                          key={server.id}
                          className="server-row"
                          onClick={() =>
                            openServer(server)
                          }
                        >

                          <div className="server-icon">

                            {icon ? (
                              <img
                                src={icon}
                                alt=""
                              />
                            ) : (
                              "🖥️"
                            )}

                          </div>

                          <div className="server-main">

                            <strong>
                              {server.name ||
                                "Ukendt server"}
                            </strong>

                            <small>
                              {server.id}
                            </small>

                          </div>

                          <div className="server-members">
                            👥{" "}
                            {formatNumber(
                              server.member_count
                            )}
                          </div>

                          <div className="server-arrow">
                            →
                          </div>

                        </button>
                      );
                    })
                  )}

                </div>
              </>
            )}

            {page === "server-details" &&
              selectedServer && (
                <div className="server-details-page">

                  <button
                    className="back-button"
                    onClick={() =>
                      setPage("servers")
                    }
                  >
                    ← Tilbage
                  </button>

                  <div className="server-hero">

                    <div className="server-hero-icon">

                      {getServerIcon(
                        selectedServer
                      ) ? (
                        <img
                          src={getServerIcon(
                            selectedServer
                          )}
                          alt=""
                        />
                      ) : (
                        "🖥️"
                      )}

                    </div>

                    <div className="server-hero-info">

                      <span className="eyebrow">
                        SERVER
                      </span>

                      <h2>
                        {selectedServer.name}
                      </h2>

                      <p>
                        Discord ID:{" "}
                        {selectedServer.id}
                      </p>

                    </div>

                  </div>

                  {serverError && (
                    <div className="error-box">
                      {serverError}
                    </div>
                  )}

                  <div className="server-detail-grid">

                    <div className="server-detail-card">

                      <span>
                        👥 Medlemmer
                      </span>

                      <strong>
                        {formatNumber(
                          selectedServer.member_count
                        )}
                      </strong>

                    </div>

                    <div className="server-detail-card">

                      <span>
                        🆔 Server ID
                      </span>

                      <strong className="server-id">
                        {selectedServer.id}
                      </strong>

                    </div>

                    <div className="server-detail-card">

                      <span>
                        🟢 Status
                      </span>

                      <strong>
                        Tilsluttet
                      </strong>

                    </div>

                  </div>

                  {(isOwner || isManager) && (
                    <div className="server-danger-card">

                      <div>

                        <span className="eyebrow">
                          DANGER ZONE
                        </span>

                        <h3>
                          🚪 Fjern Hjælper
                        </h3>

                        <p>
                          Dette fjerner Hjælper fra
                          denne Discord-server.
                        </p>

                      </div>

                      <button
                        className="danger-button"
                        onClick={() =>
                          removeServer(
                            selectedServer.id
                          )
                        }
                      >
                        Fjern Hjælper
                      </button>

                    </div>
                  )}

                </div>
              )}

            {page === "logs" && (
              <>
                <div className="page-heading">

                  <span className="eyebrow">
                    LOGS
                  </span>

                  <h2>
                    📜 Logs
                  </h2>

                  <p>
                    System- og botaktivitet.
                  </p>

                </div>

                <div className="public-info-box">

                  <h3>
                    📡 System Logs
                  </h3>

                  <p>
                    Live logs kan administreres via
                    Wispbyte console.
                  </p>

                </div>
              </>
            )}

            {page === "system" &&
              (isOwner || isManager) && (
                <>
                  <div className="page-heading">

                    <span className="eyebrow">
                      SYSTEM
                    </span>

                    <h2>
                      ⚙️ System
                    </h2>

                    <p>
                      Systeminformation.
                    </p>

                  </div>

                  <div className="stats-grid">

                    <div className="stat-card">
                      <span>🐍 Python</span>
                      <strong>
                        3.14.7
                      </strong>
                    </div>

                    <div className="stat-card">
                      <span>🌐 API</span>
                      <strong>
                        FastAPI
                      </strong>
                    </div>

                    <div className="stat-card">
                      <span>🤖 Discord</span>
                      <strong>
                        discord.py
                      </strong>
                    </div>

                    <div className="stat-card">
                      <span>✨ Hjælper</span>
                      <strong>
                        V2
                      </strong>
                    </div>

                  </div>
                </>
              )}

          </div>

        </main>

      </div>
    );
  }

  /*
   * =====================================================
   * FALLBACK
   * =====================================================
   */

  return (
    <div className="loading-screen">

      <div className="loading-box">

        <div className="loading-spinner" />

        <h2>
          Hjælper
        </h2>

        <p>
          Indlæser...
        </p>

      </div>

    </div>
  );
}
