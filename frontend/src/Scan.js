// src\Scan.js
import React, { useState } from "react";
import { logout } from "./services/authService"; 
import './styles/App.scss';

export default function Scan({ onLogout }) {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleScan = async () => {
    if (!file) return;
    setLoading(true);
    setError("");
    setResult(null);

    const fd = new FormData();
    fd.append("file", file);

    try {
      const res = await fetch("/scan", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`, // ✅ Add token here
        },
        body: fd,
      });

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch from backend. Make sure it is running.");
    } finally {
      setLoading(false);
    }
  };
  const handleLogout = () => {
    logout(); 
    localStorage.removeItem("token"); 
    if (onLogout) onLogout();
  };


  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}></div>
      <h1>Welcome to Social Media Privacy Tool</h1>
      <button onClick={handleLogout} style={{ float: "right" }}>Logout</button>
      <h3>Upload your social media data file for scanning:</h3>
      <input type="file" onChange={(e) => setFile(e.target.files[0])} />
      <button
        onClick={handleScan}
        disabled={!file || loading}
        style={{ marginLeft: 10 }}
      >
        {loading ? "Scanning..." : "Scan"}
      </button>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {result && (
        <div style={{ marginTop: 20 }}>
          <p>
            <strong>Number of posts:</strong> {result.summary.num_posts}
          </p>
          {result.results.map((r, i) => (
            <div
              key={i}
              style={{ margin: 10, padding: 10, border: "1px solid #ccc" }}
            >
              <p>
                <strong>Post snippet:</strong> {r.text_snippet}
              </p>
              <p>
                <strong>Risk score:</strong> {r.risk_score}
              </p>
              <p>
                <strong>Findings:</strong>
              </p>
              <ul>
                {r.findings.map((f, idx) => (
                  <li key={idx}>
                    [{f.type}] {f.match} ({f.source})
                  </li>
                ))}
              </ul>
              <p>
                <strong>Recommendations:</strong>
              </p>
              <ul>
                {r.recommendations.map((rec, idx) => (
                  <li key={idx}>{rec}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
