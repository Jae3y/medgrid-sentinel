/** Shared Recharts theming — one consistent chart language across the product. */

export const GRID_PROPS = {
  stroke: "#1F3E40",
  vertical: false,
  strokeDasharray: "2 6",
} as const;

export const AXIS_PROPS = {
  tickLine: false,
  axisLine: { stroke: "#24474A" },
  tick: { fill: "#8FA9A6", fontSize: 11 },
} as const;

export const TOOLTIP_STYLE = {
  background: "#0D2124",
  border: "1px solid #2C5254",
  borderRadius: 10,
  fontSize: 12,
  boxShadow: "0 10px 28px -12px rgba(0,0,0,0.7)",
} as const;

export const TOOLTIP_LABEL = { color: "#93ABA8" } as const;

export const LEGEND_STYLE = { iconType: "circle" as const, iconSize: 8, wrapperStyle: { fontSize: 11, color: "#A3AEC2" } };

/** Gradient defs for area charts — mount once inside each chart. */
export function AreaGradients() {
  return (
    <defs>
      <linearGradient id="gradSolar" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#F2C14E" stopOpacity={0.42} />
        <stop offset="100%" stopColor="#F2C14E" stopOpacity={0.04} />
      </linearGradient>
      <linearGradient id="gradGrid" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#A3AEC2" stopOpacity={0.3} />
        <stop offset="100%" stopColor="#A3AEC2" stopOpacity={0.03} />
      </linearGradient>
      <linearGradient id="gradBattery" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#7CB8FF" stopOpacity={0.34} />
        <stop offset="100%" stopColor="#7CB8FF" stopOpacity={0.04} />
      </linearGradient>
      <linearGradient id="gradGenset" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#E06A3C" stopOpacity={0.36} />
        <stop offset="100%" stopColor="#E06A3C" stopOpacity={0.05} />
      </linearGradient>
      <linearGradient id="gradUnserved" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#FF4D5E" stopOpacity={0.55} />
        <stop offset="100%" stopColor="#FF4D5E" stopOpacity={0.12} />
      </linearGradient>
      <linearGradient id="gradCash" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#45E0A0" stopOpacity={0.35} />
        <stop offset="100%" stopColor="#45E0A0" stopOpacity={0.03} />
      </linearGradient>
    </defs>
  );
}
