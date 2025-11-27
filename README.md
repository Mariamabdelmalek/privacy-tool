# 📊 Social Media Privacy Tool

A web application that analyzes social media data exports to detect and report potential privacy risks such as phone numbers, emails, or address information found in captions, messages, and other text.

---

## 🚀 Features

- Upload ex. Instagram `.zip` export file
- Automatically extracts and scans for personal data
- Detects:
  - 📞 Phone Numbers
  - 📧 Emails
  - 🏠 Address Keywords
- Simple scoring system for privacy risk
- Interactive dashboard:
  - Risk distribution Pie Chart
  - Detailed table of findings
- 📄 Downloadable privacy report (PDF)

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React + Recharts + jsPDF |
| Backend | Node.js + Express |
| File Processing | Unzipper, CSV/JSON/HTML Parsing |
| Deployment | (Render / Netlify / etc.) |

---

## 🧪 How It Works

1. User uploads their Instagram export ZIP
2. Backend extracts and scans all text
3. Regex identifies personal information
4. Risk scores assigned to each detected element
5. Results sent back and visualized in the UI

---
     ┌──────────────────┐
     │  User uploads ZIP │
     └─────────┬────────┘
               │
       (Frontend: React)
               │  HTTP POST
               ▼
    ┌──────────────────────┐
    │   Backend: Express   │
    │ Unzip + File Parsing │
    │ JSON/CSV/HTML Scan   │
    └─────────┬───────────┘
              │
       Regex & Risk Analysis
              ▼
   ┌──────────────────────┐
   │ Summary + Results    │
   └─────────┬───────────┘
             │  JSON Response
             ▼
    UI Visualization & PDF Export

---

## 🛠 Tech Stack

| Area | Technology |
|------|------------|
| Frontend | React, Recharts, jsPDF |
| Backend | Node.js (Express) |
| File Handling | Unzipper, CSV/JSON/HTML parsing |
| Deployment | Render + Netlify (or local preview) |

---

## 📥 Getting Started (Run Locally)

### 1️⃣ Clone repository
```bash
git clone https://github.com/YOUR_USERNAME/privacy-tool.git
cd privacy-tool


## 📥 Installation & Running Locally

### 1️⃣ Clone repo

```bash
git clone https://github.com/Mariamabdelmalek/privacy-tool.git
cd privacy-tool
 2️⃣ Install backend
cd backend
npm install
npm start
Runs at → http://localhost:5000
 3️⃣ Run frontend
cd ../frontend
npm install
npm start
Runs at → http://localhost:3000
📊 Example Output
| Dashboard                  | Report View                |
| -------------------------- | -------------------------- |
| <img width="1904" height="927" alt="image" src="https://github.com/user-attachments/assets/5976761e-1c3d-4c56-862a-a0f26ffc548b" />              <img width="430" height="392" alt="image" src="https://github.com/user-attachments/assets/82c3ff29-8f88-497f-8052-a1446cfc40cd" />



|


| Score Range | Level     | Meaning                  |
| ----------- | --------- | ------------------------ |
| 7+          | 🔴 High   | Serious privacy exposure |
| 4–6         | 🟠 Medium | Risky content            |
| 1–3         | 🟡 Low    | Mild sensitivity         |
| 0           | 🟢 Safe   | No PII detected          |

Regex evaluation includes:

Email address detection

Phone number formats

Address-related keyword spotting
spotting

🔐 Privacy Notice

No user data is stored after scanning

Temporary extracted ZIP contents are removed after scan

Fully local runtime privacy protection (no cloud data storage)
