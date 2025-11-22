const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse/sync");

const express = require("express");
const fileUpload = require("express-fileupload");
const cors = require("cors");
const app = express();
const PORT = 8000;

// Middleware
app.use(cors()); // optional since CRA proxy works
app.use(fileUpload());

// Dummy /scan endpoint
app.post("/scan", (req, res) => {
  if (!req.files || !req.files.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const file = req.files.file;

  // For demo: pretend we scanned and return dummy data
  const dummyResult = {
    summary: { num_posts: 2 },
    results: [
      {
        text_snippet: "This is a post snippet...",
        findings: [
          { type: "person", match: "John Doe", source: "ner" },
          { type: "email", match: "john@example.com", source: "regex" }
        ],
        risk_score: 0.7,
        recommendations: ["Remove sensitive info", "Use pseudonyms"]
      },
      {
        text_snippet: "Another post snippet...",
        findings: [
          { type: "gpe", match: "New York", source: "ner" }
        ],
        risk_score: 0.3,
        recommendations: ["Avoid location tagging"]
      }
    ]
  };

  res.json(dummyResult);
});

// Helper: build the JSON shape your frontend expects
function buildReport({ scope = "Uploaded file", findings = [] }) {
  return {
    scope,
    generatedAt: new Date().toISOString(),
    totalFindings: findings.length,
    findings,
  };
}

// very simple text analyzers (demo quality)
const PHONE_RE = /\(?\b[2-9]\d{2}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/;
const COORDS_RE = /\b-?\d{1,2}\.\d+,\s*-?\d{1,3}\.\d+\b/;
const ADDRESS_WORDS = ["street", "st.", "ave", "avenue", "rd", "road", "drive", "dr", "blvd", "lane", "ln"];
function analyzeText(platform, text) {
  const out = [];
  if (PHONE_RE.test(text)) {
    out.push({
      id: Math.random().toString(36).slice(2, 10),
      platform,
      riskLevel: "High",
      category: "PII Exposure",
      snippet: "Phone number detected",
      recommendation: "Remove phone number; share via DM or masked email.",
    });
  }
  if (COORDS_RE.test(text)) {
    out.push({
      id: Math.random().toString(36).slice(2, 10),
      platform,
      riskLevel: "Medium",
      category: "Location",
      snippet: "Precise coordinates detected",
      recommendation: "Remove precise location; disable geo-tagging.",
    });
  }
  if (ADDRESS_WORDS.some(w => text.toLowerCase().includes(w))) {
    out.push({
      id: Math.random().toString(36).slice(2, 10),
      platform,
      riskLevel: "High",
      category: "Sensitive Location",
      snippet: "Possible street address in content",
      recommendation: "Redact address or restrict audience.",
    });
  }
  return out;
}

/**
 * POST /api/report/upload
 * Accepts a file field named "file" (.json or .csv) and returns a normalized report JSON.
 */
app.post("/api/report/upload", async (req, res) => {
  try {
    if (!req.files || !req.files.file) {
      return res.status(400).json({ error: "No file uploaded (field name must be 'file')." });
    }

    const up = req.files.file; // from express-fileupload
    const ext = (up.name.split(".").pop() || "").toLowerCase();
    const raw = up.data.toString("utf8");

    // Case 1: JSON
    if (ext === "json") {
      const json = JSON.parse(raw);
      // If it already looks like a report, just echo it back
      if (Array.isArray(json.findings)) return res.json(json);

      // Otherwise, try to infer from array/items
      const items = Array.isArray(json) ? json : (Array.isArray(json.items) ? json.items : []);
      const findings = [];
      for (const item of items) {
        const platform = item.platform || "Unknown";
        const text = [item.content, item.caption, item.bio, item.text].filter(Boolean).join(" ");
        if (text) findings.push(...analyzeText(platform, text));
      }
      return res.json(buildReport({ scope: "JSON upload", findings }));
    }

    // Case 2: CSV
    if (ext === "csv") {
      const rows = parse(raw, { columns: true, skip_empty_lines: true });
      const findings = [];
      for (const r of rows) {
        const platform = r.platform || r.site || "Unknown";
        const text = [r.content, r.caption, r.bio, r.text, r.exif, r.location].filter(Boolean).join(" ");
        if (text) findings.push(...analyzeText(platform, text));
      }
      return res.json(buildReport({ scope: "CSV upload", findings }));
    }

    return res.status(400).json({ error: `Unsupported file type: .${ext}. Upload .json or .csv.` });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});


app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
