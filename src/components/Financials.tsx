"use client";

import { useEffect, useState } from "react";
import { clsx } from "clsx";
import { useApp } from "@/lib/store";
import { fmtNaira, fmtNairaFull, fmtNum, fmtPct, fmtUsd } from "@/lib/format";
import { Card, Kpi, Note, Row } from "./ui";
import { searchSizingAsync, sensitivity, type SensitivityRow, type SizingResult } from "@/engine";
import { AreaGradients, AXIS_PROPS, GRID_PROPS, TOOLTIP_LABEL, TOOLTIP_STYLE } from "@/lib/chart-theme";
import { Area, Bar, ComposedChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

function Skeleton({ label }: { label: string }) {
  return (
    <div className="card flex h-40 items-center justify-center gap-3 text-sm text-slate-400">
      <span className="h-2 w-2 animate-pulse rounded-full bg-cyan" />
      {label}
    </div>
  );
}

export function Financials() {
  const { config, econ, econBusy, fin, setFin, ensureEcon } = useApp();
  const [sens, setSens] = useState<SensitivityRow[] | null>(null);
  const [sizing, setSizing] = useState<SizingResult | null>(null);
  const [sizingProgress, setSizingProgress] = useState<number | null>(null);

  useEffect(() => {
    if (!econ && !econBusy) ensureEcon();
  }, [econ, econBusy, ensureEcon]);

  useEffect(() => {
    setSens(null);
    const id = setTimeout(() => setSens(sensitivity(config, fin)), 60);
    return () => clearTimeout(id);
  }, [config, fin]);

  const runSizing = async () => {
    setSizingProgress(0);
    const r = await searchSizingAsync(config, { fin }, (d, t) => setSizingProgress(d / t));
    setSizing(r);
    setSizingProgress(null);
  };

  if (!econ) return <Skeleton label="Simulating a full measured year (2 × 35,136 steps) for the economics…" />;

  const cash = [{ year: 0, net: -econ.capex.totalNaira, cumulative: -econ.capex.totalNaira }, ...econ.cashFlows.map((c) => ({ year: c.year, net: c.netNaira, cumulative: c.cumulativeNaira }))];
  const b = econ.baselineAnnual;
  const p = econ.proposedAnnual;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Kpi label="System CapEx" value={fmtNaira(econ.capex.totalNaira)} sub={`${fmtUsd(econ.capex.totalUsd)} incl. Sentinel platform`} tone="cyan" />
        <Kpi label="Year-1 operating savings" value={fmtNaira(econ.annualSavingsNaira)} sub={`net ${fmtNaira(econ.netAnnualBenefitNaira)} after O&M + subscription`} tone="good" />
        <Kpi label="Payback" value={econ.simplePaybackYears ? `${fmtNum(econ.simplePaybackYears, 1)} yr` : "n/a"} sub="cumulative net cash flow" />
        <Kpi label={`NPV ${fin.analysisYears} yr @ ${fmtPct(fin.discountRate, 0)}`} value={fmtNaira(econ.npvNaira)} tone={econ.npvNaira > 0 ? "good" : "bad"} sub={econ.irr !== null ? `IRR ${fmtPct(econ.irr)}` : "IRR n/a"} />
        <Kpi label="Diesel avoided" value={`${fmtNum(econ.dieselLitresAvoidedPerYear)} L/yr`} sub={`−${fmtPct(econ.dieselAvoidedPct, 0)} · ${fmtNum(econ.co2TonnesAvoidedPerYear)} t CO₂/yr`} tone="good" />
        <Kpi label="EaaS provider IRR" value={econ.eaasProviderIrr !== null ? fmtPct(econ.eaasProviderIrr) : "n/a"} sub={`hospital keeps ${fmtPct(fin.eaasHospitalShare, 0)} of savings`} tone="warn" />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card title="Operating year (simulated, not extrapolated)" subtitle={`NASA POWER ${fin.siteDatasetId.replace("_", " ")} · ${fmtNum(b.outageHours)} grid-outage hours incl. ${fin.lineOutageDays}-day line outage`}>
          <Row k="Annual demand served" v={`${fmtNum(p.servedKwh / 1000)} MWh`} mono />
          <Row k="Diesel: status quo → Sentinel" v={`${fmtNum(b.dieselLitres)} → ${fmtNum(p.dieselLitres)} L`} mono />
          <Row k="Grid import: status quo → Sentinel" v={`${fmtNum(b.gridKwh / 1000)} → ${fmtNum(p.gridKwh / 1000)} MWh`} mono />
          <Row k="Solar to the bus" v={`${fmtNum(p.pvKwh / 1000)} MWh`} mono />
          <Row k="Generator run-hours" v={`${fmtNum(b.gensetRuntimeH)} → ${fmtNum(p.gensetRuntimeH)} h`} mono />
          <Row k="Tier-1 transfer breaks / yr" v={`${fmtNum(b.tier1Interruptions)} → ${fmtNum(p.tier1Interruptions)}`} mono />
          <Row k="Energy opex: status quo → Sentinel" v={`${fmtNaira(b.opexNaira)} → ${fmtNaira(p.opexNaira)}`} mono />
          <Row k="Energy cost per bed-day (EaaS)" v={`₦${fmtNum(econ.baselineEnergyCostPerBedDayNaira)} → ₦${fmtNum(econ.proposedEnergyCostPerBedDayNaira)}`} mono />
          <Row k="Discounted energy cost" v={`₦${fmtNum(econ.baselineLcoeNairaPerKwh)} → ₦${fmtNum(econ.lcoeNairaPerKwh)} /kWh`} mono />
          <Note>Fuel is unconstrained here so both systems deliver identical service and the comparison is pure cost. The resilience value of the hybrid under constrained fuel is shown on the Line Outage and Resilience tabs and is not monetised.</Note>
        </Card>

        <Card title="Cash flow — hospital ownership" subtitle={`${fin.analysisYears} years · PV −${fmtPct(fin.pvDegradationPerYear, 1)}/yr · battery & PCS replaced in year ${fin.batteryLifeYears}`}>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={cash} margin={{ top: 5, right: 5, bottom: 0, left: -8 }}>
                <AreaGradients />
                <CartesianGrid {...GRID_PROPS} />
                <XAxis dataKey="year" {...AXIS_PROPS} />
                <YAxis tickFormatter={(v: number) => `${(v / 1e9).toFixed(1)}B`} width={50} {...AXIS_PROPS} />
                <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL} labelFormatter={(y) => `Year ${y}`} formatter={(v: number, k: string) => [fmtNairaFull(v), k === "net" ? "Net cash flow" : "Cumulative"]} />
                <ReferenceLine y={0} stroke="#475569" />
                <Bar dataKey="net" fill="#22D3EE" opacity={0.55} radius={[2, 2, 0, 0]} isAnimationActive={false} />
                <Area type="monotone" dataKey="cumulative" stroke="#34D399" strokeWidth={2} fill="url(#gradCash)" isAnimationActive={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
            {[
              ["PV", econ.capex.pvUsd],
              ["Storage", econ.capex.storageUsd],
              ["PCS / inverter", econ.capex.inverterUsd],
              ["EPC & BOS", econ.capex.installUsd],
              ["Sentinel edge + metering", econ.capex.platformUsd],
            ].map(([k, v]) => (
              <div key={k as string} className="flex justify-between rounded-md bg-navy-950/60 px-2 py-1">
                <span className="text-slate-400">{k}</span>
                <span className="num font-mono text-white">{fmtUsd(v as number)}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Who owns, who pays, who maintains" subtitle="Three structures, all computed">
          <div className="space-y-2 text-xs leading-relaxed text-slate-300">
            <div className="rounded-lg border border-surface-border bg-navy-950/60 p-3">
              <div className="font-bold text-white">1 · Hospital ownership</div>
              Hospital (federal/state budget or own revenue) pays {fmtNaira(econ.capex.totalNaira)}; keeps all savings; contracts a local O&M
              firm ({fmtNaira(econ.cashFlows[0].omNaira)}/yr). Payback {econ.simplePaybackYears ? `${fmtNum(econ.simplePaybackYears, 1)} yr` : "n/a"}.
            </div>
            <div className="rounded-lg border border-cyan/30 bg-cyan/5 p-3">
              <div className="font-bold text-white">2 · Energy-as-a-Service (recommended)</div>
              An energy-service company owns, insures and maintains PV + storage + Sentinel. The hospital pays a fixed{" "}
              <span className="font-mono text-cyan">{fmtNaira(econ.eaasAnnualFeeNaira)}/yr</span> ({fmtNaira(econ.eaasAnnualFeeNaira / 12)}/month) — {fmtPct(1 - fin.eaasHospitalShare, 0)} of its
              measured savings — so its energy bill falls from day one with zero CapEx. Provider IRR{" "}
              <span className="font-mono text-cyan">{econ.eaasProviderIrr !== null ? fmtPct(econ.eaasProviderIrr) : "n/a"}</span> after O&M,
              subscription and year-{fin.batteryLifeYears} replacements. Patients pay nothing extra.
            </div>
            <div className="rounded-lg border border-surface-border bg-navy-950/60 p-3">
              <div className="font-bold text-white">3 · Blended finance</div>
              Concessional capital lowers the provider&apos;s hurdle rate. A CRF-based fee equals the savings at a financing rate of{" "}
              <span className="font-mono">{econ.eaasBreakevenFinancingRate ? fmtPct(econ.eaasBreakevenFinancingRate) : "n/a"}</span> — the number a
              DFI needs. No grant is assumed anywhere.
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1.4fr]">
        <Card title="Assumptions (edit → full re-simulation)">
          <div className="space-y-2">
            <FinField label="FX (₦/$)" value={fin.fxNairaPerUsd} step={50} onChange={(v) => setFin({ fxNairaPerUsd: v })} />
            <FinField label="PV $/kWp installed" value={fin.capexUsdPerKwp} step={25} onChange={(v) => setFin({ capexUsdPerKwp: v })} />
            <FinField label="Storage $/kWh" value={fin.capexUsdPerKwhStorage} step={10} onChange={(v) => setFin({ capexUsdPerKwhStorage: v })} />
            <FinField label="Line-outage days / yr" value={fin.lineOutageDays} step={1} onChange={(v) => setFin({ lineOutageDays: Math.max(0, Math.min(60, v)) })} />
            <FinField label="Discount rate" value={fin.discountRate} step={0.01} onChange={(v) => setFin({ discountRate: v })} />
            <FinField label="Hospital share of savings (EaaS)" value={fin.eaasHospitalShare} step={0.05} onChange={(v) => setFin({ eaasHospitalShare: Math.max(0, Math.min(1, v)) })} />
          </div>
          <Note>
            Diesel ₦{fmtNum(config.genset.fuelNairaPerLitre)}/L (Oct-2026 retail range; Twin tab), Band A ₦{fmtNum(config.grid.tariffNairaPerKwh)}/kWh (NERC May-2024 order).
            Storage $260/kWh installed ≈ 2.2× BNEF&apos;s 2025 global turnkey average ($117/kWh) to cover import, logistics and security premia. Feeder frequency
            1.08 interruptions/day matches the World Bank Enterprise Survey (32.8 outages/month, Nigeria 2014). {econBusy ? "Re-simulating…" : ""}
          </Note>
        </Card>

        <Card title="Sensitivity (one at a time)" subtitle="Each row re-prices or re-simulates the full year">
          {!sens ? (
            <div className="py-8 text-center text-xs text-slate-400">Computing…</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-slate-400">
                    <th className="py-1.5 pr-2">Variable</th>
                    <th className="py-1.5 pr-2">Change</th>
                    <th className="py-1.5 pr-2">Payback</th>
                    <th className="py-1.5 pr-2">NPV</th>
                    <th className="py-1.5 pr-2">IRR</th>
                  </tr>
                </thead>
                <tbody>
                  {sens.map((r, i) => (
                    <tr key={i} className="border-t border-surface-border/50 text-slate-200">
                      <td className="py-1.5 pr-2">{r.variable}</td>
                      <td className="py-1.5 pr-2 font-mono">{r.change}</td>
                      <td className="py-1.5 pr-2 font-mono">{r.paybackYears ? `${fmtNum(r.paybackYears, 1)} yr` : "n/a"}</td>
                      <td className={clsx("py-1.5 pr-2 font-mono", r.npvNaira > 0 ? "text-energy-green" : "text-energy-red")}>{fmtNaira(r.npvNaira)}</td>
                      <td className="py-1.5 pr-2 font-mono">{r.irr !== null ? fmtPct(r.irr) : "n/a"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      <Card
        title="Sizing optimizer"
        subtitle="Grid search over PV × storage. Feasible = Tier-1 on for all 936 h and critical service ≥ 99 % in the Maiduguri replay at 6,000 L/week; ranked by 20-yr NPV."
        right={
          <button onClick={runSizing} disabled={sizingProgress !== null} className="rounded-md bg-cyan/15 px-3 py-1.5 text-xs font-semibold text-cyan ring-1 ring-cyan/40 hover:bg-cyan/25 disabled:opacity-50">
            {sizingProgress !== null ? `Searching… ${Math.round(sizingProgress * 100)}%` : "Run search (16 designs)"}
          </button>
        }
      >
        {sizing ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-xs">
                <thead>
                  <tr className="text-left text-slate-400">
                    {["kWp", "kWh", "PCS kW", "Critical h", "Tier-1 h", "Diesel avoided/yr", "CapEx", "Payback", "NPV", "Feasible"].map((h) => (
                      <th key={h} className="py-1.5 pr-2">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sizing.candidates.map((c, i) => (
                    <tr key={i} className={clsx("border-t border-surface-border/50", sizing.best === c ? "text-cyan" : c.feasible ? "text-slate-200" : "text-slate-500")}>
                      <td className="py-1.5 pr-2 font-mono">{c.pvKwp}</td>
                      <td className="py-1.5 pr-2 font-mono">{c.batteryKwh}</td>
                      <td className="py-1.5 pr-2 font-mono">{c.inverterKw}</td>
                      <td className="py-1.5 pr-2 font-mono">{fmtNum(c.criticalServiceHours)}</td>
                      <td className="py-1.5 pr-2 font-mono">{fmtNum(c.tier1Hours)}</td>
                      <td className="py-1.5 pr-2 font-mono">{fmtPct(c.dieselAvoidedPct, 0)}</td>
                      <td className="py-1.5 pr-2 font-mono">{fmtNaira(c.capexNaira)}</td>
                      <td className="py-1.5 pr-2 font-mono">{c.paybackYears ? `${c.paybackYears.toFixed(1)} y` : "—"}</td>
                      <td className={clsx("py-1.5 pr-2 font-mono", c.npvNaira > 0 ? "text-energy-green" : "text-energy-red")}>{fmtNaira(c.npvNaira)}</td>
                      <td className="py-1.5 pr-2">{c.feasible ? "✓" : "✗"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Note>{sizing.target}. Best NPV: {sizing.best?.pvKwp} kWp + {sizing.best?.batteryKwh} kWh. The reference design keeps 600 kWh (rather than the NPV-best 300 kWh) because the Monte Carlo shows the extra storage carries Tier-1 through generator repairs — a resilience choice made explicit. Heuristic grid search, not a proven global optimum.</Note>
          </>
        ) : (
          <p className="text-sm text-slate-400">Each design runs the 39-day replay and a full measured year (~0.5 s each).</p>
        )}
      </Card>
    </div>
  );
}

function FinField({ label, value, step, onChange }: { label: string; value: number; step: number; onChange: (v: number) => void }) {
  const [local, setLocal] = useState(String(value));
  useEffect(() => setLocal(String(value)), [value]);
  const commit = () => {
    const v = Number(local);
    if (Number.isFinite(v) && v !== value) onChange(v);
  };
  return (
    <label className="flex items-center justify-between gap-2">
      <span className="text-xs text-slate-400">{label}</span>
      <input type="number" className="input-num" value={local} step={step} onChange={(e) => setLocal(e.target.value)} onBlur={commit} onKeyDown={(e) => e.key === "Enter" && commit()} />
    </label>
  );
}
