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
  const [serverLoading, setServerLoading] = useState(false);
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
    if (!isStaff) return;

    loadAdminData();
  }, [user, isStaff]);

  useEffect(() => {
    loadPublicStats();
    loadPublicStatus();

    const interval = setInterval(() => {
      loadPublicStats();
      loadPublicStatus();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

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
      const [statsResponse, cogsResponse, serversResponse] =
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

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      if (cogsResponse.ok) {
        const cogsData = await cogsResponse.json();
        setCogs(cogsData.cogs || []);
      }

      if (serversResponse.ok) {
        const serversData = await serversResponse.json();
        setServers(serversData.servers || []);
      }
    } catch (error) {
      console.error("Fejl ved hentning af admin-data:", error);
    }
  }

  async function loadPublicStats() {
    try {
      const response = await fetch(`${API}/api/public/stats`);

      if (!response.ok) return;

      const data = await response.json();

      setPublicStats(data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Fejl ved public stats:", error);
    }
  }

  async function loadPublicStatus() {
    try {
      const response = await fetch(`${API}/api/public/stats`);

      if (!response.ok) return;

      const data = await response.json();

      setPublicStatus(data);
    } catch (error) {
      console.error("Fejl ved public status:", error);
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
      console.error("Logout fejl:", error);
    }

    setUser(null);
    setSelectedServer(null);
    setPage("login");
  }

  function getAvatarUrl() {
    if (!user?.id) return null;

    if (user?.avatar) {
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

  async function openServer(server) {
    setServerLoading(true);
    setServerError("");

    try {
      const response = await fetch(
        `${API}/api/servers`,
        {
          credentials: "include",
        }
      );

      if (!response.ok) {
        setServerError("Kunne ikke hente serveren.");
        return;
      }

      const data = await response.json();

      const updatedServer =
        (data.servers || []).find(
          (item) =>
            String(item.id) === String(server.id)
        ) || server;

      setSelectedServer(updatedServer);
      setPage("server-details");
    } catch (error) {
      console.error(error);
      setServerError("Der opstod en fejl.");
    } finally {
      setServerLoading(false);
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

    setServerError("");

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
          "Kunne ikke fjerne Hjælper fra serveren."
        );
        return;
      }

      setServers((current) =>
        current.filter(
          (server) =>
            String(server.id) !== String(guildId)
        )
      );

      setSelectedServer(null);
      setPage("servers");
    } catch (error) {
      console.error(error);
      setServerError("Der opstod en fejl.");
    }
  }

  function formatNumber(value) {
    if (value === undefined || value === null) {
      return "0";
    }

    return Number(value).toLocaleString("da-DK");
  }

  function formatTime(date) {
    if (!date) return "Ikke opdateret";

    return date.toLocaleTimeString("da-DK", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }

  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-card">
          <div className="loading-icon">✨</div>
          <h2>Hjælper</h2>
          <p>Indlæser...</p>
        </div>
      </div>
    );
  }

  /*
   * =========================================================
   * LOGIN
   * =========================================================
   */

  if (page === "login" && !user) {
    return (
      <div className="login-page">

        <div className="login-card">

          <div className="login-logo">

            <div className="logo-icon">
              ✨
            </div>

            <h1>
              Hjælper
            </h1>

            <p>
              Discord bot & dashboard
            </p>

          </div>

          <div className="login-options">

            <button
              className="login-option primary"
              onClick={adminLogin}
            >
              <span className="login-option-icon">
                🔐
              </span>

              <span>
                <strong>
                  Admin Login
                </strong>

                <small>
                  Log ind som Ejer, Manager eller Admin
                </small>
              </span>

            </button>

            <button
              className="login-option"
              onClick={userLogin}
            >
              <span className="login-option-icon">
                👤
              </span>

              <span>
                <strong>
                  Bruger Login
                </strong>

                <small>
                  Log ind som almindelig bruger
                </small>
              </span>

            </button>

            <button
              className="login-option"
              onClick={() =>
                setPage("public-stats")
              }
            >
              <span className="login-option-icon">
                📊
              </span>

              <span>
                <strong>
                  Se Statistik
                </strong>

                <small>
                  Se offentlig statistik
                </small>
              </span>

            </button>

            <button
              className="login-option"
              onClick={() =>
                setPage("public-status")
              }
            >
              <span className="login-option-icon">
                🟢
              </span>

              <span>
                <strong>
                  Status
                </strong>

                <small>
                  Se Hjælpers aktuelle status
                </small>
              </span>

            </button>

            <button
              className="login-option"
              onClick={() =>
                setPage("roadmap")
              }
            >
              <span className="login-option-icon">
                🚀
              </span>

              <span>
                <strong>
                  Roadmap
                </strong>

                <small>
                  Se hvad der kommer senere
                </small>
              </span>

            </button>

          </div>

          <div className="login-footer">
            Hjælper • 2026
          </div>

        </div>

      </div>
    );
  }

  /*
   * =========================================================
   * PUBLIC STATS
   * =========================================================
   */

  if (page === "public-stats") {
    return (
      <div className="public-page">

        <div className="public-header">

          <button
            className="back-button"
            onClick={() => setPage("login")}
          >
            ← Tilbage
          </button>

          <div>
            <h1>
              📊 Statistik
            </h1>

            <p>
              Offentlig statistik for Hjælper
            </p>
          </div>

        </div>

        <div className="public-grid">

          <div className="public-stat-card">
            <span>🟢</span>
            <small>Bot status</small>
            <strong>
              {publicStats?.online
                ? "Online"
                : "Offline"}
            </strong>
          </div>

          <div className="public-stat-card">
            <span>🖥️</span>
            <small>Servere</small>
            <strong>
              {formatNumber(publicStats?.servers)}
            </strong>
          </div>

          <div className="public-stat-card">
            <span>👥</span>
            <small>Discord-brugere</small>
            <strong>
              {formatNumber(publicStats?.users)}
            </strong>
          </div>

          <div className="public-stat-card">
            <span>⚡</span>
            <small>Commands</small>
            <strong>
              {formatNumber(publicStats?.commands)}
            </strong>
          </div>

          <div className="public-stat-card">
            <span>🧩</span>
            <small>Cogs</small>
            <strong>
              {formatNumber(publicStats?.cogs)}
            </strong>
          </div>

        </div>

        <div className="public-info-box">

          <h2>
            👤 Panelbrugere
          </h2>

          <div className="public-grid">

            <div className="public-stat-card">
              <span>📅</span>
              <small>I dag</small>
              <strong>
                {formatNumber(
                  publicStats?.dashboard_users?.today ??
                  publicStats?.panel_users_today
                )}
              </strong>
            </div>

            <div className="public-stat-card">
              <span>📆</span>
              <small>Denne uge</small>
              <strong>
                {formatNumber(
                  publicStats?.dashboard_users?.week ??
                  publicStats?.panel_users_week
                )}
              </strong>
            </div>

            <div className="public-stat-card">
              <span>🗓️</span>
              <small>Dette år</small>
              <strong>
                {formatNumber(
                  publicStats?.dashboard_users?.year ??
                  publicStats?.panel_users_year
                )}
              </strong>
            </div>

            <div className="public-stat-card">
              <span>👤</span>
              <small>I alt</small>
              <strong>
                {formatNumber(
                  publicStats?.dashboard_users?.total ??
                  publicStats?.panel_users_total
                )}
              </strong>
            </div>

          </div>

        </div>

        <div className="public-updated">
          Sidst opdateret: {formatTime(lastUpdated)}
        </div>

      </div>
    );
  }

  /*
   * =========================================================
   * PUBLIC STATUS
   * =========================================================
   */

  if (page === "public-status") {
    const online =
      publicStatus?.online === true;

    return (
      <div className="public-page">

        <div className="public-header">

          <button
            className="back-button"
            onClick={() => setPage("login")}
          >
            ← Tilbage
          </button>

          <div>
            <h1>
              🟢 Status
            </h1>

            <p>
              Aktuel status for Hjælper
            </p>
          </div>

        </div>

        <div className="status-list">

          <div className="status-row">

            <div>
              <strong>
                🤖 Bot
              </strong>

              <span>
                Discord-botten
              </span>
            </div>

            <b
              className={
                online
                  ? "status-online"
                  : "status-offline"
              }
            >
              {online
                ? "🟢 Online"
                : "🔴 Offline"}
            </b>

          </div>

          <div className="status-row">

            <div>
              <strong>
                🌐 API
              </strong>

              <span>
                Hjælper API
              </span>
            </div>

            <b className="status-online">
              🟢 Online
            </b>

          </div>

          <div className="status-row">

            <div>
              <strong>
                🖥️ Servere
              </strong>

              <span>
                Tilsluttede Discord-servere
              </span>
            </div>

            <b>
              {formatNumber(
                publicStatus?.servers
              )}
            </b>

          </div>

          <div className="status-row">

            <div>
              <strong>
                ⚡ Commands
              </strong>

              <span>
                Registrerede commands
              </span>
            </div>

            <b>
              {formatNumber(
                publicStatus?.commands
              )}
            </b>

          </div>

          <div className="status-row">

            <div>
              <strong>
                🧩 Cogs
              </strong>

              <span>
                Aktive bot-moduler
              </span>
            </div>

            <b>
              {formatNumber(
                publicStatus?.cogs
              )}
            </b>

          </div>

        </div>

        <div className="public-info-box">

          <h2>
            🛡️ Systemstatus
          </h2>

          <p>
            Hjælper overvåges løbende.
            Statussen opdateres automatisk hvert
            10. sekund.
          </p>

        </div>

        <div className="public-updated">
          Sidst opdateret: {formatTime(lastUpdated)}
        </div>

      </div>
    );
  }

  /*
   * =========================================================
   * ROADMAP
   * =========================================================
   */

  if (page === "roadmap") {
    return (
      <div className="public-page">

        <div className="public-header">

          <button
            className="back-button"
            onClick={() => setPage("login")}
          >
            ← Tilbage
          </button>

          <div>
            <h1>
              🚀 Roadmap
            </h1>

            <p>
              Hvad der kommer til Hjælper
            </p>
          </div>

        </div>

        <div className="roadmap-list">

          <div className="roadmap-card">

            <div className="roadmap-version">
              V2.1
            </div>

            <div>
              <h2>
                🔒 Privacy Policy
              </h2>

              <p>
                Tydelig information om data og privatliv.
              </p>

              <p>
                🛡️ Mere gennemsigtighed omkring Hjælper.
              </p>
            </div>

          </div>

          <div className="roadmap-card">

            <div className="roadmap-version">
              V2.2
            </div>

            <div>

              <h2>
                ✨ Coming Soon
              </h2>

              <p>
                ✨ Nye features
              </p>

              <p>
                ⚡ Flere muligheder
              </p>

              <p>
                👀 Mere bliver afsløret senere
              </p>

            </div>

          </div>

        </div>

        <div className="public-info-box">

          <p>
            Ikke alt bliver afsløret på forhånd. 👀
          </p>

        </div>

      </div>
    );
  }

  /*
   * =========================================================
   * USER DASHBOARD
   * =========================================================
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

    const userPageTitle =
      page === "user-privacy"
        ? "🔒 Privacy Policy"
        : page === "user-terms"
          ? "📜 Terms of Service"
          : page === "user-cookies"
            ? "🍪 Cookie Policy"
            : "🏠 Dashboard";

    return (
      <div className="dashboard-layout">

        <aside className="sidebar">

          <div className="sidebar-brand">

            <div className="brand-icon">
              ✨
            </div>

            <div>
              <strong>
                Hjælper
              </strong>

              <span>
                Bruger Dashboard
              </span>
            </div>

          </div>

          <nav className="sidebar-nav">

            <button
              className={
                `nav-item ${
                  page === "user-dashboard"
                    ? "active"
                    : ""
                }`
              }
              onClick={() =>
                setPage("user-dashboard")
              }
            >
              <span>
                🏠
              </span>

              <span>
                Dashboard
              </span>
            </button>

          </nav>

          <div className="sidebar-bottom">

            <button
              className={
                `nav-item ${
                  page === "user-privacy"
                    ? "active"
                    : ""
                }`
              }
              onClick={() =>
                setPage("user-privacy")
              }
            >
              <span>
                🔒
              </span>

              <span>
                Privacy Policy
              </span>
            </button>

            <button
              className={
                `nav-item ${
                  page === "user-terms"
                    ? "active"
                    : ""
                }`
              }
              onClick={() =>
                setPage("user-terms")
              }
            >
              <span>
                📜
              </span>

              <span>
                Terms of Service
              </span>
            </button>

            <button
              className={
                `nav-item ${
                  page === "user-cookies"
                    ? "active"
                    : ""
                }`
              }
              onClick={() =>
                setPage("user-cookies")
              }
            >
              <span>
                🍪
              </span>

              <span>
                Cookie Policy
              </span>
            </button>

            <div className="user-mini">

              <div className="user-avatar">

                {getAvatarUrl() ? (
                  <img
                    src={getAvatarUrl()}
                    alt=""
                  />
                ) : (
                  "👤"
                )}

              </div>

              <div className="user-info">

                <strong>
                  {user?.username || "Bruger"}
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

        <main className="main-content">

          <header className="topbar">

            <div>

              <h1>
                {userPageTitle}
              </h1>

              <p>
                Velkommen til Hjælper.
              </p>

            </div>

            <div className="topbar-user">

              <div className="user-avatar">

                {getAvatarUrl() ? (
                  <img
                    src={getAvatarUrl()}
                    alt=""
                  />
                ) : (
                  "👤"
                )}

              </div>

              <div>

                <strong>
                  {user?.username}
                </strong>

                <span>
                  👤 Bruger
                </span>

              </div>

            </div>

          </header>

          <section className="content">

            {page === "user-dashboard" && (
              <>
                <div className="page-heading">

                  <span className="eyebrow">
                    BRUGER
                  </span>

                  <h2>
                    Velkommen, {user?.username}! 👋
                  </h2>

                  <p>
                    Dette er dit Hjælper-dashboard.
                  </p>

                </div>

                <div className="dashboard-grid">

                  <div className="info-card">

                    <h3>
                      👤 Din konto
                    </h3>

                    <div className="list-card">

                      <div className="list-row">

                        <span>
                          Brugernavn
                        </span>

                        <strong>
                          {user?.username || "Ukendt"}
                        </strong>

                      </div>

                      <div className="list-row">

                        <span>
                          Discord ID
                        </span>

                        <strong>
                          {user?.id || "Ukendt"}
                        </strong>

                      </div>

                      <div className="list-row">

                        <span>
                          Rolle
                        </span>

                        <strong>
                          {roleLabel}
                        </strong>

                      </div>

                    </div>

                  </div>

                  <div className="info-card">

                    <h3>
                      🔐 Login
                    </h3>

                    <p>
                      Du er logget ind via Discord OAuth.
                    </p>

                    <p>
                      Din konto er forbundet med din Discord-konto.
                    </p>

                  </div>

                </div>

                <div className="public-info-box">

                  <h2>
                    ✨ Hjælper
                  </h2>

                  <p>
                    Du er logget ind som almindelig bruger.
                    Admin-funktioner er kun tilgængelige for
                    autoriserede staff-medlemmer.
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
                    Information om hvordan Hjælper håndterer data.
                  </p>

                </div>

                <div className="info-card">

                  <div>
                    <h3>
                      Hvilke personoplysninger vi indsamler
                    </h3>

                    <p>
                      Hjælper kan modtage oplysninger, der er
                      nødvendige for at identificere din Discord-konto
                      og give dig adgang til dashboardet.
                    </p>
                  </div>

                  <div>
                    <h3>
                      Discord-data vi modtager
                    </h3>

                    <p>
                      Dette kan blandt andet være dit Discord-ID,
                      brugernavn og avatar.
                    </p>
                  </div>

                  <div>
                    <h3>
                      Hvad data bruges til
                    </h3>

                    <p>
                      Data bruges til login, sessionshåndtering
                      og funktioner i Hjælper-dashboardet.
                    </p>
                  </div>

                  <div>
                    <h3>
                      Hvor længe data gemmes
                    </h3>

                    <p>
                      Oplysninger gemmes kun så længe, de er
                      nødvendige for de funktioner, de bruges til.
                    </p>
                  </div>

                  <div>
                    <h3>
                      Tredjepartstjenester
                    </h3>

                    <p>
                      Hjælper bruger blandt andet Discord til login
                      og Discord-relaterede funktioner.
                    </p>
                  </div>

                  <div>
                    <h3>
                      Cookies
                    </h3>

                    <p>
                      Hjælper kan bruge nødvendige cookies til
                      blandt andet login og sessionshåndtering.
                    </p>
                  </div>

                  <div>
                    <h3>
                      Dine GDPR-rettigheder
                    </h3>

                    <p>
                      Du kan have rettigheder til blandt andet
                      indsigt, rettelse og sletning af dine
                      personoplysninger.
                    </p>
                  </div>

                  <div>
                    <h3>
                      Kontakt
                    </h3>

                    <p>
                      Kontakt Hjælper-teamet via den officielle
                      supportkanal, hvis du har spørgsmål om dine data.
                    </p>
                  </div>

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
                    Regler for brug af Hjælper.
                  </p>

                </div>

                <div className="info-card">

                  <div>
                    <h3>
                      Regler for brug af Hjælper
                    </h3>

                    <p>
                      Hjælper skal bruges på en ansvarlig og
                      lovlig måde.
                    </p>
                  </div>

                  <div>
                    <h3>
                      Forbud mod misbrug
                    </h3>

                    <p>
                      Forsøg på at omgå sikkerhed, misbruge systemer
                      eller forstyrre tjenesten er ikke tilladt.
                    </p>
                  </div>

                  <div>
                    <h3>
                      API-regler og rate limits
                    </h3>

                    <p>
                      API'et må ikke bruges til overdreven trafik
                      eller automatisering, der belaster tjenesten
                      unødvendigt.
                    </p>
                  </div>

                  <div>
                    <h3>
                      Discord-regler
                    </h3>

                    <p>
                      Brug af Hjælper skal også følge Discords
                      gældende regler og vilkår.
                    </p>
                  </div>

                  <div>
                    <h3>
                      Suspension eller afslutning af konto
                    </h3>

                    <p>
                      Adgang kan begrænses eller afsluttes ved
                      misbrug eller brud på disse vilkår.
                    </p>
                  </div>

                  <div>
                    <h3>
                      Ansvarsbegrænsning
                    </h3>

                    <p>
                      Hjælper leveres som en tjeneste, og funktioner
                      kan ændres, være midlertidigt utilgængelige
                      eller blive fjernet.
                    </p>
                  </div>

                  <div>
                    <h3>
                      Ændringer af vilkårene
                    </h3>

                    <p>
                      Vilkårene kan blive opdateret, når Hjælper
                      udvikles.
                    </p>
                  </div>

                  <div>
                    <h3>
                      Kontakt
                    </h3>

                    <p>
                      Kontakt Hjælper-teamet via den officielle
                      supportkanal ved spørgsmål.
                    </p>
                  </div>

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
                    Information om cookies i Hjælper.
                  </p>

                </div>

                <div className="info-card">

                  <div>
                    <h3>
                      Hvilke cookies der bruges
                    </h3>

                    <p>
                      Hjælper kan bruge cookies, der er nødvendige
                      for login og sessionshåndtering.
                    </p>
                  </div>

                  <div>
                    <h3>
                      Nødvendige cookies
                    </h3>

                    <p>
                      Nødvendige cookies bruges til at holde din
                      login-session aktiv og sikre, at dashboardet
                      fungerer.
                    </p>
                  </div>

                  <div>
                    <h3>
                      Analytics og andre cookies
                    </h3>

                    <p>
                      Hvis Hjælper senere anvender analytics eller
                      andre ikke-nødvendige cookies, vil dette blive
                      oplyst her.
                    </p>
                  </div>

                  <div>
                    <h3>
                      Sådan styrer du cookies
                    </h3>

                    <p>
                      Du kan normalt styre eller slette cookies
                      gennem indstillingerne i din browser.
                    </p>
                  </div>

                </div>
              </>
            )}

          </section>

        </main>

      </div>
    );
  }

  /*
   * =========================================================
   * ADMIN PANEL
   * =========================================================
   */

  if (user && isStaff) {
    return (
      <div className="dashboard-layout">

        <aside className="sidebar">

          <div className="sidebar-brand">

            <div className="brand-icon">
              ✨
            </div>

            <div>
              <strong>
                Hjælper
              </strong>

              <span>
                Admin Dashboard
              </span>
            </div>

          </div>

          <nav className="sidebar-nav">

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
              <span>
                🏠
              </span>

              <span>
                Dashboard
              </span>
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
              <span>
                🤖
              </span>

              <span>
                Bot
              </span>
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
              <span>
                📊
              </span>

              <span>
                Stats
              </span>
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
              <span>
                🧩
              </span>

              <span>
                Cogs
              </span>
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
              <span>
                🖥️
              </span>

              <span>
                Servere
              </span>
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
              <span>
                📜
              </span>

              <span>
                Logs
              </span>
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
                <span>
                  ⚙️
                </span>

                <span>
                  System
                </span>
              </button>
            )}

          </nav>

          <div className="sidebar-bottom">

            <div className="user-mini">

              <div className="user-avatar">

                {getAvatarUrl() ? (
                  <img
                    src={getAvatarUrl()}
                    alt=""
                  />
                ) : (
                  "👤"
                )}

              </div>

              <div className="user-info">

                <strong>
                  {user?.username || "Bruger"}
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

        <main className="main-content">

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

              <p>
                Hjælper V2
              </p>

            </div>

            <div className="topbar-user">

              <div className="user-avatar">

                {getAvatarUrl() ? (
                  <img
                    src={getAvatarUrl()}
                    alt=""
                  />
                ) : (
                  "👤"
                )}

              </div>

              <div>

                <strong>
                  {user?.username}
                </strong>

                <span>
                  {roleLabel}
                </span>

              </div>

            </div>

          </header>

          <section className="content">

            {page === "overview" && (
              <>
                <div className="page-heading">

                  <span className="eyebrow">
                    OVERVIEW
                  </span>

                  <h2>
                    Velkommen tilbage, {user?.username}! 👋
                  </h2>

                  <p>
                    Her kan du se en hurtig oversigt over Hjælper.
                  </p>

                </div>

                <div className="dashboard-grid">

                  <div className="stat-card">
                    <span>🟢</span>
                    <small>Status</small>
                    <strong>
                      {stats?.online
                        ? "Online"
                        : "Offline"}
                    </strong>
                  </div>

                  <div className="stat-card">
                    <span>🖥️</span>
                    <small>Servere</small>
                    <strong>
                      {formatNumber(
                        stats?.servers
                      )}
                    </strong>
                  </div>

                  <div className="stat-card">
                    <span>👥</span>
                    <small>Discord-brugere</small>
                    <strong>
                      {formatNumber(
                        stats?.users
                      )}
                    </strong>
                  </div>

                  <div className="stat-card">
                    <span>⚡</span>
                    <small>Commands</small>
                    <strong>
                      {formatNumber(
                        stats?.commands
                      )}
                    </strong>
                  </div>

                </div>

                <div className="info-card">

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
                    Information om Discord-botten.
                  </p>

                </div>

                <div className="dashboard-grid">

                  <div className="info-card">
                    <h3>Bot</h3>
                    <p>
                      {stats?.name || "Hjælper"}
                    </p>
                  </div>

                  <div className="info-card">
                    <h3>Status</h3>
                    <p>
                      {stats?.online
                        ? "🟢 Online"
                        : "🔴 Offline"}
                    </p>
                  </div>

                  <div className="info-card">
                    <h3>Commands</h3>
                    <p>
                      {formatNumber(
                        stats?.commands
                      )}
                    </p>
                  </div>

                  <div className="info-card">
                    <h3>Cogs</h3>
                    <p>
                      {formatNumber(
                        stats?.cogs
                      )}
                    </p>
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
                    Statistik for Hjælper og dashboardet.
                  </p>

                </div>

                <div className="dashboard-grid">

                  <div className="stat-card">
                    <span>🖥️</span>
                    <small>Servere</small>
                    <strong>
                      {formatNumber(
                        stats?.servers
                      )}
                    </strong>
                  </div>

                  <div className="stat-card">
                    <span>👥</span>
                    <small>Discord-brugere</small>
                    <strong>
                      {formatNumber(
                        stats?.users
                      )}
                    </strong>
                  </div>

                  <div className="stat-card">
                    <span>⚡</span>
                    <small>Commands</small>
                    <strong>
                      {formatNumber(
                        stats?.commands
                      )}
                    </strong>
                  </div>

                  <div className="stat-card">
                    <span>🧩</span>
                    <small>Cogs</small>
                    <strong>
                      {formatNumber(
                        stats?.cogs
                      )}
                    </strong>
                  </div>

                </div>

                <div className="info-card">

                  <h3>
                    👤 Panelbrugere
                  </h3>

                  <div className="list-card">

                    <div className="list-row">
                      <span>
                        I dag
                      </span>

                      <strong>
                        {formatNumber(
                          stats?.dashboard_users?.today ??
                          stats?.panel_users_today
                        )}
                      </strong>
                    </div>

                    <div className="list-row">
                      <span>
                        Denne uge
                      </span>

                      <strong>
                        {formatNumber(
                          stats?.dashboard_users?.week ??
                          stats?.panel_users_week
                        )}
                      </strong>
                    </div>

                    <div className="list-row">
                      <span>
                        Dette år
                      </span>

                      <strong>
                        {formatNumber(
                          stats?.dashboard_users?.year ??
                          stats?.panel_users_year
                        )}
                      </strong>
                    </div>

                    <div className="list-row">
                      <span>
                        I alt
                      </span>

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
                    Aktive moduler i Hjælper.
                  </p>

                </div>

                <div className="list-card">

                  {cogs.length === 0 ? (
                    <div className="empty-state">
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
                            🧩 {name}
                          </span>

                          <strong>
                            🟢 Loaded
                          </strong>
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

                <div className="server-grid">

                  {servers.length === 0 ? (
                    <div className="empty-state">
                      Ingen servere fundet.
                    </div>
                  ) : (
                    servers.map((server) => {

                      const icon =
                        getServerIcon(server);

                      return (
                        <button
                          className="server-card"
                          key={server.id}
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

                          <div className="server-info">

                            <strong>
                              {server.name ||
                                "Ukendt server"}
                            </strong>

                            <span>
                              {formatNumber(
                                server.member_count
                              )} medlemmer
                            </span>

                          </div>

                          <span>
                            →
                          </span>

                        </button>
                      );
                    })
                  )}

                </div>
              </>
            )}

            {page === "server-details" &&
              selectedServer && (
                <>
                  <div className="page-heading">

                    <button
                      className="back-button"
                      onClick={() =>
                        setPage("servers")
                      }
                    >
                      ← Tilbage til servere
                    </button>

                    <h2>

                      {getServerIcon(
                        selectedServer
                      ) ? (
                        <img
                          src={getServerIcon(
                            selectedServer
                          )}
                          alt=""
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 12,
                            verticalAlign:
                              "middle",
                            marginRight: 10,
                          }}
                        />
                      ) : (
                        "🖥️"
                      )}

                      {selectedServer.name}

                    </h2>

                    <p>
                      Serverinformation
                    </p>

                  </div>

                  {serverError && (
                    <div className="error-box">
                      {serverError}
                    </div>
                  )}

                  <div className="dashboard-grid">

                    <div className="info-card">

                      <h3>
                        🆔 Server ID
                      </h3>

                      <p>
                        {selectedServer.id}
                      </p>

                    </div>

                    <div className="info-card">

                      <h3>
                        👥 Medlemmer
                      </h3>

                      <p>
                        {formatNumber(
                          selectedServer.member_count
                        )}
                      </p>

                    </div>

                  </div>

                  {(isOwner || isManager) && (
                    <div className="info-card">

                      <h3>
                        ⚠️ Server handlinger
                      </h3>

                      <p>
                        Kun Ejer og Manager kan fjerne
                        Hjælper fra en server.
                      </p>

                      <button
                        className="danger-button"
                        onClick={() =>
                          removeServer(
                            selectedServer.id
                          )
                        }
                      >
                        🚪 Fjern Hjælper
                      </button>

                    </div>
                  )}

                </>
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

                <div className="info-card">

                  <h3>
                    📡 System
                  </h3>

                  <p>
                    Live logs kan administreres fra
                    Wispbyte console.
                  </p>

                </div>
              </>
            )}

            {page === "system" && (
              <>
                <div className="page-heading">

                  <span className="eyebrow">
                    SYSTEM
                  </span>

                  <h2>
                    ⚙️ System
                  </h2>

                  <p>
                    Systeminformation og administration.
                  </p>

                </div>

                <div className="dashboard-grid">

                  <div className="info-card">
                    <h3>🐍 Python</h3>
                    <p>
                      Python 3.14.7
                    </p>
                  </div>

                  <div className="info-card">
                    <h3>🌐 API</h3>
                    <p>
                      FastAPI
                    </p>
                  </div>

                  <div className="info-card">
                    <h3>🤖 Discord</h3>
                    <p>
                      discord.py
                    </p>
                  </div>

                  <div className="info-card">
                    <h3>✨ Hjælper</h3>
                    <p>
                      V2
                    </p>
                  </div>

                </div>
              </>
            )}

          </section>

        </main>

      </div>
    );
  }

  return (
    <div className="app-loading">

      <div className="loading-card">

        <div className="loading-icon">
          ✨
        </div>

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
