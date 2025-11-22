// backend/server.js
const express = require("express");
const fileUpload = require("express-fileupload");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const unzipper = require("unzipper");
const csvParse = require("csv-parse/sync");

const app = express();
const PORT = 8000;

// Middleware
app.use(cors());
app.use(fileUpload());

// -------------------
// Utility: Analyze Text
// -------------------
const PHONE_RE = /\(?\b[2-9]\d{2}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/;
const EMAIL_RE = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
const ADDRESS_WORDS = ["street", "st.", "ave", "avenue", "rd", "road", "drive", "dr", "blvd", "lane", "ln"];

function analyzeText(text) {
  const findings = [];
  const recommendations = [];
  let risk_score = 0;

  if (PHONE_RE.test(text)) {
    findings.push({ type: "PHONE", match: text.match(PHONE_RE)[0], source: "regex" });
    recommendations.push("Remove phone number from post.");
    risk_score += 5;
  }

  if (EMAIL_RE.test(text)) {
    findings.push({ type: "EMAIL", match: text.match(EMAIL_RE)[0], source: "regex" });
    recommendations.push("Remove email from post.");
    risk_score += 5;
  }

  if (ADDRESS_WORDS.some(w => text.toLowerCase().includes(w))) {
    findings.push({ type: "ADDRESS", match: "Possible street address", source: "regex" });
    recommendations.push("Redact address or restrict audience.");
    risk_score += 5;
  }

  if (risk_score > 10) risk_score = 10;

  return { findings, recommendations, risk_score };
}

// -------------------
// Utility: Extract posts/messages
// -------------------
async function extractPosts(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  let posts = [];

  if (ext === ".zip") {
    const dir = path.join(__dirname, "tmp", Date.now().toString());
    fs.mkdirSync(dir, { recursive: true });

    await fs.createReadStream(filePath)
      .pipe(unzipper.Extract({ path: dir }))
      .promise();

    const files = fs.readdirSync(dir);
    for (const f of files) {
      const fPath = path.join(dir, f);
      posts.push(...await extractPosts(fPath));
    }
    return posts;
  }

  if (ext === ".json") {
    const raw = fs.readFileSync(filePath, "utf8");
    const data = JSON.parse(raw);
    const items = Array.isArray(data) ? data : (Array.isArray(data.items) ? data.items : []);
    posts = items.map(item => {
      const text = [item.text, item.content, item.caption, item.bio].filter(Boolean).join(" ");
      return { text };
    });
    return posts;
  }

  if (ext === ".csv") {
    const raw = fs.readFileSync(filePath, "utf8");
    const rows = csvParse.parse(raw, { columns: true, skip_empty_lines: true });
    posts = rows.map(r => {
      const text = [r.text, r.content, r.caption, r.bio, r.exif, r.location].filter(Boolean).join(" ");
      return { text };
    });
    return posts;
  }

  if (ext === ".html") {
    const raw = fs.readFileSync(filePath, "utf8");
    const matches = raw.match(/<p>(.*?)<\/p>/gi) || [];
    posts = matches.map(m => ({ text: m.replace(/<\/?p>/g, "") }));
    return posts;
  }

  throw new Error(`Unsupported file type: ${ext}`);
}

// -------------------
// /scan Endpoint
// -------------------
app.post("/scan", async (req, res) => {
  try {
    if (!req.files || !req.files.file) return res.status(400).json({ error: "No file uploaded" });

    const file = req.files.file;
    const tempDir = path.join(__dirname, "tmp");
    fs.mkdirSync(tempDir, { recursive: true });
    const tempPath = path.join(tempDir, `${Date.now()}-${file.name}`);
    fs.writeFileSync(tempPath, file.data);

    const posts = await extractPosts(tempPath);

    const results = posts.map(p => {
      const analysis = analyzeText(p.text);
      return {
        text_snippet: p.text.substring(0, 100) + (p.text.length > 100 ? "..." : ""),
        risk_score: analysis.risk_score,
        findings: analysis.findings,
        recommendations: analysis.recommendations
      };
    });

    const summary = {
      num_posts: results.length,
      high_risk_count: results.filter(r => r.risk_score >= 5).length
    };

    res.json({ summary, results });

    // Clean up temp file
    fs.unlinkSync(tempPath);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// -------------------
// Start server
// -------------------
app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
