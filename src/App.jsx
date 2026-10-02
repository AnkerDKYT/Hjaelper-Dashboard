import React, { useEffect, useState } from "react";
import "./style.css";

const API = "/backend";

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState("overview");
  const [error, setError] = useState("");

  const [status, setStatus] = useState({});
  const [stats, setStats] = useState({});
  const [cogs, setCogs] = useState({});
  const [servers, setServers] = useState({});

  const [selectedServer, setSelectedServer] = useState(null);
  const [leavingServer, setLeavingServer] = useState(false);

  useEffect(() => {
    async function loadUser() {
      try {
        const response = await fetch(`${API}/auth/me`, {
          credentials: "include",
        });

        const data = await response.json();

        if (data.authenticated && data.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error(err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  async function loadDashboard() {
    try {
      setError("");

      const [statusRes, statsRes, cogsRes, serversRes] =
        await Promise.all([
          fetch(`${API}/api/status`, {
            credentials: "include",
          }),

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

      if (statusRes.ok) {
        setStatus(await statusRes.json());
      }

      if (statsRes.ok) {
        setStats(await statsRes.json());
      }

      if (cogsRes.ok) {
        setCogs(await cogsRes.json());
      }

      if (serversRes.ok) {
        const serverData = await serversRes.json();

        setServers(serverData);

        if (selectedServer) {
          const stillExists = (serverData.servers || []).some(
            (server) => server.id === selectedServer.id
          );

          if (!stillExists) {
            setSelectedServer(null);
          }
        }
      }
    } catch (err) {
      console.error(err);
      setError("Kunne ikke hente data fra API'et.");
    }
  }

  useEffect(() => {
    if (!user) return;

    loadDashboard();

    const interval = setInterval(loadDashboard, 10000);

    return () => clearInterval(interval);
  }, [user]);

  function adminLogin() {
    window.location.href = `${API}/auth/discord`;
  }

  async function logout() {
    try {
      await fetch(`${API}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error(err);
    }

    setUser(null);
    setSelectedServer(null);
    setPage("overview");
  }

  async function reloadCogs() {
    try {
      setError("");

      const response = await fetch(`${API}/api/reload-cogs`, {
        method: "POST",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Kunne ikke reloade Cogs."
        );
      }

      await loadDashboard();
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  }

  async function leaveServer() {
    if (!selectedServer) {
      return;
    }

    const serverName = selectedServer.name;
    const serverId = selectedServer.id;

    const confirmed = window.confirm(
      `Er du sikker på, at Hjælper skal forlade "${serverName}"?\n\nServer ID: ${serverId}`
    );

    if (!confirmed) {
      return;
    }

    try {
      setLeavingServer(true);
      setError("");

      console.log(
        `🚪 Forsøger at få Hjælper til at forlade: ${serverName}`
      );

      const response = await fetch(
        `${API}/api/servers/${serverId}/leave`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      let data = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      console.log(
        "Leave server response:",
        response.status,
        data
      );

      if (!response.ok) {
        throw new Error(
