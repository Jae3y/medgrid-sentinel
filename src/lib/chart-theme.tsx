/** Shared Recharts theming — one consistent chart language across the product. */

export const GRID_PROPS = {
  stroke: "#16304F",
  vertical: false,
  strokeDasharray: "2 6",
} as const;

export const AXIS_PROPS = {
  tickLine: false,
  axisLine: { stroke: "#1E3A5F" },
  tick: { fill: "#7C8EA6", fontSize: 11 },
} as const;

export const TOOLTIP_STYLE = {
  background: "#0B1F3A",
  border: "1px solid #24466E",
  borderRadius: 10,
  fontSize: 12,
  boxShadow: "0 10px 28px -12px rgba(0,0,0,0.7)",
} as const;

export const TOOLTIP_LABEL = { color: "#8FA3BD" } as const;

export const LEGEND_STYLE = { fontSize: 11, iconType: "circle" as const, iconSize: 8 };

/** Gradient defs for area charts — mount once inside each chart. */
export function AreaGradients() {
  return (
    <defs>
      <linearGradient id="gradSolar" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#22D3EE" stopOpacity={0.42} />
        <stop offset="100%" stopColor="#22D3EE" stopOpacity={0.04} />
      </linearGradient>
      <linearGradient id="gradGrid" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#34D399" stopOpacity={0.3} />
        <stop offset="100%" stopColor="#34D399" stopOpacity={0.03} />
      </linearGradient>
      <linearGradient id="gradBattery" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#7DE9F7" stopOpacity={0.34} />
        <stop offset="100%" stopColor="#7DE9F7" stopOpacity={0.04} />
      </linearGradient>
      <linearGradient id="gradGenset" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.36} />
        <stop offset="100%" stopColor="#F59E0B" stopOpacity={0.05} />
      </linearGradient>
      <linearGradient id="gradUnserved" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#EF4444" stopOpacity={0.55} />
        <stop offset="100%" stopColor="#EF4444" stopOpacity={0.12} />
      </linearGradient>
      <linearGradient id="gradCash" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#34D399" stopOpacity={0.35} />
        <stop offset="100%" stopColor="#34D399" stopOpacity={0.03} />
      </linearGradient>
    </defs>
  );
}
