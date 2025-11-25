// src/pages/Reports.js
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

export default function Reports() {
  const { state } = useLocation();
  const navigate = useNavigate();

  const report = state?.report;

  if (!report) {
    return (
      <main style={{ padding: 20 }}>
        <h2>No report loaded</h2>
        <p>Please upload a file first.</p>
        <button onClick={() => navigate("/dashboard")}>Go to Dashboard</button>
      </main>
    );
  }

  /* -----------------------------
       Build PDF
  ------------------------------ */
  function downloadPDF() {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Social Media Privacy Report", 14, 20);

    doc.setFontSize(12);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
    doc.text(
      `Total Items Scanned: ${report.summary.total_items_scanned}`,
      14,
      40
    );
    doc.text(
      `High Risk Items: ${report.summary.high_risk_items}`,
      14,
      50
    );

    const rows = report.results.map((r, i) => [
      i + 1,
      r.snippet,
      r.score,
      r.findings.map((f) => f.type).join(", ") || "None",
    ]);

    doc.autoTable({
      startY: 60,
      head: [["#", "Snippet", "Risk Score", "Findings"]],
      body: rows,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [52, 73, 94] },
    });

    doc.save(`privacy-report-${Date.now()}.pdf`);
  }

  /* -----------------------------
       Pie Chart Data
  ------------------------------ */
  const riskData = [
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
  ];

  return (
    <main style={styles.page}>
      <h1>Privacy Report</h1>

      {/* Summary section */}
      <section style={styles.summaryBox}>
        <div style={styles.summaryItem}>
          <div style={styles.summaryLabel}>Total Items</div>
          <div style={styles.summaryValue}>
            {report.summary.total_items_scanned}
          </div>
        </div>
        <div style={styles.summaryItem}>
          <div style={styles.summaryLabel}>High Risk</div>
          <div style={styles.summaryValue}>
            {report.summary.high_risk_items}
          </div>
        </div>
      </section>

      {/* Pie Chart */}
      <section style={{ textAlign: "center", marginTop: 20 }}>
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
            {riskData.map((entry, index) => (
              <Cell key={index} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </section>

      {/* Table */}
      <section style={{ marginTop: 30 }}>
        <h2>Detailed Findings</h2>

        <table style={styles.table}>
          <thead>
            <tr>
              <th>Snippet</th>
              <th>Risk Score</th>
              <th>Findings</th>
            </tr>
          </thead>
          <tbody>
            {report.results.map((r, i) => (
              <tr key={i}>
                <td>{r.snippet}</td>
                <td>{r.score}</td>
                <td>
                  {r.findings.length
                    ? r.findings.map((f) => f.type).join(", ")
                    : "None"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
    </main>
  );
}

/* ---------------- STYLES ---------------- */
const styles = {
  page: { padding: 20 },
  summaryBox: {
    display: "flex",
    gap: 20,
    marginTop: 10,
    padding: 16,
    background: "#f9f9f9",
    borderRadius: 12,
  },
  summaryItem: { flex: 1, textAlign: "center" },
  summaryLabel: { fontSize: 12, opacity: 0.6 },
  summaryValue: { fontSize: 22, fontWeight: 700 },

  table: {
    width: "100%",
    background: "white",
    borderCollapse: "collapse",
  },

  actionsRow: {
    marginTop: 20,
    display: "flex",
    gap: 10,
  },
  secondary: {
    padding: "10px 14px",
    borderRadius: 8,
    background: "#eee",
    cursor: "pointer",
  },
};
