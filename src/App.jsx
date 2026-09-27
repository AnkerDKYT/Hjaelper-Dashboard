import React from "react";

export default function App() {
  return (
    <div className="admin-page">
      <div className="admin-card">

        <div className="bot-icon">
          🤖
        </div>

        <h1>Hjælper</h1>

        <div className="buttons">

          <button className="admin-button">
            🔐 Admin adgang
          </button>

          <button className="login-button">
            🔵 Log ind
            <span>Kommer snart</span>
          </button>

        </div>

      </div>

      <div className="version">
        Hjælper Dashboard • V1
      </div>
    </div>
  );
}
