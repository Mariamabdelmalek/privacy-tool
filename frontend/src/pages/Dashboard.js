// src/pages/Dashboard.js
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const [err, setErr] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const dropRef = useRef(null);
  const navigate = useNavigate();

  // Render environment API URL
  const base = process.env.REACT_APP_API_URL;

  /*---------------------------
    Drag & Drop upload handler
  ----------------------------*/
  useEffect(() => {
    const el = dropRef.current;
    if (!el) return;

    const prevent = (e) => { e.preventDefault(); e.stopPropagation(); };

    const onEnter = (e) => { prevent(e); el.classList.add("is-dragover"); };
    const onOver = (e) => { prevent(e); el.classList.add("is-dragover"); };
    const onLeave = (e) => { prevent(e); el.classList.remove("is-dragover"); };

    const onDrop = (e) => {
      prevent(e);
      el.classList.remove("is-dragover");
      if (e.dataTransfer?.files?.[0]) setFile(e.dataTransfer.files[0]);
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

  /*---------------------------
    Upload + Scan file
  ----------------------------*/
  async function handleUpload() {
    if (!file) {
      setErr("Please select a ZIP file.");
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
        const message = await res.text();
        setErr(`Upload failed: ${message}`);
        setUploading(false);
        return;
      }

      const data = await res.json(); // { summary, results }

      /* ------------------------
         Convert backend → report format
      -------------------------*/
      const flatFindings = [];

      if (Array.isArray(data.results)) {
        data.results.forEach((item, index) => {
          const snippet = item.snippet || item.text_snippet || "";
          const score = item.score ?? item.risk_score ?? 0;

          const riskLevel =
            score >= 4 ? "High" :
            score >= 2 ? "Medium" :
            score > 0 ? "Low" : "Safe";

          const findings = Array.isArray(item.findings) ? item.findings : [];

          findings.forEach((f, i) => {
            const type = f.type || "PII";

            let recommendation = "Review this data before posting.";
            if (type === "PHONE") recommendation = "Avoid posting phone numbers publicly.";
            if (type === "EMAIL") recommendation = "Avoid posting email addresses.";
            if (type === "ADDRESS") recommendation = "Avoid posting home/work addresses.";

            flatFindings.push({
              id: `${index}-${i}`,
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
        scope: "Instagram Export ZIP",
        generatedAt: new Date().toISOString(),
        totalFindings: flatFindings.length,
        findings: flatFindings,
        results: data.results, // needed for pie chart
      };

      navigate("/reports", { state: { report } });

    } catch (e) {
      setErr(`Upload error: ${e.message}`);
    } finally {
      setUploading(false);
    }
  }

  return (
    <main style={styles.page}>
      <h1 style={styles.title}>Privacy Risk Dashboard</h1>

      {err && <div style={styles.error}>⚠ {err}</div>}

      <section style={styles.glass}>
        <div style={styles.header}>
          <span style={styles.badge}>New</span>
          <p>Upload your Instagram ZIP export for analysis.</p>
        </div>

        {/* Dropzone */}
        <div ref={dropRef} style={styles.dropzone} className="dropzone">
          <div style={styles.dropInner}>
            <div style={styles.cloud}>☁️</div>
            <strong>Drag & drop your ZIP here</strong>
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
          {uploading ? "Analyzing…" : "Analyze & View Report"}
        </button>
      </section>

      {/* Inline dragover style */}
      <style>{`
        .dropzone.is-dragover {
          outline: 2px dashed #fff;
          background: rgba(255,255,255,0.1);
        }
      `}</style>
    </main>
  );
}

/* ------------------------------
   Styles
------------------------------ */
const styles = {
  page: { padding: 20, color: "#0b1f26" },
  title: { fontSize: 24, marginBottom: 15 },
  error: { color: "red", marginBottom: 10 },

  glass: {
    padding: 20,
    borderRadius: 16,
    background: "rgba(255,255,255,0.2)",
    border: "1px solid rgba(255,255,255,0.3)",
    backdropFilter: "blur(5px)",
  },

  header: { marginBottom: 10 },
  badge: {
    display: "inline-block",
    background: "#8be3ff",
    padding: "3px 8px",
    borderRadius: 8,
    fontWeight: 600,
    marginBottom: 6,
  },

  dropzone: {
    marginTop: 10,
    padding: 20,
    borderRadius: 14,
    outline: "2px dashed rgba(255,255,255,0.5)",
  },
  dropInner: { textAlign: "center", display: "grid", placeItems: "center", gap: 6 },
  cloud: { fontSize: 32 },
  pickButton: {
    background: "#fff",
    padding: "6px 12px",
    borderRadius: 10,
    fontWeight: 700,
    cursor: "pointer",
  },
  filename: { marginTop: 8, opacity: 0.8 },

  cta: {
    marginTop: 14,
    padding: "10px 14px",
    background: "linear-gradient(135deg,#7de5ff,#b4f0ff)",
    borderRadius: 12,
    fontWeight: 700,
    cursor: "pointer",
    border: "none",
  },
  disabled: { opacity: 0.5, cursor: "not-allowed" },

  subtle: { opacity: 0.7, fontSize: 12 },
};
