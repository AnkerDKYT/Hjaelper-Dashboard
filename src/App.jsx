import React, { useEffect, useMemo, useState } from "react";
import "./style.css";

const API = "/backend";

async function apiFetch(path, options = {}) {
    const response = await fetch(`${API}${path}`, {
        credentials: "include",
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {}),
        },
    });

    const text = await response.text();

    let data = {};

    try {
        data = text ? JSON.parse(text) : {};
    } catch {
        data = {
            raw: text,
        };
    }

    if (!response.ok) {
        const error = new Error(
            data?.detail ||
            data?.error ||
            `HTTP ${response.status}`
        );

        error.status = response.status;
        error.data = data;

        throw error;
    }

    return data;
}

function formatDate(value) {
    if (!value) return "Ukendt";

    try {
        return new Date(value).toLocaleString("da-DK", {
            dateStyle: "short",
            timeStyle: "short",
        });
    } catch {
        return value;
    }
}

function roleLabel(role) {
    switch (role) {
        case "owner":
            return "Ejer";
        case "manager":
            return "Manager";
        case "admin":
            return "Admin";
        default:
            return "Bruger";
    }
}

function roleClass(role) {
    switch (role) {
        case "owner":
            return "role-owner";
        case "manager":
            return "role-manager";
        case "admin":
            return "role-admin";
        default:
            return "role-user";
    }
}

function statusLabel(status) {
    switch (status) {
        case "open":
            return "Åben";
        case "answered":
            return "Besvaret";
        case "closed":
            return "Lukket";
        default:
            return status || "Ukendt";
    }
}

function statusClass(status) {
    switch (status) {
        case "open":
            return "status-open";
        case "answered":
            return "status-answered";
        case "closed":
            return "status-closed";
        default:
            return "";
    }
}

export default function App() {
    const [user, setUser] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);

    const [page, setPage] = useState("dashboard");

    const [publicStats, setPublicStats] = useState(null);
    const [botStatus, setBotStatus] = useState(null);
    const [stats, setStats] = useState(null);
    const [cogs, setCogs] = useState([]);
    const [servers, setServers] = useState([]);
    const [logs, setLogs] = useState([]);
    const [system, setSystem] = useState(null);

    const [account, setAccount] = useState(null);
    const [security, setSecurity] = useState(null);
    const [connected, setConnected] = useState(null);

    // ========================================================
    // USER SUPPORT
    // ========================================================

    const [userTickets, setUserTickets] = useState([]);
    const [selectedUserTicket, setSelectedUserTicket] = useState(null);

    const [supportSubject, setSupportSubject] = useState("");
    const [supportMessage, setSupportMessage] = useState("");

    const [userTicketReply, setUserTicketReply] = useState("");

    const [supportLoading, setSupportLoading] = useState(false);
    const [supportError, setSupportError] = useState("");
    const [supportSuccess, setSupportSuccess] = useState("");

    // ========================================================
    // ADMIN TICKETS
    // ========================================================

    const [adminTickets, setAdminTickets] = useState([]);
    const [selectedAdminTicket, setSelectedAdminTicket] = useState(null);

    const [adminTicketReply, setAdminTicketReply] = useState("");

    const [adminTicketLoading, setAdminTicketLoading] = useState(false);
    const [adminTicketError, setAdminTicketError] = useState("");
    const [adminTicketSuccess, setAdminTicketSuccess] = useState("");

    // ========================================================
    // GENERAL
    // ========================================================

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const isOwner =
        user?.role === "owner" ||
        user?.is_owner === true;

    const isManager = user?.role === "manager";
    const isAdmin = user?.role === "admin";

    const isStaff =
        isOwner ||
        isManager ||
        isAdmin;

    // ========================================================
    // AUTH
    // ========================================================

    useEffect(() => {
        checkAuth();
    }, []);

    async function checkAuth() {
        try {
            const data = await apiFetch("/auth/me");

            if (data?.authenticated && data?.user) {
                setUser(data.user);
            } else {
                setUser(null);
            }
        } catch {
            setUser(null);
        } finally {
            setAuthLoading(false);
        }
    }

    function login(type = "admin") {
        window.location.href =
            `${API}/auth/discord?login_type=${type}`;
    }

    async function logout() {
        try {
            await apiFetch("/auth/logout", {
                method: "POST",
            });
        } catch {
            // Ignore
        }

        setUser(null);
    }

    // ========================================================
    // DATA
    // ========================================================

    useEffect(() => {
        if (!user) return;

        loadPublicStats();

        if (isStaff) {
            loadAdminData();
        }

        if (!isStaff) {
            loadUserTickets();
        }
    }, [user]);

    async function loadPublicStats() {
        try {
            const data = await apiFetch(
                "/api/public/stats"
            );

            setPublicStats(data);
        } catch {
            // Public stats are optional
        }
    }

    async function loadAdminData() {
        try {
            const [
                statusData,
                statsData,
                cogsData,
                serversData,
            ] = await Promise.all([
                apiFetch("/api/status"),
                apiFetch("/api/stats"),
                apiFetch("/api/cogs"),
                apiFetch("/api/servers"),
            ]);

            setBotStatus(statusData);
            setStats(statsData);
            setCogs(cogsData?.cogs || []);
            setServers(serversData?.servers || []);

        } catch (err) {
            setError(
                err.message ||
                "Kunne ikke hente admin-data."
            );
        }
    }

    // ========================================================
    // USER TICKETS
    // ========================================================

    async function loadUserTickets() {
        try {
            setSupportLoading(true);
            setSupportError("");

            const data = await apiFetch(
                "/api/support/tickets"
            );

            setUserTickets(
                Array.isArray(data?.tickets)
                    ? data.tickets
                    : []
            );
        } catch (err) {
            setSupportError(
                err.message ||
                "Kunne ikke hente dine tickets."
            );
        } finally {
            setSupportLoading(false);
        }
    }

    async function openUserTicket(ticket) {
        setSupportError("");
        setSupportSuccess("");

        try {
            setSupportLoading(true);

            const data = await apiFetch(
                `/api/support/tickets`
            );

            const tickets = Array.isArray(data?.tickets)
                ? data.tickets
                : [];

            const found = tickets.find(
                item =>
                    String(item.id) ===
                    String(ticket.id)
            );

            setUserTickets(tickets);

            setSelectedUserTicket(
                found || ticket
            );

        } catch (err) {
            setSelectedUserTicket(ticket);

            setSupportError(
                err.message ||
                "Kunne ikke åbne ticketen."
            );
        } finally {
            setSupportLoading(false);
        }
    }

    function backToUserTickets() {
        setSelectedUserTicket(null);
        setUserTicketReply("");
        setSupportError("");
        setSupportSuccess("");

        loadUserTickets();
    }

    async function createUserTicket(event) {
        event.preventDefault();

        setSupportError("");
        setSupportSuccess("");

        if (!supportSubject.trim()) {
            setSupportError("Skriv et emne.");
            return;
        }

        if (!supportMessage.trim()) {
            setSupportError("Skriv en besked.");
            return;
        }

        try {
            setSupportLoading(true);

            const data = await apiFetch(
                "/api/support/tickets",
                {
                    method: "POST",
                    body: JSON.stringify({
                        subject:
                            supportSubject.trim(),
                        message:
                            supportMessage.trim(),
                    }),
                }
            );

            setSupportSubject("");
            setSupportMessage("");

            setSupportSuccess(
                "Din ticket blev oprettet."
            );

            const ticket = data?.ticket;

            await loadUserTickets();

            if (ticket) {
                setSelectedUserTicket(ticket);
            }

        } catch (err) {
            setSupportError(
                err.message ||
                "Kunne ikke oprette ticketen."
            );
        } finally {
            setSupportLoading(false);
        }
    }

    async function replyToUserTicket() {
        if (!selectedUserTicket) return;

        if (!userTicketReply.trim()) {
            setSupportError(
                "Skriv en besked først."
            );
            return;
        }

        setSupportError("");
        setSupportSuccess("");

        try {
            setSupportLoading(true);

            const data = await apiFetch(
                `/api/support/${selectedUserTicket.id}/reply`,
                {
                    method: "POST",
                    body: JSON.stringify({
                        message:
                            userTicketReply.trim(),
                    }),
                }
            );

            setSelectedUserTicket(
                data?.ticket ||
                selectedUserTicket
            );

            setUserTicketReply("");

            await loadUserTickets();

            setSupportSuccess(
                "Dit svar blev sendt."
            );

        } catch (err) {
            setSupportError(
                err.message ||
                "Kunne ikke sende svaret."
            );
        } finally {
            setSupportLoading(false);
        }
    }

    async function closeUserTicket() {
        if (!selectedUserTicket) return;

        try {
            setSupportLoading(true);
            setSupportError("");

            const data = await apiFetch(
                `/api/support/tickets/${selectedUserTicket.id}/close`,
                {
                    method: "POST",
                }
            );

            setSelectedUserTicket(
                data?.ticket ||
                {
                    ...selectedUserTicket,
                    status: "closed",
                }
            );

            await loadUserTickets();

            setSupportSuccess(
                "Ticketen blev lukket."
            );

        } catch (err) {
            setSupportError(
                err.message ||
                "Kunne ikke lukke ticketen."
            );
        } finally {
            setSupportLoading(false);
        }
    }

    // ========================================================
    // ADMIN TICKETS
    // ========================================================

    async function loadAdminTickets() {
        try {
            setAdminTicketLoading(true);
            setAdminTicketError("");

            const data = await apiFetch(
                "/api/support/admin/tickets"
            );

            setAdminTickets(
                Array.isArray(data?.tickets)
                    ? data.tickets
                    : []
            );

        } catch (err) {
            setAdminTicketError(
                err.message ||
                "Kunne ikke hente tickets."
            );
        } finally {
            setAdminTicketLoading(false);
        }
    }

    async function openAdminTicket(ticket) {
        setAdminTicketError("");
        setAdminTicketSuccess("");

        try {
            setAdminTicketLoading(true);

            const data = await apiFetch(
                `/api/support/admin/tickets/${ticket.id}`
            );

            setSelectedAdminTicket(
                data?.ticket ||
                ticket
            );

        } catch (err) {
            setAdminTicketError(
                err.message ||
                "Kunne ikke åbne ticketen."
            );
        } finally {
            setAdminTicketLoading(false);
        }
    }

    function backToAdminTickets() {
        setSelectedAdminTicket(null);
        setAdminTicketReply("");
        setAdminTicketError("");
        setAdminTicketSuccess("");

        loadAdminTickets();
    }

    async function replyToAdminTicket() {
        if (!selectedAdminTicket) return;

        if (!adminTicketReply.trim()) {
            setAdminTicketError(
                "Skriv en besked først."
            );
            return;
        }

        setAdminTicketError("");
        setAdminTicketSuccess("");

        try {
            setAdminTicketLoading(true);

            const data = await apiFetch(
                `/api/support/admin/tickets/${selectedAdminTicket.id}/reply`,
                {
                    method: "POST",
                    body: JSON.stringify({
                        message:
                            adminTicketReply.trim(),
                    }),
                }
            );

            setSelectedAdminTicket(
                data?.ticket ||
                selectedAdminTicket
            );

            setAdminTicketReply("");

            await loadAdminTickets();

            setAdminTicketSuccess(
                "Svar sendt."
            );

        } catch (err) {
            setAdminTicketError(
                err.message ||
                "Kunne ikke sende svaret."
            );
        } finally {
            setAdminTicketLoading(false);
        }
    }

    async function closeAdminTicket() {
        if (!selectedAdminTicket) return;

        try {
            setAdminTicketLoading(true);
            setAdminTicketError("");

            const data = await apiFetch(
                `/api/support/admin/tickets/${selectedAdminTicket.id}/close`,
                {
                    method: "POST",
                }
            );

            setSelectedAdminTicket(
                data?.ticket ||
                {
                    ...selectedAdminTicket,
                    status: "closed",
                }
            );

            await loadAdminTickets();

            setAdminTicketSuccess(
                "Ticketen blev lukket."
            );

        } catch (err) {
            setAdminTicketError(
                err.message ||
                "Kunne ikke lukke ticketen."
            );
        } finally {
            setAdminTicketLoading(false);
        }
    }

    // ========================================================
    // ACCOUNT
    // ========================================================

    async function loadAccount() {
        try {
            const [
                accountData,
                securityData,
                connectedData,
            ] = await Promise.all([
                apiFetch("/api/account"),
                apiFetch("/api/account/security"),
                apiFetch("/api/account/connected"),
            ]);

            setAccount(accountData);
            setSecurity(securityData);
            setConnected(connectedData);

        } catch (err) {
            setError(
                err.message ||
                "Kunne ikke hente konto."
            );
        }
    }

    useEffect(() => {
        if (
            user &&
            page === "account"
        ) {
            loadAccount();
        }
    }, [page, user]);

    // ========================================================
    // NAVIGATION
    // ========================================================

    function navigate(nextPage) {
        setPage(nextPage);

        setSelectedAdminTicket(null);
        setSelectedUserTicket(null);

        setAdminTicketError("");
        setAdminTicketSuccess("");

        setSupportError("");
        setSupportSuccess("");

        if (nextPage === "tickets" && isStaff) {
            loadAdminTickets();
        }

        if (nextPage === "support" && !isStaff) {
            loadUserTickets();
        }
    }

    // ========================================================
    // TICKET MESSAGE LIST
    // ========================================================

    function renderTicketMessages(ticket) {
        if (!ticket) return null;

        const replies = Array.isArray(ticket.replies)
            ? ticket.replies
            : [];

        return (
            <div className="ticket-messages">

                <div className="ticket-message user-message">
                    <div className="ticket-message-header">
                        <strong>
                            {ticket.username || "Bruger"}
                        </strong>

                        <span>
                            {formatDate(
                                ticket.created_at
                            )}
                        </span>
                    </div>

                    <div className="ticket-message-content">
                        {ticket.message}
                    </div>
                </div>

                {replies.map((reply) => (
                    <div
                        key={
                            reply.id ||
                            `${reply.created_at}-${reply.username}`
                        }
                        className={
                            `ticket-message ${
                                reply.role === "user"
                                    ? "user-message"
                                    : "staff-message"
                            }`
                        }
                    >
                        <div className="ticket-message-header">
                            <strong>
                                {reply.username ||
                                    "Bruger"}
                            </strong>

                            <span>
                                {reply.role_name ||
                                    roleLabel(reply.role)}
                            </span>

                            <span>
                                {formatDate(
                                    reply.created_at
                                )}
                            </span>
                        </div>

                        <div className="ticket-message-content">
                            {reply.message}
                        </div>
                    </div>
                ))}

            </div>
        );
    }

    // ========================================================
    // LOGIN
    // ========================================================

    if (authLoading) {
        return (
            <div className="app-loading">
                <div className="card">
                    <h2>Hjælper</h2>
                    <p>Indlæser...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="login-page">
                <div className="login-card">
                    <h1>Hjælper</h1>

                    <p>
                        Log ind med Discord for at
                        fortsætte.
                    </p>

                    <button
                        className="btn btn-primary"
                        onClick={() =>
                            login("user")
                        }
                    >
                        💜 Log ind med Discord
                    </button>
                </div>
            </div>
        );
    }

    // ========================================================
    // SIDEBAR
    // ========================================================

    const staffNavigation = [
        ["dashboard", "🏠", "Dashboard"],
        ["bot", "🤖", "Bot"],
        ["stats", "📊", "Stats"],
        ["cogs", "🧩", "Cogs"],
        ["servers", "🌐", "Servere"],
        ["tickets", "🎫", "Tickets"],
        ["logs", "📜", "Logs"],
    ];

    if (isOwner || isManager) {
        staffNavigation.push(
            ["system", "⚙️", "System"]
        );
    }

    const userNavigation = [
        ["dashboard", "🏠", "Dashboard"],
        ["support", "🛟", "Support"],
    ];

    return (
        <div className="app-shell">

            <aside className="sidebar">

                <div className="sidebar-brand">
                    <div className="brand-logo">
                        H
                    </div>

                    <div>
                        <strong>
                            Hjælper
                        </strong>

                        <small>
                            Dashboard
                        </small>
                    </div>
                </div>

                <nav className="sidebar-nav">

                    {(isStaff
                        ? staffNavigation
                        : userNavigation
                    ).map(
                        ([key, icon, label]) => (
                            <button
                                key={key}
                                className={
                                    page === key
                                        ? "nav-item active"
                                        : "nav-item"
                                }
                                onClick={() =>
                                    navigate(key)
                                }
                            >
                                <span>
                                    {icon}
                                </span>

                                {label}
                            </button>
                        )
                    )}

                    <div className="nav-divider" />

                    <button
                        className={
                            page === "account"
                                ? "nav-item active"
                                : "nav-item"
                        }
                        onClick={() =>
                            navigate("account")
                        }
                    >
                        👤 Konto
                    </button>

                </nav>

                <div className="sidebar-bottom">

                    <div className="sidebar-user">

                        {user.avatar ? (
                            <img
                                src={
                                    `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128`
                                }
                                alt=""
                            />
                        ) : (
                            <div className="avatar-placeholder">
                                {(
                                    user.username ||
                                    "U"
                                )
                                    .charAt(0)
                                    .toUpperCase()}
                            </div>
                        )}

                        <div>
                            <strong>
                                {user.username}
                            </strong>

                            <small
                                className={roleClass(
                                    user.role
                                )}
                            >
                                {roleLabel(
                                    user.role
                                )}
                            </small>
                        </div>
                    </div>

                    <button
                        className="btn btn-secondary logout-button"
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
                            {page === "dashboard" &&
                                "Dashboard"}

                            {page === "bot" &&
                                "Bot"}

                            {page === "stats" &&
                                "Statistik"}

                            {page === "cogs" &&
                                "Cogs"}

                            {page === "servers" &&
                                "Servere"}

                            {page === "tickets" &&
                                "Tickets"}

                            {page === "support" &&
                                "Support"}

                            {page === "logs" &&
                                "Logs"}

                            {page === "system" &&
                                "System"}

                            {page === "account" &&
                                "Konto"}
                        </h1>

                        <p>
                            Velkommen tilbage,{" "}
                            <strong>
                                {user.username}
                            </strong>
                        </p>
                    </div>

                    <div className="topbar-user">

                        <span
                            className={roleClass(
                                user.role
                            )}
                        >
                            {roleLabel(
                                user.role
                            )}
                        </span>

                    </div>

                </header>

                <div className="content">

                    {error && (
                        <div className="alert alert-error">
                            {error}
                        </div>
                    )}

                    {/* ====================================================
                        DASHBOARD
                    ==================================================== */}

                    {page === "dashboard" && (
                        <section>

                            <div className="page-intro">
                                <h2>
                                    Hej {user.username} 👋
                                </h2>

                                <p>
                                    Her kan du se
                                    status og
                                    information om
                                    Hjælper.
                                </p>
                            </div>

                            <div className="stats-grid">

                                <div className="card stat-card">
                                    <span>🤖</span>
                                    <div>
                                        <small>
                                            Bot status
                                        </small>

                                        <strong>
                                            {publicStats?.online
                                                ? "Online"
                                                : "Offline"}
                                        </strong>
                                    </div>
                                </div>

                                <div className="card stat-card">
                                    <span>🌐</span>
                                    <div>
                                        <small>
                                            Servere
                                        </small>

                                        <strong>
                                            {publicStats?.servers ??
                                                "—"}
                                        </strong>
                                    </div>
                                </div>

                                <div className="card stat-card">
                                    <span>⚡</span>
                                    <div>
                                        <small>
                                            Commands
                                        </small>

                                        <strong>
                                            {publicStats?.commands ??
                                                "—"}
                                        </strong>
                                    </div>
                                </div>

                                <div className="card stat-card">
                                    <span>👥</span>
                                    <div>
                                        <small>
                                            Panelbrugere
                                        </small>

                                        <strong>
                                            {publicStats?.panel_users_total ??
                                                "—"}
                                        </strong>
                                    </div>
                                </div>

                            </div>

                            <div className="card">

                                <h3>
                                    Din konto
                                </h3>

                                <p>
                                    Logget ind som{" "}
                                    <strong>
                                        {user.username}
                                    </strong>
                                    .
                                </p>

                                <span
                                    className={
                                        roleClass(
                                            user.role
                                        )
                                    }
                                >
                                    {roleLabel(
                                        user.role
                                    )}
                                </span>

                            </div>

                        </section>
                    )}

                    {/* ====================================================
                        BOT
                    ==================================================== */}

                    {page === "bot" && isStaff && (
                        <section>

                            <div className="stats-grid">

                                <div className="card stat-card">
                                    <span>🤖</span>
                                    <div>
                                        <small>
                                            Status
                                        </small>
                                        <strong>
                                            {botStatus?.online
                                                ? "Online"
                                                : "Offline"}
                                        </strong>
                                    </div>
                                </div>

                                <div className="card stat-card">
                                    <span>🌐</span>
                                    <div>
                                        <small>
                                            Servere
                                        </small>
                                        <strong>
                                            {botStatus?.guilds ??
                                                0}
                                        </strong>
                                    </div>
                                </div>

                                <div className="card stat-card">
                                    <span>🆔</span>
                                    <div>
                                        <small>
                                            Bot ID
                                        </small>
                                        <strong>
                                            {botStatus?.id ||
                                                "—"}
                                        </strong>
                                    </div>
                                </div>

                            </div>

                            <div className="card">

                                <h2>
                                    {botStatus?.name ||
                                        "Hjælper"}
                                </h2>

                                <p>
                                    Discord-botten er{" "}
                                    {botStatus?.online
                                        ? "online"
                                        : "offline"}.
                                </p>

                            </div>

                        </section>
                    )}

                    {/* ====================================================
                        STATS
                    ==================================================== */}

                    {page === "stats" && isStaff && (
                        <section>

                            <div className="stats-grid">

                                <div className="card stat-card">
                                    <span>🌐</span>
                                    <div>
                                        <small>
                                            Servere
                                        </small>
                                        <strong>
                                            {stats?.servers ??
                                                0}
                                        </strong>
                                    </div>
                                </div>

                                <div className="card stat-card">
                                    <span>👥</span>
                                    <div>
                                        <small>
                                            Discord brugere
                                        </small>
                                        <strong>
                                            {stats?.users ??
                                                0}
                                        </strong>
                                    </div>
                                </div>

                                <div className="card stat-card">
                                    <span>⚡</span>
                                    <div>
                                        <small>
                                            Commands
                                        </small>
                                        <strong>
                                            {stats?.commands ??
                                                0}
                                        </strong>
                                    </div>
                                </div>

                                <div className="card stat-card">
                                    <span>🧩</span>
                                    <div>
                                        <small>
                                            Cogs
                                        </small>
                                        <strong>
                                            {stats?.cogs ??
                                                0}
                                        </strong>
                                    </div>
                                </div>

                            </div>

                            <div className="card">

                                <h3>
                                    Panelbrugere
                                </h3>

                                <div className="stats-grid">

                                    <div>
                                        <small>
                                            I dag
                                        </small>
                                        <h2>
                                            {stats?.panel_users_today ??
                                                0}
                                        </h2>
                                    </div>

                                    <div>
                                        <small>
                                            Denne uge
                                        </small>
                                        <h2>
                                            {stats?.panel_users_week ??
                                                0}
                                        </h2>
                                    </div>

                                    <div>
                                        <small>
                                            Dette år
                                        </small>
                                        <h2>
                                            {stats?.panel_users_year ??
                                                0}
                                        </h2>
                                    </div>

                                    <div>
                                        <small>
                                            Total
                                        </small>
                                        <h2>
                                            {stats?.panel_users_total ??
                                                0}
                                        </h2>
                                    </div>

                                </div>

                            </div>

                        </section>
                    )}

                    {/* ====================================================
                        COGS
                    ==================================================== */}

                    {page === "cogs" && isStaff && (
                        <section>

                            <div className="card">

                                <div className="card-header">
                                    <div>
                                        <h2>
                                            Cogs
                                        </h2>

                                        <p>
                                            Indlæste
                                            extensions.
                                        </p>
                                    </div>

                                    {(isOwner ||
                                        isManager) && (
                                        <button
                                            className="btn btn-primary"
                                            onClick={async () => {
                                                try {
                                                    await apiFetch(
                                                        "/api/reload-cogs",
                                                        {
                                                            method:
                                                                "POST",
                                                        }
                                                    );

                                                    await loadAdminData();
                                                } catch (
                                                    err
                                                ) {
                                                    setError(
                                                        err.message
                                                    );
                                                }
                                            }}
                                        >
                                            🔄 Reload
                                        </button>
                                    )}
                                </div>

                                <div className="list">

                                    {cogs.length === 0 ? (
                                        <p>
                                            Ingen cogs
                                            fundet.
                                        </p>
                                    ) : (
                                        cogs.map(
                                            cog => (
                                                <div
                                                    className="list-item"
                                                    key={
                                                        cog.name
                                                    }
                                                >
                                                    <strong>
                                                        {cog.name}
                                                    </strong>

                                                    <span className="status-open">
                                                        ● Loaded
                                                    </span>
                                                </div>
                                            )
                                        )
                                    )}

                                </div>

                            </div>

                        </section>
                    )}

                    {/* ====================================================
                        SERVERS
                    ==================================================== */}

                    {page === "servers" && isStaff && (
                        <section>

                            <div className="card">

                                <h2>
                                    Servere
                                </h2>

                                <p>
                                    Servere hvor
                                    Hjælper er
                                    installeret.
                                </p>

                                <div className="list">

                                    {servers.length === 0 ? (
                                        <p>
                                            Ingen servere
                                            fundet.
                                        </p>
                                    ) : (
                                        servers.map(
                                            server => (
                                                <div
                                                    className="list-item"
                                                    key={
                                                        server.id
                                                    }
                                                >
                                                    <div className="server-info">

                                                        {server.icon ? (
                                                            <img
                                                                src={
                                                                    server.icon
                                                                }
                                                                alt=""
                                                                className="server-icon"
                                                            />
                                                        ) : (
                                                            <div className="server-icon-placeholder">
                                                                🌐
                                                            </div>
                                                        )}

                                                        <div>
                                                            <strong>
                                                                {server.name}
                                                            </strong>

                                                            <small>
                                                                {server.member_count ??
                                                                    server.members ??
                                                                    0}{" "}
                                                                medlemmer
                                                            </small>
                                                        </div>

                                                    </div>

                                                    {(isOwner ||
                                                        isManager) && (
                                                        <button
                                                            className="btn btn-danger"
                                                            onClick={async () => {
                                                                if (
                                                                    !window.confirm(
                                                                        `Er du sikker på, at Hjælper skal forlade ${server.name}?`
                                                                    )
                                                                ) {
                                                                    return;
                                                                }

                                                                try {
                                                                    await apiFetch(
                                                                        `/api/servers/${server.id}/leave`,
                                                                        {
                                                                            method:
                                                                                "POST",
                                                                        }
                                                                    );

                                                                    await loadAdminData();
                                                                } catch (
                                                                    err
                                                                ) {
                                                                    setError(
                                                                        err.message
                                                                    );
                                                                }
                                                            }}
                                                        >
                                                            Forlad
                                                        </button>
                                                    )}

                                                </div>
                                            )
                                        )
                                    )}

                                </div>

                            </div>

                        </section>
                    )}

                    {/* ====================================================
                        ADMIN TICKETS
                    ==================================================== */}

                    {page === "tickets" &&
                        isStaff && (
                            <section>

                                {!selectedAdminTicket ? (
                                    <>
                                        <div className="page-intro">
                                            <h2>
                                                🎫 Tickets
                                            </h2>

                                            <p>
                                                Administrer
                                                alle
                                                support-sager
                                                fra brugerne.
                                            </p>
                                        </div>

                                        {adminTicketError && (
                                            <div className="alert alert-error">
                                                {
                                                    adminTicketError
                                                }
                                            </div>
                                        )}

                                        {adminTicketLoading &&
                                            adminTickets.length ===
                                                0 && (
                                                <div className="card">
                                                    Indlæser
                                                    tickets...
                                                </div>
                                            )}

                                        <div className="ticket-list">

                                            {adminTickets.length ===
                                            0 ? (
                                                <div className="card empty-state">
                                                    <h3>
                                                        Ingen
                                                        tickets
                                                    </h3>

                                                    <p>
                                                        Der er
                                                        ingen
                                                        support-sager
                                                        lige nu.
                                                    </p>
                                                </div>
                                            ) : (
                                                adminTickets.map(
                                                    ticket => (
                                                        <button
                                                            key={
                                                                ticket.id
                                                            }
                                                            className="ticket-card"
                                                            onClick={() =>
                                                                openAdminTicket(
                                                                    ticket
                                                                )
                                                            }
                                                        >
                                                            <div className="ticket-card-top">

                                                                <div>
                                                                    <strong>
                                                                        {ticket.subject ||
                                                                            "Ingen emne"}
                                                                    </strong>

                                                                    <small>
                                                                        #{ticket.id}
                                                                    </small>
                                                                </div>

                                                                <span
                                                                    className={
                                                                        statusClass(
                                                                            ticket.status
                                                                        )
                                                                    }
                                                                >
                                                                    {statusLabel(
                                                                        ticket.status
                                                                    )}
                                                                </span>

                                                            </div>

                                                            <div className="ticket-card-bottom">

                                                                <span>
                                                                    👤{" "}
                                                                    {ticket.username ||
                                                                        "Bruger"}
                                                                </span>

                                                                <span>
                                                                    {formatDate(
                                                                        ticket.updated_at ||
                                                                            ticket.created_at
                                                                    )}
                                                                </span>

                                                            </div>

                                                        </button>
                                                    )
                                                )
                                            )}

                                        </div>
                                    </>
                                ) : (
                                    <div className="ticket-detail">

                                        <button
                                            className="btn btn-secondary back-button"
                                            onClick={
                                                backToAdminTickets
                                            }
                                        >
                                            ← Alle tickets
                                        </button>

                                        <div className="card ticket-header-card">

                                            <div>
                                                <h2>
                                                    {
                                                        selectedAdminTicket.subject
                                                    }
                                                </h2>

                                                <p>
                                                    Ticket #
                                                    {
                                                        selectedAdminTicket.id
                                                    }
                                                </p>
                                            </div>

                                            <span
                                                className={
                                                    statusClass(
                                                        selectedAdminTicket.status
                                                    )
                                                }
                                            >
                                                {statusLabel(
                                                    selectedAdminTicket.status
                                                )}
                                            </span>

                                        </div>

                                        {adminTicketError && (
                                            <div className="alert alert-error">
                                                {
                                                    adminTicketError
                                                }
                                            </div>
                                        )}

                                        {adminTicketSuccess && (
                                            <div className="alert alert-success">
                                                {
                                                    adminTicketSuccess
                                                }
                                            </div>
                                        )}

                                        <div className="card">

                                            <div className="ticket-user-info">

                                                <strong>
                                                    👤{" "}
                                                    {
                                                        selectedAdminTicket.username
                                                    }
                                                </strong>

                                                <span>
                                                    Oprettet{" "}
                                                    {formatDate(
                                                        selectedAdminTicket.created_at
                                                    )}
                                                </span>

                                            </div>

                                            {renderTicketMessages(
                                                selectedAdminTicket
                                            )}

                                        </div>

                                        {selectedAdminTicket.status !==
                                            "closed" && (
                                            <div className="card ticket-reply-card">

                                                <h3>
                                                    Svar på ticket
                                                </h3>

                                                <textarea
                                                    className="textarea"
                                                    value={
                                                        adminTicketReply
                                                    }
                                                    onChange={e =>
                                                        setAdminTicketReply(
                                                            e.target
                                                                .value
                                                        )
                                                    }
                                                    placeholder="Skriv dit svar..."
                                                    rows={5}
                                                />

                                                <div className="ticket-actions">

                                                    <button
                                                        className="btn btn-primary"
                                                        disabled={
                                                            adminTicketLoading
                                                        }
                                                        onClick={
                                                            replyToAdminTicket
                                                        }
                                                    >
                                                        📤 Send svar
                                                    </button>

                                                    <button
                                                        className="btn btn-danger"
                                                        disabled={
                                                            adminTicketLoading
                                                        }
                                                        onClick={
                                                            closeAdminTicket
                                                        }
                                                    >
                                                        🔒 Luk ticket
                                                    </button>

                                                </div>

                                            </div>
                                        )}

                                    </div>
                                )}

                            </section>
                        )}

                    {/* ====================================================
                        USER SUPPORT
                    ==================================================== */}

                    {page === "support" &&
                        !isStaff && (
                            <section>

                                {!selectedUserTicket ? (
                                    <>
                                        <div className="page-intro">
                                            <h2>
                                                🛟 Support
                                            </h2>

                                            <p>
                                                Har du brug
                                                for hjælp?
                                                Opret en
                                                ticket.
                                            </p>
                                        </div>

                                        {supportError && (
                                            <div className="alert alert-error">
                                                {supportError}
                                            </div>
                                        )}

                                        {supportSuccess && (
                                            <div className="alert alert-success">
                                                {supportSuccess}
                                            </div>
                                        )}

                                        <div className="card">

                                            <h3>
                                                Opret ticket
                                            </h3>

                                            <form
                                                onSubmit={
                                                    createUserTicket
                                                }
                                            >

                                                <label>
                                                    Emne
                                                </label>

                                                <input
                                                    className="input"
                                                    value={
                                                        supportSubject
                                                    }
                                                    onChange={e =>
                                                        setSupportSubject(
                                                            e.target
                                                                .value
                                                        )
                                                    }
                                                    placeholder="Hvad handler din ticket om?"
                                                    maxLength={150}
                                                />

                                                <label>
                                                    Besked
                                                </label>

                                                <textarea
                                                    className="textarea"
                                                    value={
                                                        supportMessage
                                                    }
                                                    onChange={e =>
                                                        setSupportMessage(
                                                            e.target
                                                                .value
                                                        )
                                                    }
                                                    placeholder="Beskriv dit problem..."
                                                    rows={6}
                                                    maxLength={5000}
                                                />

                                                <button
                                                    className="btn btn-primary"
                                                    type="submit"
                                                    disabled={
                                                        supportLoading
                                                    }
                                                >
                                                    🎫 Opret ticket
                                                </button>

                                            </form>

                                        </div>

                                        <div className="card">

                                            <div className="card-header">
                                                <div>
                                                    <h3>
                                                        Mine tickets
                                                    </h3>

                                                    <p>
                                                        Se dine
                                                        tidligere
                                                        support-sager.
                                                    </p>
                                                </div>

                                                <button
                                                    className="btn btn-secondary"
                                                    onClick={
                                                        loadUserTickets
                                                    }
                                                >
                                                    🔄 Opdater
                                                </button>
                                            </div>

                                            <div className="ticket-list">

                                                {userTickets.length ===
                                                0 ? (
                                                    <div className="empty-state">
                                                        <h3>
                                                            Ingen
                                                            tickets
                                                        </h3>

                                                        <p>
                                                            Du har
                                                            ikke
                                                            oprettet
                                                            nogen
                                                            tickets
                                                            endnu.
                                                        </p>
                                                    </div>
                                                ) : (
                                                    userTickets.map(
                                                        ticket => (
                                                            <button
                                                                key={
                                                                    ticket.id
                                                                }
                                                                className="ticket-card"
                                                                onClick={() =>
                                                                    openUserTicket(
                                                                        ticket
                                                                    )
                                                                }
                                                            >
                                                                <div className="ticket-card-top">

                                                                    <div>
                                                                        <strong>
                                                                            {
                                                                                ticket.subject
                                                                            }
                                                                        </strong>

                                                                        <small>
                                                                            #{ticket.id}
                                                                        </small>
                                                                    </div>

                                                                    <span
                                                                        className={
                                                                            statusClass(
                                                                                ticket.status
                                                                            )
                                                                        }
                                                                    >
                                                                        {statusLabel(
                                                                            ticket.status
                                                                        )}
                                                                    </span>

                                                                </div>

                                                                <div className="ticket-card-bottom">

                                                                    <span>
                                                                        {formatDate(
                                                                            ticket.updated_at ||
                                                                                ticket.created_at
                                                                        )}
                                                                    </span>

                                                                    <span>
                                                                        →
                                                                    </span>

                                                                </div>

                                                            </button>
                                                        )
                                                    )
                                                )}

                                            </div>

                                        </div>

                                    </>
                                ) : (
                                    <div className="ticket-detail">

                                        <button
                                            className="btn btn-secondary back-button"
                                            onClick={
                                                backToUserTickets
                                            }
                                        >
                                            ← Mine tickets
                                        </button>

                                        {supportError && (
                                            <div className="alert alert-error">
                                                {supportError}
                                            </div>
                                        )}

                                        {supportSuccess && (
                                            <div className="alert alert-success">
                                                {supportSuccess}
                                            </div>
                                        )}

                                        <div className="card ticket-header-card">

                                            <div>
                                                <h2>
                                                    {
                                                        selectedUserTicket.subject
                                                    }
                                                </h2>

                                                <p>
                                                    Ticket #
                                                    {
                                                        selectedUserTicket.id
                                                    }
                                                </p>
                                            </div>

                                            <span
                                                className={
                                                    statusClass(
                                                        selectedUserTicket.status
                                                    )
                                                }
                                            >
                                                {statusLabel(
                                                    selectedUserTicket.status
                                                )}
                                            </span>

                                        </div>

                                        <div className="card">

                                            <div className="ticket-user-info">

                                                <strong>
                                                    🎫 Support
                                                </strong>

                                                <span>
                                                    Oprettet{" "}
                                                    {formatDate(
                                                        selectedUserTicket.created_at
                                                    )}
                                                </span>

                                            </div>

                                            {renderTicketMessages(
                                                selectedUserTicket
                                            )}

                                        </div>

                                        {selectedUserTicket.status !==
                                            "closed" && (
                                            <div className="card ticket-reply-card">

                                                <h3>
                                                    Svar
                                                </h3>

                                                <textarea
                                                    className="textarea"
                                                    value={
                                                        userTicketReply
                                                    }
                                                    onChange={e =>
                                                        setUserTicketReply(
                                                            e.target
                                                                .value
                                                        )
                                                    }
                                                    placeholder="Skriv et svar..."
                                                    rows={5}
                                                    maxLength={5000}
                                                />

                                                <div className="ticket-actions">

                                                    <button
                                                        className="btn btn-primary"
                                                        disabled={
                                                            supportLoading
                                                        }
                                                        onClick={
                                                            replyToUserTicket
                                                        }
                                                    >
                                                        📤 Send svar
                                                    </button>

                                                    <button
                                                        className="btn btn-danger"
                                                        disabled={
                                                            supportLoading
                                                        }
                                                        onClick={
                                                            closeUserTicket
                                                        }
                                                    >
                                                        🔒 Luk ticket
                                                    </button>

                                                </div>

                                            </div>
                                        )}

                                    </div>
                                )}

                            </section>
                        )}

                    {/* ====================================================
                        LOGS
                    ==================================================== */}

                    {page === "logs" && isStaff && (
                        <section>

                            <div className="card">

                                <h2>
                                    📜 Logs
                                </h2>

                                <p>
                                    Log-systemet kan
                                    udvides med
                                    dashboard- og
                                    bot-events.
                                </p>

                                {logs.length > 0 ? (
                                    <div className="list">
                                        {logs.map(
                                            (log, index) => (
                                                <div
                                                    className="list-item"
                                                    key={
                                                        index
                                                    }
                                                >
                                                    {JSON.stringify(
                                                        log
                                                    )}
                                                </div>
                                            )
                                        )}
                                    </div>
                                ) : (
                                    <div className="empty-state">
                                        Ingen logs
                                        tilgængelige.
                                    </div>
                                )}

                            </div>

                        </section>
                    )}

                    {/* ====================================================
                        SYSTEM
                    ==================================================== */}

                    {page === "system" &&
                        (isOwner ||
                            isManager) && (
                            <section>

                                <div className="card">

                                    <h2>
                                        ⚙️ System
                                    </h2>

                                    <p>
                                        Systemindstillinger
                                        for Hjælper.
                                    </p>

                                    <div className="list">

                                        <div className="list-item">
                                            <strong>
                                                Din rolle
                                            </strong>

                                            <span
                                                className={roleClass(
                                                    user.role
                                                )}
                                            >
                                                {roleLabel(
                                                    user.role
                                                )}
                                            </span>
                                        </div>

                                        <div className="list-item">
                                            <strong>
                                                API
                                            </strong>

                                            <span>
                                                Hjælper V2
                                            </span>
                                        </div>

                                        <div className="list-item">
                                            <strong>
                                                Session
                                            </strong>

                                            <span>
                                                Aktiv
                                            </span>
                                        </div>

                                    </div>

                                </div>

                            </section>
                        )}

                    {/* ====================================================
                        ACCOUNT
                    ==================================================== */}

                    {page === "account" && (
                        <section>

                            <div className="card">

                                <div className="account-profile">

                                    {user.avatar ? (
                                        <img
                                            src={
                                                `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=256`
                                            }
                                            alt=""
                                            className="account-avatar"
                                        />
                                    ) : (
                                        <div className="account-avatar-placeholder">
                                            {user.username
                                                ?.charAt(
                                                    0
                                                )
                                                ?.toUpperCase()}
                                        </div>
                                    )}

                                    <div>
                                        <h2>
                                            {user.username}
                                        </h2>

                                        <span
                                            className={roleClass(
                                                user.role
                                            )}
                                        >
                                            {roleLabel(
                                                user.role
                                            )}
                                        </span>

                                        <p>
                                            Discord ID:{" "}
                                            {user.id}
                                        </p>
                                    </div>

                                </div>

                            </div>

                            <div className="card">

                                <h3>
                                    🔐 Security
                                </h3>

                                <p>
                                    Aktive
                                    sessioner:{" "}
                                    {
                                        security
                                            ?.active_sessions
                                            ?.length
                                    }
                                </p>

                                <button
                                    className="btn btn-secondary"
                                    onClick={
                                        async () => {
                                            try {
                                                await apiFetch(
                                                    "/api/account/security/logout-all",
                                                    {
                                                        method:
                                                            "POST",
                                                    }
                                                );

                                                await loadAccount();
                                            } catch (
                                                err
                                            ) {
                                                setError(
                                                    err.message
                                                );
                                            }
                                        }
                                    }
                                >
                                    Log ud af andre
                                    sessioner
                                </button>

                            </div>

                            <div className="card">

                                <h3>
                                    🔗 Connected accounts
                                </h3>

                                {connected?.accounts?.map(
                                    connectedAccount => (
                                        <div
                                            className="list-item"
                                            key={
                                                connectedAccount.provider
                                            }
                                        >
                                            <strong>
                                                {
                                                    connectedAccount.provider
                                                }
                                            </strong>

                                            <span className="status-open">
                                                ✓ Forbundet
                                            </span>
                                        </div>
                                    )
                                )}

                            </div>

                        </section>
                    )}

                </div>

            </main>

        </div>
    );
}
