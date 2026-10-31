/**
 * Probabilistic resilience engine (Monte Carlo).
 *
 * A single deterministic replay answers "what happened in that outage". A facility
 * engineer, a financier and a judge need "how likely is the ICU to stay powered through
 * the NEXT one". Each trial samples, with common random numbers across strategies:
 *   - outage start: random day and hour across three measured Maiduguri weather years
 *     (NASA POWER 2022–2024) → real cloud, dust and season variability;
 *   - generator failure-to-start and failures-while-running drawn from the published
 *     reliability class (NREL/TP-5C00-76553: FTS probability, exponential run-time to
 *     failure with the class MTTF), with log-normal repair time incl. logistics;
 *   - fuel supply chain: initial tank level, per-delivery delays and missed deliveries.
 * Every strategy then faces exactly the same trial. Outputs are survival curves
 * S(h) = P(no sustained Tier-1 interruption during the first h hours) and distributions of
 * critical-service hours and diesel use.
 */

import type { Strategy, SystemConfig } from "./types";
import { STEPS_PER_DAY } from "./types";
import { lineOutageConfig, type LineOutageOptions } from "./scenarios";
import { RELIABILITY_CLASSES, type ReliabilityClass } from "./policy";
import { withStrategy, weatherAt } from "./simulate";
import { initialRuntime, stepSim } from "./dispatch";
import { mulberry32 } from "./weather";
import { measuredDataset } from "./measured";

export interface MonteCarloOptions {
  trials: number;
  outageHours: number;
  reliabilityClassId: ReliabilityClass["id"];
  /** Mean repair time including parts and technician logistics, hours. */
  repairMeanHours: number;
  /** Probability a scheduled delivery is late; lateness uniform in (0, maxDelayHours]. */
  deliveryDelayProb: number;
  maxDelayHours: number;
  /** Probability a scheduled delivery never arrives. */
  deliveryMissProb: number;
  initialFuelFracMin: number;
  initialFuelFracMax: number;
  strategies: Strategy[];
  hardware: Partial<LineOutageOptions>;
  seed: number;
  datasets: string[];
}

export const DEFAULT_MC: MonteCarloOptions = {
  trials: 200,
  outageHours: 336,
  reliabilityClassId: "nrc",
  repairMeanHours: 72,
  deliveryDelayProb: 0.3,
  maxDelayHours: 96,
  deliveryMissProb: 0.1,
  initialFuelFracMin: 0.3,
  initialFuelFracMax: 1.0,
  strategies: ["baseline", "conventional", "sentinel"],
  hardware: {},
  seed: 20261031,
  datasets: ["maiduguri_2022", "maiduguri_2023", "maiduguri_2024"],
};

export interface TrialSample {
  datasetId: string;
  startDayOfYear: number;
  startHour: number;
  failToStart: boolean;
  runFailures: number[];
  repairHours: number;
  initialFuelFrac: number;
  delays: Record<number, number>;
  missed: number[];
}

export interface StrategyMcResult {
  strategy: Strategy;
  /** survival[h] = share of trials with no sustained Tier-1 interruption in hours [0, h). */
  survival: number[];
  /** Share of trials in which Tier-1 was never interrupted (incl. transfer breaks). */
  pZeroBreaks: number;
  /** Share of trials in which Tier-1 was sustained for the whole outage. */
  pTier1Whole: number;
  meanTier1Hours: number;
  meanCriticalHours: number;
  p10CriticalHours: number;
  p50CriticalHours: number;
  p90CriticalHours: number;
  meanDieselLitres: number;
  meanGensetRunHours: number;
  criticalHours: number[];
}

export interface MonteCarloResult {
  options: MonteCarloOptions;
  reliability: ReliabilityClass;
  samples: TrialSample[];
  byStrategy: Record<string, StrategyMcResult>;
  elapsedMs: number;
}

export function sampleTrials(o: MonteCarloOptions): TrialSample[] {
  const rng = mulberry32(o.seed);
  const cls = RELIABILITY_CLASSES.find((c) => c.id === o.reliabilityClassId) ?? RELIABILITY_CLASSES[1];
  const gauss = () => {
    const u = Math.max(1e-12, rng());
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rng());
  };
  const out: TrialSample[] = [];
  for (let i = 0; i < o.trials; i++) {
    const datasetId = o.datasets[Math.floor(rng() * o.datasets.length)];
    const days = Math.floor(measuredDataset(datasetId).hours / 24);
    const startDayOfYear = Math.floor(rng() * days);
    const startHour = Math.floor(rng() * 24);
    const failToStart = rng() < cls.failToStartProb;
    // Exponential run-time to failure; a repaired set restarts with a fresh exponential draw.
    const runFailures: number[] = [];
    let acc = 0;
    while (acc < o.outageHours * 1.5 && runFailures.length < 20) {
      acc += -Math.log(Math.max(1e-12, 1 - rng())) * cls.mttfHours;
      runFailures.push(acc);
    }
    // Log-normal repair time with the requested mean (σ = 0.6).
    const sigma = 0.6;
    const mu = Math.log(o.repairMeanHours) - (sigma * sigma) / 2;
    const repairHours = Math.max(2, Math.exp(mu + sigma * gauss()));
    const initialFuelFrac = o.initialFuelFracMin + rng() * (o.initialFuelFracMax - o.initialFuelFracMin);
    const delays: Record<number, number> = {};
    const missed: number[] = [];
    for (let k = 0; k < 40; k++) {
      if (rng() < o.deliveryMissProb) missed.push(k);
      else if (rng() < o.deliveryDelayProb) delays[k] = Math.ceil(rng() * o.maxDelayHours);
    }
    out.push({ datasetId, startDayOfYear, startHour, failToStart, runFailures, repairHours, initialFuelFrac, delays, missed });
  }
  return out;
}

/** Builds the deterministic configuration for one trial. Outage starts at day 0, startHour. */
export function trialConfig(o: MonteCarloOptions, s: TrialSample, strategy: Strategy): SystemConfig {
  const base = lineOutageConfig({ ...o.hardware, strategy, initialFuelFrac: s.initialFuelFrac });
  const horizonDays = Math.ceil((s.startHour + o.outageHours) / 24) + 1;
  const windows: SystemConfig["grid"]["outageWindows"] = [];
  let remaining = o.outageHours;
  let day = 0;
  let start = s.startHour;
  while (remaining > 0) {
    const end = Math.min(24, start + remaining);
    windows.push({ day, startHour: start, endHour: end });
    remaining -= end - start;
    start = 0;
    day++;
  }
  const cfg: SystemConfig = {
    ...base,
    horizonDays,
    grid: { ...base.grid, outageWindows: windows },
    battery: { ...base.battery, initialSocFrac: 0.85 },
    fuel: {
      ...base.fuel!,
      firstDeliveryDay: 3.5,
      delayHours: s.delays,
      missedDeliveries: s.missed,
    },
    reliability: {
      failToStartOnOutage: s.failToStart ? [1] : [],
      runFailureAtRunHours: s.runFailures,
      repairHours: s.repairHours,
    },
    measuredWeather: { datasetId: s.datasetId, startDayOfYear: s.startDayOfYear },
  };
  return withStrategy(cfg, strategy);
}

interface TrialOutcome {
  firstSustainedLossHour: number;
  anyBreak: boolean;
  tier1Hours: number;
  criticalHours: number;
  diesel: number;
  runHours: number;
}

/** Lean runner: steps the engine without storing the step history. */
export function runTrial(cfg: SystemConfig, outageStartStep: number, outageSteps: number): TrialOutcome {
  let rt = initialRuntime(cfg);
  const total = cfg.horizonDays * STEPS_PER_DAY;
  const end = Math.min(total, outageStartStep + outageSteps);
  let first = Infinity;
  let anyBreak = false;
  let t1 = 0;
  let crit = 0;
  let diesel = 0;
  let runH = 0;
  for (let t = 0; t < end; t++) {
    const { step, runtime } = stepSim(cfg, rt, weatherAt(cfg, t));
    rt = runtime;
    if (t < outageStartStep) continue;
    const d1 = step.demandKw[1];
    const short1 = d1 > 0 && step.servedKw[1] < 0.995 * d1;
    const shortBreak = step.startGapSec > 0 && step.startGapSec <= 90;
    if (short1) anyBreak = true;
    if (short1 && !shortBreak && first === Infinity) first = (t - outageStartStep) / 4;
    if (!short1 || shortBreak) t1 += 0.25;
    const dc = step.demandKw[1] + step.demandKw[2];
    if (step.servedKw[1] + step.servedKw[2] >= 0.995 * dc || shortBreak) crit += 0.25;
    diesel += step.dieselLph * 0.25;
    if (step.gensetOn) runH += 0.25;
  }
  return { firstSustainedLossHour: first, anyBreak, tier1Hours: t1, criticalHours: crit, diesel, runHours: runH };
}

function pct(sorted: number[], p: number): number {
  if (!sorted.length) return 0;
  const i = Math.min(sorted.length - 1, Math.max(0, Math.round(p * (sorted.length - 1))));
  return sorted[i];
}

export function summarize(strategy: Strategy, outcomes: TrialOutcome[], outageHours: number): StrategyMcResult {
  const n = outcomes.length;
  const survival: number[] = [];
  for (let h = 0; h <= outageHours; h++) survival.push(outcomes.filter((o) => o.firstSustainedLossHour >= h).length / n);
  const crit = outcomes.map((o) => o.criticalHours).sort((a, b) => a - b);
  const mean = (f: (o: TrialOutcome) => number) => outcomes.reduce((s, o) => s + f(o), 0) / n;
  return {
    strategy,
    survival,
    pZeroBreaks: outcomes.filter((o) => !o.anyBreak).length / n,
    pTier1Whole: outcomes.filter((o) => o.firstSustainedLossHour === Infinity).length / n,
    meanTier1Hours: mean((o) => o.tier1Hours),
    meanCriticalHours: mean((o) => o.criticalHours),
    p10CriticalHours: pct(crit, 0.1),
    p50CriticalHours: pct(crit, 0.5),
    p90CriticalHours: pct(crit, 0.9),
    meanDieselLitres: mean((o) => o.diesel),
    meanGensetRunHours: mean((o) => o.runHours),
    criticalHours: crit,
  };
}

/** Synchronous Monte Carlo (scripts and tests). The UI uses the chunked variant. */
export function runMonteCarlo(opts: Partial<MonteCarloOptions> = {}): MonteCarloResult {
  const o = { ...DEFAULT_MC, ...opts };
  const t0 = Date.now();
  const samples = sampleTrials(o);
  const outcomes: Record<string, TrialOutcome[]> = {};
  for (const strat of o.strategies) {
    outcomes[strat] = samples.map((s) => runTrial(trialConfig(o, s, strat), s.startHour * 4, o.outageHours * 4));
  }
  return finish(o, samples, outcomes, Date.now() - t0);
}

function finish(o: MonteCarloOptions, samples: TrialSample[], outcomes: Record<string, TrialOutcome[]>, elapsedMs: number): MonteCarloResult {
  const byStrategy: Record<string, StrategyMcResult> = {};
  for (const strat of o.strategies) byStrategy[strat] = summarize(strat, outcomes[strat], o.outageHours);
  return {
    options: o,
    reliability: RELIABILITY_CLASSES.find((c) => c.id === o.reliabilityClassId) ?? RELIABILITY_CLASSES[1],
    samples,
    byStrategy,
    elapsedMs,
  };
}

/** Chunked Monte Carlo that yields to the browser between batches and reports progress. */
export async function runMonteCarloAsync(
  opts: Partial<MonteCarloOptions>,
  onProgress?: (done: number, total: number) => void,
  shouldCancel?: () => boolean
): Promise<MonteCarloResult | null> {
  const o = { ...DEFAULT_MC, ...opts };
  const t0 = Date.now();
  const samples = sampleTrials(o);
  const outcomes: Record<string, TrialOutcome[]> = {};
  for (const s of o.strategies) outcomes[s] = [];
  const total = samples.length * o.strategies.length;
  let done = 0;
  for (let i = 0; i < samples.length; i++) {
    for (const strat of o.strategies) {
      outcomes[strat].push(runTrial(trialConfig(o, samples[i], strat), samples[i].startHour * 4, o.outageHours * 4));
      done++;
    }
    if (i % 4 === 3) {
      onProgress?.(done, total);
      await new Promise((r) => setTimeout(r, 0));
      if (shouldCancel?.()) return null;
    }
  }
  onProgress?.(total, total);
  return finish(o, samples, outcomes, Date.now() - t0);
}
