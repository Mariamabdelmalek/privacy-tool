// backend/server.js
const express = require("express");
const fileUpload = require("express-fileupload");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const unzipper = require("unzipper");
const { parse } = require("csv-parse/sync");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Allow deployed frontend
app.use(
  cors({
    origin: "*",
  })
);

app.use(fileUpload());

const PORT = process.env.PORT || 5000;

/* ----------------------
   REGEX RULES
-------------------------*/
const PHONE_RE = /\b(\+?\d{1,2}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)\d{3}[-.\s]?\d{4}\b/;
const EMAIL_RE = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
const ADDRESS_WORDS = [
  "street","st.","st ","avenue","ave","road","rd","drive","dr",
  "lane","ln","blvd","boulevard","way","court","ct"
];

/* ----------------------
   ANALYZE TEXT
-------------------------*/
function analyzeText(text) {
  const findings = [];
  let score = 0;

  if (!text?.trim()) return { findings, score };

  if (PHONE_RE.test(text)) {
    findings.push({ type: "PHONE" });
    score += 4;
  }

  if (EMAIL_RE.test(text)) {
    findings.push({ type: "EMAIL" });
    score += 4;
  }

  if (ADDRESS_WORDS.some((w) => text.toLowerCase().includes(w))) {
    findings.push({ type: "ADDRESS" });
    score += 3;
  }

  return { findings, score };
}

/* ----------------------
   HELPERS
-------------------------*/
async function unzipFile(zipPath, extractTo) {
  await fs.createReadStream(zipPath)
    .pipe(unzipper.Extract({ path: extractTo }))
    .promise();
}

function readJSON(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function readHTML(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  const matches = raw.match(/>([^<]{5,})</g) || [];
  return matches.map((m) => m.replace(/[><]/g, "").trim());
}

function readCSV(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  return parse(raw, { columns: true });
}

function scanDirectory(dir) {
  let all_text = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const ext = path.extname(entry.name).toLowerCase();

    if (entry.isDirectory()) {
      all_text.push(...scanDirectory(fullPath));
      continue;
    }

    if (ext === ".json") {
      const data = readJSON(fullPath);
      if (!data) continue;

      const items = Array.isArray(data)
        ? data
        : data.items || data.ig_followers || [];

      for (const item of items) {
        const text = [
          item.text,
          item.caption,
          item.title,
          item.message,
          item.string_list_data?.map((x) => x.value).join(" "),
        ]
          .filter(Boolean)
          .join(" ");

        if (text) all_text.push(text);
      }
    }

    if (ext === ".html") all_text.push(...readHTML(fullPath));

    if (ext === ".csv") {
      const rows = readCSV(fullPath);
      rows.forEach((r) => all_text.push(Object.values(r).join(" ")));
    }
  }

  return all_text;
}

/* ----------------------
   /scan ENDPOINT
-------------------------*/
app.post("/scan", async (req, res) => {
  try {
    if (!req.files?.file)
      return res.status(400).json({ error: "No file uploaded" });

    const file = req.files.file;
    if (!file.name.endsWith(".zip"))
      return res.status(400).json({ error: "Upload a ZIP file" });

    const uploadDir = path.join(__dirname, "uploads");
    fs.mkdirSync(uploadDir, { recursive: true });

    const zipPath = path.join(uploadDir, `${Date.now()}-${file.name}`);
    fs.writeFileSync(zipPath, file.data);

    const extractDir = path.join(__dirname, "extracted", `ig-${Date.now()}`);
    fs.mkdirSync(extractDir, { recursive: true });

    await unzipFile(zipPath, extractDir);

    const all_text = scanDirectory(extractDir);

    const results = all_text.map((t) => {
      const analysis = analyzeText(t);
      return {
        snippet: t.substring(0, 120),
        findings: analysis.findings,
        score: analysis.score,
      };
    });

    const summary = {
      total_items_scanned: results.length,
      high_risk_items: results.filter((r) => r.score >= 4).length,
    };

    res.json({ summary, results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ----------------------
   Serve React build (Render)
-------------------------*/
const frontend = path.join(__dirname, "../frontend/build");

if (fs.existsSync(frontend)) {
  app.use(express.static(frontend));
  app.get("*", (req, res) =>
    res.sendFile(path.join(frontend, "index.html"))
  );
}

/* ----------------------
   START SERVER
-------------------------*/
app.listen(PORT, () =>
  console.log(`Backend running at http://localhost:${PORT}`)
);
