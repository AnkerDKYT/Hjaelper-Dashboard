import React, { useState } from "react";

const ADMIN_CODE = "5378";

export default function App() {
  const [page, setPage] = useState("home");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  function checkCode() {
    if (code === ADMIN_CODE) {
      setError("");
      setCode("");
      setPage("dashboard");
    } else {
      setError("❌ Forkert admin-kode");
      setCode("");
    }
  }

  if (page === "dashboard") {
    return (
      <div className="admin-page">
        <div className="admin-card">
          <div className="bot-icon">🤖</div>

          <h1>Hjælper</h1>

          <p style={{ color: "#b9bfcc", marginTop: "10px" }}>
            🔐 Admin Dashboard
          </p>

          <button
            className="admin-button"
            onClick={() => setPage("home")}
            style={{ marginTop: "25px" }}
          >
            ← Log ud
          </button>
        </div>

        <div className="version">
          Hjælper Dashboard • V1
        </div>
      </div>
    );
  }

  if (page === "login") {
    return (
      <div className="admin-page">
        <div className="admin-card">
          <div className="bot-icon">🔐</div>

          <h1>Admin adgang</h1>

          <p style={{ color: "#b9bfcc", marginTop: "10px" }}>
            Indtast admin-koden for at fortsætte.
          </p>

          <input
            type="password"
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              setError("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                checkCode();
              }
            }}
            placeholder="Admin-kode"
            maxLength={4}
            className="code-input"
          />

          {error && <div className="error">{error}</div>}

          <div className="buttons">
            <button className="admin-button" onClick={checkCode}>
              🔓 Fortsæt
            </button>

            <button
              className="login-button"
              onClick={() => {
                setPage("home");
                setCode("");
                setError("");
              }}
              style={{ cursor: "pointer", opacity: 1 }}
            >
              ← Tilbage
            </button>
          </div>
        </div>

        <div className="version">
          Hjælper Dashboard • V1
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-card">
        <div className="bot-icon">🤖</div>

        <h1>Hjælper</h1>

        <div className="buttons">
          <button
            className="admin-button"
            onClick={() => setPage("login")}
          >
            🔐 Admin adgang
          </button>

          <button className="login-button" disabled>
            🔵 Log ind
            <span>Kommer snart</span>
          </button>
        </div>
      </div>

      <div className="version">
        Hjælper Dashboard • V2
      </div>
    </div>
  );
}
