"use client";

import { useApp } from "@/lib/store";
import { Card, Note, Row } from "./ui";
import { PowerFlowDiagram } from "./PowerFlowDiagram";
import { fmtHour12, fmtKw, fmtKwh, fmtNum } from "@/lib/format";
import { dailyEnergyKwh } from "@/engine";

function NumField({
  label,
  value,
  onChange,
  step = 1,
  min,
  max,
  unit,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
  max?: number;
  unit?: string;
}) {
  return (
    <label className="flex items-center justify-between gap-2 py-1">
      <span className="text-xs text-slate-400">
        {label}
        {unit && <span className="ml-1 text-slate-600">({unit})</span>}
      </span>
      <input
        type="number"
        className="input-num"
        value={Number.isFinite(value) ? value : 0}
        step={step}
        min={min}
        max={max}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}

export function DigitalTwin() {
  const { config, updateConfig, sim, stepIndex, setStep } = useApp();
  const cur = sim.steps[Math.min(stepIndex, sim.steps.length - 1)];

  return (
    <div className="grid gap-4 xl:grid-cols-5">
      <div className="space-y-4 xl:col-span-2">
        <Card title="Controller on this hardware" subtitle="Same PV, battery and generator; only the dispatch decisions change. The diesel-only status quo is always computed alongside for comparison.">
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-navy-950 p-1" role="radiogroup" aria-label="Controller">
            {([
              ["sentinel", "MedGrid Sentinel"],
              ["conventional", "Fixed-rule hybrid"],
            ] as const).map(([id, label]) => {
              const on = (config.strategy ?? "conventional") === id;
              return (
                <button key={id} role="radio" aria-checked={on} onClick={() => updateConfig((c) => { c.strategy = id; })} className={`rounded-lg px-2 py-2 text-[12.5px] font-semibold ${on ? (id === "sentinel" ? "bg-cyan text-navy-950" : "bg-navy-700 text-white") : "text-slate-400 hover:text-white"}`}>
                  {label}
                </button>
              );
            })}
          </div>
        </Card>
        <Card title="Facility" subtitle={config.facility.name}>
          <Row k="Beds (illustrative)" v={fmtNum(config.facility.beds)} />
          <Row k="Defined circuits" v={config.facility.loads.length} />
          <Row
            k="Tier 1 life-critical"
            v={fmtKw(config.facility.loads.filter((l) => l.tier === 1).reduce((s, l) => s + l.ratedKw, 0))}
          />
          <Row
            k="Tier 2 clinical priority"
            v={fmtKw(config.facility.loads.filter((l) => l.tier === 2).reduce((s, l) => s + l.ratedKw, 0))}
          />
          <Row
            k="Tier 3 deferrable"
            v={fmtKw(config.facility.loads.filter((l) => l.tier === 3).reduce((s, l) => s + l.ratedKw, 0))}
          />
          <Row k="Daily energy (all loads)" v={fmtKwh(config.facility.loads.reduce((s, l) => s + dailyEnergyKwh(l), 0))} mono />
          <div className="mt-3 max-h-44 space-y-1 overflow-y-auto pr-1">
            {config.facility.loads.map((l) => (
              <div key={l.id} className="flex items-center justify-between gap-2 rounded-md bg-navy-950/60 px-2 py-1">
                <span className="truncate text-[11px] text-slate-300">
                  <span
                    className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${
                      l.tier === 1 ? "bg-energy-red" : l.tier === 2 ? "bg-energy-amber" : "bg-slate-500"
                    }`}
                  />
                  {l.name}
                </span>
                <span className="shrink-0 num text-[11px] text-slate-400">{l.ratedKw} kW</span>
              </div>
            ))}
          </div>
          <Note>
            Tier classification is a decision-support default, not a certified standard. Qualified
            facility engineers assign real circuit priorities during commissioning.
          </Note>
        </Card>

        <Card title="Solar PV & inverter">
          <NumField label="Installed capacity" unit="kWp" value={config.pv.kwp} min={0} max={1000} step={10}
            onChange={(v) => updateConfig((c) => { c.pv.kwp = Math.max(0, v); })} />
          <NumField label="Performance ratio" value={config.pv.performanceRatio} min={0.4} max={0.95} step={0.01}
            onChange={(v) => updateConfig((c) => { c.pv.performanceRatio = Math.min(0.95, Math.max(0.4, v)); })} />
          <NumField label="Inverter AC limit" unit="kW" value={config.inverter.ratedKw} min={0} max={1000} step={10}
            onChange={(v) => updateConfig((c) => { c.inverter.ratedKw = Math.max(0, v); })} />
        </Card>

        <Card title="Battery storage">
          <NumField label="Nominal capacity" unit="kWh" value={config.battery.nominalKwh} min={0} max={3000} step={50}
            onChange={(v) => updateConfig((c) => { c.battery.nominalKwh = Math.max(0, v); })} />
          <NumField label="Max charge power" unit="kW" value={config.battery.maxChargeKw} min={0} max={1000} step={10}
            onChange={(v) => updateConfig((c) => { c.battery.maxChargeKw = Math.max(0, v); })} />
          <NumField label="Max discharge power" unit="kW" value={config.battery.maxDischargeKw} min={0} max={1000} step={10}
            onChange={(v) => updateConfig((c) => { c.battery.maxDischargeKw = Math.max(0, v); })} />
          <NumField label="Minimum SOC" value={config.battery.minSocFrac} min={0.05} max={0.5} step={0.05}
            onChange={(v) => updateConfig((c) => { c.battery.minSocFrac = Math.min(0.5, Math.max(0.05, v)); })} />
          <NumField label="Outage reserve (grid-connected)" value={config.battery.gridReserveSocFrac} min={0.2} max={1} step={0.05}
            onChange={(v) => updateConfig((c) => { c.battery.gridReserveSocFrac = Math.min(1, Math.max(0.2, v)); })} />
          <label className="flex items-center justify-between py-1">
            <span className="text-xs text-slate-400">Off-peak grid charging</span>
            <input
              type="checkbox"
              checked={config.battery.gridChargeEnabled}
              onChange={(e) => updateConfig((c) => { c.battery.gridChargeEnabled = e.target.checked; })}
              className="h-4 w-4 accent-cyan"
            />
          </label>
        </Card>

        <Card title="Generator & grid">
          <NumField label="Generator rating" unit="kW" value={config.genset.ratedKw} min={50} max={1200} step={10}
            onChange={(v) => updateConfig((c) => { c.genset.ratedKw = Math.max(50, v); })} />
          <NumField label="Minimum load point" unit="kW" value={config.genset.minLoadKw} min={0} max={500} step={10}
            onChange={(v) => updateConfig((c) => { c.genset.minLoadKw = Math.max(0, v); })} />
          <NumField label="Fixed fuel burn" unit="L/h" value={config.genset.fuelFixedLph} min={0} max={40} step={0.5}
            onChange={(v) => updateConfig((c) => { c.genset.fuelFixedLph = Math.max(0, v); })} />
          <NumField label="Marginal fuel burn" unit="L/kWh" value={config.genset.fuelLinearLperKwh} min={0.15} max={0.5} step={0.01}
            onChange={(v) => updateConfig((c) => { c.genset.fuelLinearLperKwh = Math.min(0.5, Math.max(0.15, v)); })} />
          <NumField label="Diesel price" unit="₦/L" value={config.genset.fuelNairaPerLitre} min={200} max={4000} step={25}
            onChange={(v) => updateConfig((c) => { c.genset.fuelNairaPerLitre = Math.max(200, v); })} />
          <NumField label="Grid import limit" unit="kW" value={config.grid.importLimitKw} min={0} max={2000} step={10}
            onChange={(v) => updateConfig((c) => { c.grid.importLimitKw = Math.max(0, v); })} />
          <NumField label="Grid tariff" unit="₦/kWh" value={config.grid.tariffNairaPerKwh} min={0} max={1000} step={5}
            onChange={(v) => updateConfig((c) => { c.grid.tariffNairaPerKwh = Math.max(0, v); })} />
        </Card>
      </div>

      <div className="space-y-4 xl:col-span-3">
        <Card
          title="System one-line diagram"
          subtitle={`Interactive playback — ${fmtHour12(cur.hour)} on day ${cur.day + 1}. Every value is a simulation output.`}
          right={
            <input
              type="range"
              min={0}
              max={sim.steps.length - 1}
              value={stepIndex}
              onChange={(e) => setStep(Number(e.target.value))}
              aria-label="Simulation playback position"
              className="w-56 accent-cyan"
            />
          }
        >
          <PowerFlowDiagram step={cur} cfg={config} />
        </Card>

        <Card title="Live telemetry (simulated)" subtitle="Local bus values from the model — explicitly not measured facility data">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <TeleCard label="Voltage (L-N)" value={`${cur.telemetry?.voltageV ?? 0} V`} tone={
              (cur.telemetry?.voltageV ?? 230) < 207 || (cur.telemetry?.voltageV ?? 230) > 253 ? "warn" : "ok"
            } />
            <TeleCard label="Frequency" value={`${cur.telemetry?.freqHz ?? 0} Hz`} tone={
              (cur.telemetry?.freqHz ?? 50) < 49 || (cur.telemetry?.freqHz ?? 50) > 51 ? "warn" : "ok"
            } />
            <TeleCard label="Bus loading" value={fmtKw(cur.servedKw[1] + cur.servedKw[2] + cur.servedKw[3])} tone="ok" />
            <TeleCard
              label="Grid state"
              value={cur.islanded ? "ISLANDED" : "CLOSED"}
              tone={cur.islanded ? "warn" : "ok"}
            />
          </div>
          <Note>
            Voltage/frequency values are the model&apos;s simulated telemetry (nominal 230 V / 50 Hz with
            small seeded variation). Disturbances appear only where a scenario defines them. This is a
            decision-support model and must not be connected to real hospital protection systems.
          </Note>
        </Card>

        <Card title="Event log" subtitle="Deterministic — identical inputs produce identical events">
          <div className="max-h-72 space-y-1 overflow-y-auto">
            {sim.events.length === 0 && <p className="text-sm text-slate-400">No events.</p>}
            {sim.events.map((e, i) => (
              <div key={i} className="flex items-start gap-2 rounded-md bg-navy-950/60 px-2.5 py-1.5">
                <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${
                  e.severity === "critical" ? "bg-energy-red" : e.severity === "warning" ? "bg-energy-amber" : "bg-cyan"
                }`} />
                <span className="w-24 shrink-0 num text-[10px] text-slate-500">
                  D{e.day + 1} {fmtHour12(e.hour)}
                </span>
                <span className="text-[11px] leading-snug text-slate-300">{e.message}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function TeleCard({ label, value, tone }: { label: string; value: string; tone: "ok" | "warn" }) {
  return (
    <div className="rounded-lg border border-surface-border bg-navy-950/60 p-3">
      <div className="label">{label}</div>
      <div className={`text-lg font-bold ${tone === "warn" ? "text-energy-amber" : "text-white"}`}>{value}</div>
    </div>
  );
}
