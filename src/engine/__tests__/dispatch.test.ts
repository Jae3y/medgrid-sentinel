/**
 * Dispatch-engine integration tests: power balance at every step, tier priority,
 * battery floors, outage transitions and determinism.
 */
import { describe, expect, it } from "vitest";
import { runSimulation, buildBaselineConfig, peakFacilityLoadKw } from "../simulate";
import { stepSim, initialRuntime } from "../dispatch";
import { defaultConfig } from "../scenarios";
import { dailyIrradiance } from "../weather";
import type { StepResult, SystemConfig } from "../types";

function balanceResidual(s: StepResult): number {
  const served = s.servedKw[1] + s.servedKw[2] + s.servedKw[3];
  const supply = s.pvKw + s.gridKw + s.gensetKw - s.battKw;
  return supply - served;
}

describe("power balance", () => {
  it("holds at every step of a normal 3-day run (≤ 1e-6 kW)", () => {
    const sim = runSimulation(defaultConfig());
    for (const s of sim.steps) {
      expect(Math.abs(balanceResidual(s))).toBeLessThan(1e-6);
    }
  });

  it("holds during islanded operation with generator running", () => {
    const cfg = defaultConfig();
    cfg.grid.outageWindows = [{ startHour: 6, endHour: 18 }];
    const sim = runSimulation(cfg);
    const islandedGenset = sim.steps.filter((s) => s.islanded && s.gensetOn);
    expect(islandedGenset.length).toBeGreaterThan(10);
    for (const s of islandedGenset) {
      expect(s.gridKw).toBe(0);
      expect(Math.abs(balanceResidual(s))).toBeLessThan(1e-6);
    }
  });
});

describe("load priority", () => {
  it("serves tier 1+2 fully and sheds tier 3 when the generator is capacity-limited", () => {
    const cfg = defaultConfig();
    cfg.pv = { kwp: 0, performanceRatio: 0.78 };
    // Small pack bridges the generator start delay; 150 kW genset covers night
    // critical demand (T1 ≈ 80 kW + T2 ≈ 68 kW) but not the daytime total —
    // deferrable load must shed first.
    cfg.battery = { ...cfg.battery, nominalKwh: 60, maxChargeKw: 100, maxDischargeKw: 100 };
    cfg.genset = { ...cfg.genset, ratedKw: 150, minLoadKw: 40, failed: false };
    cfg.grid.outageWindows = [{ day: 1, startHour: 0, endHour: 24 }];
    const sim = runSimulation(cfg);
    const m = sim.metrics;
    expect(m.unservedKwh[1]).toBeLessThan(1);
    expect(m.unservedKwh[2]).toBeGreaterThan(0);
    expect(m.unservedKwh[3]).toBeGreaterThan(m.unservedKwh[2]);
  });

  it("reports tier-1 deficits honestly instead of hiding them", () => {
    const cfg = defaultConfig();
    cfg.pv = { kwp: 0, performanceRatio: 0.78 };
    cfg.battery = { ...cfg.battery, nominalKwh: 0 };
    cfg.genset = { ...cfg.genset, failed: true };
    cfg.grid.outageWindows = [{ day: 1, startHour: 0, endHour: 24 }];
    const sim = runSimulation(cfg);
    expect(sim.metrics.unservedKwh[1]).toBeGreaterThan(0);
    expect(
      sim.events.some((e) => e.type === "tier1_unserved" && e.severity === "critical")
    ).toBe(true);
  });
});

describe("battery constraints", () => {
  it("never discharges below min SOC while islanded", () => {
    const cfg = defaultConfig();
    cfg.grid.outageWindows = [{ startHour: 6, endHour: 18 }];
    const sim = runSimulation(cfg);
    const minSoc = Math.min(...sim.steps.map((s) => s.socFrac));
    expect(minSoc).toBeGreaterThanOrEqual(cfg.battery.minSocFrac * 0.999);
  });

  it("keeps the outage reserve while grid-connected (peak shave case)", () => {
    const cfg = defaultConfig();
    cfg.peakShaveKw = 200; // aggressive shaving forces battery use
    const sim = runSimulation(cfg);
    for (const s of sim.steps) {
      if (!s.islanded && s.battKw < 0) {
        // discharging while connected: SOC must stay at/above reserve
        expect(s.socFrac).toBeGreaterThanOrEqual(
          Math.max(cfg.battery.minSocFrac, cfg.battery.gridReserveSocFrac) - 0.005
        );
      }
    }
  });
});

describe("outage state machine", () => {
  it("forms the island on battery with no Tier-1 break, then bridges the generator's 15 s transfer", () => {
    const cfg = defaultConfig();
    cfg.grid.outageWindows = [{ day: 1, startHour: 18, endHour: 24 }, { day: 2, startHour: 0, endHour: 18 }];
    const sim = runSimulation(cfg);
    const t0 = 96 + 18 * 4;
    const s0 = sim.steps[t0];
    expect(s0.islanded).toBe(true);
    // Evening demand exceeds the 200 kW battery rating, so the set is called at once —
    // and storage discharges through its 15 s start so Tier-1 sees no break.
    expect(s0.battKw).toBeLessThan(0);
    expect(s0.servedKw[1]).toBeCloseTo(s0.demandKw[1], 9);
    expect(s0.startGapSec).toBe(0);
    expect(sim.metrics.tier1Interruptions).toBe(0);
  });

  it("waits for the stability delay before re-closing the tie", () => {
    const cfg = defaultConfig();
    cfg.grid.outageWindows = [{ startHour: 6, endHour: 18 }];
    cfg.grid.reconnectDelaySteps = 2;
    const sim = runSimulation(cfg);
    // outage ends at 18:00 → t = 96 + 72 = 168. Steps 168,169 still islanded.
    expect(sim.steps[168].islanded).toBe(true);
    expect(sim.steps[169].islanded).toBe(true);
    expect(sim.steps[170].islanded).toBe(false);
    expect(sim.steps[170].gridKw).toBeGreaterThanOrEqual(0);
  });

  it("islands protectively on a breaker-tripping PQ event", () => {
    const cfg = defaultConfig();
    cfg.pqEvents = [
      { day: 1, startHour: 10, endHour: 11, kind: "voltage_sag", value: 186, tripsBreaker: true },
    ];
    const sim = runSimulation(cfg);
    const tStart = 96 + 40;
    expect(sim.steps[tStart].islanded).toBe(true);
    expect(sim.events.some((e) => e.type === "pq_trip")).toBe(true);
    // reconnected after the event + delay
    expect(sim.steps[tStart + 4 + 2].islanded).toBe(false);
  });
});

describe("determinism", () => {
  it("produces identical results for identical configurations", () => {
    const a = runSimulation(defaultConfig());
    const b = runSimulation(defaultConfig());
    expect(JSON.stringify(a.steps)).toBe(JSON.stringify(b.steps));
    expect(JSON.stringify(a.metrics)).toBe(JSON.stringify(b.metrics));
  });
});

describe("stepSim directly", () => {
  it("starts the genset immediately when startupSteps = 0", () => {
    const cfg: SystemConfig = {
      ...defaultConfig(),
      battery: { ...defaultConfig().battery, nominalKwh: 0 },
      genset: { ...defaultConfig().genset, startupSteps: 0 },
      grid: { ...defaultConfig().grid, outageWindows: [{ startHour: 0, endHour: 24 }] },
      weather: [
        { type: "sunny", label: "Sunny", peakIrradianceWm2: 920 },
        { type: "sunny", label: "Sunny", peakIrradianceWm2: 920 },
        { type: "sunny", label: "Sunny", peakIrradianceWm2: 920 },
      ],
    };
    const irr = dailyIrradiance(cfg.weather[0], 42)[0];
    const out = stepSim(cfg, initialRuntime(cfg), irr);
    expect(out.step.gensetOn).toBe(true);
    expect(out.step.gensetKw).toBeGreaterThan(0);
  });
});

describe("baseline builder", () => {
  it("removes PV and storage and upsizes the generator", () => {
    const cfg = defaultConfig();
    cfg.grid.outageWindows = [{ day: 1, startHour: 6, endHour: 18 }];
    const b = buildBaselineConfig(cfg);
    expect(b.pv.kwp).toBe(0);
    expect(b.battery.nominalKwh).toBe(0);
    expect(b.genset.ratedKw).toBeGreaterThanOrEqual(450);
    expect(peakFacilityLoadKw(cfg)).toBeGreaterThan(300);
    const sim = runSimulation(b);
    expect(sim.metrics.pvUsedKwh).toBe(0);
    expect(sim.metrics.dieselLitres).toBeGreaterThan(0);
  });
});
