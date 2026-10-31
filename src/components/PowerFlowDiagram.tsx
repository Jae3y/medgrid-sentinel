"use client";

import type { StepResult, SystemConfig } from "@/engine";
import { fmtKw } from "@/lib/format";

/**
 * Single-line power-flow diagram — redrawn as a proper engineering one-line:
 * vertical AC bus, orthogonal connections, wire power labels, breaker state for
 * the grid tie, per-tier service bars, and simulated telemetry chip.
 * Every value comes from the simulation step — nothing decorative.
 */
export function PowerFlowDiagram({ step, cfg }: { step: StepResult; cfg: SystemConfig }) {
  const pv = step.pvKw;
  const grid = step.islanded ? 0 : step.gridKw;
  const batt = step.battKw; // + charging, − discharging
  const gen = step.gensetKw;
  const soc = step.socFrac;

  const W = 760;
  const BUS_X = 372; // bus left edge; bus width 12
  const BUS_Y0 = 52;
  const BUS_Y1 = 268;

  const active = "#7DE9F7";
  const idle = "#2E4E78";
  const flow = (on: boolean) => (on ? active : idle);

  const tiers = [
    { t: "T1", name: "Life-critical", served: step.servedKw[1], demand: step.demandKw[1], color: "#F87171" },
    { t: "T2", name: "Clinical", served: step.servedKw[2], demand: step.demandKw[2], color: "#FBBF24" },
    { t: "T3", name: "Deferrable", served: step.servedKw[3], demand: step.demandKw[3], color: "#94A3B8" },
  ];
  const maxTier = Math.max(1, ...tiers.map((x) => x.demand));
  const loadTotal = step.servedKw[1] + step.servedKw[2] + step.servedKw[3];

  return (
    <svg viewBox="0 0 760 384" className="w-full" role="img" aria-label="Hospital microgrid one-line diagram">
      <defs>
        <marker id="mf-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill={active} />
        </marker>
        <marker id="mf-i" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill={idle} />
        </marker>
        <marker id="mf-r" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#EF4444" />
        </marker>
      </defs>

      {/* ---------------- bus ---------------- */}
      <rect x={BUS_X} y={BUS_Y0} width={12} height={BUS_Y1 - BUS_Y0} rx={4} fill="#1E3A63" stroke="#3A5578" strokeWidth={1.5} />
      <text x={BUS_X + 6} y={BUS_Y0 - 26} textAnchor="middle" fontSize="10.5" fontWeight="700" fill="#94A3B8" letterSpacing={1.5}>
        MAIN AC BUS
      </text>
      <text x={BUS_X + 6} y={BUS_Y0 - 12} textAnchor="middle" fontSize="9.5" fill="#5B6B7C">
        {step.telemetry ? `${step.telemetry.voltageV.toFixed(0)} V · ${step.telemetry.freqHz.toFixed(2)} Hz` : ""}
      </text>

      {/* ---------------- source nodes ---------------- */}
      <Node
        x={30} y={30} title="SOLAR PV" value={fmtKw(pv)}
        tone={pv > 0.5 ? "#22D3EE" : "#7C8EA6"} border={pv > 0.5 ? "#22D3EE" : "#2E4E78"}
        sub={`${cfg.pv.kwp} kWp · PR ${cfg.pv.performanceRatio}`}
        status={pv > 0.5 ? "generating" : "night"}
      />
      <Node
        x={30} y={228} title="BATTERY"
        value={batt > 0.5 ? `charging ${fmtKw(batt)}` : batt < -0.5 ? `discharging ${fmtKw(-batt)}` : "idle"}
        tone={Math.abs(batt) > 0.5 ? "#7DE9F7" : "#7C8EA6"} border={Math.abs(batt) > 0.5 ? "#7DE9F7" : "#2E4E78"}
        sub={`${cfg.battery.nominalKwh} kWh LFP`}
        status={batt > 0.5 ? "charging" : batt < -0.5 ? "discharging" : "standby"}
        soc={soc}
      />
      <Node
        x={556} y={30}
        title={step.islanded ? "GRID TIE" : "GRID"}
        value={step.islanded ? "disconnected" : grid > 0.5 ? `importing ${fmtKw(grid)}` : "connected"}
        tone={step.islanded ? "#F87171" : grid > 0.5 ? "#34D399" : "#7C8EA6"}
        border={step.islanded ? "#EF4444" : grid > 0.5 ? "#34D399" : "#2E4E78"}
        sub={step.islanded ? "breaker open — islanded" : `${cfg.grid.tariffNairaPerKwh} ₦/kWh`}
        status={step.islanded ? "open" : grid > 0.5 ? "supplying" : "closed"}
      />
      <Node
        x={556} y={228}
        title={step.gensetStarting ? "DIESEL GENSET" : "DIESEL GENSET"}
        value={step.gensetOn ? fmtKw(gen) : cfg.genset.failed ? "FAULT" : "standby"}
        tone={gen > 0.5 ? "#FBBF24" : cfg.genset.failed ? "#F87171" : "#7C8EA6"}
        border={gen > 0.5 ? "#F59E0B" : cfg.genset.failed ? "#EF4444" : "#2E4E78"}
        sub={step.gensetOn ? `${step.dieselLph.toFixed(1)} L/h · min ${cfg.genset.minLoadKw} kW` : `${cfg.genset.ratedKw} kW rated`}
        status={step.gensetOn ? "running" : step.gensetStarting ? "starting" : cfg.genset.failed ? "fault" : "standby"}
      />

      {/* ---------------- orthogonal flows ---------------- */}
      {/* PV → bus */}
      <Wire
        d={`M 200 62 H ${BUS_X - 42} Q ${BUS_X - 34} 62 ${BUS_X - 34} 70 V 96 Q ${BUS_X - 34} 104 ${BUS_X - 26} 104 H ${BUS_X}`}
        on={pv > 0.5} label={fmtKw(pv)} lx={252} ly={50}
      />
      {/* Battery ↔ bus (bidirectional) */}
      <Wire
        d={`M 200 260 H ${BUS_X - 42} Q ${BUS_X - 34} 260 ${BUS_X - 34} 252 V 224 Q ${BUS_X - 34} 216 ${BUS_X - 26} 216 H ${BUS_X}`}
        on={Math.abs(batt) > 0.5}
        label={batt > 0.5 ? `+${fmtKw(batt)}` : batt < -0.5 ? `−${fmtKw(-batt)}` : "0 kW"}
        lx={252} ly={248} both
      />
      {/* Grid tie: bus → grid (breaker visual at the elbow) */}
      <Wire
        d={`M ${BUS_X + 12} 104 H ${BUS_X + 40} Q ${BUS_X + 48} 104 ${BUS_X + 48} 96 V 70 Q ${BUS_X + 48} 62 ${BUS_X + 56} 62 H 556`}
        on={!step.islanded && grid > 0.5}
        muted={step.islanded}
        label={step.islanded ? "open" : fmtKw(grid)}
        lx={478} ly={50}
      />
      {step.islanded && (
        <g>
          <circle cx={BUS_X + 48} cy={104} r={4} fill="none" stroke="#F87171" strokeWidth={1.6} />
          <line x1={BUS_X + 42} y1={96} x2={BUS_X + 54} y2={84} stroke="#F87171" strokeWidth={1.6} />
          <text x={BUS_X + 58} y={122} fontSize="9" fontWeight="700" fill="#F87171">
            BREAKER OPEN
          </text>
        </g>
      )}
      {/* Genset → bus */}
      <Wire
        d={`M 556 260 H ${BUS_X + 56} Q ${BUS_X + 48} 260 ${BUS_X + 48} 252 V 224 Q ${BUS_X + 48} 216 ${BUS_X + 40} 216 H ${BUS_X + 12}`}
        on={gen > 0.5} label={fmtKw(gen)} lx={478} ly={248}
      />
      {/* Bus → loads */}
      <Wire d={`M ${BUS_X + 6} ${BUS_Y1} V 296`} on={loadTotal > 0.5} />

      {/* ---------------- loads panel ---------------- */}
      <rect x={210} y={296} width={340} height={82} rx={8} fill="#0F2440" stroke="#3A5578" strokeWidth={1.2} />
      <text x={224} y={314} fontSize="10" fontWeight="700" fill="#F1F5F9" letterSpacing={1}>
        HOSPITAL LOADS — SERVING {loadTotal.toFixed(0)} kW
      </text>
      {tiers.map((t, i) => {
        const y = 322 + i * 17;
        const bw = 120;
        const frac = t.demand > 0 ? Math.min(1, t.served / t.demand) : 1;
        const deficit = t.demand - t.served > 0.5;
        return (
          <g key={t.t}>
            <text x={224} y={y + 8} fontSize="9.5" fontWeight="700" fill={t.color}>
              {t.t}
            </text>
            <text x={246} y={y + 8} fontSize="9" fill="#94A3B8">
              {t.name}
            </text>
            <rect x={318} y={y + 2} width={bw} height={6} rx={3} fill="#1B3A63" />
            <rect x={318} y={y + 2} width={Math.max(2, bw * frac)} height={6} rx={3} fill={deficit ? "#EF4444" : "#34D399"} />
            <text x={446} y={y + 8} fontSize="9" fill="#CBD5E1" className="num">
              {t.served.toFixed(0)}/{t.demand.toFixed(0)} kW
            </text>
          </g>
        );
      })}

      {step.unservedKw[1] > 0.5 && (
        <text x={380} y={390} textAnchor="middle" fontSize="12" fontWeight="700" fill="#F87171">
          ⚠ TIER-1 DEFICIT {step.unservedKw[1].toFixed(1)} kW — system cannot serve all life-critical load
        </text>
      )}
    </svg>
  );
}

function Node({
  x,
  y,
  title,
  value,
  tone,
  border,
  sub,
  status,
  soc,
}: {
  x: number;
  y: number;
  title: string;
  value: string;
  tone: string;
  border: string;
  sub: string;
  status: string;
  soc?: number;
}) {
  return (
    <g>
      <rect x={x} y={y} width={170} height={68} rx={9} fill="#0F2440" stroke={border} strokeWidth={1.4} />
      <circle cx={x + 13} cy={y + 15} r={3.4} fill={tone} />
      <text x={x + 23} y={y + 18.5} fontSize="10" fontWeight="700" fill={tone} letterSpacing={0.6}>
        {title}
      </text>
      <text x={x + 157} y={y + 18.5} textAnchor="end" fontSize="8.5" fill="#5B6B7C" letterSpacing={0.5}>
        {status.toUpperCase()}
      </text>
      <text x={x + 13} y={y + 39} fontSize="15.5" fontWeight="700" fill="#F1F5F9">
        {value}
      </text>
      <text x={x + 13} y={y + 55} fontSize="9" fill="#7C8EA6">
        {sub}
      </text>
      {soc !== undefined && (
        <g>
          <rect x={x + 13} y={y + 60} width={144} height={3.5} rx={1.75} fill="#1B3A63" />
          <rect
            x={x + 13}
            y={y + 60}
            width={Math.max(3, 144 * Math.min(1, soc))}
            height={3.5}
            rx={1.75}
            fill={soc < 0.25 ? "#EF4444" : soc < 0.5 ? "#F59E0B" : "#34D399"}
          />
        </g>
      )}
    </g>
  );
}

function Wire({
  d,
  on,
  muted,
  label,
  lx,
  ly,
  both,
}: {
  d: string;
  on: boolean;
  muted?: boolean;
  label?: string;
  lx?: number;
  ly?: number;
  both?: boolean;
}) {
  const stroke = muted ? "#EF4444" : on ? "#7DE9F7" : "#2E4E78";
  return (
    <g>
      <path
        d={d}
        fill="none"
        stroke={stroke}
        strokeWidth={on ? 2 : 1.4}
        strokeDasharray={muted ? "5 5" : on ? "7 5" : undefined}
        opacity={muted ? 0.65 : on ? 1 : 0.55}
        markerEnd={muted ? "url(#mf-r)" : on ? "url(#mf-a)" : "url(#mf-i)"}
        markerStart={both && on ? "url(#mf-a)" : undefined}
      >
        {on && !muted && (
          <animate attributeName="stroke-dashoffset" from="24" to="0" dur="0.9s" repeatCount="indefinite" />
        )}
      </path>
      {label && lx !== undefined && ly !== undefined && (
        <text x={lx} y={ly} fontSize="10" fontWeight="700" fill={muted ? "#F87171" : on ? "#BAE6FD" : "#5B6B7C"} className="num">
          {label}
        </text>
      )}
    </g>
  );
}
