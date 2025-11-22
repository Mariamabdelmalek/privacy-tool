import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const navigate = useNavigate();
    const dropRef = useRef(null);

    const base = import.meta?.env?.VITE_API_URL ? import.meta.env.VITE_API_URL : "";

    useEffect(() => {
        const url = `${base}/api/summary`;
        (async () => {
            try {
                const r = await fetch(url);
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                const data = await r.json();
                setSummary(data);
            } catch (e) {
                setErr(e.message);
                setSummary(null);
            } finally {
                setLoading(false);
            }
        })();
    }, [base]);

    // Drag & drop handlers (nice but optional)
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

    async function handleUpload() {
        if (!file) return;
        setUploading(true);
        setErr("");

        try {
            const form = new FormData();
            form.append("file", file); // field name MUST be "file"

            const res = await fetch(`${base}/api/report/upload`, {
                method: "POST",
                body: form,
            });

            if (!res.ok) {
                const t = await res.text();
                setErr(`Upload failed: ${res.status} ${t}`);
                setUploading(false);
                return;
            }

            const data = await res.json();
            navigate("/report", { state: { report: data } });
        } catch (e) {
            setErr(`Upload failed: ${e.message}`);
            setUploading(false);
        }
    }

    return (
        <main style={styles.page}>
            <h1 style={styles.title}>Privacy Risk Dashboard</h1>
            {err && <div style={styles.note}>Note: {err}</div>}

            {/* Glass card */}
            <section style={styles.glass}>
                <div style={styles.glassHeader}>
                    <div style={styles.glassTitle}>
                        <span style={styles.badge}>New</span>
                        Upload data to generate a report
                    </div>
                    <p style={styles.subtle}>
                        Choose your export file (JSON/CSV from a social platform). We’ll analyze it and show a detailed report.
                    </p>
                </div>

                {/* Dropzone */}
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
                                accept=".json,.csv,.txt,.xml,.html,.zip"
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
                    style={{ ...styles.cta, ...((!file || uploading) ? styles.ctaDisabled : {}) }}
                >
                    {uploading ? "Analyzing…" : "Analyze & View Report"}
                </button>
            </section>

            {/* Empty / summary state */}
            {!loading && summary && (summary.totalScans > 0 || (summary.recent?.length ?? 0) > 0) ? (
                <>
                    <section style={styles.kpiRow}>
                        <div style={styles.kpi}><div style={styles.kpiLabel}>Total Scans</div><div style={styles.kpiValue}>{summary?.totalScans ?? "-"}</div></div>
                        <div style={styles.kpi}><div style={styles.kpiLabel}>High Risk</div><div style={styles.kpiValue}>{summary?.highRisk ?? "-"}</div></div>
                        <div style={styles.kpi}><div style={styles.kpiLabel}>Medium Risk</div><div style={styles.kpiValue}>{summary?.mediumRisk ?? "-"}</div></div>
                        <div style={styles.kpi}><div style={styles.kpiLabel}>Low Risk</div><div style={styles.kpiValue}>{summary?.lowRisk ?? "-"}</div></div>
                    </section>

                    {summary.recent && summary.recent.length > 0 && (
                        <section style={styles.activity}>
                            <h2 style={styles.h2}>Recent Activity</h2>
                            <ul style={styles.list}>
                                {summary.recent.map((i) => (
                                    <li key={i.id} style={styles.listItem}>
                                        <span style={styles.dot} /> {i.platform} · {i.findings} findings · {new Date(i.createdAt).toLocaleString()}
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}
                </>
            ) : (
                <section style={styles.emptyPill}>
                    <b>No scans yet.</b>&nbsp; Upload a file above to generate your first report.
                </section>
            )}

            {/* lightweight page-scoped styles for dragover */}
            <style>{`
        .dropzone.is-dragover { outline: 2px dashed rgba(255,255,255,0.8); background: rgba(255,255,255,0.08); }
      `}</style>
        </main>
    );
}

/* ===== Styles (inline to avoid touching global SCSS) ===== */
const styles = {
    page: {
        padding: 16,
        color: "#0b1f26",
    },
    title: { marginBottom: 8 },
    note: { margin: "6px 0 12px", fontSize: 12, opacity: 0.75 },

    glass: {
        margin: "16px 0 24px",
        padding: 20,
        borderRadius: 16,
        background: "rgba(255,255,255,0.18)",
        boxShadow: "0 10px 30px rgba(0,0,0,0.18)",
        border: "1px solid rgba(255,255,255,0.35)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
    },
    glassHeader: { marginBottom: 12 },
    glassTitle: { fontSize: 20, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 },
    badge: {
        background: "linear-gradient(135deg,#8be3ff,#6ecbff)",
        color: "#053f5c",
        padding: "2px 8px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 700,
    },
    subtle: { fontSize: 13, opacity: 0.8, marginTop: 6 },

    dropzone: {
        position: "relative",
        marginTop: 8,
        borderRadius: 14,
        background: "rgba(255,255,255,0.12)",
        outline: "2px dashed rgba(255,255,255,0.5)",
        padding: 18,
        transition: "all .2s ease",
    },
    dropInner: {
        display: "grid",
        placeItems: "center",
        gap: 6,
        textAlign: "center",
    },
    cloud: { fontSize: 32, marginBottom: 6 },
    pickButton: {
        display: "inline-block",
        marginTop: 8,
        padding: "8px 12px",
        borderRadius: 10,
        background: "rgba(255,255,255,0.85)",
        color: "#0b1f26",
        fontWeight: 600,
        cursor: "pointer",
        boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
    },
    fileName: { marginTop: 8, fontSize: 13 },

    cta: {
        marginTop: 14,
        padding: "10px 14px",
        border: "none",
        borderRadius: 12,
        fontWeight: 700,
        color: "#053f5c",
        background: "linear-gradient(135deg,#aaf7ff,#7de5ff,#b4f0ff)",
        boxShadow: "0 6px 16px rgba(0,0,0,0.2)",
        cursor: "pointer",
    },
    ctaDisabled: { opacity: 0.5, cursor: "not-allowed", filter: "grayscale(20%)" },

    kpiRow: {
        display: "grid",
        gridTemplateColumns: "repeat(4, minmax(160px, 1fr))",
        gap: 12,
    },
    kpi: {
        padding: 14,
        borderRadius: 14,
        background: "rgba(255,255,255,0.16)",
        border: "1px solid rgba(255,255,255,0.35)",
        backdropFilter: "blur(6px)",
    },
    kpiLabel: { fontSize: 12, opacity: 0.8 },
    kpiValue: { fontSize: 28, fontWeight: 800, marginTop: 4 },

    activity: { marginTop: 18 },
    h2: { margin: "0 0 6px 0" },
    list: { margin: 0, padding: 0, listStyle: "none" },
    listItem: { padding: "8px 10px", display: "flex", alignItems: "center", gap: 8 },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 999,
        background: "linear-gradient(135deg,#8be3ff,#6ecbff)",
        display: "inline-block",
    },

    emptyPill: {
        marginTop: 8,
        padding: 14,
        borderRadius: 999,
        display: "inline-block",
        background: "rgba(255,255,255,0.18)",
        border: "1px solid rgba(255,255,255,0.35)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
    },
};
