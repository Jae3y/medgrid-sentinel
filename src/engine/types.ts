/**
 * MedGrid Sentinel — core type definitions for the hospital microgrid simulation engine.
 *
 * Units: power in kW (AC at the main bus), energy in kWh, time in hours.
 * One simulation step = 0.25 h (15 minutes). All models are deterministic.
 */

export type Tier = 1 | 2 | 3;

/** A hospital electrical load with a criticality tier and 24-hour utilization profile. */
export interface LoadDef {
  id: string;
  name: string;
  tier: Tier;
  ratedKw: number;
  /** 24 hourly utilization fractions (0..1); index h covers hour beginning at h:00. */
  profile: number[];
}

export interface FacilityConfig {
  name: string;
  beds: number;
  loads: LoadDef[];
}

export interface PVConfig {
  /** Installed DC capacity, kWp */
  kwp: number;
  /**
   * Performance ratio (inverter, soiling, mismatch, cabling). 0..1. When measured
   * ambient temperature is available the temperature loss is modelled separately
   * (see tempCoeffPerC) and this PR must then EXCLUDE temperature losses.
   */
  performanceRatio: number;
  /** Power temperature coefficient per °C above 25 °C cell temperature (mono-PERC ≈ −0.0035). */
  tempCoeffPerC?: number;
  /** Nominal operating cell temperature, °C. Cell model: T_c = T_amb + (NOCT − 20)/800 × G. */
  noctC?: number;
}

export interface BatteryConfig {
  nominalKwh: number;
  minSocFrac: number;
  maxSocFrac: number;
  initialSocFrac: number;
  maxChargeKw: number;
  maxDischargeKw: number;
  /** Lumped one-way efficiencies (AC-coupled, includes inverter + battery losses). */
  chargeEff: number;
  dischargeEff: number;
  /** SOC fraction kept in reserve while grid-connected, for outage ride-through. */
  gridReserveSocFrac: number;
  /** Allow charging from the grid during off-peak hours to restore reserve. */
  gridChargeEnabled: boolean;
  /** End of the off-peak window (hour of day) used for grid charging. */
  gridChargeWindowEndHour: number;
}

export interface InverterConfig {
  /** AC power limit of the shared PV/battery inverter station, kW */
  ratedKw: number;
}

export interface GensetConfig {
  ratedKw: number;
  /** Minimum stable load; below this the unit should not run for long (wet stacking). */
  minLoadKw: number;
  /** No-load/fixed fuel burn while running, litres per hour. */
  fuelFixedLph: number;
  /** Marginal fuel burn, litres per kWh generated. */
  fuelLinearLperKwh: number;
  /** Steps (15 min) from start command to breaker close (legacy coarse model, used when startupSeconds is absent). */
  startupSteps: number;
  /**
   * Seconds from start command to transfer-switch closure (ATS-class sets: ~10–15 s).
   * When present it supersedes startupSteps: the first running step loses
   * startupSeconds / 900 of its energy unless storage bridges the gap.
   */
  startupSeconds?: number;
  /** Variable O&M while running, naira per hour. */
  maintenanceNairaPerHour: number;
  /** Delivered diesel price, naira per litre. */
  fuelNairaPerLitre: number;
  /** Genset may run to support grid import limit / peak shaving. */
  canSupportGridPeak: boolean;
  /** Genset may charge the battery to reach its minimum efficient load point. */
  chargesBattery: boolean;
  /** Fault condition used by failure scenarios. */
  failed: boolean;
}

export interface OutageWindow {
  /** Simulated day index the window applies to. Omitted = repeats every day. */
  day?: number;
  /** Start hour of day (inclusive), end hour (exclusive). */
  startHour: number;
  endHour: number;
}

/** On-site diesel stock and the resupply chain that feeds it. Absent = unlimited fuel. */
export interface FuelConfig {
  tankLitres: number;
  initialLitres: number;
  /** Litres per delivery (capped by free tank space when it arrives). */
  deliveryLitres: number;
  /** Days between scheduled deliveries; 0 disables resupply. */
  deliveryEveryDays: number;
  /** Simulated day of the first scheduled delivery. */
  firstDeliveryDay: number;
  /** Hour of day deliveries arrive. */
  deliveryHour: number;
  /** Delivery indices (0-based) that never arrive (convoy cancelled / supplier stock-out). */
  missedDeliveries?: number[];
  /** Per-delivery delay in hours, keyed by delivery index (set by the Monte Carlo sampler). */
  delayHours?: Record<number, number>;
}

/**
 * Deterministic generator failure injection. The Monte Carlo sampler draws these from
 * published reliability statistics (NREL/TP-5C00-76553); scenarios may set them explicitly.
 */
export interface GensetReliabilityInjection {
  /** Islanding events (1-based outage count) at which the set fails to start. */
  failToStartOnOutage?: number[];
  /** Cumulative run-hours at which a running failure occurs (ascending). */
  runFailureAtRunHours?: number[];
  /** Hours from a failure until the set is available again (repair incl. logistics). */
  repairHours: number;
}

/**
 * Dispatch strategy. All strategies share the same physics and constraints and differ
 * only in decisions — which is how the value of the control software is isolated.
 *
 *  - baseline:           grid + diesel only (status quo); the generator follows the full load.
 *  - baseline_rationed:  status quo + manual rationing (every Tier-3 load off while islanded).
 *  - conventional:       PV + battery + diesel under fixed-rule hybrid-inverter logic
 *                        (battery first, generator load-follows once the battery hits its floor).
 *  - sentinel:           identical hardware under MedGrid Sentinel predictive dispatch:
 *                        fuel-runway governor, clinical ride-through reserve, efficient
 *                        generator cycling.
 */
export type Strategy = "baseline" | "baseline_rationed" | "conventional" | "sentinel";

export interface SentinelPolicy {
  /** Minimum planning horizon for the fuel-runway governor, hours. */
  minHorizonHours: number;
  /** Planning horizon used when no delivery is scheduled, hours. */
  maxHorizonHours: number;
  /** Hours added after the next expected delivery (convoy-delay margin). */
  deliveryMarginHours: number;
  /** Fraction of forecast solar energy the governor is allowed to count on. */
  pvForecastConfidence: number;
  /** Hours of Tier-1 demand always held in the battery while the generator is off. */
  clinicalReserveHours: number;
  /** Generator cycling: stop charging and shut down once SOC reaches this fraction. */
  gensetStopSocFrac: number;
  /** Required surplus before the governor restores a higher service level (hysteresis). */
  restoreMargin: number;
}

/** Stochastic feeder regime (seeded) that expands into explicit outage windows. */
export interface FeederRegime {
  /** Mean interruptions per day (Poisson). */
  outagesPerDay: number;
  /** Median interruption duration, hours (log-normal). */
  medianDurationHours: number;
  /** Log-normal shape parameter. */
  sigma: number;
}

export interface GridConfig {
  available: boolean;
  importLimitKw: number;
  tariffNairaPerKwh: number;
  outageWindows: OutageWindow[];
  /** Steps to wait after supply returns before re-closing the tie breaker. */
  reconnectDelaySteps: number;
}

export type PQKind = "voltage_sag" | "voltage_swell" | "under_frequency" | "over_frequency";

export interface PQEvent {
  day: number;
  startHour: number;
  endHour: number;
  kind: PQKind;
  /** Worst measured value during the window (V or Hz). */
  value: number;
  /** Whether the disturbance exceeds protective trip thresholds. */
  tripsBreaker: boolean;
}

export type WeatherType = "sunny" | "partly_cloudy" | "overcast" | "harmattan";

export interface WeatherDay {
  type: WeatherType;
  label: string;
  /** Clear-sky peak irradiance for the day type, W/m². */
  peakIrradianceWm2: number;
}

export interface SystemConfig {
  facility: FacilityConfig;
  pv: PVConfig;
  battery: BatteryConfig;
  inverter: InverterConfig;
  genset: GensetConfig;
  grid: GridConfig;
  weather: WeatherDay[];
  /** Simulated power-quality disturbances (explicitly synthetic telemetry). */
  pqEvents: PQEvent[];
  horizonDays: number;
  /** Open the grid tie on breaker-tripping PQ events and ride through on island. */
  islandOnSeverePQ: boolean;
  /** Limit grid import to this kW (peak shaving); null disables. */
  peakShaveKw: number | null;
  /** Seed for the small deterministic telemetry noise (never affects energy math). */
  seed: number;
  /** Dispatch strategy (default "conventional"). */
  strategy?: Strategy;
  sentinel?: SentinelPolicy;
  /** On-site diesel logistics; absent = unlimited fuel. */
  fuel?: FuelConfig;
  reliability?: GensetReliabilityInjection;
  /**
   * Measured weather: dataset id in src/data/irradiance (NASA POWER hourly) and the
   * 0-based day-of-year that simulated day 0 maps to. Absent = synthetic library.
   */
  measuredWeather?: { datasetId: string; startDayOfYear: number };
  /** Optional stochastic feeder regime layered on top of explicit outage windows. */
  feederRegime?: FeederRegime;
  /** Multiplier applied to every load (demand-surge studies). Default 1. */
  loadScale?: number;
  /** Calendar date of simulated day 0 (display only), e.g. "2024-09-20". */
  calendarStart?: string;
}

export interface TierDemand {
  1: number;
  2: number;
  3: number;
}

export interface StepResult {
  t: number;
  day: number;
  hour: number;
  demandKw: TierDemand;
  servedKw: TierDemand;
  unservedKw: TierDemand;
  /** PV DC potential before inverter cap, kW. */
  pvAvailableKw: number;
  /** PV AC power actually injected at the bus, kW. */
  pvKw: number;
  pvCurtailedKw: number;
  gridKw: number;
  gridConnected: boolean;
  islanded: boolean;
  /** Battery bus power: positive = charging, negative = discharging. kW */
  battKw: number;
  socFrac: number;
  socKwh: number;
  gensetKw: number;
  gensetOn: boolean;
  gensetStarting: boolean;
  dieselLph: number;
  gridCostNaira: number;
  dieselCostNaira: number;
  maintenanceNaira: number;
  /** Diesel in the tank at the end of the step, litres (Infinity when unlimited). */
  fuelLitres: number;
  /** Load deliberately deferred by the dispatch policy (not a supply deficit), kW by tier. */
  deferredKw: TierDemand;
  /** Governor service level: 3 all tiers · 2 Tier 1+2 · 1 Tier 1 + half of Tier 2 · 0 Tier 1 only. */
  serviceLevel: ServiceLevel;
  /** Generator needed-or-not, it is unavailable this step (fault, repair, or empty tank). */
  gensetUnavailable: boolean;
  /** Irradiance used this step, W/m² (measured or synthetic). */
  irradianceWm2: number;
  /** Seconds of generator start-to-transfer gap inside this step (0 when none). */
  startGapSec: number;
  /** Diesel delivered at this step, litres. */
  deliveredL: number;
  /** Simulated local telemetry (never presented as measured facility data). */
  telemetry?: { voltageV: number; freqHz: number; pqKind?: PQKind };
}

export type EventSeverity = "info" | "warning" | "critical";

export interface SimEvent {
  t: number;
  day: number;
  hour: number;
  severity: EventSeverity;
  type: string;
  message: string;
}

export interface SimMetrics {
  horizonHours: number;
  totalDemandKwh: number;
  totalServedKwh: number;
  tier1DemandKwh: number;
  tier1ServedKwh: number;
  /** Tier 1 + Tier 2 (life-critical + clinical priority). */
  criticalDemandKwh: number;
  criticalServedKwh: number;
  unservedKwh: TierDemand;
  outageHours: number;
  /** Energy-weighted hours of critical (T1+T2) service maintained during outages. */
  criticalServiceHours: number;
  tier1ServiceHours: number;
  pvKwh: number;
  pvUsedKwh: number;
  pvCurtailedKwh: number;
  gridKwh: number;
  battChargedKwh: number;
  battDischargedKwh: number;
  gensetKwh: number;
  gensetRuntimeH: number;
  dieselLitres: number;
  renewableShare: number;
  peakDemandKw: number;
  gridCostNaira: number;
  dieselCostNaira: number;
  maintenanceNaira: number;
  opexNaira: number;
  co2Kg: number;
  /** Hours (while islanded) in which ≥ 99.5 % of Tier-1 demand was served. */
  tier1MaintainedHours: number;
  /** Hours (while islanded) in which ≥ 99.5 % of Tier-1 AND Tier-2 demand was served. */
  criticalMaintainedHours: number;
  /** Distinct episodes in which Tier-1 supply was interrupted. */
  tier1Interruptions: number;
  /** Energy deliberately deferred by policy (rationing), kWh. */
  deferredKwh: number;
  /** Hours in which the generator was unavailable (fault, repair or empty tank) while islanded. */
  gensetUnavailableHours: number;
  /** Islanded hours with an empty diesel tank. */
  fuelOutHours: number;
  /** Litres delivered by the resupply chain during the run. */
  fuelDeliveredLitres: number;
  /** Diesel left at the end of the run (Infinity when unlimited). */
  fuelEndLitres: number;
  /** Diesel burned per critical-service hour maintained. */
  litresPerCriticalHour: number;
}

export type ServiceLevel = 0 | 1 | 2 | 3;

export interface DayMetrics {
  day: number;
  demandKwh: number;
  servedKwh: number;
  outageHours: number;
  criticalServiceHours: number;
  dieselLitres: number;
  gensetKwh: number;
  gridKwh: number;
  pvKwh: number;
  opexNaira: number;
  unservedKwh: number;
}

export interface SimResult {
  steps: StepResult[];
  events: SimEvent[];
  metrics: SimMetrics;
  perDay: DayMetrics[];
  config: SystemConfig;
}

export const STEP_HOURS = 0.25;
export const STEPS_PER_DAY = 96;
/** kg CO2 per litre of diesel (stationary combustion, DEFRA-class value). */
export const CO2_KG_PER_LITRE_DIESEL = 2.68;
