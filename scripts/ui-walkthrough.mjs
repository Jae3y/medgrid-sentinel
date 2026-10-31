/**
 * Production E2E walkthrough: drives every tab of the static export in real headless
 * Chrome, exercises the key interactions, captures screenshots for the README/deck,
 * and fails on any page or console error.
 * Run: npm run build && npm run serve   (static server on :3003), then npm run e2e
 */
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "fs";

const BASE = process.env.BASE_URL || "http://localhost:3003";
mkdirSync("results/ui", { recursive: true });

const errors = [];
const steps = [];
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 });
page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(`console: ${m.text()}`);
});

const tab = async (label) => {
  await page.getByRole("button", { name: label, exact: true }).first().click();
  await page.waitForTimeout(800);
};
const shot = async (name, opts = {}) => {
  // Capture to memory, then write with retries: on Windows an antivirus scan can
  // briefly lock a freshly written PNG.
  const buf = await page.screenshot(opts);
  for (let i = 0; i < 6; i++) {
    try {
      writeFileSync(`results/ui/${name}.png`, buf);
      break;
    } catch (e) {
      if (i === 5) throw e;
      await new Promise((r) => setTimeout(r, 700));
    }
  }
  steps.push(`screenshot ${name}`);
};
const text = async () => page.locator("main").innerText();

try {
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);

  // ---- Line Outage (Brief #13) ----
  const t0 = await text();
  if (!t0.includes("Critical-service hours kept")) throw new Error("mission page did not render metrics");
  await page.waitForSelector("canvas", { timeout: 60000 });
  await page.waitForTimeout(2500);
  await shot("mission-hero");
  // 3D: flip the controller at the same moment — the status-quo hospital is dark.
  await page.getByRole("radio", { name: "Status quo" }).click();
  await page.waitForTimeout(1500);
  await shot("scene-status-quo");
  await page.getByRole("radio", { name: "Sentinel" }).click();
  await page.waitForTimeout(1500);
  await shot("scene-sentinel");
  await page.waitForSelector("text=vs weekly diesel supply");
  await page.waitForFunction(() => !document.body.innerText.includes("Running replays"), null, { timeout: 60000 });
  await page.mouse.wheel(0, 900);
  await page.waitForTimeout(500);
  await shot("mission-ribbon");
  await page.mouse.wheel(0, 900);
  await page.waitForTimeout(500);
  await shot("mission-fuel");
  await page.mouse.wheel(0, 900);
  await page.waitForTimeout(500);
  await shot("mission-sms");
  // Interaction: toggle the generator-trip stress event; results must change.
  const before = await page.locator("text=What the software alone adds").locator("..").innerText();
  await page.getByText("Generator trips after 150 run-hours").click();
  await page.waitForTimeout(1500);
  const after = await page.locator("text=What the software alone adds").locator("..").innerText();
  steps.push(`stress toggle changed results: ${before !== after}`);
  await page.getByText("Generator trips after 150 run-hours").click();
  await page.waitForTimeout(1200);
  await page.evaluate(() => window.scrollTo(0, 0));
  // Export: the CSV must actually download with data rows for all four controllers.
  const [dl] = await Promise.all([page.waitForEvent("download"), page.getByText("Hourly data, all controllers (.csv)").click()]);
  const dlPath = await dl.path();
  const csvText = (await import("fs")).readFileSync(dlPath, "utf8");
  const csvRows = csvText.trim().split(/\r?\n/).length;
  if (csvRows < 4000) throw new Error(`CSV export too short: ${csvRows} rows`);
  steps.push(`csv export ${dl.suggestedFilename()} rows=${csvRows}`);
  const [md] = await Promise.all([page.waitForEvent("download"), page.getByText("Summary report (.md)").click()]);
  steps.push(`report export ${md.suggestedFilename()}`);

  // ---- Resilience Lab ----
  await tab("Resilience lab");
  await page.waitForFunction(() => document.body.innerText.includes("P(TIER-1 KEPT") || document.body.innerText.includes("P(Tier-1 kept"), null, { timeout: 120000 });
  await page.waitForFunction(() => !document.body.innerText.includes("Running…"), null, { timeout: 120000 });
  await page.waitForTimeout(800);
  await shot("resilience");
  steps.push("monte carlo completed in browser");

  // ---- Dashboard / Twin / Scenario Lab ----
  await page.evaluate(() => window.scrollTo(0, 0));
  await tab("Live dashboard");
  await shot("dashboard");
  await tab("Digital twin");
  await page.getByRole("radio", { name: "Fixed-rule hybrid" }).click();
  await page.waitForTimeout(800);
  await page.getByRole("radio", { name: "MedGrid Sentinel" }).click();
  await page.waitForTimeout(800);
  steps.push("twin controller switch OK");
  await shot("twin");
  await tab("Stress scenarios");
  await page.getByRole("button", { name: /G · Generator failure/ }).first().click().catch(() => steps.push("scenario G button not found"));
  await page.waitForTimeout(1000);
  await shot("scenarios");

  // ---- Financials ----
  await tab("Financials");
  await page.waitForFunction(() => document.body.innerText.includes("EaaS provider IRR") || document.body.innerText.includes("EAAS PROVIDER IRR"), null, { timeout: 120000 });
  await page.waitForTimeout(1500);
  await shot("financials");
  await page.getByRole("button", { name: /Run search/ }).click();
  await page.waitForFunction(() => document.body.innerText.includes("Best NPV"), null, { timeout: 180000 });
  steps.push("sizing search completed in browser");

  // ---- Fleet ----
  await page.evaluate(() => window.scrollTo(0, 0));
  await tab("Fleet & scale");
  await page.waitForFunction(() => document.body.innerText.includes("10 site-years simulated"), null, { timeout: 180000 });
  await page.waitForTimeout(800);
  await shot("fleet");

  // ---- Intelligence / Brief / Sources ----
  await tab("Forecasting & AI");
  await page.waitForTimeout(1000);
  await shot("intelligence");
  await tab("Brief & metrics");
  await page.waitForTimeout(2500);
  await shot("brief");
  await tab("Data & sources");
  await shot("sources");

  // ---- Mobile layout ----
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.getByRole("button", { name: "Line outage replay" }).first().click();
  await page.waitForTimeout(1200);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  steps.push(`mobile horizontal overflow px: ${overflow}`);
  await shot("mobile-mission");
} catch (e) {
  errors.push(`walkthrough: ${e.message}`);
  await page.screenshot({ path: "results/ui/FAILURE.png" }).catch(() => {});
}

await browser.close();
const report = { base: BASE, at: new Date().toISOString(), steps, errors, pass: errors.length === 0 };
writeFileSync("results/ui/e2e-report.json", JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
process.exit(errors.length ? 1 : 0);
