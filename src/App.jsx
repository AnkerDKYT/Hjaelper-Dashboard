import React, { useState, useEffect } from 'react';
import "./style.css";

/* ======================================================
   HOVEDKOMPONENT
====================================================== */

export default function App() {
  const [user, setUser] = useState(null);
  const [currentTab, setCurrentTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  // Support / Tickets states
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [replyMessage, setReplyMessage] = useState('');
  const [messagesList, setMessagesList] = useState([]);

  // Account states
  const [profileUsername, setProfileUsername] = useState('');
  const [sessions, setSessions] = useState([]);

  // Simulerer hentning af brugerdata og initialisering
  useEffect(() => {
    // Eksempel-bruger til test/udvikling - kan erstattes med rigtig API-kald
    setTimeout(() => {
      setUser({
        id: '123456789',
        username: 'AdminUser',
        discriminator: '0001',
        avatar: null,
        role: 'admin', // eller 'user'
      });
      setProfileUsername('AdminUser');
      setLoading(false);
    }, 500);
  }, []);

  // Håndter oprettelse af ticket
  const handleCreateTicket = (e) => {
    e.preventDefault();
    if (!ticketSubject || !ticketMessage) return;

    const newTicket = {
      id: Date.now().toString().slice(-4),
      subject: ticketSubject,
      message: ticketMessage,
      username: user?.username || 'Bruger',
      status: 'Åben',
    };

    setTickets([newTicket, ...tickets]);
    setTicketSubject('');
    setTicketMessage('');
  };

  // Håndter svar på ticket
  const handleReplyTicket = (ticketId) => {
    if (!replyMessage) return;
    const newMsg = {
      sender: user?.username || 'Support',
      message: replyMessage,
    };
    setMessagesList([...messagesList, newMsg]);
    setReplyMessage('');
  };

  // Luk ticket
  const handleCloseTicket = (ticketId) => {
    setTickets(tickets.map(t => t.id === ticketId ? { ...t, status: 'Lukket' } : t));
    if (selectedTicket && selectedTicket.id === ticketId) {
      setSelectedTicket({ ...selectedTicket, status: 'Lukket' });
    }
  };

  if (loading) {
    return (
      <div className="loading-screen" style={{ color: '#fff', textAlign: 'center', marginTop: '20vh' }}>
        <h2>Indlæser Hjælper Dashboard...</h2>
      </div>
    );
  }

  const isStaff = user?.role === 'admin' || user?.role === 'moderator';

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <h2>Hjælper</h2>
          <span>Discord Bot Dashboard</span>
        </div>
        <nav className="sidebar-nav">
          <button 
            className={currentTab === 'overview' ? 'active' : ''} 
            onClick={() => { setCurrentTab('overview'); setSelectedTicket(null); }}
          >
            📊 Oversigt
          </button>
          <button 
            className={currentTab === 'support' ? 'active' : ''} 
            onClick={() => { setCurrentTab('support'); setSelectedTicket(null); }}
          >
            🎫 Support
          </button>
          <button 
            className={currentTab === 'roadmap' ? 'active' : ''} 
            onClick={() => { setCurrentTab('roadmap'); setSelectedTicket(null); }}
          >
            🗺️ Roadmap
          </button>
          {isStaff && (
            <button 
              className={currentTab === 'logs' ? 'active' : ''} 
              onClick={() => { setCurrentTab('logs'); setSelectedTicket(null); }}
            >
              📜 System Logs
            </button>
          )}
          {user?.role === 'admin' && (
            <button 
              className={currentTab === 'system' ? 'active' : ''} 
              onClick={() => { setCurrentTab('system'); setSelectedTicket(null); }}
            >
              ⚙️ System Status
            </button>
          )}
          <button 
            className={currentTab === 'account' ? 'active' : ''} 
            onClick={() => { setCurrentTab('account'); setSelectedTicket(null); }}
          >
            👤 Konto
          </button>
        </nav>
        
        <div className="sidebar-footer">
          <UserAvatar user={user} />
          <div className="user-info">
            <strong>{user?.username}</strong>
            <span>{user?.role || 'Bruger'}</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        {currentTab === 'overview' && <OverviewPage user={user} tickets={tickets} />}
        
        {currentTab === 'support' && !selectedTicket && (
          <SupportPage 
            tickets={tickets} 
            staff={isStaff} 
            onCreateTicket={handleCreateTicket}
            ticketSubject={ticketSubject}
            setTicketSubject={setTicketSubject}
            ticketMessage={ticketMessage}
            setTicketMessage={setTicketMessage}
            onOpenTicket={(ticket) => setSelectedTicket(ticket)}
          />
        )}

        {currentTab === 'support' && selectedTicket && (
          <TicketDetailView 
            selectedTicket={selectedTicket}
            messagesList={messagesList}
            replyMessage={replyMessage}
            setReplyMessage={setReplyMessage}
            onReply={handleReplyTicket}
            onClose={handleCloseTicket}
            onBack={() => setSelectedTicket(null)}
          />
        )}

        {currentTab === 'roadmap' && <Roadmap />}
        {currentTab === 'logs' && <LogsPage />}
        {currentTab === 'system' && <SystemPage user={user} />}
        {currentTab === 'account' && (
          <AccountPage 
            user={user}
            sessions={sessions}
            profileUsername={profileUsername}
            setProfileUsername={setProfileUsername}
            onSaveProfile={(e) => { e.preventDefault(); alert('Profil gemt!'); }}
            onLogoutAll={() => setSessions([])}
            onDeleteAccount={() => alert('Konto slettet (simuleret)')}
          />
        )}
      </main>
    </div>
  );
}

/* ======================================================
   UNDERSIDERS / KOMPONENTER
====================================================== */

function OverviewPage({ user, tickets }) {
  const openTicketsCount = tickets.filter(t => t.status === 'Åben').length;

  return (
    <div>
      <div className="page-heading">
        <div className="eyebrow">VELKOMMEN TILBAGE</div>
        <h2>Oversigt</h2>
        <p>Her er et hurtigt overblik over din bot og dine aktive sager.</p>
      </div>

      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '25px' }}>
        <div className="stat-card public-info-box">
          <span>Bot Status</span>
          <strong style={{ color: '#4BB543' }}>● Online</strong>
        </div>
        <div className="stat-card public-info-box">
          <span>Dine Åbne Tickets</span>
          <strong>{openTicketsCount}</strong>
        </div>
        <div className="stat-card public-info-box">
          <span>Brugerrolle</span>
          <strong>{user?.role?.toUpperCase()}</strong>
        </div>
      </div>

      <div className="public-info-box">
        <h3>Hurtige genveje</h3>
        <p>Brug menuen til venstre til at navigere rundt i systemet, oprette support-tickets eller administrere din konto.</p>
      </div>
    </div>
  );
}

function SupportPage({ 
  tickets, 
  staff, 
  onCreateTicket, 
  ticketSubject, 
  setTicketSubject, 
  ticketMessage, 
  setTicketMessage, 
  onOpenTicket 
}) {
  return (
    <div>
      <div className="page-heading">
        <div className="eyebrow">SUPPORT</div>
        <h2>{staff ? "Support Tickets (Admin)" : "Mine Tickets"}</h2>
        <p>{staff ? "Håndter indgående bruger-tickets." : "Opret og overvåg dine support-henvendelser."}</p>
      </div>

      {!staff && (
        <form onSubmit={onCreateTicket} className="public-info-box" style={{ marginBottom: "25px" }}>
          <h3>Opret ny ticket</h3>
          <input
            type="text"
            placeholder="Emne..."
            value={ticketSubject}
            onChange={(e) => setTicketSubject(e.target.value)}
            className="input-field"
            style={{ width: "100%", marginTop: "10px", padding: "10px" }}
          />
          <textarea
            placeholder="Beskriv dit problem..."
            value={ticketMessage}
            onChange={(e) => setTicketMessage(e.target.value)}
            className="input-field"
            rows="3"
            style={{ width: "100%", marginTop: "10px", padding: "10px" }}
          />
          <button type="submit" className="primary-button" style={{ marginTop: "15px" }}>
            Opret ticket
          </button>
        </form>
      )}

      <div className="stats-grid" style={{ display: 'grid', gap: '15px' }}>
        {tickets.length === 0 ? (
          <p>Ingen tickets fundet.</p>
        ) : (
          tickets.map((ticket) => (
            <div
              key={ticket.id}
              className="stat-card public-info-box"
              onClick={() => onOpenTicket(ticket)}
              style={{ cursor: "pointer", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <span>🎫 Ticket #{ticket.id}</span>
              <strong>{ticket.subject}</strong>
              <span style={{ fontSize: "12px", opacity: 0.7, marginTop: "5px", display: 'block' }}>Status: {ticket.status}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function TicketDetailView({ 
  selectedTicket, 
  messagesList, 
  replyMessage, 
  setReplyMessage, 
  onReply, 
  onClose, 
  onBack 
}) {
  return (
    <div>
      <button onClick={onBack} className="primary-button" style={{ marginBottom: "20px", background: "#444" }}>
        ← Tilbage til oversigt
      </button>

      <div className="page-heading">
        <div className="eyebrow">TICKET #{selectedTicket.id}</div>
        <h2>{selectedTicket.subject}</h2>
        <p>Status: <strong>{selectedTicket.status}</strong></p>
      </div>

      <div className="public-info-box" style={{ marginBottom: "20px" }}>
        <h3>Beskeder</h3>
        <div className="messages-list" style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "15px" }}>
          {selectedTicket.message && (
            <div className="message-card" style={{ padding: "10px", background: "rgba(255,255,255,0.05)", borderRadius: "6px" }}>
              <strong>{selectedTicket.username || "Bruger"}:</strong>
              <p style={{ marginTop: "5px" }}>{selectedTicket.message}</p>
            </div>
          )}

          {messagesList.map((msg, index) => (
            <div key={index} className="message-card" style={{ padding: "10px", background: "rgba(255,255,255,0.05)", borderRadius: "6px" }}>
              <strong>{msg.sender}:</strong>
              <p style={{ marginTop: "5px" }}>{msg.message}</p>
            </div>
          ))}
        </div>
      </div>

      {selectedTicket.status !== "Lukket" && (
        <div className="public-info-box">
          <h3>Svar på ticket</h3>
          <textarea
            className="input-field"
            rows="3"
            placeholder="Skriv et svar..."
            value={replyMessage}
            onChange={(e) => setReplyMessage(e.target.value)}
            style={{ width: "100%", marginTop: "10px", padding: "10px" }}
          />
          <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
            <button className="primary-button" onClick={() => onReply(selectedTicket.id)}>
              Send svar
            </button>
            <button className="logout-button" style={{ backgroundColor: "#d9534f", color: "white", border: 'none', padding: '10px 15px', borderRadius: '4px', cursor: 'pointer' }} onClick={() => onClose(selectedTicket.id)}>
              Luk ticket
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function AccountPage({
  user,
  sessions,
  profileUsername,
  setProfileUsername,
  onSaveProfile,
  onLogoutAll,
  onDeleteAccount,
}) {
  return (
    <div>
      <div className="page-heading">
        <div className="eyebrow">KONTO</div>
        <h2>Kontoindstillinger</h2>
        <p>Administrer din profil, sikkerhed og aktive sessioner.</p>
      </div>

      <form onSubmit={onSaveProfile} className="public-info-box" style={{ marginBottom: "20px" }}>
        <h3>Profil</h3>
        <label style={{ display: "block", marginTop: "10px", fontSize: "14px" }}>Brugernavn</label>
        <input
          type="text"
          value={profileUsername}
          onChange={(e) => setProfileUsername(e.target.value)}
          className="input-field"
          style={{ width: "100%", marginTop: "5px", padding: "10px" }}
        />
        <button type="submit" className="primary-button" style={{ marginTop: "15px" }}>
          Gem ændringer
        </button>
      </form>

      <div className="public-info-box" style={{ marginBottom: "20px" }}>
        <h3>Sikkerhed & Sessioner</h3>
        <p>Aktive sessioner: {sessions.length}</p>
        <button className="primary-button" onClick={onLogoutAll} style={{ marginTop: "10px" }}>
          Log ud af alle sessioner
        </button>
      </div>

      <div className="public-info-box" style={{ borderColor: "#d9534f" }}>
        <h3 style={{ color: "#d9534f" }}>Farlig zone</h3>
        <p>Slet din konto permanent fra systemet.</p>
        <button
          className="logout-button"
          style={{ marginTop: "15px", backgroundColor: "#d9534f", color: "white", border: 'none', padding: '10px 15px', borderRadius: '4px', cursor: 'pointer' }}
          onClick={onDeleteAccount}
        >
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
        <h2>Fremtidige opdateringer</h2>
        <p>Se hvad vi arbejder på for Hjælper.</p>
      </div>
      <div className="public-info-box">
        <h3>Kommende funktioner</h3>
        <p>• Udvidet automatisering<br />• Flere moderator-værktøjer<br />• Forbedret webhooks-integration</p>
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
        <p>Se seneste hændelser og fejlmeddelelser.</p>
      </div>
      <div className="public-info-box">
        <p>Ingen nylige kritiske logfiler fundet.</p>
      </div>
    </div>
  );
}

function SystemPage({ user }) {
  return (
    <div>
      <div className="page-heading">
        <div className="eyebrow">SYSTEM</div>
        <h2>Systemstatus & Diagnose</h2>
        <p>Avancerede systemindstillinger for ejere og managers.</p>
      </div>
      <div className="public-info-box">
        <h3>Node & Miljø</h3>
        <p>Rolle: {user?.role}</p>
      </div>
    </div>
  );
}

function UserAvatar({ user }) {
  const avatarUrl = user?.avatar
    ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
    : null;

  return (
    <div className="user-avatar" style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#5865F2", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
      {avatarUrl ? (
        <img src={avatarUrl} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <span style={{ color: '#fff', fontWeight: 'bold' }}>{user?.username?.[0]?.toUpperCase() || "U"}</span>
      )}
    </div>
  );
}
