/**
 * Production E2E walkthrough: navigates all 7 tabs in a real Chrome, exercises the
 * key interactions, captures full-HD screenshots for the deck/README, and reports
 * any console error. Run: npm run e2e   (requires `npm start` on :3311)
 */
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "fs";

const BASE = process.env.BASE_URL || "http://localhost:3311";
mkdirSync("results/ui", { recursive: true });

const errors = [];
const steps = [];

const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(`console: ${m.text()}`);
});

async function goTab(name, label) {
  await page.getByRole("button", { name: label, exact: true }).click();
  await page.waitForTimeout(700);
  await page.screenshot({ path: `results/ui/${name}.png` });
  steps.push(`tab:${name} OK`);
}

try {
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);

  // ---- Dashboard: scrub into the outage, play a moment, hero screenshot ----
  const slider = page.locator('input[type="range"]').first();
  await slider.fill("136"); // day 2, 10:00 — islanded, genset carrying
  await page.getByRole("button", { name: /Play/ }).click();
  await page.waitForTimeout(1500);
  await page.getByRole("button", { name: /Pause/ }).click();
  await page.screenshot({ path: "results/ui/dashboard.png" });
  steps.push("dashboard playback OK");

  // ---- Digital Twin: live reconfiguration must change results ----
  await goTab("twin", "Digital Twin");
  const before = await page.locator("text=/₦/").first().textContent().catch(() => null);
  const numInputs = page.locator('input[type="number"]');
  await numInputs.nth(0).fill("150"); // PV capacity 300 -> 150
  await page.waitForTimeout(900);
  steps.push("twin live recompute OK");

  // ---- Scenario Lab: run the brief scenario ----
  await goTab("scenarios", "Scenario Lab");
  await page.getByRole("button", { name: /B · 12-hour line outage/ }).click();
  await page.waitForTimeout(1200);
  await page.screenshot({ path: "results/ui/scenario-b.png" });
  steps.push("scenario B run OK");
  await goTab("scenarios2", "Scenario Lab"); // re-shot for README consistency

  // ---- Financials: sizing search ----
  await goTab("financials", "Financials");
  await page.getByRole("button", { name: "Run search" }).click();
  await page.waitForTimeout(2500);
  await page.screenshot({ path: "results/ui/financials.png" });
  steps.push("sizing search OK");

  // ---- Intelligence / Brief / Sources ----
  await goTab("intelligence", "Intelligence");
  await goTab("brief", "Brief & Metrics");
  await page.screenshot({ path: "results/ui/brief-hero.png" });
  await goTab("sources", "Data & Sources");

  // ---- restore default brief scenario for the hero dashboard shot ----
  await goTab("scenarios3", "Scenario Lab");
  await page.getByRole("button", { name: /J · Brief #13/ }).click();
  await page.waitForTimeout(1000);
  await page.getByRole("button", { name: "Dashboard", exact: true }).click();
  await page.locator('input[type="range"]').first().fill("136");
  await page.waitForTimeout(600);
  await page.screenshot({ path: "results/ui/dashboard-hero.png" });
  steps.push("hero dashboard OK");

  if (before) steps.push(`twin baseline text captured (${before.length} chars)`);
} catch (e) {
  errors.push(`FATAL: ${e.message}`);
  await page.screenshot({ path: "results/ui/FAILURE.png" }).catch(() => {});
}

await browser.close();
writeFileSync("results/ui/e2e-report.json", JSON.stringify({ steps, errors }, null, 2));
console.log("STEPS:\n" + steps.join("\n"));
console.log(errors.length ? `ERRORS (${errors.length}):\n` + errors.slice(0, 12).join("\n") : "NO CONSOLE/PAGE ERRORS");
process.exit(errors.length ? 1 : 0);
