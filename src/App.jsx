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

  const isOwner = user?.role === "owner" || user?.is_owner === true;
  const isManager = user?.role === "manager";
  const isAdmin = user?.role === "admin";

  const isStaff = isOwner || isManager || isAdmin;

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
        data?.detail || data?.message || `HTTP ${response.status}`
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
    await Promise.all([loadStats(), loadCogs(), loadServers(), loadTickets()]);
  }

  async function loadUserData() {
    await Promise.all([loadAccount(), loadTickets()]);
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
      setCogs(Array.isArray(data) ? data : data?.cogs || []);
    } catch (err) {
      setError(err.message);
    }
  }

  async function loadServers() {
    try {
      const data = await apiFetch("/api/servers");
      setServers(Array.isArray(data) ? data : data?.servers || []);
    } catch (err) {
      setError(err.message);
    }
  }

  async function loadTickets() {
    try {
      const endpoint = isStaff
        ? "/api/support/admin/tickets"
        : "/api/support/tickets";

      const data = await apiFetch(endpoint);
      setTickets(Array.isArray(data) ? data : data?.tickets || []);
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
      setSessions(Array.isArray(sessionsData) ? sessionsData : sessionsData?.sessions || []);
      setLoginHistory(Array.isArray(historyData) ? historyData : historyData?.history || []);
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
    window.location.href = `${API}/auth/discord?login_type=admin`;
  }

  function userLogin() {
    window.location.href = `${API}/auth/discord?login_type=user`;
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
        : `/api/support/tickets/${ticketId}/reply`;

      await apiFetch(endpoint, {
        method: "POST",
        body: JSON.stringify({
          message: replyMessage.trim(),
        }),
      });

      setReplyMessage("");
      await loadTickets();

      // Hent opdateret ticket-detalje så visningen opdateres med det nye svar
      const singleEndpoint = isStaff
        ? `/api/support/admin/tickets/${ticketId}`
        : `/api/support/tickets/${ticketId}`;

      try {
        const updatedTicket = await apiFetch(singleEndpoint);
        setSelectedTicket(updatedTicket);
      } catch {
        // Fallback hvis enkelt-endpoint ikke findes, filtrer fra listen i stedet
        const listEndpoint = isStaff
          ? "/api/support/admin/tickets"
          : "/api/support/tickets";
        const data = await apiFetch(listEndpoint);
        const list = Array.isArray(data) ? data : data?.tickets || [];
        setSelectedTicket(
          list.find((t) => String(t.id) === String(ticketId)) || null
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

      const endpoint = isStaff
        ? `/api/support/admin/tickets/${ticket.id}`
        : `/api/support/tickets/${ticket.id}`;

      try {
        const data = await apiFetch(endpoint);
        setSelectedTicket(data);
      } catch {
        // Hvis enkelt-hentning fejler, brug elementet fra den eksisterende liste
        setSelectedTicket(ticket);
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
      await apiFetch("/api/account/security/logout-all", {
        method: "POST",
      });
      setSuccess("Alle andre aktive sessioner er blevet logget ud.");
      await loadAccount();
    } catch (err) {
      setError(err.message);
    }
  }

  async function deleteSession(sessionId) {
    try {
      await apiFetch(`/api/account/sessions/${sessionId}`, {
        method: "DELETE",
      });
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
      await apiFetch(`/api/servers/${guildId}/leave`, {
        method: "POST",
      });

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

  if (!user) {
    if (page === "stats") {
      return (
        <PublicLayout title="Statistik" onBack={() => setPage("login")}>
          <PublicStats stats={publicStats} lastUpdated={lastUpdated} />
        </PublicLayout>
      );
    }

    if (page === "status") {
      return (
        <PublicLayout title="Status" onBack={() => setPage("login")}>
          <PublicStatus status={publicStatus} />
        </PublicLayout>
      );
    }

    if (page === "roadmap") {
      return (
        <PublicLayout title="Roadmap" onBack={() => setPage("login")}>
          <Roadmap />
        </PublicLayout>
      );
    }

    return (
      <PublicLanding
        onStats={() => setPage("stats")}
        onStatus={() => setPage("status")}
        onRoadmap={() => setPage("roadmap")}
        onAdminLogin={adminLogin}
        onUserLogin={userLogin}
      />
    );
  }

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

        {page === "stats" && <DashboardPublicStats stats={publicStats} />}
        {page === "status" && <DashboardPublicStatus status={publicStatus} />}
        {page === "roadmap" && <Roadmap />}

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

        {error && <div className="error-box">{error}</div>}
        {success && <div className="success-box">{success}</div>}
      </DashboardLayout>
    );
  }

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

      {page === "stats" && <StaffStats stats={stats} publicStats={publicStats} />}
      {page === "status" && <DashboardPublicStatus status={publicStatus} />}
      {page === "bot" && <BotPage stats={stats} />}
      {page === "cogs" && <CogsPage cogs={cogs} onReload={reloadCogs} />}

      {page === "servers" && !selectedServer && (
        <ServersPage servers={servers} onSelect={setSelectedServer} />
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

      {page === "roadmap" && <Roadmap />}
      {page === "logs" && <LogsPage />}
      {page === "system" && <SystemPage user={user} security={security} />}

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

      {error && <div className="error-box">{error}</div>}
      {success && <div className="success-box">{success}</div>}
    </DashboardLayout>
  );
}

/* ======================================================
   PUBLIC LANDING & LAYOUT COMPONENTS
====================================================== */

function PublicLanding({ onStats, onStatus, onRoadmap, onAdminLogin, onUserLogin }) {
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
          <div className="eyebrow">HJÆLPER V2</div>
          <h2>Velkommen til Hjælper</h2>
          <p>Administrer botten, se statistik og få support fra ét samlet dashboard.</p>
        </div>

        <div className="stats-grid">
          <button className="stat-card" onClick={onStats} style={{ border: "1px solid rgba(255,255,255,0.07)", color: "inherit", textAlign: "left", cursor: "pointer" }}>
            <span>📊 Statistik</span>
            <strong>Se statistik</strong>
          </button>

          <button className="stat-card" onClick={onStatus} style={{ border: "1px solid rgba(255,255,255,0.07)", color: "inherit", textAlign: "left", cursor: "pointer" }}>
            <span>🟢 Status</span>
            <strong>System status</strong>
          </button>

          <button className="stat-card" onClick={onRoadmap} style={{ border: "1px solid rgba(255,255,255,0.07)", color: "inherit", textAlign: "left", cursor: "pointer" }}>
            <span>🗺️️ Roadmap</span>
            <strong>Se roadmap</strong>
          </button>
        </div>

        <div className="public-info-box" style={{ marginTop: "25px" }}>
          <div className="eyebrow">LOGIN</div>
          <h3>Log ind med Discord</h3>
          <p>Vælg den login-type, du skal bruge. Staff får adgang til Admin Panel, mens almindelige brugere får adgang til deres bruger-dashboard.</p>

          <button className="login" style={{ marginTop: "20px", minHeight: "60px" }} onClick={onAdminLogin}>
            <span><span className="discord-icon">🛡️</span><strong>Admin Login med Discord</strong></span>
            <span>→</span>
          </button>

          <button className="login secondary-login" style={{ minHeight: "60px" }} onClick={onUserLogin}>
            <span><span className="discord-icon">👤</span><strong>Bruger Login med Discord</strong></span>
            <span>→</span>
          </button>
        </div>

        <div className="login-footer">Hjælper · 2026</div>
      </main>
    </div>
  );
}

function PublicLayout({ title, onBack, children }) {
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

        <button className="back-button" onClick={onBack}>
          ← Tilbage
        </button>
      </div>

      {children}
    </div>
  );
}

function PublicStats({ stats, lastUpdated }) {
  const data = stats || {};

  const values = [
    ["🤖 Bot status", data.bot_online === false ? "Offline" : "Online"],
    ["🖥️ Servere", data.servers ?? data.server_count ?? data.guilds ?? 0],
    ["👥 Brugere", data.users ?? data.user_count ?? data.total_users ?? 0],
    ["💬 Commands", data.commands ?? data.command_count ?? 0],
  ];

  return (
    <div className="public-content">
      <div className="public-title">
        <div className="eyebrow">STATISTIK</div>
        <h2>Hjælper statistik</h2>
        <p>Aktuel offentlig statistik for Hjælper.</p>
      </div>

      <div className="stats-grid">
        {values.map(([label, value]) => (
          <div className="stat-card" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>

      <div className="last-updated">
        Sidst opdateret {lastUpdated ? lastUpdated.toLocaleTimeString("da-DK") : "—"}
      </div>
    </div>
  );
}

function PublicStatus({ status }) {
  const online = status?.bot_online !== false && status?.online !== false;

  return (
    <div className="public-content">
      <div className="public-title">
        <div className="eyebrow">STATUS</div>
        <h2>System status</h2>
        <p>Se den aktuelle status for Hjælper.</p>
      </div>

      <div className="public-status-grid">
        <div className="public-status-card">
          <div className="status-icon">🤖</div>
          <div>
            <span>Discord bot</span>
            <strong className={online ? "status-online" : "status-offline"}>
              {online ? "Online" : "Offline"}
            </strong>
          </div>
        </div>

        <div className="public-status-card">
          <div className="status-icon">🌐</div>
          <div>
            <span>Dashboard API</span>
            <strong className="status-online">Online</strong>
          </div>
        </div>

        <div className="public-status-card">
          <div className="status-icon">🔐</div>
          <div>
            <span>Discord OAuth</span>
            <strong className="status-online">Online</strong>
          </div>
        </div>
      </div>

      <div className="public-info-box">
        <h3>{online ? "Alle systemer ser gode ud" : "Botten er offline"}</h3>
        <p>
          {online
            ? "Hjælper-dashboardet og de vigtigste services svarer normalt."
            : "Discord-botten ser ud til at være offline lige nu."}
        </p>
      </div>
    </div>
  );
}

function DashboardLayout({ user, roleLabel, page, setPage, onLogout, children, staffMode, isOwner, isManager }) {
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
    staffItems.push(["system", "⚙️", "System"]);
  }

  staffItems.push(["account", "👤", "Konto"]);

  const userItems = [
    ["dashboard", "🏠", "Dashboard"],
    ["stats", "📊", "Statistik"],
    ["status", "🟢", "Status"],
    ["roadmap", "🗺️", "Roadmap"],
    ["support", "🛟", "Support"],
    ["account", "👤", "Konto"],
  ];

  const items = staffMode ? staffItems : userItems;
  const currentTitle = items.find(([key]) => key === page)?.[2] || "Dashboard";

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon">H</div>
          <div>
            <h2>Hjælper</h2>
            <span>{staffMode ? "Admin Dashboard" : "Bruger Dashboard"}</span>
          </div>
        </div>

        <nav>
          {items.map(([key, icon, label]) => (
            <button
              key={key}
              className={`nav-item ${page === key ? "active" : ""}`}
              onClick={() => setPage(key)}
            >
              <span>{icon}</span>
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="user-mini">
            <UserAvatar user={user} />
            <div className="user-info">
              <strong>{user?.username || user?.global_name || "Bruger"}</strong>
              <span>{roleLabel}</span>
            </div>
          </div>

          <button className="logout-button" onClick={onLogout}>
            ↪ Log ud
          </button>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <h1>{currentTitle}</h1>
            <span>Hjælper Dashboard</span>
          </div>
          <div className="topbar-user">{roleLabel}</div>
        </header>

        <div className="content">{children}</div>
      </main>
    </div>
  );
}

function UserDashboard({ user, tickets, onSupport }) {
  const openTickets = tickets.filter((t) => t.status !== "closed").length;

  return (
    <div>
      <div className="page-heading">
        <div className="eyebrow">DASHBOARD</div>
        <h2>Hej {user?.username || user?.global_name || "Bruger"} 👋</h2>
        <p>Velkommen tilbage til Hjælper.</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <span>🎫 Mine tickets</span>
          <strong>{tickets.length}</strong>
        </div>

        <div className="stat-card">
          <span>🟢 Åbne tickets</span>
          <strong>{openTickets}</strong>
        </div>

        <div className="stat-card">
          <span>🔐 Login</span>
          <strong>Discord</strong>
        </div>
      </div>

      <div className="public-info-box" style={{ marginTop: "20px" }}>
        <h3>Har du brug for hjælp?</h3>
        <p>Opret en support-ticket, hvis du har brug for hjælp med Hjælper.</p>
        <button className="primary-button" style={{ marginTop: "15px" }} onClick={onSupport}>
          🛟 Åbn Support
        </button>
      </div>
    </div>
  );
}

function DashboardPublicStats({ stats }) {
  return (
    <div>
      <div className="page-heading">
        <div className="eyebrow">STATISTIK</div>
        <h2>Statistik</h2>
        <p>Offentlig statistik for Hjælper.</p>
      </div>
      <PublicStats stats={stats} />
    </div>
  );
}

function DashboardPublicStatus({ status }) {
  return (
    <div>
      <div className="page-heading">
        <div className="eyebrow">STATUS</div>
        <h2>Systemstatus</h2>
        <p>Aktuel driftssikkerhed og status for Hjælper-tjenesterne.</p>
      </div>
      <PublicStatus status={status} />
    </div>
  );
}

function AdminPanel({ user, stats, servers, cogs, tickets, onPage }) {
  const openTickets = tickets.filter((t) => t.status !== "closed").length;

  return (
    <div>
      <div className="page-heading">
        <div className="eyebrow">ADMIN PANEL</div>
        <h2>Velkommen tilbage, {user?.username || "Admin"} 🛡️</h2>
        <p>Her er et hurtigt overblik over botten og dens systemer.</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card" onClick={() => onPage("servers")} style={{ cursor: "pointer" }}>
          <span>🖥️ Servere</span>
          <strong>{stats?.servers || servers.length || 0}</strong>
        </div>

        <div className="stat-card" onClick={() => onPage("cogs")} style={{ cursor: "pointer" }}>
          <span>🧩 Aktive Cogs</span>
          <strong>{cogs.length}</strong>
        </div>

        <div className="stat-card" onClick={() => onPage("tickets")} style={{ cursor: "pointer" }}>
          <span>🎫 Åbne Tickets</span>
          <strong>{openTickets}</strong>
        </div>
      </div>

      <div className="public-info-box" style={{ marginTop: "25px" }}>
        <h3>Genveje</h3>
        <p>Brug menuen til venstre for at navigere til bot-indstillinger, logfiler, servere eller systemstatus.</p>
      </div>
    </div>
  );
}

function StaffStats({ stats, publicStats }) {
  const combined = { ...publicStats, ...stats };

  return (
    <div>
      <div className="page-heading">
        <div className="eyebrow">STATISTIK</div>
        <h2>Udvidet Statistik</h2>
        <p>Detaljerede nøgletal for staff-medlemmer.</p>
      </div>
      <PublicStats stats={combined} lastUpdated={new Date()} />
    </div>
  );
}

function BotPage({ stats }) {
  return (
    <div>
      <div className="page-heading">
        <div className="eyebrow">BOT</div>
        <h2>Bot-indstillinger</h2>
        <p>Information og kontrolpanel for Discord-botten.</p>
      </div>

      <div className="public-info-box">
        <h3>Status & Detaljer</h3>
        <p>Uptime: {stats?.uptime || "Ukendt"}</p>
        <p>Latens (Ping): {stats?.ping || "—"} ms</p>
      </div>
    </div>
  );
}

function CogsPage({ cogs, onReload }) {
  return (
    <div>
      <div className="page-heading">
        <div className="eyebrow">COGS</div>
        <h2>Moduler (Cogs)</h2>
        <p>Administrer og genindlæs bot-moduler.</p>
      </div>

      <button className="primary-button" onClick={onReload} style={{ marginBottom: "20px" }}>
        🔄 Genindlæs alle Cogs
      </button>

      <div className="stats-grid">
        {cogs.map((cog, index) => (
          <div className="stat-card" key={index}>
            <span>🧩 Modul</span>
            <strong>{typeof cog === "string" ? cog : cog.name || "Ukendt Cog"}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function ServersPage({ servers, onSelect }) {
  return (
    <div>
      <div className="page-heading">
        <div className="eyebrow">SERVERE</div>
        <h2>Tilsluttede Servere</h2>
        <p>Vælg en server for at se detaljer.</p>
      </div>

      <div className="stats-grid">
        {servers.map((server) => (
          <div
            className="stat-card"
            key={server.id || server.guild_id}
            onClick={() => onSelect(server)}
            style={{ cursor: "pointer", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <span>🖥️ Server</span>
            <strong>{server.name || "Ukendt Server"}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function ServerDetails({ server, onBack, onLeave }) {
  return (
    <div>
      <div className="page-heading">
        <button className="back-button" onClick={onBack} style={{ marginBottom: "15px" }}>
          ← Tilbage til servere
        </button>
        <div className="eyebrow">SERVER DETALJER</div>
        <h2>{server.name}</h2>
        <p>ID: {server.id || server.guild_id}</p>
      </div>

      <div className="public-info-box">
        <h3>Handlinger</h3>
        <p>Fjern botten fra denne server, hvis den ikke længere skal være der.</p>
        <button
          className="logout-button"
          style={{ marginTop: "15px", backgroundColor: "#d9534f", color: "white" }}
          onClick={() => onLeave(server.id || server.guild_id)}
        >
          Forlad server
        </button>
      </div>
    </div>
  );
}

/* ======================================================
   SUPPORT PAGE (TICKETS - RETTET)
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
    const messagesList = Array.isArray(selectedTicket.messages)
      ? selectedTicket.messages
      : selectedTicket.replies || [];

    return (
      <div>
        <button className="back-button" onClick={onBack} style={{ marginBottom: "15px" }}>
          ← Tilbage til oversigt
        </button>

        <div className="page-heading">
          <div className="eyebrow">TICKET #{selectedTicket.id}</div>
          <h2>{selectedTicket.subject}</h2>
          <p>Status: <strong>{selectedTicket.status || "Åben"}</strong></p>
        </div>

        <div className="public-info-box" style={{ marginBottom: "20px" }}>
          <p><strong>Oprindelig besked:</strong></p>
          <p>{selectedTicket.message || selectedTicket.body || "Ingen besked"}</p>
        </div>

        {messagesList.length > 0 && (
          <div className="public-info-box" style={{ marginBottom: "20px" }}>
            <h3>Svarhistorik</h3>
            {messagesList.map((msg, idx) => (
              <div key={idx} style={{ marginTop: "10px", padding: "10px", background: "rgba(255,255,255,0.03)", borderRadius: "6px" }}>
                <p style={{ fontSize: "0.85rem", opacity: 0.7 }}>
                  <strong>{msg.author || msg.username || "Bruger"}</strong>
                </p>
                <p>{msg.message || msg.content}</p>
              </div>
            ))}
          </div>
        )}

        {selectedTicket.status !== "closed" && (
          <div className="public-info-box">
            <h3>Send svar</h3>
            <textarea
              className="ticket-textarea"
              rows="3"
              placeholder="Skriv et svar..."
              value={replyMessage}
              onChange={(e) => setReplyMessage(e.target.value)}
              style={{ width: "100%", padding: "10px", marginTop: "10px", borderRadius: "6px" }}
            />
            <div style={{ marginTop: "10px", display: "flex", gap: "10px" }}>
              <button className="primary-button" onClick={() => onReply(selectedTicket.id)}>
                Send svar
              </button>
              <button className="logout-button" onClick={() => onClose(selectedTicket.id)} style={{ backgroundColor: "#d9534f", color: "white" }}>
                Luk ticket
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="page-heading">
        <div className="eyebrow">SUPPORT</div>
        <h2>{staff ? "Support Tickets (Admin)" : "Mine Tickets"}</h2>
        <p>Opret eller besvar support-henvendelser.</p>
      </div>

      {!staff && (
        <form onSubmit={onCreateTicket} className="public-info-box" style={{ marginBottom: "25px" }}>
          <h3>Opret ny ticket</h3>
          <div style={{ marginTop: "15px" }}>
            <input
              type="text"
              placeholder="Emne"
              value={ticketSubject}
              onChange={(e) => setTicketSubject(e.target.value)}
              style={{ width: "100%", padding: "10px", marginBottom: "10px", borderRadius: "6px" }}
            />
            <textarea
              placeholder="Beskriv dit problem..."
              value={ticketMessage}
              onChange={(e) => setTicketMessage(e.target.value)}
              rows="3"
              style={{ width: "100%", padding: "10px", marginBottom: "10px", borderRadius: "6px" }}
            />
            <button type="submit" className="primary-button">Opret ticket</button>
          </div>
        </form>
      )}

      <div className="stats-grid">
        {tickets.map((ticket) => (
          <div
            className="stat-card"
            key={ticket.id}
            onClick={() => onOpenTicket(ticket)}
            style={{ cursor: "pointer", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <span>🎫 Ticket #{ticket.id}</span>
            <strong>{ticket.subject}</strong>
            <span style={{ fontSize: "0.8rem", opacity: 0.7 }}>Status: {ticket.status || "åben"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Roadmap() {
  return (
    <div>
      <div className="page-heading">
        <div className="eyebrow">ROADMAP</div>
        <h2>Kommende funktioner</h2>
        <p>Se hvad vi arbejder på til Hjælper V2.</p>
      </div>

      <div className="public-info-box">
        <h3>Fremtidsplaner</h3>
        <p>• Udvidet logning og automatisering<br />• Flere tilpassede moduler (Cogs)<br />• Forbedret brugergrænseflade</p>
      </div>
    </div>
  );
}

function LogsPage() {
  return (
    <div>
      <div className="page-heading">
        <div className="eyebrow">LOGS</div>
        <h2>Systemlogfiler</h2>
        <p>Se seneste hændelser og fejl fra botten.</p>
      </div>

      <div className="public-info-box">
        <p>[INFO] Bot startede uden fejl.<br />[DEBUG] Forbindelse til database etableret.</p>
      </div>
    </div>
  );
}

function SystemPage({ user }) {
  return (
    <div>
      <div className="page-heading">
        <div className="eyebrow">SYSTEM</div>
        <h2>Systemoversigt</h2>
        <p>Avancerede indstillinger for ejere og managers.</p>
      </div>

      <div className="public-info-box">
        <h3>Servermiljø</h3>
        <p>Rolle: {user?.role}</p>
        <p>Sikkerhedsstatus: Aktiv</p>
      </div>
    </div>
  );
}

function AccountPage({
  profileUsername,
  setProfileUsername,
  onSaveProfile,
  onLogoutAll,
  onDeleteAccount,
  sessions,
}) {
  return (
    <div>
      <div className="page-heading">
        <div className="eyebrow">KONTO</div>
        <h2>Kontoindstillinger</h2>
        <p>Administrer din profil, sessioner og sikkerhed.</p>
      </div>

      <form onSubmit={onSaveProfile} className="public-info-box" style={{ marginBottom: "20px" }}>
        <h3>Profil</h3>
        <div style={{ marginTop: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px" }}>Brugernavn:</label>
          <input
            type="text"
            value={profileUsername}
            onChange={(e) => setProfileUsername(e.target.value)}
            style={{ width: "100%", padding: "10px", marginBottom: "10px", borderRadius: "6px" }}
          />
          <button type="submit" className="primary-button">Gem ændringer</button>
        </div>
      </form>

      <div className="public-info-box" style={{ marginBottom: "20px" }}>
        <h3>Sikkerhed & Sessioner</h3>
        <p style={{ marginTop: "10px" }}>Aktive sessioner: {sessions.length}</p>
        <button className="primary-button" style={{ marginTop: "10px" }} onClick={onLogoutAll}>
          Log ud af alle andre sessioner
        </button>
      </div>

      <div className="public-info-box" style={{ borderColor: "#d9534f" }}>
        <h3>Faresone</h3>
        <p style={{ marginTop: "10px" }}>Slet din konto permanent fra systemet.</p>
        <button
          className="logout-button"
          style={{ marginTop: "10px", backgroundColor: "#d9534f", color: "white" }}
          onClick={onDeleteAccount}
        >
          Slet konto
        </button>
      </div>
    </div>
  );
}

function UserAvatar({ user }) {
  const avatarUrl = user?.avatar
    ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
    : null;

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt="Avatar"
        style={{ width: "40px", height: "40px", borderRadius: "50%" }}
      />
    );
  }

  return (
    <div
      style={{
        width: "40px",
        height: "40px",
        borderRadius: "50%",
        background: "#5865F2",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: "bold",
        color: "white",
      }}
    >
      {(user?.username || user?.global_name || "U")[0].toUpperCase()}
    </div>
  );
}

return (
    <div>
      <button className="back-button" onClick={onBack} style={{ marginBottom: "15px" }}>
        ← Tilbage til oversigt
      </button>

      <div className="page-heading">
        <div className="eyebrow">TICKET DETALJER</div>
        <h2>{selectedTicket.subject}</h2>
        <p>Status: <strong className={selectedTicket.status === "closed" ? "status-offline" : "status-online"}>{selectedTicket.status}</strong></p>
      </div>

      <div className="public-info-box" style={{ marginBottom: "20px" }}>
        <h3>Beskeder</h3>
        <div className="messages-list" style={{ marginTop: "15px", display: "flex", flexDirection: "column", gap: "10px" }}>
          {messagesList.map((msg, index) => (
            <div key={index} style={{ padding: "12px", background: "rgba(255,255,255,0.03)", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)" }}>
              <div style={{ fontSize: "12px", opacity: 0.7, marginBottom: "4px" }}>
                {msg.sender_name || msg.author || "Bruger"}
              </div>
              <div>{msg.message || msg.content}</div>
            </div>
          ))}
        </div>
      </div>

      {selectedTicket.status !== "closed" && (
        <div className="public-info-box" style={{ marginBottom: "20px" }}>
          <h3>Skriv et svar</h3>
          <textarea
            className="input-field"
            rows="3"
            placeholder="Skriv din besked her..."
            value={replyMessage}
            onChange={(e) => setReplyMessage(e.target.value)}
            style={{ width: "100%", marginTop: "10px", padding: "10px", borderRadius: "6px", background: "rgba(0,0,0,0.2)", color: "white", border: "1px solid rgba(255,255,255,0.1)" }}
          />
          <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
            <button className="primary-button" onClick={() => onReply(selectedTicket.id)}>
              Send svar
            </button>
            <button className="logout-button" style={{ backgroundColor: "#d9534f", color: "white" }} onClick={() => onClose(selectedTicket.id)}>
              Luk ticket
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ======================================================
   ACCOUNT PAGE
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
  return (
    <div>
      <div className="page-heading">
        <div className="eyebrow">KONTO</div>
        <h2>Kontoindstillinger</h2>
        <p>Administrer din profil, sikkerhed og aktive sessioner.</p>
      </div>

      <div className="public-info-box" style={{ marginBottom: "20px" }}>
        <h3>Profil</h3>
        <form onSubmit={onSaveProfile} style={{ marginTop: "15px" }}>
          <label style={{ display: "block", marginBottom: "8px", fontSize: "14px" }}>Brugernavn</label>
          <input
            type="text"
            value={profileUsername}
            onChange={(e) => setProfileUsername(e.target.value)}
            style={{ width: "100%", padding: "10px", borderRadius: "6px", background: "rgba(0,0,0,0.2)", color: "white", border: "1px solid rgba(255,255,255,0.1)", marginBottom: "15px" }}
          />
          <button className="primary-button" type="submit">Gem ændringer</button>
        </form>
      </div>

      <div className="public-info-box" style={{ marginBottom: "20px" }}>
        <h3>Sikkerhed & Sessioner</h3>
        <p style={{ marginTop: "10px", marginBottom: "15px" }}>Aktive sessioner: {sessions.length}</p>
        <button className="logout-button" onClick={onLogoutAll} style={{ backgroundColor: "#f0ad4e", color: "white", marginBottom: "20px" }}>
          Log ud af alle andre sessioner
        </button>

        <div style={{ marginTop: "15px" }}>
          <h4 style={{ marginBottom: "10px" }}>Aktive enheder</h4>
          {sessions.map((session, idx) => (
            <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px", background: "rgba(255,255,255,0.03)", borderRadius: "6px", marginBottom: "8px" }}>
              <span>{session.ip || session.device || "Ukendt enhed"}</span>
              <button className="logout-button" style={{ backgroundColor: "#d9534f", color: "white", padding: "5px 10px", fontSize: "12px" }} onClick={() => onDeleteSession(session.id)}>
                Fjern
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="public-info-box" style={{ border: "1px solid rgba(217,83,79,0.3)" }}>
        <h3>Farligzone</h3>
        <p style={{ marginTop: "10px", marginBottom: "15px" }}>Slet din konto permanent fra systemet.</p>
        <button className="logout-button" style={{ backgroundColor: "#d9534f", color: "white" }} onClick={onDeleteAccount}>
          Slet konto
        </button>
      </div>
    </div>
  );
}

function Roadmap() {
  return (
    <div>
      <div className="page-heading">
        <div className="eyebrow">ROADMAP</div>
        <h2>Kommende funktioner</h2>
        <p>Se hvad der er på vej til Hjælper.</p>
      </div>

      <div className="public-info-box">
        <h3>V2.2 Planer</h3>
        <p style={{ marginTop: "10px" }}>Vi arbejder løbende på at forbedre botten, tilføje nye cogs og udvide dashboard-mulighederne.</p>
      </div>
    </div>
  );
}

function SystemPage({ user, security }) {
  return (
    <div>
      <div className="page-heading">
        <div className="eyebrow">SYSTEM</div>
        <h2>Systemovervågning</h2>
        <p>Interne systemoplysninger for ejere og managers.</p>
      </div>

      <div className="public-info-box">
        <h3>Miljø</h3>
        <p style={{ marginTop: "10px" }}>Rolle: {user?.role}</p>
        <p>Sikkerhedsstatus: Optimal</p>
      </div>
    </div>
  );
}

function LogsPage() {
  return (
    <div>
      <div className="page-heading">
        <div className="eyebrow">LOGS</div>
        <h2>Systemlogfiler</h2>
        <p>Se seneste hændelser fra botten og API'et.</p>
      </div>

      <div className="public-info-box">
        <h3>Seneste log</h3>
        <p style={{ marginTop: "10px", fontFamily: "monospace" }}>[INFO] API kører stabilt på port 9305.</p>
      </div>
    </div>
  );
}

function UserAvatar({ user }) {
  const avatarUrl = user?.avatar
    ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
    : null;

  return (
    <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "#5865F2", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", fontWeight: "bold" }}>
      {avatarUrl ? (
        <img src={avatarUrl} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <span>{user?.username?.[0]?.toUpperCase() || "U"}</span>
      )}
    </div>
  );
}
