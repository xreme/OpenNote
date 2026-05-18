import { useState, useEffect, useRef } from "react";
import { CheckCircle, AlertCircle, ChevronDown, Loader2, ChevronLeft } from "lucide-react";

export default function AddPage() {
  const [collections, setCollections] = useState([]);
  const [collectionId, setCollectionId] = useState("");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("idle"); // idle | success | error
  const [errorMsg, setErrorMsg] = useState("");
  const [pendingFile, setPendingFile] = useState(null);
  const fileRef = useRef(null);

  useEffect(() => {
    fetch("/collections")
      .then((r) => r.json())
      .then((data) => {
        setCollections(data);
        if (data.length > 0) setCollectionId(data[0].id);
      })
      .catch(() => {});
  }, []);

  const reset = () => {
    setStatus("idle");
    setErrorMsg("");
    setPendingFile(null);
    setUrl("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleError = (err) => {
    setStatus("error");
    setErrorMsg(err.message || "Something went wrong. Please try again.");
  };

  const submitUrl = async (e) => {
    e.preventDefault();
    if (!url.trim() || !collectionId || loading) return;
    setLoading(true);
    setStatus("idle");
    try {
      const res = await fetch("/upload/url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim(), collectionId }),
      });
      if (!res.ok) throw new Error(await res.text());
      setStatus("success");
      setUrl("");
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) setPendingFile(file);
  };

  const submitFile = async () => {
    if (!pendingFile || !collectionId || loading) return;
    setLoading(true);
    setStatus("idle");
    const formData = new FormData();
    formData.append("videos", pendingFile);
    formData.append("collectionId", collectionId);
    try {
      const res = await fetch("/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error(await res.text());
      setStatus("success");
      setPendingFile(null);
      if (fileRef.current) fileRef.current.value = "";
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  if (status === "success") {
    return (
      <div style={{ ...s.page, justifyContent: "center" }}>
        <div style={{ ...s.card, alignItems: "center", textAlign: "center", gap: "16px" }}>
          <CheckCircle size={52} style={{ color: "var(--success)" }} />
          <h2 style={{ margin: 0, fontSize: "20px" }}>Added to vault</h2>
          <p style={{ margin: 0, color: "var(--text-dim)", fontSize: "14px" }}>
            Your content is being processed.
          </p>
          <button style={s.btn} onClick={reset}>Add Another</button>
        </div>
      </div>
    );
  }

  return (
    <div style={s.page}>
      <header style={s.header}>
        <a
          href="/library"
          style={{
            display: "inline-flex", alignItems: "center", gap: "4px",
            fontSize: "12px", color: "var(--text-dim)", textDecoration: "none",
            marginBottom: "16px", fontFamily: "inherit",
          }}
        >
          <ChevronLeft size={14} /> Library
        </a>
        <div style={{ color: "var(--primary)", fontWeight: 800, fontSize: "22px", letterSpacing: "0.12em" }}>
          OPENNOTE
        </div>
        <div style={{ color: "var(--text-dim)", fontSize: "13px", marginTop: "4px", letterSpacing: "0.06em" }}>
          Add to vault
        </div>
      </header>

      <div style={s.card}>
        {/* Collection */}
        <div style={s.field}>
          <label style={s.label}>Collection</label>
          <div style={{ position: "relative" }}>
            <select
              value={collectionId}
              onChange={(e) => setCollectionId(e.target.value)}
              style={s.select}
              disabled={collections.length === 0}
            >
              {collections.length === 0 && <option>Loading...</option>}
              {collections.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
            <ChevronDown
              size={16}
              style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--text-dim)" }}
            />
          </div>
        </div>

        <div style={s.divider} />

        {/* URL */}
        <form onSubmit={submitUrl} style={s.field}>
          <label style={s.label}>Paste a link</label>
          <input
            type="url"
            placeholder="https://youtube.com/watch?v=..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            style={s.input}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
          />
          <button
            type="submit"
            style={{ ...s.btn, opacity: (!url.trim() || !collectionId || loading) ? 0.5 : 1 }}
            disabled={!url.trim() || !collectionId || loading}
          >
            {loading && !pendingFile ? <Loader2 size={16} className="spin" /> : null}
            {loading && !pendingFile ? "Adding…" : "Add Link"}
          </button>
        </form>

        <div style={{ ...s.divider, display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ flex: 1, height: "1px", background: "var(--card-border)" }} />
          <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-dim)", letterSpacing: "0.08em", textTransform: "uppercase" }}>or</span>
          <div style={{ flex: 1, height: "1px", background: "var(--card-border)" }} />
        </div>

        {/* File upload */}
        <div style={s.field}>
          <label style={s.label}>Upload a file</label>
          <input
            ref={fileRef}
            type="file"
            accept="video/*"
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={loading}
            style={{ ...s.btn, background: "var(--bg-color)", color: "var(--text-main)", border: "var(--border-width) solid var(--card-border)", boxShadow: "none" }}
          >
            {pendingFile ? `📎 ${pendingFile.name}` : "Choose a video"}
          </button>

          {pendingFile && (
            <button
              type="button"
              onClick={submitFile}
              disabled={!collectionId || loading}
              style={{ ...s.btn, opacity: (!collectionId || loading) ? 0.5 : 1 }}
            >
              {loading && pendingFile ? <Loader2 size={16} className="spin" /> : null}
              {loading && pendingFile ? "Uploading…" : "Upload File"}
            </button>
          )}
        </div>

        {status === "error" && (
          <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", color: "#d94f4f", fontSize: "13px", lineHeight: 1.5 }}>
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: "1px" }} />
            {errorMsg}
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  page: {
    position: "fixed",
    inset: 0,
    overflowY: "auto",
    WebkitOverflowScrolling: "touch",
    overscrollBehavior: "none",
    background: "var(--bg-color)",
    color: "var(--text-main)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "40px 16px 60px",
    paddingTop: "calc(40px + env(safe-area-inset-top))",
    fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
  },
  header: {
    textAlign: "center",
    marginBottom: "28px",
  },
  card: {
    width: "100%",
    maxWidth: "460px",
    background: "var(--card-bg)",
    border: "var(--border-width) solid var(--card-border)",
    borderRadius: "var(--radius-lg)",
    padding: "24px",
    boxShadow: "var(--shadow)",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  label: {
    fontSize: "11px",
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "var(--text-dim)",
  },
  input: {
    width: "100%",
    padding: "14px",
    fontSize: "16px",
    fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
    border: "var(--border-width) solid var(--card-border)",
    borderRadius: "var(--radius)",
    background: "var(--bg-color)",
    color: "var(--text-main)",
    outline: "none",
    boxSizing: "border-box",
  },
  select: {
    width: "100%",
    padding: "14px 40px 14px 14px",
    fontSize: "16px",
    fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
    border: "var(--border-width) solid var(--card-border)",
    borderRadius: "var(--radius)",
    background: "var(--bg-color)",
    color: "var(--text-main)",
    outline: "none",
    appearance: "none",
    cursor: "pointer",
    boxSizing: "border-box",
  },
  btn: {
    width: "100%",
    padding: "14px",
    fontSize: "14px",
    fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
    fontWeight: 700,
    background: "var(--primary)",
    color: "#1a1a18",
    border: "var(--border-width) solid var(--border-color)",
    borderRadius: "var(--radius)",
    boxShadow: "var(--shadow-sm)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    letterSpacing: "0.04em",
    boxSizing: "border-box",
  },
  divider: {
    margin: "0",
  },
};
