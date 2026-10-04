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

  const [account, setAccount] = useState(null);
  const [security, setSecurity] = useState(null);
  const [supportTickets, setSupportTickets] = useState([]);

  const [bio, setBio] = useState("");
  const [supportSubject, setSupportSubject] = useState("");
  const [supportMessage, setSupportMessage] = useState("");

  const [selectedServer, setSelectedServer] = useState(null);
  const [serverError, setServerError] = useState("");
  const [accountMessage, setAccountMessage] = useState("");
  const [supportMessageStatus, setSupportMessageStatus] = useState("");
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

  async function loadAccount() {
    try {
      const [accountRes, securityRes] =
        await Promise.all([
          fetch(`${API}/api/account`, {
            credentials: "include",
          }),
          fetch(`${API}/api/account/security`, {
            credentials: "include",
          }),
        ]);

      if (accountRes.ok) {
        const data = await accountRes.json();

        setAccount(data);

        setBio(
          data.user?.bio || ""
        );
      }

      if (securityRes.ok) {
        setSecurity(
          await securityRes.json()
        );
      }
    } catch (error) {
      console.error(
        "Konto kunne ikke indlæses:",
        error
      );
    }
  }

  async function loadSupport() {
    try {
      const response = await fetch(
        `${API}/api/support/tickets`,
        {
          credentials: "include",
        }
      );

      if (!response.ok) return;

      const data = await response.json();

      setSupportTickets(
        data.tickets || []
      );
    } catch (error) {
      console.error(
        "Support kunne ikke indlæses:",
        error
      );
    }
  }

  function goToAccount() {
    setPage("account");
    setAccountMessage("");
    loadAccount();
  }

  function goToSupport() {
    setPage("support");
    setSupportMessageStatus("");
    loadSupport();
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
      return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=256`;
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

  async function saveProfile() {
    setAccountMessage("");

    try {
      const response = await fetch(
        `${API}/api/account/profile`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            bio,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setAccountMessage(
          data.detail ||
          "Kunne ikke gemme profilen."
        );
        return;
      }

      setAccountMessage(
        "✅ Profilen er gemt."
      );

      setAccount(current =>
        current
          ? {
              ...current,
              user: {
                ...current.user,
                bio: data.bio,
              },
            }
          : current
      );
    } catch (error) {
      console.error(error);
      setAccountMessage(
        "Der opstod en fejl."
      );
    }
  }

  async function logoutAllSessions() {
    if (
      !window.confirm(
        "Vil du logge alle andre aktive sessions ud?"
      )
    ) {
      return;
    }

    try {
      const response = await fetch(
        `${API}/api/account/security/logout-all`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setAccountMessage(
          data.detail ||
          "Kunne ikke logge sessions ud."
        );
        return;
      }

      setAccountMessage(
        `✅ ${data.removed || 0} andre sessions blev logget ud.`
      );

      loadAccount();
    } catch (error) {
      console.error(error);
    }
  }

  async function deleteAccount() {
    const firstConfirm = window.confirm(
      "Er du sikker på, at du vil slette din Hjælper-konto?"
    );

    if (!firstConfirm) return;

    const secondConfirm = window.confirm(
      "Dette kan ikke fortrydes. Slet kontoen?"
    );

    if (!secondConfirm) return;

    try {
      const response = await fetch(
        `${API}/api/account`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setAccountMessage(
          data.detail ||
          "Kontoen kunne ikke slettes."
        );
        return;
      }

      alert(
        data.message ||
        "Kontoen er slettet."
      );

      setUser(null);
      setAccount(null);
      setPage("login");
    } catch (error) {
      console.error(error);

      setAccountMessage(
        "Der opstod en fejl ved sletning."
      );
    }
  }

  async function createSupportTicket() {
    setSupportMessageStatus("");

    try {
      const response = await fetch(
        `${API}/api/support/tickets`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            subject: supportSubject,
            message: supportMessage,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setSupportMessageStatus(
          data.detail ||
          "Kunne ikke oprette supportsag."
        );
        return;
      }

      setSupportSubject("");
      setSupportMessage("");

      setSupportMessageStatus(
        "✅ Din supportsag er oprettet."
      );

      loadSupport();
    } catch (error) {
      console.error(error);

      setSupportMessageStatus(
        "Der opstod en fejl."
      );
    }
  }

  async function closeSupportTicket(ticketId) {
    try {
      const response = await fetch(
        `${API}/api/support/tickets/${ticketId}/close`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setSupportMessageStatus(
          data.detail ||
          "Kunne ikke lukke sagen."
        );
        return;
      }

      loadSupport();
    } catch (error) {
      console.error(error);
    }
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

  function renderAccountPage() {
    return (
      <>
        <div className="page-heading">
          <span className="eyebrow">
            KONTO
          </span>

          <h2>
            👤 Konto & brugerprofil
          </h2>

          <p>
            Administrer dine oplysninger,
            sikkerhed og connected accounts.
          </p>
        </div>

        {accountMessage && (
          <div className="success-box">
            {accountMessage}
          </div>
        )}

        <div className="account-grid">
          <div className="account-profile-card">
            <div className="large-avatar">
              <img
                src={getAvatarUrl()}
                alt=""
              />
            </div>

            <div className="account-profile-info">
              <span className="eyebrow">
                DISCORD
              </span>

              <h3>
                {user.username}
              </h3>

              <p>
                {roleLabel}
              </p>

              <small>
                ID: {user.id}
              </small>
            </div>
          </div>

          <div className="account-card">
            <div className="account-card-title">
              <div>
                <span className="eyebrow">
                  PROFIL
                </span>

                <h3>
                  ✏️ Profil
                </h3>
              </div>
            </div>

            <label>
              Om mig
            </label>

            <textarea
              value={bio}
              onChange={event =>
                setBio(event.target.value)
              }
              maxLength={500}
              placeholder="Skriv lidt om dig selv..."
            />

            <div className="character-count">
              {bio.length}/500
            </div>

            <button
              className="primary-button"
              onClick={saveProfile}
            >
              💾 Gem profil
            </button>
          </div>
        </div>

        <div className="account-card">
          <div className="account-card-title">
            <div>
              <span className="eyebrow">
                CONNECTED ACCOUNTS
              </span>

              <h3>
                🔗 Forbundne konti
              </h3>
            </div>
          </div>

          <div className="connected-account">
            <div className="connected-icon">
              💬
            </div>

            <div className="connected-main">
              <strong>
                Discord
              </strong>

              <span>
                {user.username}
              </span>
            </div>

            <div className="connected-status">
              🟢 Forbundet
            </div>
          </div>
        </div>

        <div className="account-card">
          <div className="account-card-title">
            <div>
              <span className="eyebrow">
                SECURITY
              </span>

              <h3>
                🔐 Sikkerhed
              </h3>
            </div>

            <button
              className="secondary-button small-button"
              onClick={logoutAllSessions}
            >
              Log andre sessions ud
            </button>
          </div>

          <h4 className="account-subtitle">
            🟢 Aktive sessions
          </h4>

          <div className="session-list">
            {security?.active_sessions?.length ? (
              security.active_sessions.map(
                session => (
                  <div
                    className="session-row"
                    key={session.id}
                  >
                    <div className="session-icon">
                      💻
                    </div>

                    <div className="session-main">
                      <strong>
                        {session.device}
                      </strong>

                      <span>
                        Oprettet:{" "}
                        {session.created_at || "-"}
                      </span>

                      <small>
                        Sidst aktiv:{" "}
                        {session.last_activity || "-"}
                      </small>
                    </div>

                    <div
                      className={
                        session.current
                          ? "session-current"
                          : "session-status"
                      }
                    >
                      {session.current
                        ? "Denne session"
                        : "Aktiv"}
                    </div>
                  </div>
                )
              )
            ) : (
              <div className="empty">
                Ingen aktive sessions.
              </div>
            )}
          </div>

          <h4 className="account-subtitle">
            📜 Login-historik
          </h4>

          <div className="login-history">
            {security?.login_history?.length ? (
              security.login_history.map(
                (entry, index) => (
                  <div
                    className="history-row"
                    key={`${entry.timestamp}-${index}`}
                  >
                    <div>
                      <strong>
                        🔐 Discord login
                      </strong>

                      <span>
                        {entry.timestamp}
                      </span>
                    </div>

                    <span className="history-success">
                      🟢 Succes
                    </span>
                  </div>
                )
              )
            ) : (
              <div className="empty">
                Ingen login-historik endnu.
              </div>
            )}
          </div>
        </div>

        <div className="danger-account-card">
          <div>
            <span className="eyebrow">
              DANGER ZONE
            </span>

            <h3>
              🗑️ Slet konto
            </h3>

            <p>
              Dette sletter din Hjælper-dashboardkonto
              og gemte profiloplysninger.
            </p>
          </div>

          <button
            className="danger-button"
            onClick={deleteAccount}
          >
            Slet min konto
          </button>
        </div>
      </>
    );
  }

  function renderSupportPage() {
    return (
      <>
        <div className="page-heading">
          <span className="eyebrow">
            SUPPORT
          </span>

          <h2>
            🛟 Hjælper Support
          </h2>

          <p>
            Har du brug for hjælp? Opret en supportsag.
          </p>
        </div>

        {supportMessageStatus && (
          <div className="success-box">
            {supportMessageStatus}
          </div>
        )}

        <div className="support-grid">
          <div className="account-card">
            <div className="account-card-title">
              <div>
                <span className="eyebrow">
                  NY SAG
                </span>

                <h3>
                  🎫 Opret supportsag
                </h3>
              </div>
            </div>

            <label>
              Emne
            </label>

            <input
              type="text"
              value={supportSubject}
              onChange={event =>
                setSupportSubject(
                  event.target.value
                )
              }
              maxLength={100}
              placeholder="Hvad har du brug for hjælp til?"
            />

            <label>
              Besked
            </label>

            <textarea
              value={supportMessage}
              onChange={event =>
                setSupportMessage(
                  event.target.value
                )
              }
              maxLength={3000}
              placeholder="Beskriv problemet så detaljeret som muligt..."
            />

            <button
              className="primary-button"
              onClick={createSupportTicket}
            >
              🚀 Opret supportsag
            </button>
          </div>

          <div className="account-card">
            <div className="account-card-title">
              <div>
                <span className="eyebrow">
                  MINE SAGER
                </span>

                <h3>
                  📋 Supporthistorik
                </h3>
              </div>
            </div>

            <div className="support-ticket-list">
              {supportTickets.length === 0 ? (
                <div className="empty">
                  Du har ingen supportsager endnu.
                </div>
              ) : (
                supportTickets.map(ticket => (
                  <div
                    className="ticket-card"
                    key={ticket.id}
                  >
                    <div className="ticket-top">
                      <strong>
                        #{ticket.id}
                      </strong>

                      <span
                        className={
                          ticket.status === "open"
                            ? "ticket-open"
                            : "ticket-closed"
                        }
                      >
                        {ticket.status === "open"
                          ? "🟢 Åben"
                          : "⚪ Lukket"}
                      </span>
                    </div>

                    <h4>
                      {ticket.subject}
                    </h4>

                    <p>
                      {ticket.message}
                    </p>

                    <small>
                      Oprettet:{" "}
                      {ticket.created_at}
                    </small>

                    {ticket.status === "open" && (
                      <button
                        className="secondary-button close-ticket-button"
                        onClick={() =>
                          closeSupportTicket(
                            ticket.id
                          )
                        }
                      >
                        Luk sag
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </>
    );
  }

  if (loading) {
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

            <span>→</span>
          </button>

          <button
            className="login secondary-login"
            onClick={userLogin}
          >
            <span>
              <span className="discord-icon">
                👤
              </span>
              Bruger Login
            </span>

            <span>→</span>
          </button>

          <button
            className="login secondary-login"
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

            <span>→</span>
          </button>

          <button
            className="login secondary-login"
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

            <span>→</span>
          </button>

          <button
            className="login secondary-login"
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

            <span>→</span>
          </button>

          <div className="login-footer">
            Hjælper • 2026
          </div>
        </div>
      </div>
    );
  }

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

  if (
    user &&
    (
      page === "user-dashboard" ||
      page === "user-privacy" ||
      page === "user-terms" ||
      page === "user-cookies" ||
      page === "account" ||
      page === "support"
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
                {isStaff
                  ? "Admin Dashboard"
                  : "Bruger Dashboard"}
              </span>
            </div>
          </div>

          <nav>
            {isStaff ? (
              <>
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
              </>
            ) : (
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
            )}

            <button
              className={`nav-item ${
                page === "account"
                  ? "active"
                  : ""
              }`}
              onClick={goToAccount}
            >
              👤 Konto
            </button>

            <button
              className={`nav-item ${
                page === "support"
                  ? "active"
                  : ""
              }`}
              onClick={goToSupport}
            >
              🛟 Support
            </button>
          </nav>

          <div className="sidebar-bottom">
            {!isStaff && (
              <>
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
              </>
            )}

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
                              : page === "system"
                                ? "⚙️ System"
                                : page === "account"
                                  ? "👤 Konto"
                                  : page === "support"
                                    ? "🛟 Support"
                                    : page === "user-privacy"
                                      ? "🔒 Privacy Policy"
                                      : page === "user-terms"
                                        ? "📜 Terms of Service"
                                        : "🍪 Cookie Policy"}
              </h1>

              <span>
                Hjælper V2
              </span>
            </div>

            <div className="topbar-user">
              {user.username} • {roleLabel}
            </div>
          </header>

          <div className="content">
            {page === "account" &&
              renderAccountPage()}

            {page === "support" &&
              renderSupportPage()}

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
                    Du er logget ind som almindelig
                    bruger. Brug Konto til at administrere
                    din profil og Support hvis du har brug
                    for hjælp.
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

            {page === "overview" && isStaff && (
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

            {page === "bot" && isStaff && (
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

            {page === "stats" && isStaff && (
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

            {page === "cogs" && isStaff && (
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
                          <span>🧩</span>

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

            {page === "servers" && isStaff && (
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
              selectedServer &&
              isStaff && (
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

            {page === "logs" && isStaff && (
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
