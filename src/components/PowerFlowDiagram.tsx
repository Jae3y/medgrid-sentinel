"use client";

import type { StepResult, SystemConfig } from "@/engine";
import { fmtKw } from "@/lib/format";

/**
 * Single-line power-flow diagram of the hospital microgrid.
 * All values come from the simulation step — nothing decorative.
 */
export function PowerFlowDiagram({
  step,
  cfg,
}: {
  step: StepResult;
  cfg: SystemConfig;
}) {
  const pv = step.pvKw;
  const grid = step.islanded ? 0 : step.gridKw;
  const batt = step.battKw; // + charging, − discharging
  const gen = step.gensetKw;
  const load = step.servedKw[1] + step.servedKw[2] + step.servedKw[3];

  const soc = step.socFrac;
  const socTone = soc < 0.25 ? "#EF4444" : soc < 0.5 ? "#F59E0B" : "#34D399";

  return (
    <svg viewBox="0 0 760 330" className="w-full">
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#7DE9F7" />
        </marker>
        <marker id="arrowG" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#94A3B8" />
        </marker>
      </defs>

      {/* Bus bar */}
      <rect x="300" y="140" width="160" height="14" rx="3" fill="#1B3A63" stroke="#24466E" />
      <text x="380" y="176" textAnchor="middle" className="fill-slate-400" fontSize="11">
        MAIN AC BUS
      </text>

      {/* PV (top-left) */}
      <Node x={70} y={30} w={150} h={62} title="SOLAR PV" value={fmtKw(pv)} tone={pv > 0 ? "#22D3EE" : "#334155"} sub={`${cfg.pv.kwp} kWp · PR ${cfg.pv.performanceRatio}`} />
      <Flow x1={145} y1={92} x2={340} y2={140} active={pv > 0} />

      {/* Grid (top-right) */}
      <Node
        x={540}
        y={30}
        w={150}
        h={62}
        title={step.islanded ? "GRID — DISCONNECTED" : "GRID"}
        value={step.islanded ? "open" : fmtKw(grid)}
        tone={step.islanded ? "#EF4444" : grid > 0 ? "#34D399" : "#334155"}
        sub={step.islanded ? "islanded" : `${cfg.grid.tariffNairaPerKwh} ₦/kWh`}
      />
      <Flow x1={615} y1={92} x2={430} y2={140} active={!step.islanded && grid > 0} muted={step.islanded} />

      {/* Battery (bottom-left) */}
      <Node
        x={70}
        y={220}
        w={150}
        h={62}
        title="BATTERY"
        value={batt > 0 ? `+${fmtKw(batt)}` : batt < 0 ? fmtKw(-batt) : "idle"}
        tone={Math.abs(batt) > 0 ? "#7DE9F7" : "#334155"}
        sub={`${(soc * 100).toFixed(0)}% SOC · ${cfg.battery.nominalKwh} kWh`}
        barValue={soc}
        barColor={socTone}
      />
      <Flow x1={145} y1={220} x2={340} y2={154} active={Math.abs(batt) > 0.5} />

      {/* Generator (bottom-right) */}
      <Node
        x={540}
        y={220}
        w={150}
        h={62}
        title={step.gensetStarting ? "GENERATOR — STARTING" : "DIESEL GENERATOR"}
        value={step.gensetOn ? fmtKw(gen) : cfg.genset.failed ? "FAULT" : "standby"}
        tone={gen > 0 ? "#F59E0B" : cfg.genset.failed ? "#EF4444" : "#334155"}
        sub={step.gensetOn ? `${step.dieselLph.toFixed(1)} L/h` : `${cfg.genset.ratedKw} kW rated`}
      />
      <Flow x1={615} y1={220} x2={430} y2={154} active={gen > 0} />

      {/* Loads (right of bus) */}
      <g>
        <rect x="530" y="118" width="200" height="58" rx="8" fill="#0F2440" stroke="#24466E" />
        <text x="545" y="138" fontSize="11" className="fill-slate-300" fontWeight="700">
          HOSPITAL LOADS
        </text>
        <text x="545" y="153" fontSize="10" className="fill-slate-400">
          T1 {step.servedKw[1].toFixed(0)} / T2 {step.servedKw[2].toFixed(0)} / T3 {step.servedKw[3].toFixed(0)} kW
        </text>
        <text x="545" y="167" fontSize="10" className="fill-slate-500">
          demand {(step.demandKw[1] + step.demandKw[2] + step.demandKw[3]).toFixed(0)} kW · serving {load.toFixed(0)} kW
        </text>
      </g>
      <Flow x1={460} y1={147} x2={530} y2={147} active={load > 0} />

      {step.unservedKw[1] > 0.5 && (
        <text x="380" y="310" textAnchor="middle" fontSize="12" className="fill-energy-red" fontWeight="700">
          ⚠ TIER-1 DEFICIT {step.unservedKw[1].toFixed(1)} kW — system cannot serve all life-critical load
        </text>
      )}
    </svg>
  );
}

function Node({
  x,
  y,
  w,
  h,
  title,
  value,
  tone,
  sub,
  barValue,
  barColor,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  title: string;
  value: string;
  tone: string;
  sub: string;
  barValue?: number;
  barColor?: string;
}) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={8} fill="#0F2440" stroke={tone} strokeWidth={1.5} />
      <text x={x + 12} y={y + 18} fontSize="10" fontWeight="700" fill={tone}>
        {title}
      </text>
      <text x={x + 12} y={y + 35} fontSize="15" fontWeight="700" fill="#F1F5F9">
        {value}
      </text>
      <text x={x + 12} y={y + 50} fontSize="9.5" fill="#94A3B8">
        {sub}
      </text>
      {barValue !== undefined && (
        <rect x={x + 12} y={y + h - 8} width={w - 24} height={3} rx={1.5} fill="#24466E">
          <rect width={Math.max(2, (w - 24) * Math.min(1, barValue))} height={3} rx={1.5} fill={barColor} />
        </rect>
      )}
    </g>
  );
}

function Flow({
  x1,
  y1,
  x2,
  y2,
  active,
  muted,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  active: boolean;
  muted?: boolean;
}) {
  return (
    <line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke={muted ? "#EF4444" : active ? "#7DE9F7" : "#334155"}
      strokeWidth={active ? 2.5 : 1.5}
      strokeDasharray={muted ? "5 5" : active ? "6 4" : undefined}
      markerEnd={muted ? undefined : active ? "url(#arrow)" : "url(#arrowG)"}
      opacity={muted ? 0.7 : active ? 1 : 0.5}
    >
      {active && (
        <animate attributeName="stroke-dashoffset" from="20" to="0" dur="0.9s" repeatCount="indefinite" />
      )}
    </line>
  );
}
