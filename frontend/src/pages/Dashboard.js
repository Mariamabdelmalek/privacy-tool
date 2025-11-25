// src/pages/Dashboard.js
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const [err, setErr] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const dropRef = useRef(null);
  const navigate = useNavigate();

  const base = process.env.REACT_APP_API_URL;

  /* -----------------------------
     Drag & Drop Listeners
  ------------------------------ */
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

  /* -----------------------------
     Upload → Backend → Navigate
  ------------------------------ */
  async function handleUpload() {
    if (!file) return setErr("Please upload a file.");

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
        setErr(`Upload failed: ${t}`);
        setUploading(false);
        return;
      }

      const data = await res.json(); // { summary, results }
      const results = data.results ?? [];

      /* Convert backend → display format */
      const flatFindings = [];
      results.forEach((item, index) => {
        const snippet = item.snippet || item.text_snippet || "";
        const score = item.score ?? item.risk_score ?? 0;

        const riskLevel =
          score >= 4 ? "High" :
          score >= 2 ? "Medium" :
          score > 0 ? "Low" : "Safe";

        (item.findings || []).forEach((f, i) => {
          flatFindings.push({
            id: `${index}-${i}`,
            platform: "Instagram",
            riskLevel,
            category: f.type || "PII",
            snippet,
            recommendation: f.recommendation || "Review before posting.",
          });
        });
      });

      const report = {
        scope: "Instagram Export ZIP",
        generatedAt: new Date().toISOString(),
        summary: data.summary,     // <-- IMPORTANT
        findings: flatFindings,
        results: data.results,summary: data.summary,
        results,
        findings: flatFindings,
      };

      navigate("/reports", { state: { report } });
    } catch (e) {
      setErr(`Error: ${e.message}`);
    } finally {
      setUploading(false);
    }
  }

  return (
    <main style={styles.page}>
      <h1>Privacy Risk Dashboard</h1>

      {err && <div style={styles.err}>⚠ {err}</div>}

      <section style={styles.glass}>
        <p>Upload your Instagram export ZIP to analyze risks.</p>

        {/* Upload zone */}
        <div ref={dropRef} style={styles.dropzone} className="dropzone">
          <div style={styles.dropInner}>
            <div style={styles.cloud}>☁️</div>
            <b>Drag & drop your ZIP file</b>
            <span style={styles.subtle}>or</span>

            <label style={styles.pickButton}>
              Choose File
              <input
                type="file"
                accept=".zip"
                style={{ display: "none" }}
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </label>
          </div>

          {file && <div style={styles.filename}>Selected: {file.name}</div>}
        </div>

        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          style={{ ...styles.cta, ...(uploading || !file ? styles.disabled : {}) }}
        >
          {uploading ? "Analyzing..." : "Analyze & View Report"}
        </button>
      </section>

      {/* Dragover CSS */}
      <style>
        {`
          .dropzone.is-dragover {
            outline: 2px dashed #fff;
            background: rgba(255,255,255,0.1);
          }
        `}
      </style>
    </main>
  );
}

/* ---------------- STYLES ---------------- */
const styles = {
  page: { padding: 20 },
  err: { color: "red", marginBottom: 10 },

  glass: {
    padding: 20,
    borderRadius: 14,
    background: "rgba(255,255,255,0.15)",
    backdropFilter: "blur(6px)",
    border: "1px solid rgba(255,255,255,0.3)",
  },

  dropzone: {
    marginTop: 20,
    padding: 20,
    borderRadius: 14,
    outline: "2px dashed rgba(255,255,255,0.5)",
  },
  dropInner: {
    display: "grid",
    textAlign: "center",
    gap: 10,
    placeItems: "center",
  },
  cloud: { fontSize: 32 },

  pickButton: {
    background: "white",
    padding: "8px 14px",
    borderRadius: 10,
    cursor: "pointer",
    fontWeight: 600,
  },

  filename: { marginTop: 8, opacity: 0.8 },

  cta: {
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
    border: "none",
    background: "linear-gradient(135deg,#87e8ff,#59d2ff)",
    fontWeight: 700,
    cursor: "pointer",
  },
  disabled: { opacity: 0.5, cursor: "not-allowed" },

  subtle: { opacity: 0.7, fontSize: 12 },
};
  