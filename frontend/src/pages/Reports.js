// src/pages/Reports.js
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

export default function Reports() {
  const { state } = useLocation();
  const navigate = useNavigate();

  const [report, setReport] = useState(state?.report ?? null);
  const [loading, setLoading] = useState(!state?.report);
  const [err, setErr] = useState("");

  const base = import.meta?.env?.VITE_API_URL ?? "";

  // Fetch if not provided by navigation
  useEffect(() => {
    if (report) return;

    (async () => {
      try {
        const r = await fetch(`${base}/api/report/latest`);
        if (!r.ok) throw new Error("No report found");
        const data = await r.json();
        setReport(data);
      } catch (e) {
        setErr("No report found. Upload a file first.");
      } finally {
        setLoading(false);
      }
    })();
  }, [report, base]);

  // ------ PDF DOWNLOAD ------
  const downloadPDF = () => {
    if (!report) return;

    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Social Media Privacy Scan Report", 14, 20);

    doc.setFontSize(12);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
    doc.text(`Total Items Scanned: ${report.summary.total_items_scanned}`, 14, 40);
    doc.text(`High Risk Items: ${report.summary.high_risk_items}`, 14, 50);

    // Build PDF table
    const tableRows = report.results.map((r, i) => [
      i + 1,
      r.snippet,
      r.score,
      r.findings.map((f) => f.type).join(", ") || "None",
    ]);

    doc.autoTable({
      startY: 60,
      head: [["#", "Text Snippet", "Risk Score", "Findings"]],
      body: tableRows,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [70, 130, 180] },
    });

    doc.save(`privacy-report-${Date.now()}.pdf`);
  };

  // ------- PIE CHART DATA -------
  const riskData = report
    ? [
        {
          name: "High Risk",
          value: report.results.filter((r) => r.score >= 4).length,
          color: "#ff4d4d",
        },
        {
          name: "Medium Risk",
          value: report.results.filter((r) => r.score === 2 || r.score === 3).length,
          color: "#ffcc00",
        },
        {
          name: "Low Risk",
          value: report.results.filter((r) => r.score === 1).length,
          color: "#4da6ff",
        },
        {
          name: "Safe",
          value: report.results.filter((r) => r.score === 0).length,
          color: "#8cd98c",
        },
      ]
    : [];

  if (loading) return <div style={{ padding: 20 }}>Loading…</div>;

  return (
    <main style={styles.page}>
      <h1 style={styles.title}>Privacy Report</h1>

      {err && <div style={styles.note}>{err}</div>}

      {!report ? (
        <div style={styles.emptyCard}>
          <h2>No report found</h2>
          <p style={styles.subtle}>Upload a file from the Dashboard to generate a report.</p>
          <button style={styles.cta} onClick={() => navigate("/dashboard")}>
            Go to Dashboard
          </button>
        </div>
      ) : (
        <>
          {/* Summary Box */}
          <section style={styles.summaryBox}>
            <div style={styles.summaryItem}>
              <div style={styles.summaryLabel}>Total Items</div>
              <div style={styles.summaryValue}>{report.summary.total_items_scanned}</div>
            </div>
            <div style={styles.summaryItem}>
              <div style={styles.summaryLabel}>High Risk</div>
              <div style={styles.summaryValue}>{report.summary.high_risk_items}</div>
            </div>
          </section>

          {/* Pie Chart */}
          <section style={{ marginTop: 20, textAlign: "center" }}>
            <h2>Risk Score Distribution</h2>
            <PieChart width={420} height={320} style={{ margin: "0 auto" }}>
              <Pie
                data={riskData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={120}
                label
              >
                {riskData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </section>

          {/* Table */}
          <section style={{ marginTop: 30 }}>
            <h2 style={styles.h2}>Detailed Findings</h2>
            <div style={{ overflowX: "auto" }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Snippet</th>
                    <th style={styles.th}>Risk Score</th>
                    <th style={styles.th}>Findings</th>
                  </tr>
                </thead>
                <tbody>
                  {report.results.map((r, i) => (
                    <tr key={i}>
                      <td style={styles.td}>{r.snippet}</td>
                      <td style={styles.td}>{r.score}</td>
                      <td style={styles.td}>
                        {r.findings.length > 0
                          ? r.findings.map((f) => f.type).join(", ")
                          : "None"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Actions */}
          <section style={styles.actionsRow}>
            <button style={styles.secondary} onClick={() => navigate("/dashboard")}>
              Analyze Another File
            </button>
            <button style={styles.secondary} onClick={downloadPDF}>
              📄 Download PDF
            </button>
          </section>
        </>
      )}
    </main>
  );
}

/* ---------------- Styles ---------------- */
const styles = {
  page: { padding: 20 },
  title: { marginBottom: 10 },
  note: { color: "red", marginBottom: 10 },

  emptyCard: {
    padding: 20,
    textAlign: "center",
    background: "#f8f8f8",
    borderRadius: 12,
  },

  summaryBox: {
    display: "flex",
    gap: 20,
    marginTop: 10,
    padding: 16,
    background: "rgba(255,255,255,0.25)",
    borderRadius: 12,
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
  },
  summaryItem: { flex: 1, textAlign: "center" },
  summaryLabel: { fontSize: 12, opacity: 0.7 },
  summaryValue: { fontSize: 22, fontWeight: "bold" },

  h2: { margin: "20px 0 10px" },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    background: "white",
  },
  th: {
    padding: 10,
    background: "#f0f0f0",
    textAlign: "left",
    fontWeight: "bold",
  },
  td: {
    padding: 10,
    borderBottom: "1px solid #ddd",
  },

  actionsRow: { display: "flex", gap: 10, marginTop: 20 },
  secondary: {
    padding: "10px 14px",
    borderRadius: 8,
    background: "#eee",
    cursor: "pointer",
  },
  cta: {
    padding: "10px 14px",
    background: "#4da6ff",
    color: "white",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
  },
};
