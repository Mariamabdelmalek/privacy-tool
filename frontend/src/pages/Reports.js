// src/Reports.js
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import "jspdf-autotable";

export default function Reports() {
    const { state } = useLocation(); // may contain { report } from Dashboard navigate()
    const navigate = useNavigate();

    const [report, setReport] = useState(state?.report ?? null);
    const [loading, setLoading] = useState(!state?.report);
    const [err, setErr] = useState("");

    const base = import.meta?.env?.VITE_API_URL ?? "";

    // Fetch latest report if not passed via state
    useEffect(() => {
        if (report) return;
        const candidates = [`${base}/api/report/latest`, `${base}/api/report`];
        (async () => {
            for (const url of candidates) {
                try {
                    const r = await fetch(url);
                    if (r.ok) {
                        setReport(await r.json());
                        setLoading(false);
                        return;
                    }
                } catch { }
            }
            setLoading(false);
            setErr("No report found. Upload a file to generate one.");
        })();
    }, [base, report]);

    const hasFindings = !!(report?.findings && report.findings.length > 0);

    const downloadPDF = () => {
        if (!report) return;
        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.text("Social Media Privacy Report", 14, 20);

        doc.setFontSize(12);
        doc.text(`Scope: ${report.scope ?? "Uploaded file"}`, 14, 30);
        doc.text(
            `Generated: ${report.generatedAt ? new Date(report.generatedAt).toLocaleString() : "N/A"}`,
            14,
            40
        );
        doc.text(`Total Findings: ${report.totalFindings ?? 0}`, 14, 50);

        if (hasFindings) {
            const tableRows = report.findings.map((f, i) => [
                i + 1,
                f.platform,
                f.riskLevel,
                f.category,
                f.snippet,
                f.recommendation,
            ]);

            doc.autoTable({
                startY: 60,
                head: [["#", "Platform", "Risk", "Type", "Snippet", "Recommendation"]],
                body: tableRows,
                headStyles: { fillColor: [52, 73, 94] },
                styles: { fontSize: 9, cellWidth: "wrap" },
            });
        }

        doc.save(`privacy-report-${Date.now()}.pdf`);
    };

    return (
        <main style={styles.page}>
            <h1 style={styles.title}>Detailed Privacy Report</h1>
            {err && <div style={styles.note}>Note: {err}</div>}

            {!loading && !report && (
                <section style={styles.emptyWrap}>
                    <div style={styles.emptyCard}>
                        <div style={styles.shield}>🛡️</div>
                        <h2 style={{ margin: "0 0 6px" }}>No report yet</h2>
                        <p style={styles.subtle}>
                            You haven’t analyzed a file. Head to the Dashboard to upload a JSON/CSV export and
                            we’ll generate a detailed privacy report.
                        </p>
                        <button style={styles.cta} onClick={() => navigate("/dashboard")}>
                            Go to Dashboard & Upload
                        </button>
                    </div>
                </section>
            )}

            {report && (
                <>
                    {/* Meta */}
                    <section style={styles.metaGlass}>
                        <div style={styles.metaRow}>
                            <div style={styles.metaItem}>
                                <div style={styles.metaLabel}>Scope</div>
                                <div style={styles.metaValue}>{report.scope ?? "Uploaded file"}</div>
                            </div>
                            <div style={styles.metaItem}>
                                <div style={styles.metaLabel}>Generated</div>
                                <div style={styles.metaValue}>
                                    {report.generatedAt ? new Date(report.generatedAt).toLocaleString() : "N/A"}
                                </div>
                            </div>
                            <div style={styles.metaItem}>
                                <div style={styles.metaLabel}>Total Findings</div>
                                <div style={styles.metaValue}>{report.totalFindings ?? 0}</div>
                            </div>
                        </div>
                    </section>

                    {/* Findings Table */}
                    <section style={styles.tableWrap}>
                        <h2 style={styles.h2}>Findings</h2>

                        {!hasFindings ? (
                            <div style={styles.emptyPill}>
                                <b>No findings found.</b> Great job — nothing risky detected.
                            </div>
                        ) : (
                            <div style={{ overflowX: "auto" }}>
                                <table style={styles.table}>
                                    <thead>
                                        <tr>
                                            <th style={styles.th}>Platform</th>
                                            <th style={styles.th}>Risk</th>
                                            <th style={styles.th}>Type</th>
                                            <th style={styles.th}>Snippet</th>
                                            <th style={styles.th}>Recommendation</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {report.findings.map((f) => (
                                            <tr key={f.id}>
                                                <td style={styles.td}>{f.platform}</td>
                                                <td style={{ ...styles.td, ...riskBadge(f.riskLevel) }}>{f.riskLevel}</td>
                                                <td style={styles.td}>{f.category}</td>
                                                <td style={styles.td}>{f.snippet}</td>
                                                <td style={styles.td}>{f.recommendation}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>

                    {/* Actions */}
                    <section style={styles.actionsRow}>
                        <button style={styles.secondary} onClick={() => navigate("/dashboard")}>
                            Analyze another file
                        </button>
                        <button style={styles.secondary} onClick={downloadPDF}>
                            📄 Download PDF
                        </button>
                    </section>
                </>
            )}

            {loading && <div style={{ padding: 16 }}>Loading…</div>}
        </main>
    );
}

/* ---------- helpers ---------- */
function riskBadge(level = "") {
    const L = (level || "").toLowerCase();
    const base = {
        padding: "4px 8px",
        borderRadius: 999,
        display: "inline-block",
        fontWeight: 700,
        fontSize: 12,
    };
    if (L === "high") return { ...base, background: "rgba(255,80,80,0.2)", color: "#7a0b0b", border: "1px solid rgba(255,80,80,0.35)" };
    if (L === "medium") return { ...base, background: "rgba(255,200,90,0.2)", color: "#7a4f0b", border: "1px solid rgba(255,200,90,0.35)" };
    if (L === "low") return { ...base, background: "rgba(120,220,160,0.2)", color: "#0b5c3a", border: "1px solid rgba(120,220,160,0.35)" };
    return base;
}

/* ---------- styles (scoped) ---------- */
const styles = {
    page: { padding: 16, color: "#0b1f26" },
    title: { marginBottom: 8 },
    note: { margin: "6px 0 12px", fontSize: 12, opacity: 0.75 },

    emptyWrap: { display: "grid", placeItems: "center", marginTop: 12 },
    emptyCard: {
        maxWidth: 700,
        width: "100%",
        padding: 24,
        borderRadius: 16,
        background: "rgba(255,255,255,0.18)",
        border: "1px solid rgba(255,255,255,0.35)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        textAlign: "center",
        boxShadow: "0 10px 30px rgba(0,0,0,0.18)",
    },
    shield: { fontSize: 40, marginBottom: 6 },
    subtle: { fontSize: 14, opacity: 0.8 },

    metaGlass: {
        marginTop: 8,
        padding: 16,
        borderRadius: 16,
        background: "rgba(255,255,255,0.18)",
        border: "1px solid rgba(255,255,255,0.35)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        boxShadow: "0 10px 30px rgba(0,0,0,0.18)",
    },
    metaRow: { display: "grid", gridTemplateColumns: "repeat(3, minmax(160px,1fr))", gap: 12 },
    metaItem: { padding: 12, borderRadius: 12, background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.3)" },
    metaLabel: { fontSize: 12, opacity: 0.8 },
    metaValue: { fontSize: 16, fontWeight: 700, marginTop: 2 },

    tableWrap: { marginTop: 16 },
    h2: { margin: "0 0 8px 0" },
    emptyPill: {
        padding: 14,
        borderRadius: 999,
        display: "inline-block",
        background: "rgba(255,255,255,0.18)",
        border: "1px solid rgba(255,255,255,0.35)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
    },
    table: {
        width: "100%",
        borderCollapse: "collapse",
        background: "rgba(255,255,255,0.18)",
        border: "1px solid rgba(255,255,255,0.35)",
        borderRadius: 14,
        overflow: "hidden",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
    },
    th: { textAlign: "left", padding: "12px 14px", fontWeight: 800, fontSize: 13, borderBottom: "1px solid rgba(255,255,255,0.35)" },
    td: { padding: "12px 14px", borderBottom: "1px solid rgba(255,255,255,0.25)", verticalAlign: "top" },

    actionsRow: { marginTop: 16, display: "flex", gap: 10, alignItems: "center" },
    secondary: {
        padding: "8px 12px",
        borderRadius: 10,
        border: "1px solid rgba(255,255,255,0.35)",
        background: "rgba(255,255,255,0.18)",
        cursor: "pointer",
    },
};
