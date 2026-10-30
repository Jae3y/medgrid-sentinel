export const NAIRA = "₦";

export function fmtNum(v: number, digits = 0): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(v);
}

export function fmtKw(v: number): string {
  return `${fmtNum(v, v < 100 ? 1 : 0)} kW`;
}

export function fmtKwh(v: number): string {
  if (v >= 1_000_000) return `${fmtNum(v / 1_000_000, 2)} GWh`;
  if (v >= 1000) return `${fmtNum(v / 1000, 2)} MWh`;
  return `${fmtNum(v, 0)} kWh`;
}

/** Compact naira: ₦12.4M / ₦1.87B / ₦450k */
export function fmtNaira(v: number, digits = 1): string {
  const abs = Math.abs(v);
  if (abs >= 1e9) return `${NAIRA}${fmtNum(v / 1e9, digits)}B`;
  if (abs >= 1e6) return `${NAIRA}${fmtNum(v / 1e6, digits)}M`;
  if (abs >= 1e3) return `${NAIRA}${fmtNum(v / 1e3, 0)}k`;
  return `${NAIRA}${fmtNum(v, 0)}`;
}

export function fmtNairaFull(v: number): string {
  return `${NAIRA}${fmtNum(v, 0)}`;
}

export function fmtPct(v: number, digits = 1): string {
  return `${fmtNum(v * 100, digits)}%`;
}

export function fmtHour12(h: number): string {
  const hh = Math.floor(h) % 24;
  const mm = Math.round((h - Math.floor(h)) * 60);
  const ampm = hh < 12 ? "AM" : "PM";
  const h12 = hh % 12 === 0 ? 12 : hh % 12;
  return `${h12}:${String(mm).padStart(2, "0")} ${ampm}`;
}

export function fmtUsd(v: number, digits = 0): string {
  return `$${fmtNum(v, digits)}`;
}

/** Official submission deadline: Sunday, November 1, 2026, 12:00 PM ET.
 *  After the Nov 1 DST change ET = EST (UTC−5) → 17:00 UTC → 18:00 WAT. */
export const SUBMISSION_DEADLINE = new Date("2026-11-01T17:00:00Z");
export const SUBMISSION_DEADLINE_WAT = "Sun Nov 1 · 12:00 PM ET · 6:00 PM WAT";

export function countdownParts(now: Date = new Date()) {
  const ms = SUBMISSION_DEADLINE.getTime() - now.getTime();
  const clamped = Math.max(0, ms);
  const h = Math.floor(clamped / 3_600_000);
  const m = Math.floor((clamped % 3_600_000) / 60_000);
  return { h, m, past: ms <= 0 };
}
