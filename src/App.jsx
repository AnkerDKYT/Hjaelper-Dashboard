import React, { useEffect, useState } from "react";
import "./style.css";

const API = "/backend";

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState("login");

  const [publicStats, setPublicStats] = useState(null);
  const [publicStatus, setPublicStatus] = useState(null);

  const [stats, setStats] = useState(null);
  const [cogs, setCogs] = useState([]);
  const [servers, setServers] = useState([]);

  const [account, setAccount] = useState(null);
  const [security, setSecurity] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loginHistory, setLoginHistory] = useState([]);
  const [connected, setConnected] = useState(null);

  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);

  const [selectedServer, setSelectedServer] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketMessage, setTicketMessage] = useState("");
  const [replyMessage, setReplyMessage] = useState("");

  const [profileUsername, setProfileUsername] = useState("");

  const [lastUpdated, setLastUpdated] = useState(null);

  const isOwner =
    user?.role === "owner" ||
    user?.is_owner === true;

  const isManager = user?.role === "manager";
  const isAdmin = user?.role === "admin";

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

    if (isStaff) {
      loadStaffData();
    } else {
      loadUserData();
    }
  }, [user]);

  async function apiFetch(path, options = {}) {
    const response = await fetch(`${API}${path}`, {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      ...options,
    });

    let data = null;

    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      throw new Error(
        data?.detail ||
        data?.message ||
        `HTTP ${response.status}`
      );
    }

    return data;
  }

  async function loadUser() {
    try {
      const data = await apiFetch("/auth/me");

      if (data?.authenticated && data?.user) {
        setUser(data.user);

        if (
          data.user.role === "owner" ||
          data.user.role === "manager" ||
          data.user.role === "admin"
        ) {
          setPage("admin");
        } else {
          setPage("dashboard");
        }
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function loadPublicStats() {
    try {
      const data = await apiFetch("/api/public/stats");
      setPublicStats(data);
      setLastUpdated(new Date());
    } catch {
      setPublicStats(null);
    }
  }

  async function loadPublicStatus() {
    try {
      const data = await apiFetch("/api/public/stats");
      setPublicStatus(data);
    } catch {
      setPublicStatus(null);
    }
  }

  async function loadStaffData() {
    await Promise.all([
      loadStats(),
      loadCogs(),
      loadServers(),
      loadTickets(),
    ]);
  }

  async function loadUserData() {
    await Promise.all([
      loadAccount(),
      loadTickets(),
    ]);
  }

  async function loadStats() {
    try {
      const data = await apiFetch("/api/stats");
      setStats(data);
    } catch (err) {
      setError(err.message);
    }
  }

  async function loadCogs() {
    try {
      const data = await apiFetch("/api/cogs");
      setCogs(
        Array.isArray(data)
          ? data
          : data?.cogs || []
      );
    } catch (err) {
      setError(err.message);
    }
  }

  async function loadServers() {
    try {
      const data = await apiFetch("/api/servers");

      setServers(
        Array.isArray(data)
          ? data
          : data?.servers || []
      );
    } catch (err) {
      setError(err.message);
    }
  }

  async function loadTickets() {
    try {
      const data = await apiFetch(
        isStaff
          ? "/api/support/admin/tickets"
          : "/api/support/tickets"
      );

      setTickets(
        Array.isArray(data)
          ? data
          : data?.tickets || []
      );
    } catch {
      setTickets([]);
    }
  }

  async function loadAccount() {
    try {
      const [
        accountData,
        securityData,
        sessionsData,
        historyData,
        connectedData,
      ] = await Promise.all([
        apiFetch("/api/account"),
        apiFetch("/api/account/security"),
        apiFetch("/api/account/sessions"),
        apiFetch("/api/account/login-history"),
        apiFetch("/api/account/connected"),
      ]);

      setAccount(accountData);
      setSecurity(securityData);

      setSessions(
        Array.isArray(sessionsData)
          ? sessionsData
          : sessionsData?.sessions || []
      );

      setLoginHistory(
        Array.isArray(historyData)
          ? historyData
          : historyData?.history || []
      );

      setConnected(connectedData);

      const username =
        accountData?.username ||
        accountData?.user?.username ||
        user?.username ||
        "";

      setProfileUsername(username);
    } catch (err) {
      setError(err.message);
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
      await apiFetch("/auth/logout", {
        method: "POST",
      });
    } catch {
      // Continue with local logout even if backend request fails.
    }

    setUser(null);
    setPage("login");
    setSelectedTicket(null);
    setSelectedServer(null);
  }

  function goPublic(target) {
    setPage(target);
    setError("");
    setSuccess("");
  }

  function goDashboard() {
    setError("");
    setSuccess("");

    if (isStaff) {
      setPage("admin");
    } else {
      setPage("dashboard");
    }
  }

  async function createTicket(event) {
    event.preventDefault();

    if (!ticketSubject.trim() || !ticketMessage.trim()) {
      setError("Udfyld både emne og besked.");
      return;
    }

    try {
      setError("");

      await apiFetch("/api/support/tickets", {
        method: "POST",
        body: JSON.stringify({
          subject: ticketSubject.trim(),
          message: ticketMessage.trim(),
        }),
      });

      setTicketSubject("");
      setTicketMessage("");

      await loadTickets();

      setSuccess("Din ticket er blevet oprettet.");
    } catch (err) {
      setError(err.message);
    }
  }

  async function replyToTicket(ticketId) {
    if (!replyMessage.trim()) {
      setError("Skriv en besked først.");
      return;
    }

    try {
      setError("");

      const endpoint = isStaff
        ? `/api/support/admin/tickets/${ticketId}/reply`
        : `/api/support/${ticketId}/reply`;

      await apiFetch(endpoint, {
        method: "POST",
        body: JSON.stringify({
          message: replyMessage.trim(),
        }),
      });

      setReplyMessage("");

      await loadTickets();

      const updated = await apiFetch(
        isStaff
          ? `/api/support/admin/tickets/${ticketId}`
          : `/api/support/tickets`
      );

      if (isStaff) {
        setSelectedTicket(updated);
      } else {
        const list =
          Array.isArray(updated)
            ? updated
            : updated?.tickets || [];

        setSelectedTicket(
          list.find(
            (ticket) =>
              String(ticket.id) === String(ticketId)
          ) || null
        );
      }
    } catch (err) {
      setError(err.message);
    }
  }

  async function closeTicket(ticketId) {
    try {
      setError("");

      const endpoint = isStaff
        ? `/api/support/admin/tickets/${ticketId}/close`
        : `/api/support/tickets/${ticketId}/close`;

      await apiFetch(endpoint, {
        method: "POST",
      });

      await loadTickets();

      setSuccess("Ticketen er blevet lukket.");

      if (selectedTicket) {
        setSelectedTicket({
          ...selectedTicket,
          status: "closed",
        });
      }
    } catch (err) {
      setError(err.message);
    }
  }

  async function openTicket(ticket) {
    try {
      setError("");

      if (isStaff) {
        const data = await apiFetch(
          `/api/support/admin/tickets/${ticket.id}`
        );

        setSelectedTicket(data);
      } else {
        const data = await apiFetch(
          "/api/support/tickets"
        );

        const list =
          Array.isArray(data)
            ? data
            : data?.tickets || [];

        setSelectedTicket(
          list.find(
            (item) =>
              String(item.id) === String(ticket.id)
          ) || ticket
        );
      }
    } catch {
      setSelectedTicket(ticket);
    }
  }

  async function saveProfile(event) {
    event.preventDefault();

    if (!profileUsername.trim()) {
      setError("Brugernavn må ikke være tomt.");
      return;
    }

    try {
      setError("");

      await apiFetch("/api/account/profile", {
        method: "PATCH",
        body: JSON.stringify({
          username: profileUsername.trim(),
        }),
      });

      await loadAccount();

      setSuccess("Profilen er blevet opdateret.");
    } catch (err) {
      setError(err.message);
    }
  }

  async function logoutAllSessions() {
    try {
      setError("");

      await apiFetch(
        "/api/account/security/logout-all",
        {
          method: "POST",
        }
      );

      setSuccess(
        "Alle andre aktive sessioner er blevet logget ud."
      );

      await loadAccount();
    } catch (err) {
      setError(err.message);
    }
  }

  async function deleteSession(sessionId) {
    try {
      await apiFetch(
        `/api/account/sessions/${sessionId}`,
        {
          method: "DELETE",
        }
      );

      await loadAccount();

      setSuccess("Sessionen er blevet fjernet.");
    } catch (err) {
      setError(err.message);
    }
  }

  async function deleteAccount() {
    const confirmed = window.confirm(
      "Er du sikker på, at du vil slette din konto permanent?"
    );

    if (!confirmed) return;

    try {
      await apiFetch("/api/account", {
        method: "DELETE",
      });

      setUser(null);
      setPage("login");
    } catch (err) {
      setError(err.message);
    }
  }

  async function leaveServer(guildId) {
    const confirmed = window.confirm(
      "Er du sikker på, at botten skal forlade denne server?"
    );

    if (!confirmed) return;

    try {
      await apiFetch(
        `/api/servers/${guildId}/leave`,
        {
          method: "POST",
        }
      );

      setSelectedServer(null);

      await loadServers();

      setSuccess("Botten har forladt serveren.");
    } catch (err) {
      setError(err.message);
    }
  }

  async function reloadCogs() {
    try {
      setError("");

      await apiFetch("/api/reload-cogs", {
        method: "POST",
      });

      await loadCogs();

      setSuccess("Cogs er blevet genindlæst.");
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-box">
          <div className="loading-spinner" />
          <h2>Hjælper</h2>
          <p>Indlæser dashboard...</p>
        </div>
      </div>
    );
  }

  /*
   * ======================================================
   * PUBLIC PAGES
   * ======================================================
   */

  if (!user) {
    if (page === "stats") {
      return (
        <PublicLayout
          title="Statistik"
          onBack={() => goPublic("login")}
        >
          <PublicStats
            stats={publicStats}
            lastUpdated={lastUpdated}
          />
        </PublicLayout>
      );
    }

    if (page === "status") {
      return (
        <PublicLayout
          title="Status"
          onBack={() => goPublic("login")}
        >
          <PublicStatus status={publicStatus} />
        </PublicLayout>
      );
    }

    if (page === "roadmap") {
      return (
        <PublicLayout
          title="Roadmap"
          onBack={() => goPublic("login")}
        >
          <Roadmap />
        </PublicLayout>
      );
    }

    return (
      <PublicLanding
        onStats={() => goPublic("stats")}
        onStatus={() => goPublic("status")}
        onRoadmap={() => goPublic("roadmap")}
        onAdminLogin={adminLogin}
        onUserLogin={userLogin}
      />
    );
  }

  /*
   * ======================================================
   * USER DASHBOARD
   * ======================================================
   */

  if (!isStaff) {
    return (
      <DashboardLayout
        user={user}
        roleLabel={roleLabel}
        page={page}
        setPage={setPage}
        onLogout={logout}
        userMode
      >
        {page === "dashboard" && (
          <UserDashboard
            user={user}
            tickets={tickets}
            onSupport={() => setPage("support")}
          />
        )}

        {page === "stats" && (
          <DashboardPublicStats
            stats={publicStats}
          />
        )}

        {page === "status" && (
          <DashboardPublicStatus
            status={publicStatus}
          />
        )}

        {page === "roadmap" && (
          <Roadmap />
        )}

        {page === "support" && (
          <SupportPage
            tickets={tickets}
            selectedTicket={selectedTicket}
            setSelectedTicket={setSelectedTicket}
            onOpenTicket={openTicket}
            onCreateTicket={createTicket}
            ticketSubject={ticketSubject}
            setTicketSubject={setTicketSubject}
            ticketMessage={ticketMessage}
            setTicketMessage={setTicketMessage}
            replyMessage={replyMessage}
            setReplyMessage={setReplyMessage}
            onReply={replyToTicket}
            onClose={closeTicket}
            onBack={() => setSelectedTicket(null)}
            staff={false}
          />
        )}

        {page === "account" && (
          <AccountPage
            user={user}
            account={account}
            security={security}
            sessions={sessions}
            loginHistory={loginHistory}
            connected={connected}
            profileUsername={profileUsername}
            setProfileUsername={setProfileUsername}
            onSaveProfile={saveProfile}
            onLogoutAll={logoutAllSessions}
            onDeleteSession={deleteSession}
            onDeleteAccount={deleteAccount}
          />
        )}

        {error && (
          <div className="error-box">
            {error}
          </div>
        )}

        {success && (
          <div className="success-box">
            {success}
          </div>
        )}
      </DashboardLayout>
    );
  }

  /*
   * ======================================================
   * STAFF DASHBOARD
   * ======================================================
   */

  return (
    <DashboardLayout
      user={user}
      roleLabel={roleLabel}
      page={page}
      setPage={setPage}
      onLogout={logout}
      staffMode
      isOwner={isOwner}
      isManager={isManager}
    >
      {page === "admin" && (
        <AdminPanel
          user={user}
          stats={stats}
          servers={servers}
          cogs={cogs}
          tickets={tickets}
          onStats={loadStats}
          onServers={loadServers}
          onCogs={loadCogs}
          onTickets={loadTickets}
          onPage={setPage}
        />
      )}

      {page === "stats" && (
        <StaffStats
          stats={stats}
          publicStats={publicStats}
        />
      )}

      {page === "status" && (
        <DashboardPublicStatus
          status={publicStatus}
        />
      )}

      {page === "bot" && (
        <BotPage
          stats={stats}
          publicStats={publicStats}
        />
      )}

      {page === "cogs" && (
        <CogsPage
          cogs={cogs}
          onReload={reloadCogs}
        />
      )}

      {page === "servers" && !selectedServer && (
        <ServersPage
          servers={servers}
          onSelect={setSelectedServer}
        />
      )}

      {page === "servers" && selectedServer && (
        <ServerDetails
          server={selectedServer}
          onBack={() => setSelectedServer(null)}
          onLeave={leaveServer}
        />
      )}

      {page === "tickets" && (
        <SupportPage
          tickets={tickets}
          selectedTicket={selectedTicket}
          setSelectedTicket={setSelectedTicket}
          onOpenTicket={openTicket}
          onCreateTicket={null}
          ticketSubject=""
          setTicketSubject={() => {}}
          ticketMessage=""
          setTicketMessage={() => {}}
          replyMessage={replyMessage}
          setReplyMessage={setReplyMessage}
          onReply={replyToTicket}
          onClose={closeTicket}
          onBack={() => setSelectedTicket(null)}
          staff
        />
      )}

      {page === "roadmap" && (
        <Roadmap />
      )}

      {page === "logs" && (
        <LogsPage />
      )}

      {page === "system" && (
        <SystemPage
          user={user}
          security={security}
        />
      )}

      {page === "account" && (
        <AccountPage
          user={user}
          account={account}
          security={security}
          sessions={sessions}
          loginHistory={loginHistory}
          connected={connected}
          profileUsername={profileUsername}
          setProfileUsername={setProfileUsername}
          onSaveProfile={saveProfile}
          onLogoutAll={logoutAllSessions}
          onDeleteSession={deleteSession}
          onDeleteAccount={deleteAccount}
        />
      )}

      {error && (
        <div className="error-box">
          {error}
        </div>
      )}

      {success && (
        <div className="success-box">
          {success}
        </div>
      )}
    </DashboardLayout>
  );
}

/* ======================================================
   PUBLIC LANDING
====================================================== */

function PublicLanding({
  onStats,
  onStatus,
  onRoadmap,
  onAdminLogin,
  onUserLogin,
}) {
  return (
    <div className="public-page">
      <div className="public-topbar">
        <div className="brand">
          <div className="brand-icon">H</div>

          <div>
            <h1>Hjælper</h1>
            <span>Dashboard</span>
          </div>
        </div>
      </div>

      <main className="public-content">
        <div className="public-title">
          <div className="eyebrow">
            HJÆLPER V2
          </div>

          <h2>Velkommen til Hjælper</h2>

          <p>
            Administrer botten, se statistik og få
            support fra ét samlet dashboard.
          </p>
        </div>

        <div className="stats-grid">
          <button
            className="stat-card"
            onClick={onStats}
            style={{
              border: "1px solid rgba(255,255,255,0.07)",
              color: "inherit",
              textAlign: "left",
              cursor: "pointer",
            }}
          >
            <span>📊 Statistik</span>
            <strong>Se statistik</strong>
          </button>

          <button
            className="stat-card"
            onClick={onStatus}
            style={{
              border: "1px solid rgba(255,255,255,0.07)",
              color: "inherit",
              textAlign: "left",
              cursor: "pointer",
            }}
          >
            <span>🟢 Status</span>
            <strong>System status</strong>
          </button>

          <button
            className="stat-card"
            onClick={onRoadmap}
            style={{
              border: "1px solid rgba(255,255,255,0.07)",
              color: "inherit",
              textAlign: "left",
              cursor: "pointer",
            }}
          >
            <span>🗺️ Roadmap</span>
            <strong>Se roadmap</strong>
          </button>
        </div>

        <div
          className="public-info-box"
          style={{ marginTop: "25px" }}
        >
          <div className="eyebrow">
            LOGIN
          </div>

          <h3>Log ind med Discord</h3>

          <p>
            Vælg den login-type, du skal bruge.
            Staff får adgang til Admin Panel, mens
            almindelige brugere får adgang til deres
            bruger-dashboard.
          </p>

          <button
            className="login"
            style={{
              marginTop: "20px",
              minHeight: "60px",
            }}
            onClick={onAdminLogin}
          >
            <span>
              <span className="discord-icon">
                🛡️
              </span>

              <strong>
                Admin Login med Discord
              </strong>
            </span>

            <span>→</span>
          </button>

          <button
            className="login secondary-login"
            style={{
              minHeight: "60px",
            }}
            onClick={onUserLogin}
          >
            <span>
              <span className="discord-icon">
                👤
              </span>

              <strong>
                Bruger Login med Discord
              </strong>
            </span>

            <span>→</span>
          </button>
        </div>

        <div className="login-footer">
          Hjælper · 2026
        </div>
      </main>
    </div>
  );
}

/* ======================================================
   PUBLIC LAYOUT
====================================================== */

function PublicLayout({
  title,
  onBack,
  children,
}) {
  return (
    <div className="public-page">
      <div className="public-topbar">
        <div className="brand">
          <div className="brand-icon">H</div>

          <div>
            <h1>Hjælper</h1>
            <span>{title}</span>
          </div>
        </div>

        <button
          className="back-button"
          onClick={onBack}
        >
          ← Tilbage
        </button>
      </div>

      {children}
    </div>
  );
}

/* ======================================================
   PUBLIC STATS
====================================================== */

function PublicStats({
  stats,
  lastUpdated,
}) {
  const data = stats || {};

  const values = [
    [
      "🤖 Bot status",
      data.bot_online === false
        ? "Offline"
        : "Online",
    ],
    [
      "🖥️ Servere",
      data.servers ??
      data.server_count ??
      data.guilds ??
      0,
    ],
    [
      "👥 Brugere",
      data.users ??
      data.user_count ??
      data.total_users ??
      0,
    ],
    [
      "💬 Commands",
      data.commands ??
      data.command_count ??
      0,
    ],
  ];

  return (
    <div className="public-content">
      <div className="public-title">
        <div className="eyebrow">
          STATISTIK
        </div>

        <h2>Hjælper statistik</h2>

        <p>
          Aktuel offentlig statistik for Hjælper.
        </p>
      </div>

      <div className="stats-grid">
        {values.map(([label, value]) => (
          <div
            className="stat-card"
            key={label}
          >
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>

      <div className="last-updated">
        Sidst opdateret{" "}
        {lastUpdated
          ? lastUpdated.toLocaleTimeString("da-DK")
          : "—"}
      </div>
    </div>
  );
}

/* ======================================================
   PUBLIC STATUS
====================================================== */

function PublicStatus({
  status,
}) {
  const online =
    status?.bot_online !== false &&
    status?.online !== false;

  return (
    <div className="public-content">
      <div className="public-title">
        <div className="eyebrow">
          STATUS
        </div>

        <h2>System status</h2>

        <p>
          Se den aktuelle status for Hjælper.
        </p>
      </div>

      <div className="public-status-grid">
        <div className="public-status-card">
          <div className="status-icon">
            🤖
          </div>

          <div>
            <span>Discord bot</span>

            <strong
              className={
                online
                  ? "status-online"
                  : "status-offline"
              }
            >
              {online
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
            <span>Dashboard API</span>

            <strong className="status-online">
              Online
            </strong>
          </div>
        </div>

        <div className="public-status-card">
          <div className="status-icon">
            🔐
          </div>

          <div>
            <span>Discord OAuth</span>

            <strong className="status-online">
              Online
            </strong>
          </div>
        </div>
      </div>

      <div className="public-info-box">
        <h3>
          {online
            ? "Alle systemer ser gode ud"
            : "Botten er offline"}
        </h3>

        <p>
          {online
            ? "Hjælper-dashboardet og de vigtigste services svarer normalt."
            : "Discord-botten ser ud til at være offline lige nu."}
        </p>
      </div>
    </div>
  );
}

/* ======================================================
   DASHBOARD LAYOUT
====================================================== */

function DashboardLayout({
  user,
  roleLabel,
  page,
  setPage,
  onLogout,
  children,
  staffMode,
  userMode,
  isOwner,
  isManager,
}) {
  const staffItems = [
    ["admin", "🏠", "Admin Panel"],
    ["stats", "📊", "Statistik"],
    ["status", "🟢", "Status"],
    ["bot", "🤖", "Bot"],
    ["cogs", "🧩", "Cogs"],
    ["servers", "🖥️", "Servere"],
    ["tickets", "🎫", "Tickets"],
    ["roadmap", "🗺️", "Roadmap"],
    ["logs", "📜", "Logs"],
  ];

  if (isOwner || isManager) {
    staffItems.push([
      "system",
      "⚙️",
      "System",
    ]);
  }

  staffItems.push([
    "account",
    "👤",
    "Konto",
  ]);

  const userItems = [
    ["dashboard", "🏠", "Dashboard"],
    ["stats", "📊", "Statistik"],
    ["status", "🟢", "Status"],
    ["roadmap", "🗺️", "Roadmap"],
    ["support", "🛟", "Support"],
    ["account", "👤", "Konto"],
  ];

  const items = staffMode
    ? staffItems
    : userItems;

  const currentTitle =
    items.find(
      ([key]) => key === page
    )?.[2] || "Dashboard";

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon">
            H
          </div>

          <div>
            <h2>Hjælper</h2>
            <span>
              {staffMode
                ? "Admin Dashboard"
                : "Bruger Dashboard"}
            </span>
          </div>
        </div>

        <nav>
          {items.map(
            ([key, icon, label]) => (
              <button
                key={key}
                className={
                  `nav-item ${
                    page === key
                      ? "active"
                      : ""
                  }`
                }
                onClick={() => {
                  setPage(key);
                }}
              >
                <span>{icon}</span>
                <span>{label}</span>
              </button>
            )
          )}
        </nav>

        <div className="sidebar-bottom">
          <div className="user-mini">
            <UserAvatar user={user} />

            <div className="user-info">
              <strong>
                {user?.username ||
                  user?.global_name ||
                  "Bruger"}
              </strong>

              <span>
                {roleLabel}
              </span>
            </div>
          </div>

          <button
            className="logout-button"
            onClick={onLogout}
          >
            ↪ Log ud
          </button>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <h1>{currentTitle}</h1>
            <span>
              Hjælper Dashboard
            </span>
          </div>

          <div className="topbar-user">
            {roleLabel}
          </div>
        </header>

        <div className="content">
          {children}
        </div>
      </main>
    </div>
  );
}

/* ======================================================
   USER DASHBOARD
====================================================== */

function UserDashboard({
  user,
  tickets,
  onSupport,
}) {
  const openTickets = tickets.filter(
    (ticket) =>
      ticket.status !== "closed"
  ).length;

  return (
    <div>
      <div className="page-heading">
        <div className="eyebrow">
          DASHBOARD
        </div>

        <h2>
          Hej{" "}
          {user?.username ||
            user?.global_name ||
            "Bruger"} 👋
        </h2>

        <p>
          Velkommen tilbage til Hjælper.
        </p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <span>🎫 Mine tickets</span>
          <strong>
            {tickets.length}
          </strong>
        </div>

        <div className="stat-card">
          <span>🟢 Åbne tickets</span>
          <strong>
            {openTickets}
          </strong>
        </div>

        <div className="stat-card">
          <span>🔐 Login</span>
          <strong>
            Discord
          </strong>
        </div>
      </div>

      <div
        className="public-info-box"
        style={{
          marginTop: "20px",
        }}
      >
        <h3>
          Har du brug for hjælp?
        </h3>

        <p>
          Opret en support-ticket, hvis du
          har brug for hjælp med Hjælper.
        </p>

        <button
          className="primary-button"
          style={{
            marginTop: "15px",
          }}
          onClick={onSupport}
        >
          🛟 Åbn Support
        </button>
      </div>
    </div>
  );
}

/* ======================================================
   DASHBOARD PUBLIC STATS
====================================================== */

function DashboardPublicStats({
  stats,
}) {
  return (
    <div>
      <div className="page-heading">
        <div className="eyebrow">
          STATISTIK
        </div>

        <h2>Statistik</h2>

        <p>
          Offentlig statistik for Hjælper.
        </p>
      </div>

      <PublicStats
        stats={stats}
      />
    </div>
  );
}

/* ======================================================
   DASHBOARD STATUS
====================================================== */

function DashboardPublicStatus({
  status,
}) {
  return (
    <div>
      <div className="page-heading">
        <div className="eyebrow">
          STATUS
        </div>

        <h2>Status</h2>

        <p>
          Aktuel status for Hjælper.
        </p>
      </div>

      <PublicStatus
        status={status}
      />
    </div>
  );
}

/* ======================================================
   ADMIN PANEL
====================================================== */

function AdminPanel({
  user,
  stats,
  servers,
  cogs,
  tickets,
  onStats,
  onServers,
  onCogs,
  onTickets,
  onPage,
}) {
  const openTickets = tickets.filter(
    (ticket) =>
      ticket.status !== "closed"
  ).length;

  return (
    <div>
      <div className="page-heading">
        <div className="eyebrow">
          ADMIN PANEL
        </div>

        <h2>
          Velkommen,{" "}
          {user?.username ||
            "Admin"} 👋
        </h2>

        <p>
          Administrer Hjælper fra dette panel.
        </p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <span>🖥️ Servere</span>
          <strong>
            {servers.length}
          </strong>
        </div>

        <div className="stat-card">
          <span>🧩 Cogs</span>
          <strong>
            {cogs.length}
          </strong>
        </div>

        <div className="stat-card">
          <span>🎫 Åbne tickets</span>
          <strong>
            {openTickets}
          </strong>
        </div>

        <div className="stat-card">
          <span>📊 Bot status</span>
          <strong>
            {stats?.bot_online === false
              ? "Offline"
              : "Online"}
          </strong>
        </div>
      </div>

      <div
        className="public-info-box"
        style={{
          marginTop: "20px",
        }}
      >
        <h3>
          Hurtige handlinger
        </h3>

        <p>
          Gå direkte til de vigtigste dele
          af admin-panelet.
        </p>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "10px",
            marginTop: "16px",
          }}
        >
          <button
            className="primary-button"
            onClick={() => {
              onStats();
              onPage("stats");
            }}
          >
            📊 Statistik
          </button>

          <button
            className="secondary-button"
            onClick={() => {
              onServers();
              onPage("servers");
            }}
          >
            🖥️ Servere
          </button>

          <button
            className="secondary-button"
            onClick={() => {
              onCogs();
              onPage("cogs");
            }}
          >
            🧩 Cogs
          </button>

          <button
            className="secondary-button"
            onClick={() => {
              onTickets();
              onPage("tickets");
            }}
          >
            🎫 Tickets
          </button>
        </div>
      </div>
    </div>
  );
}

/* ======================================================
   STAFF STATS
====================================================== */

function StaffStats({
  stats,
  publicStats,
}) {
  const data = stats || {};
  const publicData = publicStats || {};

  const values = [
    [
      "🤖 Bot status",
      data.bot_online === false
        ? "Offline"
        : "Online",
    ],
    [
      "🖥️ Servere",
      data.servers ??
      data.server_count ??
      publicData.servers ??
      0,
    ],
    [
      "👥 Brugere",
      data.users ??
      data.user_count ??
      publicData.users ??
      0,
    ],
    [
      "💬 Commands",
      data.commands ??
      data.command_count ??
      publicData.commands ??
      0,
    ],
    [
      "🧩 Cogs",
      data.cogs ??
      data.cog_count ??
      0,
    ],
    [
      "⏱️ Uptime",
      data.uptime ??
      "—",
    ],
  ];

  return (
    <div>
      <div className="page-heading">
        <div className="eyebrow">
          STATISTIK
        </div>

        <h2>Bot statistik</h2>

        <p>
          Statistik og information om Hjælper.
        </p>
      </div>

      <div className="stats-grid">
        {values.map(
          ([label, value]) => (
            <div
              className="stat-card"
              key={label}
            >
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          )
        )}
      </div>
    </div>
  );
}

/* ======================================================
   BOT
====================================================== */

function BotPage({
  stats,
  publicStats,
}) {
  const online =
    stats?.bot_online !== false;

  return (
    <div>
      <div className="page-heading">
        <div className="eyebrow">
          BOT
        </div>

        <h2>Hjælper bot</h2>

        <p>
          Information om den aktive Discord-bot.
        </p>
      </div>

      <div className="info-card">
        <div>
          <span>Status</span>
          <strong>
            {online
              ? "🟢 Online"
              : "🔴 Offline"}
          </strong>
        </div>

        <div>
          <span>Navn</span>
          <strong>
            {stats?.bot_name ||
              "Hjælper"}
          </strong>
        </div>

        <div>
          <span>Servers</span>
          <strong>
            {stats?.servers ??
              publicStats?.servers ??
              0}
          </strong>
        </div>

        <div>
          <span>Activity</span>
          <strong>
            Playing Hjælper servere
          </strong>
        </div>
      </div>
    </div>
  );
}

/* ======================================================
   COGS
====================================================== */

function CogsPage({
  cogs,
  onReload,
}) {
  return (
    <div>
      <div className="page-heading">
        <div className="eyebrow">
          COGS
        </div>

        <h2>Bot Cogs</h2>

        <p>
          Se alle loaded bot-moduler.
        </p>
      </div>

      <div
        style={{
          marginBottom: "15px",
        }}
      >
        <button
          className="primary-button"
          onClick={onReload}
        >
          🔄 Genindlæs Cogs
        </button>
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
                : cog?.name ||
                  cog?.cog ||
                  `Cog ${index + 1}`;

            const status =
              typeof cog === "object"
                ? cog?.status ||
                  "Loaded"
                : "Loaded";

            return (
              <div
                className="list-row"
                key={`${name}-${index}`}
              >
                <span>🧩</span>

                <strong>{name}</strong>

                <span>
                  {status}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

/* ======================================================
   SERVERS
====================================================== */

function ServersPage({
  servers,
  onSelect,
}) {
  return (
    <div>
      <div className="page-heading">
        <div className="eyebrow">
          SERVER MANAGEMENT
        </div>

        <h2>Servere</h2>

        <p>
          Servere hvor Hjælper er tilføjet.
        </p>
      </div>

      <div className="list-card">
        {servers.length === 0 ? (
          <div className="empty">
            Ingen servere fundet.
          </div>
        ) : (
          servers.map(
            (server, index) => {
              const guildId =
                server.id ||
                server.guild_id;

              const name =
                server.name ||
                server.guild_name ||
                "Ukendt server";

              const members =
                server.members ??
                server.member_count ??
                0;

              const icon =
                server.icon ||
                server.icon_url;

              return (
                <button
                  className="server-row"
                  key={
                    guildId ||
                    `${name}-${index}`
                  }
                  onClick={() =>
                    onSelect(server)
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
                      {name}
                    </strong>

                    <small>
                      {guildId ||
                        "Ukendt ID"}
                    </small>
                  </div>

                  <div className="server-members">
                    👥 {members}
                  </div>

                  <div className="server-arrow">
                    →
                  </div>
                </button>
              );
            }
          )
        )}
      </div>
    </div>
  );
}

/* ======================================================
   SERVER DETAILS
====================================================== */

function ServerDetails({
  server,
  onBack,
  onLeave,
}) {
  const name =
    server?.name ||
    server?.guild_name ||
    "Ukendt server";

  const id =
    server?.id ||
    server?.guild_id ||
    "Ukendt";

  const members =
    server?.members ??
    server?.member_count ??
    0;

  const owner =
    server?.owner ||
    server?.owner_name ||
    "Ukendt";

  const icon =
    server?.icon ||
    server?.icon_url;

  return (
    <div className="server-details-page">
      <button
        className="back-button"
        onClick={onBack}
      >
        ← Alle servere
      </button>

      <div className="server-hero">
        <div className="server-hero-icon">
          {icon ? (
            <img
              src={icon}
              alt=""
            />
          ) : (
            "🖥️"
          )}
        </div>

        <div className="server-hero-info">
          <div className="eyebrow">
            DISCORD SERVER
          </div>

          <h2>{name}</h2>

          <p>
            Server ID: {id}
          </p>
        </div>
      </div>

      <div className="server-detail-grid">
        <div className="server-detail-card">
          <span>👥 Medlemmer</span>
          <strong>{members}</strong>
        </div>

        <div className="server-detail-card">
          <span>👑 Ejer</span>
          <strong>{owner}</strong>
        </div>

        <div className="server-detail-card">
          <span>🆔 Server ID</span>
          <strong className="server-id">
            {id}
          </strong>
        </div>
      </div>

      <div className="server-danger-card">
        <div>
          <div className="eyebrow">
            DANGER ZONE
          </div>

          <h3>
            Forlad server
          </h3>

          <p>
            Dette får Hjælper til at forlade
            serveren. Handlingen kan ikke
            fortrydes fra dashboardet.
          </p>
        </div>

        <button
          className="danger-button"
          onClick={() =>
            onLeave(id)
          }
        >
          Forlad server
        </button>
      </div>
    </div>
  );
}

/* ======================================================
   SUPPORT / TICKETS
====================================================== */

function SupportPage({
  tickets,
  selectedTicket,
  onOpenTicket,
  onCreateTicket,
  ticketSubject,
  setTicketSubject,
  ticketMessage,
  setTicketMessage,
  replyMessage,
  setReplyMessage,
  onReply,
  onClose,
  onBack,
  staff,
}) {
  if (selectedTicket) {
    return (
      <TicketDetails
        ticket={selectedTicket}
        staff={staff}
        replyMessage={replyMessage}
        setReplyMessage={setReplyMessage}
        onReply={onReply}
        onClose={onClose}
        onBack={onBack}
      />
    );
  }

  return (
    <div>
      <div className="page-heading">
        <div className="eyebrow">
          {staff
            ? "TICKETS"
            : "SUPPORT"}
        </div>

        <h2>
          {staff
            ? "Alle tickets"
            : "Support"}
        </h2>

        <p>
          {staff
            ? "Se og håndter alle supporttickets."
            : "Opret og administrer dine supporttickets."}
        </p>
      </div>

      <div
        className={
          staff
            ? "support-grid"
            : "support-grid"
        }
      >
        {!staff &&
          onCreateTicket && (
            <form
              className="account-card"
              onSubmit={onCreateTicket}
            >
              <div className="account-card-title">
                <div>
                  <div className="eyebrow">
                    NY TICKET
                  </div>

                  <h3>
                    Opret ticket
                  </h3>
                </div>
              </div>

              <label>
                Emne
              </label>

              <input
                value={ticketSubject}
                onChange={(event) =>
                  setTicketSubject(
                    event.target.value
                  )
                }
                placeholder="Hvad har du brug for hjælp til?"
                maxLength={100}
              />

              <label>
                Besked
              </label>

              <textarea
                value={ticketMessage}
                onChange={(event) =>
                  setTicketMessage(
                    event.target.value
                  )
                }
                placeholder="Beskriv dit problem..."
                maxLength={3000}
              />

              <div className="character-count">
                {ticketMessage.length}/3000
              </div>

              <button
                className="primary-button"
                type="submit"
              >
                🎫 Opret ticket
              </button>
            </form>
          )}

        <div className="account-card">
          <div className="account-card-title">
            <div>
              <div className="eyebrow">
                {staff
                  ? "SUPPORT"
                  : "MINE TICKETS"}
              </div>

              <h3>
                {staff
                  ? "Tickets"
                  : "Mine tickets"}
              </h3>
            </div>
          </div>

          <div className="support-ticket-list">
            {tickets.length === 0 ? (
              <div className="empty">
                {staff
                  ? "Der er ingen tickets."
                  : "Du har ingen tickets endnu."}
              </div>
            ) : (
              tickets.map(
                (ticket) => (
                  <button
                    key={ticket.id}
                    className="ticket-card"
                    onClick={() =>
                      onOpenTicket(ticket)
                    }
                    style={{
                      width: "100%",
                      border: "1px solid rgba(255,255,255,0.06)",
                      color: "inherit",
                      textAlign: "left",
                      cursor: "pointer",
                    }}
                  >
                    <div className="ticket-top">
                      <strong>
                        #{ticket.id}
                      </strong>

                      <span
                        className={
                          ticket.status ===
                          "closed"
                            ? "ticket-closed"
                            : "ticket-open"
                        }
                      >
                        {ticket.status ===
                        "closed"
                          ? "Lukket"
                          : ticket.status ===
                            "answered"
                            ? "Besvaret"
                            : "Åben"}
                      </span>
                    </div>

                    <h4>
                      {ticket.subject}
                    </h4>

                    <p>
                      {ticket.message}
                    </p>

                    {staff && (
                      <small>
                        👤{" "}
                        {ticket.username ||
                          ticket.user_id}
                      </small>
                    )}

                    <br />

                    <small>
                      {ticket.created_at ||
                        ""}
                    </small>
                  </button>
                )
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ======================================================
   TICKET DETAILS
====================================================== */

function TicketDetails({
  ticket,
  staff,
  replyMessage,
  setReplyMessage,
  onReply,
  onClose,
  onBack,
}) {
  const replies =
    Array.isArray(ticket?.replies)
      ? ticket.replies
      : [];

  return (
    <div>
      <button
        className="back-button"
        onClick={onBack}
        style={{
          marginBottom: "20px",
        }}
      >
        ←{" "}
        {staff
          ? "Alle tickets"
          : "Mine tickets"}
      </button>

      <div className="page-heading">
        <div className="eyebrow">
          TICKET #{ticket?.id}
        </div>

        <h2>
          {ticket?.subject ||
            "Support ticket"}
        </h2>

        <p>
          {ticket?.username
            ? `Oprettet af ${ticket.username}`
            : "Support samtale"}
        </p>
      </div>

      <div className="account-card">
        <div className="ticket-card">
          <div className="ticket-top">
            <strong>
              👤{" "}
              {ticket?.username ||
                ticket?.user_id ||
                "Bruger"}
            </strong>

            <span
              className={
                ticket?.status ===
                "closed"
                  ? "ticket-closed"
                  : "ticket-open"
              }
            >
              {ticket?.status ===
              "closed"
                ? "Lukket"
                : ticket?.status ===
                  "answered"
                  ? "Besvaret"
                  : "Åben"}
            </span>
          </div>

          <h4>
            {ticket?.subject}
          </h4>

          <p>
            {ticket?.message}
          </p>

          <small>
            {ticket?.created_at || ""}
          </small>
        </div>

        {replies.length > 0 && (
          <div
            style={{
              marginTop: "15px",
              display: "grid",
              gap: "10px",
            }}
          >
            {replies.map(
              (reply) => (
                <div
                  className="ticket-card"
                  key={reply.id}
                >
                  <div className="ticket-top">
                    <strong>
                      {reply.username ||
                        "Bruger"}
                    </strong>

                    <span>
                      {reply.role_name ||
                        reply.role ||
                        ""}
                    </span>
                  </div>

                  <p>
                    {reply.message}
                  </p>

                  <small>
                    {reply.created_at ||
                      ""}
                  </small>
                </div>
              )
            )}
          </div>
        )}

        {ticket?.status !== "closed" && (
          <>
            <div
              className="account-subtitle"
            >
              Svar på ticket
            </div>

            <textarea
              value={replyMessage}
              onChange={(event) =>
                setReplyMessage(
                  event.target.value
                )
              }
              placeholder="Skriv dit svar..."
              style={{
                width: "100%",
                minHeight: "120px",
                padding: "13px",
                borderRadius: "10px",
                border:
                  "1px solid rgba(255,255,255,0.08)",
                background: "#0d121c",
                color: "white",
                resize: "vertical",
              }}
            />

            <div
              style={{
                display: "flex",
                gap: "10px",
                marginTop: "12px",
              }}
            >
              <button
                className="primary-button"
                onClick={() =>
                  onReply(ticket.id)
                }
              >
                💬 Send svar
              </button>

              <button
                className="secondary-button"
                onClick={() =>
                  onClose(ticket.id)
                }
              >
                🔒 Luk ticket
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ======================================================
   ROADMAP
====================================================== */

function Roadmap() {
  const items = [
    {
      version: "V2.0",
      title: "Dashboard",
      status: "I gang",
      active: true,
      tasks: [
        "Discord OAuth login",
        "Admin dashboard",
        "Bruger dashboard",
        "Statistik",
        "Status",
      ],
    },
    {
      version: "V2.1",
      title: "Support",
      status: "I gang",
      active: true,
      tasks: [
        "Support tickets",
        "Ticket svar",
        "Admin ticket management",
        "Ticket historik",
      ],
    },
    {
      version: "V2.2",
      title: "Bot Management",
      status: "Planlagt",
      active: false,
      tasks: [
        "Cogs management",
        "Server management",
        "Flere bot-statistikker",
        "Systemværktøjer",
      ],
    },
    {
      version: "V3.0",
      title: "Mere",
      status: "Planlagt",
      active: false,
      tasks: [
        "Flere dashboard features",
        "Flere integrationer",
        "Optimeringer",
        "Nye Hjælper features",
      ],
    },
  ];

  return (
    <div className="roadmap">
      <div className="public-title">
        <div className="eyebrow">
          ROADMAP
        </div>

        <h2>
          Hvad kommer der?
        </h2>

        <p>
          Planen for udviklingen af Hjælper.
        </p>
      </div>

      {items.map(
        (item) => (
          <div
            className={
              `roadmap-card ${
                item.active
                  ? "active"
                  : ""
              }`
            }
            key={item.version}
          >
            <div className="roadmap-header">
              <div>
                <div className="roadmap-version">
                  {item.version}
                </div>

                <h2>
                  {item.title}
                </h2>
              </div>

              <div
                className={
                  `roadmap-status ${
                    item.active
                      ? "active"
                      : ""
                  }`
                }
              >
                {item.status}
              </div>
            </div>

            <div className="roadmap-items">
              {item.tasks.map(
                (task) => (
                  <div key={task}>
                    {item.active
                      ? "✓"
                      : "○"}{" "}
                    {task}
                  </div>
                )
              )}
            </div>
          </div>
        )
      )}

      <div className="roadmap-note">
        Roadmapen kan ændre sig under udviklingen.
      </div>
    </div>
  );
}

/* ======================================================
   LOGS
====================================================== */

function LogsPage() {
  return (
    <div>
      <div className="page-heading">
        <div className="eyebrow">
          LOGS
        </div>

        <h2>System logs</h2>

        <p>
          Seneste dashboard-information.
        </p>
      </div>

      <div className="list-card">
        <div className="list-row">
          <span>🔐</span>

          <strong>
            Discord OAuth er aktiv
          </strong>

          <span>
            Login
          </span>
        </div>

        <div className="list-row">
          <span>🌐</span>

          <strong>
            Dashboard API er online
          </strong>

          <span>
            API
          </span>
        </div>

        <div className="list-row">
          <span>🤖</span>

          <strong>
            Hjælper bot system aktivt
          </strong>

          <span>
            Bot
          </span>
        </div>
      </div>
    </div>
  );
}

/* ======================================================
   SYSTEM
====================================================== */

function SystemPage({
  user,
  security,
}) {
  return (
    <div>
      <div className="page-heading">
        <div className="eyebrow">
          SYSTEM
        </div>

        <h2>System</h2>

        <p>
          Information om dashboard-systemet.
        </p>
      </div>

      <div className="info-card">
        <div>
          <span>Dashboard</span>
          <strong>
            Hjælper V2
          </strong>
        </div>

        <div>
          <span>API</span>
          <strong>
            Online
          </strong>
        </div>

        <div>
          <span>Din rolle</span>
          <strong>
            {user?.role_name ||
              (user?.role === "owner"
                ? "Ejer"
                : user?.role === "manager"
                  ? "Manager"
                  : "Admin")}
          </strong>
        </div>

        <div>
          <span>Sessions</span>
          <strong>
            {security?.active_sessions ??
              "—"}
          </strong>
        </div>
      </div>
    </div>
  );
}

/* ======================================================
   ACCOUNT
====================================================== */

function AccountPage({
  user,
  account,
  security,
  sessions,
  loginHistory,
  connected,
  profileUsername,
  setProfileUsername,
  onSaveProfile,
  onLogoutAll,
  onDeleteSession,
  onDeleteAccount,
}) {
  const avatar =
    user?.avatar_url ||
    user?.avatar ||
    account?.avatar_url ||
    account?.avatar;

  const username =
    user?.username ||
    user?.global_name ||
    account?.username ||
    "Bruger";

  const userId =
    user?.id ||
    account?.id ||
    account?.user_id ||
    "Ukendt";

  return (
    <div>
      <div className="page-heading">
        <div className="eyebrow">
          KONTO
        </div>

        <h2>Din konto</h2>

        <p>
          Administrer din profil og sikkerhed.
        </p>
      </div>

      <div className="account-grid">
        <div className="account-profile-card">
          <div className="large-avatar">
            {avatar ? (
              <img
                src={avatar}
                alt=""
              />
            ) : (
              "👤"
            )}
          </div>

          <div className="account-profile-info">
            <div className="eyebrow">
              DISCORD
            </div>

            <h3>{username}</h3>

            <p>
              {user?.role === "owner"
                ? "👑 Ejer"
                : user?.role === "manager"
                  ? "💼 Manager"
                  : user?.role === "admin"
                    ? "🛡️ Admin"
                    : "👤 Bruger"}
            </p>

            <small>
              ID: {userId}
            </small>
          </div>
        </div>

        <form
          className="account-card"
          onSubmit={onSaveProfile}
        >
          <div className="account-card-title">
            <div>
              <div className="eyebrow">
                PROFIL
              </div>

              <h3>
                Profiloplysninger
              </h3>
            </div>
          </div>

          <label>
            Brugernavn
          </label>

          <input
            value={profileUsername}
            onChange={(event) =>
              setProfileUsername(
                event.target.value
              )
            }
            maxLength={100}
          />

          <button
            className="primary-button"
            type="submit"
          >
            Gem ændringer
          </button>
        </form>
      </div>

      <div className="account-card">
        <div className="account-card-title">
          <div>
            <div className="eyebrow">
              CONNECTED ACCOUNTS
            </div>

            <h3>
              Forbundne konti
            </h3>
          </div>
        </div>

        <div className="connected-account">
          <div className="connected-icon">
            💜
          </div>

          <div className="connected-main">
            <strong>
              Discord
            </strong>

            <span>
              {username}
            </span>
          </div>

          <div className="connected-status">
            Forbundet
          </div>
        </div>

        {connected &&
          Array.isArray(
            connected.accounts
          ) &&
          connected.accounts.map(
            (item, index) => (
              <div
                className="connected-account"
                key={index}
                style={{
                  marginTop: "8px",
                }}
              >
                <div className="connected-icon">
                  🔗
                </div>

                <div className="connected-main">
                  <strong>
                    {item.name ||
                      item.provider ||
                      "Account"}
                  </strong>

                  <span>
                    {item.username ||
                      item.email ||
                      ""}
                  </span>
                </div>

                <div className="connected-status">
                  Forbundet
                </div>
              </div>
            )
          )}
      </div>

      <div className="account-card">
        <div className="account-card-title">
          <div>
            <div className="eyebrow">
              SECURITY
            </div>

            <h3>
              Sikkerhed
            </h3>
          </div>
        </div>

        <div className="info-card">
          <div>
            <span>
              Aktive sessions
            </span>

            <strong>
              {security?.active_sessions ??
                sessions.length}
            </strong>
          </div>

          <div>
            <span>
              Sidste login
            </span>

            <strong>
              {security?.last_login ||
                "—"}
            </strong>
          </div>
        </div>

        <button
          className="secondary-button"
          style={{
            marginTop: "15px",
          }}
          onClick={onLogoutAll}
        >
          🔒 Log ud af andre sessions
        </button>
      </div>

      <div className="account-card">
        <div className="account-card-title">
          <div>
            <div className="eyebrow">
              SESSIONS
            </div>

            <h3>
              Aktive sessions
            </h3>
          </div>
        </div>

        <div className="session-list">
          {sessions.length === 0 ? (
            <div className="empty">
              Ingen sessions fundet.
            </div>
          ) : (
            sessions.map(
              (session, index) => (
                <div
                  className="session-row"
                  key={
                    session.id ||
                    session.session_id ||
                    index
                  }
                >
                  <div className="session-icon">
                    💻
                  </div>

                  <div className="session-main">
                    <strong>
                      {session.device ||
                        session.browser ||
                        "Browser"}
                    </strong>

                    <span>
                      {session.ip ||
                        "IP skjult"}
                    </span>

                    <small>
                      {session.created_at ||
                        session.last_active ||
                        ""}
                    </small>
                  </div>

                  {session.current ? (
                    <span className="session-current">
                      Denne session
                    </span>
                  ) : (
                    <button
                      className="secondary-button small-button"
                      onClick={() =>
                        onDeleteSession(
                          session.id ||
                          session.session_id
                        )
                      }
                    >
                      Fjern
                    </button>
                  )}
                </div>
              )
            )
          )}
        </div>
      </div>

      <div className="account-card">
        <div className="account-card-title">
          <div>
            <div className="eyebrow">
              LOGIN HISTORY
            </div>

            <h3>
              Login historik
            </h3>
          </div>
        </div>

        <div className="login-history">
          {loginHistory.length === 0 ? (
            <div className="empty">
              Ingen loginhistorik fundet.
            </div>
          ) : (
            loginHistory.map(
              (item, index) => (
                <div
                  className="history-row"
                  key={
                    item.id ||
                    index
                  }
                >
                  <div>
                    <strong>
                      {item.provider ||
                        "Discord"}
                    </strong>

                    <span>
                      {item.created_at ||
                        item.timestamp ||
                        ""}
                    </span>
                  </div>

                  <span className="history-success">
                    {item.success === false
                      ? "Fejlet"
                      : "Succes"}
                  </span>
                </div>
              )
            )
          )}
        </div>
      </div>

      <div className="danger-account-card">
        <div>
          <div className="eyebrow">
            DANGER ZONE
          </div>

          <h3>
            Slet konto
          </h3>

          <p>
            Dette sletter din dashboard-konto
            permanent.
          </p>
        </div>

        <button
          className="danger-button"
          onClick={onDeleteAccount}
        >
          Slet konto
        </button>
      </div>
    </div>
  );
}

/* ======================================================
   USER AVATAR
====================================================== */

function UserAvatar({
  user,
}) {
  const avatar =
    user?.avatar_url ||
    user?.avatar;

  return (
    <div className="user-avatar">
      {avatar ? (
        <img
          src={avatar}
          alt=""
        />
      ) : (
        "👤"
      )}
    </div>
  );
}
