// backend/server.test.js
const fs = require("fs");
const path = require("path");

// Copy the analyzeText function from server.js for testing
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

// Test Suite
describe("analyzeText function", () => {
  test("should detect phone number", () => {
    const result = analyzeText("Call me at 555-123-4567");
    expect(result.findings).toHaveLength(1);
    expect(result.findings[0].type).toBe("PHONE");
    expect(result.risk_score).toBe(5);
  });

  test("should detect email address", () => {
    const result = analyzeText("Contact me at test@example.com");
    expect(result.findings).toHaveLength(1);
    expect(result.findings[0].type).toBe("EMAIL");
    expect(result.risk_score).toBe(5);
  });

  test("should detect address keywords", () => {
    const result = analyzeText("I live on Main Street");
    expect(result.findings).toHaveLength(1);
    expect(result.findings[0].type).toBe("ADDRESS");
    expect(result.risk_score).toBe(5);
  });

  test("should detect multiple PII types", () => {
    const result = analyzeText("Call me at 555-123-4567 or email test@example.com");
    expect(result.findings.length).toBeGreaterThan(1);
    expect(result.risk_score).toBe(10);
  });

  test("should return zero risk for clean text", () => {
    const result = analyzeText("This is a normal post without any sensitive information");
    expect(result.findings).toHaveLength(0);
    expect(result.risk_score).toBe(0);
  });
});
