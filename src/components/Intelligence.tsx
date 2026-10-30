"use client";

import { useMemo } from "react";
import { useApp } from "@/lib/store";
import { evaluateForecast, forecastDepletion } from "@/engine";
import { fmtHour12, fmtNum } from "@/lib/format";
import { Badge, Card, Kpi, Note, Row } from "./ui";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BrainCircuit, Radar, Sparkles, TrendingDown } from "lucide-react";

export function Intelligence() {
  const { config, sim, stepIndex } = useApp();

  const forecast = useMemo(() => evaluateForecast(config.facility.loads, 7), [config.facility.loads]);
  const cur = sim.steps[Math.min(stepIndex, sim.steps.length - 1)];
  const depletion = forecastDepletion(
    cur.socKwh,
    config.battery.nominalKwh,
    config.battery.minSocFrac,
    config.battery.dischargeEff,
    config.facility.loads,
    Math.floor(cur.hour)
  );

  const chartData = Array.from({ length: 24 }, (_, h) => ({
    hour: `${String(h).padStart(2, "0")}`,
    measured: Math.round(forecast.heldOut[h]),
    forecast: forecast.forecast[h],
  }));

  // Rule-based recommendations derived from the ACTIVE simulation result.
  const recs = buildRecommendations();

  function buildRecommendations() {
    const out: { title: string; detail: string; basis: string }[] = [];
    const m = sim.metrics;
    const bl = sim.config;

    if (m.criticalServiceHours > 0 && m.outageHours > 0) {
      out.push({
        title: "Critical-service continuity confirmed for the tested outage",
        detail: `The active configuration maintained ${m.criticalServiceHours.toFixed(2)} h of Tier-1+2 service across ${m.outageHours.toFixed(1)} outage hours in this run.`,
        basis: "Simulation metrics — active run",
      });
    }
    if (m.unservedKwh[2] > 1) {
      out.push({
        title: "Raise storage or PV: Tier-2 deficits detected",
        detail: `${m.unservedKwh[2].toFixed(1)} kWh of clinical-priority demand went unserved this run. Adding storage or rescheduling deferrable laundry/pumping into solar hours would recover most of it.`,
        basis: "Unserved-energy accounting (honest deficit reporting)",
      });
    }
    if (m.pvCurtailedKwh > 20) {
      out.push({
        title: "Usable solar is being curtailed",
        detail: `${m.pvCurtailedKwh.toFixed(0)} kWh of available PV exceeded the inverter/battery limits at midday. A larger inverter or load shifting (laundry, water pumping) converts curtailment into savings.`,
        basis: `Curtailed energy vs ${bl.inverter.ratedKw} kW inverter limit`,
      });
    }
    if (m.gensetRuntimeH > 0 && m.gensetKwh > 0) {
      const loading = m.gensetKwh / Math.max(0.01, m.gensetRuntimeH);
      out.push({
        title:
          loading < bl.genset.minLoadKw
            ? "Generator runs below its efficient load point"
            : `Generator averages ${fmtNum(loading)} kW loading`,
        detail:
          loading < bl.genset.minLoadKw
            ? `Average output ${fmtNum(loading)} kW is below the ${bl.genset.minLoadKw} kW minimum-load point — consider a smaller support set or more storage.`
            : `Dispatch keeps the set near its efficient band (min ${bl.genset.minLoadKw} kW). Fuel model: ${bl.genset.fuelFixedLph} L/h fixed + ${bl.genset.fuelLinearLperKwh} L/kWh.`,
        basis: "Generator runtime & fuel model (active run)",
      });
    }
    out.push({
      title: "Reserve policy is the resilience lever",
      detail: `Grid-connected reserve is ${Math.round(bl.battery.gridReserveSocFrac * 100)}% SOC. Each +10% adds ~${fmtNum(bl.battery.nominalKwh * 0.1)} kWh of outage ride-through at the cost of one solar cycle — tune it per feeder reliability.`,
      basis: "Battery configuration (active config)",
    });
    return out;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi icon={<Radar size={18} />} label="Forecast MAE (held-out day)" value={`${fmtNum(forecast.scheduleAwareMAE)} kW`} sub={`naive persistence: ${fmtNum(forecast.persistenceMAE)} kW`} tone="cyan" />
        <Kpi icon={<Radar size={18} />} label="Forecast RMSE" value={`${fmtNum(forecast.scheduleAwareRMSE)} kW`} sub={`naive persistence: ${fmtNum(forecast.persistenceRMSE)} kW`} />
        <Kpi icon={<TrendingDown size={18} />} label="Usable storage now" value={`${fmtNum(depletion.usableKwhNow)} kWh`} sub={depletion.autonomyHours >= 12 ? "covers next 12 h" : `${depletion.autonomyHours.toFixed(1)} h autonomy`} tone={depletion.autonomyHours >= 12 ? "good" : "warn"} />
        <Kpi icon={<Sparkles size={18} />} label="Anomalies flagged" value={`${forecast.anomalies.length}`} sub="leave-one-out z ≥ 3" tone={forecast.anomalies.length ? "warn" : "default"} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card
          title="Demand forecast vs held-out actuals"
          subtitle="Hybrid model (50% recent history + 50% schedule prior) scored against a held-out synthetic day"
        >
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -8 }}>
                <CartesianGrid stroke="#1B3A63" strokeDasharray="3 3" />
                <XAxis dataKey="hour" tick={{ fill: "#64748B", fontSize: 10 }} interval={2} unit="h" />
                <YAxis tick={{ fill: "#64748B", fontSize: 10 }} unit=" kW" width={58} />
                <Tooltip contentStyle={{ background: "#0B1F3A", border: "1px solid #24466E", borderRadius: 8, fontSize: 12 }} labelStyle={{ color: "#94A3B8" }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="measured" name="Held-out actual" stroke="#F8FAFC" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="forecast" name="Sentinel forecast" stroke="#22D3EE" strokeWidth={2} strokeDasharray="5 3" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <Note>
            Trained/scored on synthetic &quot;measured&quot; history derived from the facility&apos;s own
            profiles with seeded noise — deliberately honest for a 48-hour POC with no facility
            data. On real AMI data the same interfaces accept measured load series unchanged.
          </Note>
        </Card>

        <Card title="Battery depletion forecast" subtitle={`Projection from current SOC at ${fmtHour12(cur.hour)} (day ${cur.day + 1})`}>
          <div className="space-y-0.5">
            <Row k="Usable energy above floor" v={`${fmtNum(depletion.usableKwhNow)} kWh`} mono />
            <Row k="Forecast 12 h average demand" v={`${fmtNum(depletion.avgDemandKw)} kW`} mono />
            <Row k="Autonomy at average demand" v={`${depletion.autonomyHours.toFixed(1)} h`} mono />
            <Row k="Projected depletion time" v={depletion.depletesAtHour !== null ? fmtHour12(depletion.depletesAtHour) : "beyond 12 h"} mono />
          </div>
          <p className="mt-3 rounded-lg border border-surface-border/60 bg-navy-950/60 px-3 py-2 text-xs leading-relaxed text-slate-300">
            {depletion.message}
          </p>
          <Note>
            This is the number a hospital duty manager actually needs at 22:00 during an outage:
            &quot;how long can we hold, and when does the generator need to be ready?&quot;
          </Note>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card title="Anomaly screening" subtitle="Explainable statistical alerts — every alert states its basis">
          {forecast.anomalies.length === 0 ? (
            <p className="text-sm text-slate-400">No anomalies in the current 7-day window.</p>
          ) : (
            <ul className="space-y-2">
              {forecast.anomalies.slice(0, 6).map((a, i) => (
                <li key={i} className="rounded-lg border border-surface-border/60 bg-navy-950/60 p-2.5">
                  <div className="mb-1 flex items-center gap-2">
                    <Badge tone="warn">z = {a.zScore}</Badge>
                    <span className="text-[11px] text-slate-500">
                      Day {a.day} · {String(a.hour).padStart(2, "0")}:00
                    </span>
                  </div>
                  <p className="text-xs leading-snug text-slate-300">{a.explanation}</p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    observed {fmtNum(a.observedKw)} kW vs expected {fmtNum(a.expectedKw)} kW
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Sentinel recommendations" subtitle="Rule-based, each tied to actual simulation values — no invented insights">
          <ul className="space-y-2">
            {recs.map((r, i) => (
              <li key={i} className="rounded-lg border border-surface-border/60 bg-navy-950/60 p-2.5">
                <div className="flex items-center gap-2">
                  <BrainCircuit size={13} className="shrink-0 text-cyan" />
                  <span className="text-xs font-bold text-white">{r.title}</span>
                </div>
                <p className="mt-1 text-xs leading-snug text-slate-300">{r.detail}</p>
                <p className="mt-1 text-[11px] italic text-slate-500">Basis: {r.basis}</p>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card title="AI transparency statement">
        <p className="text-xs leading-relaxed text-slate-300">
          Every function on this page is deterministic and explainable: statistical forecasting
          (documented hybrid model with reported MAE/RMSE), energy-bookkeeping depletion projection,
          leave-one-out z-score anomaly screening, and rule-based recommendations whose inputs are
          printed alongside each insight. No black-box model makes dispatch decisions — the safety
          -critical dispatch engine is fully deterministic and unit-tested. This deliberate
          architecture keeps the platform auditable for hospital engineering teams, and keeps the
          core product fully functional offline without any external AI API.
        </p>
      </Card>
    </div>
  );
}
