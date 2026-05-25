import { useState } from "react";
import { Smartphone } from "lucide-react";

const DISMISSED_KEY = "mobilePromptDismissed";

export default function MobilePromptModal({ blocked }) {
  const [visible, setVisible] = useState(
    () => window.innerWidth < 900 && !localStorage.getItem(DISMISSED_KEY),
  );

  if (!visible || blocked) return null;

  const dismiss = () => {
    localStorage.setItem(DISMISSED_KEY, "1");
    setVisible(false);
  };

  return (
    <div className="modal-backdrop">
      <div
        className="modal-content"
        style={{ maxWidth: 340, textAlign: "center" }}
      >
        <div className="modal-body" style={{ paddingTop: 12 }}>
          <p style={{ margin: "0 0 8px", fontWeight: 600, fontSize: 15 }}>
            Small screen detected
          </p>
          <p
            style={{
              margin: "0 0 20px",
              fontSize: 13,
              color: "var(--text-dim)",
              lineHeight: 1.5,
            }}
          >
            OpenNote has a mobile version optimised for your screen size.
          </p>
          <a
            href="/mobile"
            style={{
              display: "block",
              padding: "8px 16px",
              marginBottom: 10,
              background: "var(--accent)",
              color: "#fff",
              borderRadius: "var(--radius-sm)",
              textDecoration: "none",
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            Go to mobile
          </a>
          <button
            onClick={dismiss}
            style={{
              background: "none",
              border: "none",
              color: "var(--text-dim)",
              cursor: "pointer",
              fontSize: 13,
              fontFamily: "inherit",
              padding: "4px 8px",
            }}
          >
            Continue with desktop
          </button>
        </div>
      </div>
    </div>
  );
}
