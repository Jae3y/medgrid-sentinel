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
  /** Performance ratio (includes inverter, soiling, temperature, cabling). 0..1 */
  performanceRatio: number;
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
  /** Steps (15 min) from start command to breaker close. */
  startupSteps: number;
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
}

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
