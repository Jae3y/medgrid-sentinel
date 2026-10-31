/**
 * Output-layer tests: field SMS/USSD channel, reporting/export, fleet screen.
 */
import { describe, expect, it } from "vitest";
import {
  compareStrategies,
  lineOutageConfig,
  runSimulation,
  smsFeed,
  ussdStatus,
  isGsm7,
  toGsm7,
  SMS_MAX,
  hourlyCsv,
  markdownReport,
  jsonReport,
  summaryRows,
  fleetCostFactor,
  fleetCurve,
  MAIDUGURI_EVENT,
} from "../index";

const results = compareStrategies(lineOutageConfig());

describe("feature-phone channel", () => {
  const feed = smsFeed(results.sentinel, 200);
  it("produces alerts for the replay", () => {
    expect(feed.length).toBeGreaterThan(5);
  });
  it("every SMS is a single segment of the GSM-7 alphabet (≤ 160 chars)", () => {
    for (const a of feed) {
      expect(a.text.length).toBeLessThanOrEqual(SMS_MAX);
      expect(isGsm7(a.text)).toBe(true);
    }
  });
  it("transliterates non-GSM symbols instead of sending Unicode", () => {
    expect(isGsm7("Tier ≥ 2 → ₦1,950")).toBe(false);
    expect(isGsm7(toGsm7("Tier ≥ 2 → ₦1,950 — 25°"))).toBe(true);
  });
  it("USSD status screen fits one USSD page (≤ 182 chars) and is GSM-7", () => {
    const step = results.sentinel.steps[500];
    const u = ussdStatus(step, 600, 0.15, 0.95);
    expect(u.length).toBeLessThanOrEqual(182);
    expect(isGsm7(u)).toBe(true);
  });
});

describe("reporting & export", () => {
  it("hourly CSV has one row per hour per controller plus a header", () => {
    const csv = hourlyCsv(results).trim().split("\n");
    const hours = MAIDUGURI_EVENT.horizonDays * 24;
    expect(csv.length).toBe(1 + 4 * hours);
    expect(csv[0].split(",")).toContain("tier1_served_kw");
    // every data row has the same number of columns as the header
    const n = csv[0].split(",").length;
    for (const line of csv.slice(1, 50)) expect(line.split(",").length).toBe(n);
  });

  it("CSV diesel column sums to the engine's diesel total for each controller (independent re-aggregation)", () => {
    const csv = hourlyCsv(results).trim().split("\n");
    const head = csv[0].split(",");
    const iC = head.indexOf("controller");
    const iD = head.indexOf("diesel_l");
    const sums: Record<string, number> = {};
    for (const line of csv.slice(1)) {
      const c = line.split(",");
      sums[c[iC]] = (sums[c[iC]] ?? 0) + Number(c[iD]);
    }
    for (const k of ["baseline", "conventional", "sentinel"] as const) {
      // per-hour rounding to 0.01 L across ~1,000 rows → tolerance 10 L
      expect(Math.abs(sums[k] - results[k].metrics.dieselLitres)).toBeLessThan(10);
    }
  });

  it("summary rows match engine metrics exactly (no re-computation drift)", () => {
    const rows = summaryRows(results);
    const s = rows.find((r) => r.controller === "sentinel")!;
    expect(s.criticalHours).toBeCloseTo(results.sentinel.metrics.criticalMaintainedHours, 2);
    expect(s.dieselAvoidedLitres).toBe(Math.round(results.baseline.metrics.dieselLitres - results.sentinel.metrics.dieselLitres));
  });

  it("markdown report states both brief metrics and the simulation caveat", () => {
    const md = markdownReport(results, { title: "t", scenario: "s", assumptions: ["a"], generatedAt: "x" });
    expect(md).toContain("Critical-service hours maintained");
    expect(md).toContain("Diesel litres avoided");
    expect(md).toContain("simulation, not field measurement");
  });

  it("JSON report parses and carries the governor's decisions", () => {
    const j = JSON.parse(jsonReport(results, { scenario: "s" }));
    expect(j.summary).toHaveLength(4);
    expect(j.governorDecisions.some((d: { type: string }) => d.type === "governor")).toBe(true);
  });

  it("works for a single legacy run too", () => {
    const one = { sentinel: runSimulation(lineOutageConfig()) };
    expect(hourlyCsv(one).split("\n").length).toBeGreaterThan(100);
  });
});

describe("fleet cost hypothesis", () => {
  it("is 1 for a single site, falls 6 % per doubling, and floors at 0.75", () => {
    expect(fleetCostFactor(1)).toBe(1);
    expect(fleetCostFactor(2)).toBeCloseTo(0.94, 9);
    expect(fleetCostFactor(4)).toBeCloseTo(0.94 * 0.94, 9);
    expect(fleetCostFactor(1000)).toBe(0.75);
  });
  it("curve is monotone non-increasing", () => {
    const c = fleetCurve(704415);
    for (let i = 1; i < c.length; i++) expect(c[i].capexPerSiteUsd).toBeLessThanOrEqual(c[i - 1].capexPerSiteUsd);
  });
});
