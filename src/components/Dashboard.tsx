"use client";

import { useEffect } from "react";
import { useApp } from "@/lib/store";
import { fmtHour12, fmtKw, fmtKwh, fmtNaira, fmtPct } from "@/lib/format";
import { Badge, Card, Kpi, Note, Row } from "./ui";
import { PowerFlowDiagram } from "./PowerFlowDiagram";
import {
  Activity,
  BatteryCharging,
  Fuel,
  PlugZap,
  Sun,
  TriangleAlert,
  Zap,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AreaGradients,
  AXIS_PROPS,
  GRID_PROPS,
  LEGEND_STYLE,
  TOOLTIP_LABEL,
  TOOLTIP_STYLE,
} from "@/lib/chart-theme";
import type { StepResult } from "@/engine";

export function Dashboard() {
  const { sim, config, stepIndex, playing, togglePlay, setStep, dayView, setDayView } = useApp();

  useEffect(() => {
    if (!playing) return;
    const iv = setInterval(() => {
      useApp.setState((s) => ({
        stepIndex: (s.stepIndex + 1) % s.sim.steps.length,
      }));
    }, 600);
    return () => clearInterval(iv);
  }, [playing]);

  const steps = sim.steps;
  const cur: StepResult = steps[Math.min(stepIndex, steps.length - 1)];
  const daySteps = steps.filter((s) => s.day === dayView);
  const chartData = daySteps.map((s) => ({
    t: fmtHour12(s.hour),
    hour: s.hour,
    demand: r1(s.demandKw[1] + s.demandKw[2] + s.demandKw[3]),
    critical: r1(s.demandKw[1] + s.demandKw[2]),
    pv: r1(s.pvKw),
    grid: r1(s.gridKw),
    battery: r1(-s.battKw), // discharge positive
    genset: r1(s.gensetKw),
    soc: Math.round(s.socFrac * 1000) / 10,
    unserved: r1(s.unservedKw[1] + s.unservedKw[2] + s.unservedKw[3]),
  }));

  const dayDemand = daySteps.reduce((a, s) => a + (s.demandKw[1] + s.demandKw[2] + s.demandKw[3]) * 0.25, 0);
  const dayOpex = daySteps.reduce((a, s) => a + s.gridCostNaira + s.dieselCostNaira + s.maintenanceNaira, 0);
  const dayDiesel = daySteps.reduce((a, s) => a + s.dieselLph * 0.25, 0);
  const dayPv = daySteps.reduce((a, s) => a + s.pvKw * 0.25, 0);
  const dayCriticalServed = daySteps.reduce((a, s) => a + (s.servedKw[1] + s.servedKw[2]) * 0.25, 0);
  const dayCriticalDemand = daySteps.reduce((a, s) => a + (s.demandKw[1] + s.demandKw[2]) * 0.25, 0);
  const curDemand = cur.demandKw[1] + cur.demandKw[2] + cur.demandKw[3];

  const alerts = sim.events.filter((e) => e.severity !== "info").slice(-8).reverse();

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
        <Kpi icon={<Zap size={18} />} label="Demand now" value={fmtKw(curDemand)} sub={fmtHour12(cur.hour)} />
        <Kpi icon={<Sun size={18} />} label="Solar" value={fmtKw(cur.pvKw)} tone="cyan" sub={`${config.pv.kwp} kWp installed`} />
        <Kpi
          icon={<BatteryCharging size={18} />}
          label="Battery"
          value={`${(cur.socFrac * 100).toFixed(0)}%`}
          tone={cur.socFrac < 0.25 ? "bad" : cur.socFrac < 0.5 ? "warn" : "good"}
          sub={cur.battKw > 0 ? `charging ${fmtKw(cur.battKw)}` : cur.battKw < 0 ? `discharging ${fmtKw(-cur.battKw)}` : "idle"}
        />
        <Kpi
          icon={<PlugZap size={18} />}
          label="Grid"
          value={cur.islanded ? "ISLANDED" : cur.gridKw > 0 ? fmtKw(cur.gridKw) : "connected"}
          tone={cur.islanded ? "bad" : "good"}
          sub={cur.islanded ? "running on island" : `${config.grid.tariffNairaPerKwh} ₦/kWh`}
        />
        <Kpi
          icon={<Fuel size={18} />}
          label="Generator"
          value={cur.gensetOn ? fmtKw(cur.gensetKw) : cur.gensetStarting ? "starting…" : "standby"}
          tone={cur.gensetOn ? "warn" : "default"}
          sub={cur.gensetOn ? `${cur.dieselLph.toFixed(1)} L/h` : config.genset.failed ? "FAULT" : "auto"}
        />
        <Kpi
          icon={<Activity size={18} />}
          label="Continuity (day)"
          value={dayCriticalDemand > 0 ? fmtPct(dayCriticalServed / dayCriticalDemand) : "—"}
          tone={dayCriticalServed / Math.max(1e-9, dayCriticalDemand) > 0.999 ? "good" : "bad"}
          sub={`T1+T2 of ${fmtKwh(dayCriticalDemand)}`}
        />
        <Kpi
          icon={<Fuel size={18} />}
          label="Diesel (day)"
          value={`${dayDiesel.toFixed(0)} L`}
          tone="warn"
          sub={`${fmtNaira(dayOpex)} opex today`}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card
          className="xl:col-span-2"
          title="Live power flow"
          subtitle={`${config.facility.name} — simulated one-line diagram at ${fmtHour12(cur.hour)}, day ${cur.day + 1}`}
          right={
            <div className="flex items-center gap-2">
              <button
                onClick={togglePlay}
                className="rounded-md bg-cyan/15 px-3 py-1 text-xs font-semibold text-cyan ring-1 ring-cyan/40 hover:bg-cyan/25"
              >
                {playing ? "⏸ Pause" : "▶ Play 72 h"}
              </button>
              <input
                type="range"
                min={0}
                max={steps.length - 1}
                value={stepIndex}
                onChange={(e) => setStep(Number(e.target.value))}
                aria-label="Simulation playback position"
                className="w-40 accent-cyan"
              />
            </div>
          }
        >
          <PowerFlowDiagram step={cur} cfg={config} />
        </Card>

        <Card title="Active alerts" subtitle="Derived from simulation events — no synthetic alarms">
          {alerts.length === 0 ? (
            <p className="text-sm text-slate-400">No warnings in this run.</p>
          ) : (
            <ul className="space-y-2">
              {alerts.map((e, i) => (
                <li key={i} className="rounded-lg border border-surface-border/60 bg-navy-950/60 p-2.5">
                  <div className="mb-1 flex items-center gap-2">
                    <Badge tone={e.severity === "critical" ? "bad" : "warn"}>
                      <TriangleAlert size={11} />
                      {e.type}
                    </Badge>
                    <span className="text-[11px] text-slate-500">
                      D{e.day + 1} · {fmtHour12(e.hour)}
                    </span>
                  </div>
                  <p className="text-xs leading-snug text-slate-300">{e.message}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card
          title={`Day ${dayView + 1} — demand vs supply`}
          subtitle="Hospital demand against solar, grid, battery discharge and generator"
          right={
            <div className="flex gap-1">
              {Array.from({ length: config.horizonDays }, (_, d) => (
                <button
                  key={d}
                  onClick={() => setDayView(d)}
                  className={`rounded-md px-2.5 py-1 text-xs font-semibold ring-1 ${
                    dayView === d
                      ? "bg-navy-800 text-white ring-cyan/40"
                      : "text-slate-400 ring-surface-border hover:text-white"
                  }`}
                >
                  D{d + 1}
                </button>
              ))}
            </div>
          }
        >
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -10 }}>
                <AreaGradients />
                <CartesianGrid {...GRID_PROPS} />
                <XAxis dataKey="t" interval={11} {...AXIS_PROPS} />
                <YAxis width={58} unit=" kW" {...AXIS_PROPS} />
                <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL} />
                <Legend wrapperStyle={LEGEND_STYLE} />
                <Area type="monotone" dataKey="pv" name="Solar" stackId="src" stroke="#22D3EE" strokeWidth={1.5} fill="url(#gradSolar)" />
                <Area type="monotone" dataKey="grid" name="Grid" stackId="src" stroke="#34D399" strokeWidth={1.5} fill="url(#gradGrid)" />
                <Area type="monotone" dataKey="battery" name="Battery" stackId="src" stroke="#7DE9F7" strokeWidth={1.5} fill="url(#gradBattery)" />
                <Area type="monotone" dataKey="genset" name="Generator" stackId="src" stroke="#F59E0B" strokeWidth={1.5} fill="url(#gradGenset)" />
                <Line type="monotone" dataKey="demand" name="Demand" stroke="#F1F5F9" strokeWidth={2.2} dot={false} />
                <Line type="monotone" dataKey="critical" name="Critical (T1+T2)" stroke="#F87171" strokeWidth={1.4} strokeDasharray="5 4" dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title={`Day ${dayView + 1} — battery state of charge`} subtitle="Reserve policy: ≥80% SOC kept while grid-connected; outage floor 15%">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -10 }}>
                <CartesianGrid {...GRID_PROPS} />
                <XAxis dataKey="t" interval={11} {...AXIS_PROPS} />
                <YAxis unit="%" domain={[0, 100]} width={58} {...AXIS_PROPS} />
                <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL} />
                <ReferenceLine
                  y={config.battery.gridReserveSocFrac * 100}
                  stroke="#22D3EE"
                  strokeDasharray="4 4"
                  label={{ value: `reserve ${(config.battery.gridReserveSocFrac * 100).toFixed(0)}%`, fill: "#22D3EE", fontSize: 10, position: "insideTopRight" }}
                />
                <ReferenceLine
                  y={config.battery.minSocFrac * 100}
                  stroke="#EF4444"
                  strokeDasharray="4 4"
                  label={{ value: `floor ${(config.battery.minSocFrac * 100).toFixed(0)}%`, fill: "#F87171", fontSize: 10, position: "insideBottomRight" }}
                />
                <Line type="monotone" dataKey="soc" name="SOC" stroke="#34D399" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <Note>
            During grid-connected hours the controller keeps an outage reserve (default 80% SOC).
            On outage days the battery discharges to its 15% floor to protect critical loads.
          </Note>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card title="Day summary" subtitle="From the simulation result — 15-minute resolution aggregated">
          <div className="space-y-0.5">
            <Row k="Demand served" v={fmtKwh(sim.metrics.totalServedKwh)} mono />
            <Row k="Solar used / generated" v={`${fmtKwh(sim.metrics.pvUsedKwh)} / ${fmtKwh(sim.metrics.pvKwh)}`} mono />
            <Row k="Renewable share" v={fmtPct(sim.metrics.renewableShare)} mono />
            <Row k="Grid import" v={fmtKwh(sim.metrics.gridKwh)} mono />
            <Row k="Generator energy / runtime" v={`${fmtKwh(sim.metrics.gensetKwh)} · ${sim.metrics.gensetRuntimeH.toFixed(1)} h`} mono />
            <Row k="Diesel consumed" v={`${sim.metrics.dieselLitres.toFixed(0)} L`} mono />
            <Row k="Outage hours in window" v={`${sim.metrics.outageHours.toFixed(1)} h`} mono />
            <Row k="Critical-service hours in outages" v={`${sim.metrics.criticalServiceHours.toFixed(2)} h`} mono />
            <Row k="Unserved energy (T1/T2/T3)" v={`${sim.metrics.unservedKwh[1].toFixed(1)} / ${sim.metrics.unservedKwh[2].toFixed(1)} / ${sim.metrics.unservedKwh[3].toFixed(1)} kWh`} mono />
            <Row k="Operating cost (72 h)" v={fmtNaira(sim.metrics.opexNaira)} mono />
          </div>
        </Card>

        <Card title="Peak-day source mix" subtitle={`Stacked supply across day ${dayView + 1}`}>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -10 }}>
                <AreaGradients />
                <CartesianGrid {...GRID_PROPS} />
                <XAxis dataKey="t" interval={11} {...AXIS_PROPS} />
                <YAxis width={58} unit=" kW" {...AXIS_PROPS} />
                <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL} />
                <Legend wrapperStyle={LEGEND_STYLE} />
                <Area type="monotone" dataKey="unserved" name="Unserved" stroke="#EF4444" strokeWidth={1.4} fill="url(#gradUnserved)" />
                <Area type="monotone" dataKey="pv" name="Solar" stackId="mix" stroke="#22D3EE" strokeWidth={1.5} fill="url(#gradSolar)" />
                <Area type="monotone" dataKey="grid" name="Grid" stackId="mix" stroke="#34D399" strokeWidth={1.5} fill="url(#gradGrid)" />
                <Area type="monotone" dataKey="battery" name="Battery" stackId="mix" stroke="#7DE9F7" strokeWidth={1.5} fill="url(#gradBattery)" />
                <Area type="monotone" dataKey="genset" name="Generator" stackId="mix" stroke="#F59E0B" strokeWidth={1.5} fill="url(#gradGenset)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}

function r1(v: number): number {
  return Math.round(v * 10) / 10;
}
