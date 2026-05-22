import React, { useState, useEffect } from "react";
import rawAxios from "axios";
import { PASSWORD_KEY } from "../../services/axiosInstance";
import usePreviewMode from "../../hooks/usePreviewMode";

const styles = {
  backdrop: {
    position: "fixed",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "var(--bg-color)",
    zIndex: 9999,
  },
  card: {
    background: "var(--card-bg)",
    border: "var(--border-width) solid var(--border-color)",
    boxShadow: "var(--shadow)",
    borderRadius: "var(--radius)",
    padding: "2rem 2.5rem",
    width: "100%",
    maxWidth: "360px",
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  title: {
    margin: 0,
    fontSize: "1.25rem",
    fontWeight: 700,
    color: "var(--text-main)",
  },
  subtitle: {
    margin: 0,
    fontSize: "0.8rem",
    color: "var(--text-dim)",
  },
  input: {
    width: "100%",
    padding: "0.6rem 0.75rem",
    background: "var(--bg-color)",
    border: "var(--border-width) solid var(--border-color)",
    borderRadius: "var(--radius-sm)",
    color: "var(--text-main)",
    fontFamily: "inherit",
    fontSize: "0.9rem",
    outline: "none",
    boxSizing: "border-box",
  },
  button: {
    padding: "0.6rem 1rem",
    background: "var(--primary)",
    border: "var(--border-width) solid var(--border-color)",
    boxShadow: "var(--shadow-sm)",
    borderRadius: "var(--radius-sm)",
    color: "var(--text-main)",
    fontFamily: "inherit",
    fontSize: "0.9rem",
    fontWeight: 600,
    cursor: "pointer",
  },
  error: {
    margin: 0,
    fontSize: "0.8rem",
    color: "#c0392b",
  },
};

async function ping(password) {
  const headers = password ? { "x-app-password": password } : {};
  return rawAxios.get("/ping", { headers });
}

export default function PasswordGate({ children }) {
  const previewMode = usePreviewMode();
  const [status, setStatus] = useState("checking");
  const [input, setInput] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    // First try without a password — if it works, no auth is configured on this server
    ping()
      .then(() => setStatus("unlocked"))
      .catch(async (e) => {
        if (e.response?.status !== 401) {
          setStatus("locked");
          return;
        }
        // Auth is required — try the stored password if we have one
        const stored = localStorage.getItem(PASSWORD_KEY);
        if (!stored) {
          setStatus("locked");
          return;
        }
        ping(stored)
          .then(() => setStatus("unlocked"))
          .catch(() => {
            localStorage.removeItem(PASSWORD_KEY);
            setStatus("locked");
          });
      });
  }, []);

  useEffect(() => {
    const onLogout = () => {
      setStatus("locked");
      setError("Session expired — please re-enter the password.");
    };
    window.addEventListener("auth:logout", onLogout);
    return () => window.removeEventListener("auth:logout", onLogout);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    setStatus("checking");
    try {
      await ping(trimmed);
      localStorage.setItem(PASSWORD_KEY, trimmed);
      setStatus("unlocked");
      setError("");
    } catch {
      setStatus("locked");
      setError("Wrong password, try again.");
    }
  };

  if (previewMode || status === "unlocked") return children;

  return (
    <div style={styles.backdrop}>
      <div style={styles.card}>
        <h2 style={styles.title}>OpenNote</h2>
        <p style={styles.subtitle}>Enter the access password to continue.</p>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <input
            style={styles.input}
            type="password"
            placeholder="Password"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            autoFocus
            disabled={status === "checking"}
          />
          <button style={styles.button} type="submit" disabled={status === "checking"}>
            {status === "checking" ? "Checking…" : "Enter"}
          </button>
          {error && <p style={styles.error}>{error}</p>}
        </form>
      </div>
    </div>
  );
}
