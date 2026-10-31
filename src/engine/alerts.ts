/**
 * Low-bandwidth field channel: converts engine events into single-segment SMS alerts
 * (≤ 160 GSM-7 characters) for the duty engineer's feature phone, and renders the USSD
 * status menu. No smartphone, app or data connection is assumed on the receiving end.
 *
 * The POC renders these messages in the UI; delivery through an SMS/USSD aggregator is a
 * pilot integration (docs/DEPLOYMENT_ROADMAP.md) — nothing is sent from the prototype.
 */

import type { SimEvent, SimResult, StepResult } from "./types";
import { STEPS_PER_DAY } from "./types";

export const SMS_MAX = 160;

/** GSM 03.38 basic character set (single-segment SMS without Unicode). */
const GSM7 = new Set(
  "@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà".split("")
);

export function isGsm7(text: string): boolean {
  for (const ch of text) if (!GSM7.has(ch)) return false;
  return true;
}

/** Replaces non-GSM characters (≥, →, —, ₦, °) with safe ASCII equivalents. */
export function toGsm7(text: string): string {
  return text
    .replace(/→/g, "->")
    .replace(/[—–]/g, "-")
    .replace(/≥/g, ">=")
    .replace(/≤/g, "<=")
    .replace(/₦/g, "NGN")
    .replace(/°/g, "deg")
    .replace(/[·•]/g, "-")
    .replace(/[^\x20-\x7E\n]/g, "");
}

export interface SmsAlert {
  t: number;
  stamp: string;
  severity: SimEvent["severity"];
  text: string;
  chars: number;
}

function stamp(t: number, calendarStart?: string): string {
  const day = Math.floor(t / STEPS_PER_DAY);
  const h = (t % STEPS_PER_DAY) / 4;
  const hh = String(Math.floor(h)).padStart(2, "0");
  const mm = String(Math.round((h % 1) * 60)).padStart(2, "0");
  if (calendarStart) {
    const d = new Date(`${calendarStart}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + day);
    return `${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")} ${hh}:${mm}`;
  }
  return `D${day + 1} ${hh}:${mm}`;
}

function autonomyHours(s: StepResult, minSocFrac: number, nominalKwh: number, dischargeEff: number): number {
  const usable = Math.max(0, s.socKwh - minSocFrac * nominalKwh) * dischargeEff;
  return s.demandKw[1] > 0 ? usable / s.demandKw[1] : 0;
}

const ALERT_TYPES = new Set([
  "outage_start",
  "grid_reconnect",
  "governor",
  "fuel_out",
  "fuel_missed",
  "fuel_delivery",
  "genset_fts",
  "genset_ftr",
  "genset_repaired",
  "tier1_unserved",
  "pq_trip",
  "battery_reserve",
]);

/** Builds the duty-engineer SMS feed for a simulation run. */
export function smsFeed(sim: SimResult, limit = 40): SmsAlert[] {
  const cfg = sim.config;
  const b = cfg.battery;
  const out: SmsAlert[] = [];
  for (const e of sim.events) {
    if (!ALERT_TYPES.has(e.type)) continue;
    const s = sim.steps[Math.min(e.t, sim.steps.length - 1)];
    const fuel = Number.isFinite(s.fuelLitres) ? `${Math.round(s.fuelLitres)}L` : "n/a";
    const soc = b.nominalKwh > 0 ? `${Math.round(s.socFrac * 100)}%` : "-";
    const t1h = b.nominalKwh > 0 ? autonomyHours(s, b.minSocFrac, b.nominalKwh, b.dischargeEff).toFixed(1) : "0";
    let body: string;
    switch (e.type) {
      case "outage_start":
        body = `GRID LOST. Island formed. Batt ${soc} (T1 ${t1h}h). Diesel ${fuel}.`;
        break;
      case "grid_reconnect":
        body = `GRID BACK, tie closed. Batt ${soc}. Diesel ${fuel}. Restoring normal mode.`;
        break;
      case "governor": {
        const lvl = s.serviceLevel;
        const what = lvl === 3 ? "FULL SERVICE restored" : lvl === 2 ? "Tier3 (HVAC/laundry/admin) DEFERRED" : lvl === 1 ? "Tier3 OFF, Tier2 essential only" : "TIER1 ONLY - life-critical";
        body = `FUEL RUNWAY: ${what}. Diesel ${fuel}, batt ${soc}. ICU/OT/cold chain protected.`;
        break;
      }
      case "fuel_out":
        body = `DIESEL EMPTY. Gen stopped. Batt ${soc} = ${t1h}h of Tier1. Expedite delivery NOW.`;
        break;
      case "fuel_missed":
        body = `Diesel delivery MISSED. Tank ${fuel}. Runway recalculated; rationing may follow.`;
        break;
      case "fuel_delivery":
        body = `Diesel received. Tank ${fuel}. Runway recalculated.`;
        break;
      case "genset_fts":
        body = `GEN FAILED TO START. Battery+solar carrying Tier1 (${t1h}h). Call technician.`;
        break;
      case "genset_ftr":
        body = `GEN TRIPPED while running. Battery+solar carrying Tier1 (${t1h}h). Call technician.`;
        break;
      case "genset_repaired":
        body = `Generator back in service. Diesel ${fuel}, batt ${soc}.`;
        break;
      case "tier1_unserved":
        body = `CRITICAL: Tier1 supply interrupted. Check ICU/OT UPS and transfer switch.`;
        break;
      case "pq_trip":
        body = `Grid disturbance - protective island. Batt ${soc}. Monitoring for stable return.`;
        break;
      case "battery_reserve":
        body = `Battery at floor (${soc}). Generator must carry load.`;
        break;
      default:
        body = e.message;
    }
    const st = stamp(e.t, cfg.calendarStart);
    const text = toGsm7(`MGS ${st} ${body}`).slice(0, SMS_MAX);
    out.push({ t: e.t, stamp: st, severity: e.severity, text, chars: text.length });
  }
  return out.slice(-limit);
}

/** USSD status screen (≤ 182 characters per USSD page). */
export function ussdStatus(s: StepResult, nominalKwh: number, minSocFrac: number, dischargeEff: number): string {
  const fuel = Number.isFinite(s.fuelLitres) ? `${Math.round(s.fuelLitres)}L` : "n/a";
  const t1h = autonomyHours(s, minSocFrac, nominalKwh, dischargeEff).toFixed(1);
  const mode = s.islanded ? "ISLAND" : "GRID";
  const gen = s.gensetOn ? "RUN" : s.gensetUnavailable ? "UNAVAIL" : "STBY";
  return toGsm7(
    `MedGrid Sentinel\n${mode} Gen:${gen}\nBatt ${Math.round(s.socFrac * 100)}% (T1 ${t1h}h)\nDiesel ${fuel}\nT1 ${Math.round(s.servedKw[1])}/${Math.round(s.demandKw[1])}kW\n1 Alerts 2 Runway 3 Ack`
  );
}
