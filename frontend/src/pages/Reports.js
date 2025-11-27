// src/pages/Reports.js
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
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

  /* ------------------------------
      PDF DOWNLOAD FUNCTION
  ------------------------------ */
  const downloadPDF = () => {
  try {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Social Media Privacy Report", 14, 20);

    const summary = report.summary;

    doc.setFontSize(12);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
    doc.text(`Total Items: ${summary.total_items_scanned}`, 14, 40);
    doc.text(`High Risk Items: ${summary.high_risk_items}`, 14, 50);

    const tableRows = report.results.map((r, i) => [
      i + 1,
      r.snippet,
      r.score,
      r.findings.map((f) => f.type).join(", ") || "None",
    ]);

    autoTable(doc,{
      startY: 60,
      head: [["#", "Text Snippet", "Risk Score", "Findings"]],
      body: tableRows,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [52, 73, 94] },
    });

    doc.save(`privacy-report-${Date.now()}.pdf`);
  } catch (err) {
    console.error("PDF ERROR:", err);
    
  }
};


  /* ------------------------------
      PIE CHART DATA
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
    <main style={{ padding: 20 }}>
      <h1>Privacy Report</h1>

      {/* Summary Box */}
      <section style={styles.summaryBox}>
        <div style={styles.summaryItem}>
          <div style={styles.summaryLabel}>Total Items</div>
          <div style={styles.summaryValue}>
            {report.summary?.total_items_scanned ?? report.results.length}
          </div>
        </div>
        <div style={styles.summaryItem}>
          <div style={styles.summaryLabel}>High Risk</div>
          <div style={styles.summaryValue}>
            {report.summary?.high_risk_items ??
              report.results.filter((r) => r.score >= 4).length}
          </div>
        </div>
      </section>

      {/* Pie Chart */}
      <section style={{ marginTop: 25, textAlign: "center" }}>
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
        <h2 style={styles.h2}>Detailed Findings</h2>

        <div style={{ overflowX: "auto" }}>
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
        </div>
      </section>

      {/* Buttons */}
      <section style={styles.actionsRow}>
        <button style={styles.primary} onClick={() => navigate("/dashboard")}>
          Analyze Another File
        </button>

        <button style={styles.downloadBtn} onClick={downloadPDF}>
          📄 Download PDF
        </button>
      </section>
    </main>
  );
}

const styles = {
  summaryBox: {
    display: "flex",
    gap: 20,
    padding: 16,
    background: "rgba(255,255,255,0.25)",
    borderRadius: 12,
  },
  summaryItem: { flex: 1, textAlign: "center" },
  summaryLabel: { fontSize: 12, opacity: 0.7 },
  summaryValue: { fontSize: 22, fontWeight: "bold" },
  table: { width: "100%", borderCollapse: "collapse" },
  h2: { marginBottom: 10 },
  actionsRow: { display: "flex", gap: 10, marginTop: 25 },
  primary: {
    padding: "10px 16px",
    background: "#4da6ff",
    border: "none",
    borderRadius: 8,
    color: "white",
    cursor: "pointer",
    fontWeight: 600,
  },
  downloadBtn: {
    padding: "10px 16px",
    background: "#1a73e8",
    border: "none",
    borderRadius: 8,
    color: "white",
    cursor: "pointer",
    fontWeight: 600,
  },
};
