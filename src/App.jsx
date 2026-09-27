import React from "react";

export default function App() {
  return (
    <div className="landing-page">
      <div className="landing-card">

        <div className="bot-icon">
          🤖
        </div>

        <h1>Hjælper</h1>

        <p className="subtitle">
          Dit Discord-dashboard
        </p>

        <p className="description">
          Administrer din Discord-server med Hjælper.
          Log ind med Discord for at komme i gang.
        </p>

        <button className="discord-login">
          <span>💬</span>
          Log ind med Discord
        </button>

        <p className="login-info">
          Du vælger først din Discord-server efter login.
        </p>

      </div>

      <footer>
        Hjælper Dashboard • V1
      </footer>
    </div>
  );
}
