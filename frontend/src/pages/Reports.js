// src/pages/Reports.js
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

export default function Reports() {
  const { state } = useLocation();
  const navigate = useNavigate();

  // If user came directly without scanning → redirect
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

  const hasFindings = report.findings && report.findings.length > 0;

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Social Media Privacy Report", 14, 20);

    doc.setFontSize(12);
    doc.text(`Scope: ${report.scope}`, 14, 30);
    doc.text(`Generated: ${new Date(report.generatedAt).toLocaleString()}`, 14, 40);
    doc.text(`Total Findings: ${report.totalFindings}`, 14, 50);

    if (hasFindings) {
      const rows = report.findings.map((f, i) => [
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
        body: rows,
        headStyles: { fillColor: [52, 73, 94] },
        styles: { fontSize: 9, cellWidth: "wrap" },
      });
    }

    doc.save(`privacy-report-${Date.now()}.pdf`);
  };

  return (
    <main style={{ padding: 20 }}>
      <h1>Detailed Privacy Report</h1>

      {/* Report meta */}
      <section style={styles.metaBox}>
        <div>
          <strong>Scope:</strong> {report.scope}
        </div>
        <div>
          <strong>Generated:</strong>{" "}
          {new Date(report.generatedAt).toLocaleString()}
        </div>
        <div>
          <strong>Total Findings:</strong> {report.totalFindings}
        </div>
      </section>

      {/* Findings */}
      <h2>Findings</h2>
      {!hasFindings ? (
        <p>No risky content detected!</p>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr>
              <th>Platform</th>
              <th>Risk</th>
              <th>Type</th>
              <th>Snippet</th>
              <th>Recommendation</th>
            </tr>
          </thead>
          <tbody>
            {report.findings.map((f) => (
              <tr key={f.id}>
                <td>{f.platform}</td>
                <td style={styles[f.riskLevel.toLowerCase()]}>{f.riskLevel}</td>
                <td>{f.category}</td>
                <td>{f.snippet}</td>
                <td>{f.recommendation}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div style={{ marginTop: 20 }}>
        <button onClick={() => navigate("/dashboard")}>Analyze another file</button>
        <button onClick={downloadPDF} style={{ marginLeft: 10 }}>
          Download PDF
        </button>
      </div>
    </main>
  );
}

/* Styles */
const styles = {
  metaBox: {
    padding: 16,
    background: "rgba(255,255,255,0.25)",
    borderRadius: 12,
    marginBottom: 20,
    border: "1px solid rgba(255,255,255,0.3)",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    background: "rgba(255,255,255,0.25)",
    borderRadius: 12,
    overflow: "hidden",
  },

  high: { background: "rgba(255,80,80,0.25)", color: "#7a0b0b" },
  medium: { background: "rgba(255,200,90,0.25)", color: "#7a4f0b" },
  low: { background: "rgba(120,220,160,0.25)", color: "#0b5c3a" },
};
