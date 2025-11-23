import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const [err, setErr] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();
  const dropRef = useRef(null);

  // CRA uses process.env.REACT_APP_*
  const base = process.env.REACT_APP_API_URL;

  // Drag & drop listeners
  useEffect(() => {
    const el = dropRef.current;
    if (!el) return;

    const prevent = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };
    const onEnter = (e) => {
      prevent(e);
      el.classList.add("is-dragover");
    };
    const onOver = (e) => {
      prevent(e);
      el.classList.add("is-dragover");
    };
    const onLeave = (e) => {
      prevent(e);
      el.classList.remove("is-dragover");
    };
    const onDrop = (e) => {
      prevent(e);
      el.classList.remove("is-dragover");
      if (e.dataTransfer?.files?.[0]) {
        setFile(e.dataTransfer.files[0]);
      }
    };

    el.addEventListener("dragenter", onEnter);
    el.addEventListener("dragover", onOver);
    el.addEventListener("dragleave", onLeave);
    el.addEventListener("drop", onDrop);

    return () => {
      el.removeEventListener("dragenter", onEnter);
      el.removeEventListener("dragover", onOver);
      el.removeEventListener("dragleave", onLeave);
      el.removeEventListener("drop", onDrop);
    };
  }, []);

  // MAIN Upload & Scan
  async function handleUpload() {
    if (!file) {
      setErr("Please choose a file before scanning.");
      return;
    }

    setUploading(true);
    setErr("");

    try {
      const form = new FormData();
      form.append("file", file);

      const res = await fetch(`${base}/scan`, {
        method: "POST",
        body: form,
      });

      if (!res.ok) {
        const t = await res.text();
        setErr(`Upload failed: ${res.status} ${t}`);
        setUploading(false);
        return;
      }

      const data = await res.json(); // { summary, results }

      // Convert backend results to reports-page format
      const flatFindings = [];

      if (Array.isArray(data.results)) {
        data.results.forEach((item, idx) => {
          const riskScore = item.risk_score ?? item.score ?? 0;
          const riskLevel =
            riskScore >= 5 ? "High" : riskScore > 0 ? "Medium" : "Low";

          const snippet = item.snippet ?? item.text_snippet ?? "";

          const findings = Array.isArray(item.findings) ? item.findings : [];
          findings.forEach((f, i) => {
            const type = f.type || "PII";
            let recommendation = "Consider removing or limiting this information.";

            if (type === "PHONE") {
              recommendation =
                "Avoid posting phone numbers in captions or comments.";
            } else if (type === "EMAIL") {
              recommendation =
                "Remove personal email from public posts or bios.";
            } else if (type === "ADDRESS") {
              recommendation =
                "Never share home or work addresses publicly.";
            }

            flatFindings.push({
              id: `${idx}-${i}`,
              platform: "Instagram",
              riskLevel,
              category: type,
              snippet,
              recommendation,
            });
          });
        });
      }

      const report = {
        scope: "Instagram data export",
        generatedAt: new Date().toISOString(),
        totalFindings: flatFindings.length,
        findings: flatFindings,
      };

      navigate("/reports", { state: { report } });
    } catch (e) {
      setErr(`Upload failed: ${e.message}`);
    } finally {
      setUploading(false);
    }
  }

  return (
    <main style={styles.page}>
      <h1 style={styles.title}>Privacy Risk Dashboard</h1>
      {err && <div style={styles.note}>Error: {err}</div>}

      <section style={styles.glass}>
        <div style={styles.glassHeader}>
          <div style={styles.glassTitle}>
            <span style={styles.badge}>New</span>
            Upload data to generate a report
          </div>
          <p style={styles.subtle}>
            Upload your Instagram export ZIP. We’ll analyze it and generate a detailed report.
          </p>
        </div>

        {/* Upload zone */}
        <div ref={dropRef} style={styles.dropzone} className="dropzone">
          <div style={styles.dropInner}>
            <div style={styles.cloud}>☁️</div>
            <div>
              <div style={{ fontWeight: 600 }}>Drag & drop your file here</div>
              <div style={styles.subtle}>or</div>
            </div>

            <label style={styles.pickButton}>
              Choose File
              <input
                type="file"
                accept=".zip"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                style={{ display: "none" }}
              />
            </label>
          </div>

          {file && <div style={styles.fileName}>Selected: {file.name}</div>}
        </div>

        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          style={{
            ...styles.cta,
            ...((!file || uploading) ? styles.ctaDisabled : {}),
          }}
        >
          {uploading ? "Analyzing…" : "Analyze & View Report"}
        </button>
      </section>

      <style>{`
        .dropzone.is-dragover {
          outline: 2px dashed rgba(255,255,255,0.8);
          background: rgba(255,255,255,0.1);
        }
      `}</style>
    </main>
  );
}

// Styles
const styles = {
  page: { padding: 16, color: "#0b1f26" },
  title: { marginBottom: 8 },
  note: { color: "red", marginBottom: 10 },

  glass: {
    margin: "16px 0 24px",
    padding: 20,
    borderRadius: 16,
    background: "rgba(255,255,255,0.2)",
    border: "1px solid rgba(255,255,255,0.35)",
    backdropFilter: "blur(6px)",
  },

  glassHeader: { marginBottom: 12 },
  glassTitle: {
    fontSize: 20,
    fontWeight: 700,
    display: "flex",
    gap: 8,
  },

  badge: {
    background: "linear-gradient(135deg,#8be3ff,#6ecbff)",
    padding: "2px 8px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
  },

  subtle: { opacity: 0.8, fontSize: 13 },
  dropzone: {
    marginTop: 8,
    borderRadius: 14,
    background: "rgba(255,255,255,0.12)",
    outline: "2px dashed rgba(255,255,255,0.5)",
    padding: 18,
  },
  dropInner: {
    display: "grid",
    placeItems: "center",
    textAlign: "center",
    gap: 8,
  },
  cloud: { fontSize: 32, marginBottom: 6 },
  pickButton: {
    background: "white",
    padding: "6px 12px",
    borderRadius: 10,
    fontWeight: 600,
    cursor: "pointer",
  },
  fileName: { marginTop: 8, opacity: 0.8 },

  cta: {
    marginTop: 14,
    padding: "10px 14px",
    borderRadius: 12,
    border: "none",
    fontWeight: 700,
    background: "linear-gradient(135deg,#aaf7ff,#7de5ff)",
    cursor: "pointer",
  },
  ctaDisabled: { opacity: 0.5, cursor: "not-allowed" },
};
