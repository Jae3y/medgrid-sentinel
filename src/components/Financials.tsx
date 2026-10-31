"use client";

import { useMemo, useState } from "react";
import { useApp } from "@/lib/store";
import { fmtNaira, fmtNairaFull, fmtNum, fmtPct, fmtUsd } from "@/lib/format";
import { Card, Kpi, Note, Row } from "./ui";
import { searchSizing, sensitivity } from "@/engine";
import { AreaGradients, AXIS_PROPS, GRID_PROPS, TOOLTIP_LABEL, TOOLTIP_STYLE } from "@/lib/chart-theme";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function Financials() {
  const { config, econ, fin, setFin } = useApp();
  const [sizing, setSizing] = useState<ReturnType<typeof searchSizing> | null>(null);
  const sens = useMemo(() => sensitivity(config, fin), [config, fin]);

  const cashflow: { year: number; cumulative: number }[] = [];
  {
    let cum = -econ.capex.totalNaira;
    cashflow.push({ year: 0, cumulative: cum });
    for (let y = 1; y <= fin.analysisYears; y++) {
      cum += econ.annualSavingsNaira - econ.capex.totalNaira * fin.omPctOfCapexPerYear;
      cashflow.push({ year: y, cumulative: cum });
    }
  }

  const runSizing = () => {
    setSizing(searchSizing(config, { criticalHoursTarget: 11.4 }));
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Kpi label="System CapEx" value={fmtNaira(econ.capex.totalNaira)} sub={fmtUsd(econ.capex.totalUsd)} tone="cyan" />
        <Kpi
          label="Annual opex savings"
          value={fmtNaira(econ.annualSavingsNaira)}
          sub="grid + diesel + genset O&M avoided"
          tone="good"
        />
        <Kpi
          label="Simple payback"
          value={econ.simplePaybackYears ? `${fmtNum(econ.simplePaybackYears, 1)} yr` : "n/a"}
          sub="CapEx ÷ net annual savings"
        />
        <Kpi
          label="NPV (10 yr @ 18%)"
          value={fmtNaira(econ.npvNaira)}
          tone={econ.npvNaira > 0 ? "good" : "bad"}
          sub={econ.irr ? `IRR ${fmtPct(econ.irr)}` : "IRR n/a"}
        />
        <Kpi label="Diesel avoided" value={`${fmtNum(econ.dieselLitresAvoidedPerYear)} L/yr`} sub={`${fmtNum(econ.co2TonnesAvoidedPerYear, 1)} t CO₂/yr`} tone="good" />
        <Kpi
          label="EaaS fee (provider financing)"
          value={`${fmtNaira(econ.eaasAnnualFeeNaira)}/yr`}
          sub={`closes ≤ ${econ.eaasBreakevenFinancingRate ? fmtPct(econ.eaasBreakevenFinancingRate) : "n/a"} financing · ${fmtNum(econ.eaasAssetTariffNairaPerKwh)} ₦/kWh asset`}
          tone="warn"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card title="CapEx breakdown" subtitle="Editable engineering assumptions feed the whole model">
          <Row k="Solar PV" v={`${fmtUsd(econ.capex.pvUsd)} · ${fin.capexUsdPerKwp.toLocaleString()} $/kWp`} mono />
          <Row k="Battery storage" v={`${fmtUsd(econ.capex.storageUsd)} · ${fin.capexUsdPerKwhStorage.toLocaleString()} $/kWh`} mono />
          <Row k="Inverter" v={`${fmtUsd(econ.capex.inverterUsd)} · ${fin.capexUsdPerInverterKw.toLocaleString()} $/kW`} mono />
          <Row k="Installation & BOS" v={`${fmtUsd(econ.capex.installUsd)} · ${(fin.installOverheadPct * 100).toFixed(0)}%`} mono />
          <Row k="Total" v={`${fmtUsd(econ.capex.totalUsd)} = ${fmtNairaFull(econ.capex.totalNaira)}`} mono />
          <div className="mt-3 space-y-2 border-t border-surface-border pt-3">
            <FinField label="Diesel price (₦/L)" value={config.genset.fuelNairaPerLitre} step={25} onChange={() => {}} disabled />
            <FinField label="FX rate (₦/$)" value={fin.fxNairaPerUsd} step={25} onChange={(v) => setFin({ fxNairaPerUsd: v })} />
            <FinField label="CapEx $/kWp" value={fin.capexUsdPerKwp} step={25} onChange={(v) => setFin({ capexUsdPerKwp: v })} />
            <FinField label="CapEx $/kWh" value={fin.capexUsdPerKwhStorage} step={10} onChange={(v) => setFin({ capexUsdPerKwhStorage: v })} />
            <FinField label="Outage days / year" value={fin.annualOutageDays} step={5} onChange={(v) => setFin({ annualOutageDays: v })} />
            <FinField label="Discount rate" value={fin.discountRate} step={0.01} onChange={(v) => setFin({ discountRate: v })} />
          </div>
          <Note>
            Diesel price is set on the Digital Twin tab. Outage-day mix (45/yr) is an explicit
            assumption: ~12 national grid disturbances (2024 media/industry counts) plus local
            feeder trips. All inputs are editable; every output recomputes.
          </Note>
        </Card>

        <Card title="Cumulative cash flow — ownership" subtitle={`10-year horizon, ${fmtPct(fin.discountRate)} discount rate, O&M ${fmtPct(fin.omPctOfCapexPerYear)}/yr`}>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cashflow} margin={{ top: 5, right: 5, bottom: 0, left: -8 }}>
                <AreaGradients />
                <CartesianGrid {...GRID_PROPS} />
                <XAxis dataKey="year" unit="y" {...AXIS_PROPS} />
                <YAxis tickFormatter={(v: number) => `${(v / 1e6).toFixed(0)}M`} width={58} {...AXIS_PROPS} />
                <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL} formatter={(v: number) => fmtNairaFull(v)} />
                <Area type="monotone" dataKey="cumulative" name="Cumulative" stroke="#34D399" strokeWidth={2} fill="url(#gradCash)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 space-y-0.5">
            <Row k="Annual grid energy (proposed)" v={`${fmtNum(econ.proposedAnnual.gridKwh)} kWh`} mono />
            <Row k="Annual solar to load" v={`${fmtNum(econ.proposedAnnual.pvKwh)} kWh`} mono />
            <Row k="Annual diesel (proposed vs baseline)" v={`${fmtNum(econ.proposedAnnual.dieselLitres)} vs ${fmtNum(econ.baselineAnnual.dieselLitres)} L`} mono />
            <Row k="LCOE (discounted)" v={`${fmtNum(econ.lcoeNairaPerKwh)} ₦/kWh`} mono />
          </div>
        </Card>

        <Card title="Commercial structures" subtitle="Who owns, who pays, who maintains">
          <div className="space-y-2 text-xs leading-relaxed">
            <div className="rounded-lg border border-surface-border bg-navy-950/60 p-3">
              <div className="font-bold text-white">1 · Hospital ownership</div>
              Hospital finances CapEx ({fmtNaira(econ.capex.totalNaira)}); keeps all savings;
              bears O&M ({fmtNaira(econ.capex.totalNaira * fin.omPctOfCapexPerYear)}/yr) and
              replacement risk. Payback {econ.simplePaybackYears ? `${fmtNum(econ.simplePaybackYears, 1)} yr` : "n/a"}.
            </div>
            <div className="rounded-lg border border-surface-border bg-navy-950/60 p-3">
              <div className="font-bold text-white">2 · Energy-as-a-Service (EaaS)</div>
              Provider owns and maintains the assets; hospital keeps buying grid power for the
              remainder. Fee {fmtNaira(econ.eaasAnnualFeeNaira)}/yr at{" "}
              {fmtPct(fin.financingRate)} financing vs operating savings{" "}
              {fmtNaira(econ.annualSavingsNaira)}/yr — the gap closes at financing below{" "}
              <span className="font-mono text-cyan">
                {econ.eaasBreakevenFinancingRate
                  ? fmtPct(econ.eaasBreakevenFinancingRate)
                  : "n/a"}
              </span>
              , i.e. with concessional or development-finance capital. That breakeven number is
              precisely what REA-type and DFI programmes need to see.
            </div>
            <div className="rounded-lg border border-surface-border bg-navy-950/60 p-3">
              <div className="font-bold text-white">3 · Blended / grant-supported</div>
              Concessional capital (e.g. REA-type programmes or development finance) lowers the
              cost base; the platform quantifies exactly how much subsidy is needed — it is never
              assumed to exist.
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card title="Sensitivity analysis" subtitle="One-at-a-time variations on the four decision-critical inputs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-slate-400">
                  <th className="py-1.5 pr-2">Variable</th>
                  <th className="py-1.5 pr-2">Change</th>
                  <th className="py-1.5 pr-2">Payback (yr)</th>
                  <th className="py-1.5 pr-2">NPV</th>
                  <th className="py-1.5 pr-2">EaaS ₦/kWh</th>
                </tr>
              </thead>
              <tbody>
                {sens.map((r, i) => (
                  <tr key={i} className="border-t border-surface-border/50 text-slate-200">
                    <td className="py-1.5 pr-2">{r.variable}</td>
                    <td className="py-1.5 pr-2 font-mono">{r.change}</td>
                    <td className="py-1.5 pr-2 font-mono">{r.paybackYears ? fmtNum(r.paybackYears, 1) : "n/a"}</td>
                    <td className={`py-1.5 pr-2 font-mono ${r.npvNaira > 0 ? "text-energy-green" : "text-energy-red"}`}>
                      {fmtNaira(r.npvNaira)}
                    </td>
                    <td className="py-1.5 pr-2 font-mono">{fmtNum(r.eaasTariffNairaPerKwh)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card
          title="Sizing optimizer"
          subtitle="Exhaustive grid search: PV × battery against the active scenario's outage, ranked by diesel then opex"
          right={
            <button
              onClick={runSizing}
              className="rounded-md bg-cyan/15 px-3 py-1.5 text-xs font-semibold text-cyan ring-1 ring-cyan/40 hover:bg-cyan/25"
            >
              Run search
            </button>
          }
        >
          {sizing ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-slate-400">
                      <th className="py-1.5 pr-2">kWp</th>
                      <th className="py-1.5 pr-2">kWh</th>
                      <th className="py-1.5 pr-2">Critical h</th>
                      <th className="py-1.5 pr-2">Diesel (3 d)</th>
                      <th className="py-1.5 pr-2">Opex /yr</th>
                      <th className="py-1.5 pr-2">CapEx</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sizing.candidates.slice(0, 8).map((c, i) => (
                      <tr key={i} className={`border-t border-surface-border/50 ${sizing.best === c ? "text-cyan" : "text-slate-200"}`}>
                        <td className="py-1.5 pr-2 font-mono">{c.pvKwp}</td>
                        <td className="py-1.5 pr-2 font-mono">{c.batteryKwh}</td>
                        <td className="py-1.5 pr-2 font-mono">{c.criticalServiceHours.toFixed(2)}</td>
                        <td className="py-1.5 pr-2 font-mono">{c.dieselLitres3Days}</td>
                        <td className="py-1.5 pr-2 font-mono">{fmtNaira(c.annualOpexNaira)}</td>
                        <td className="py-1.5 pr-2 font-mono">{fmtNaira(c.capexNaira)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Note>
                Target: {sizing.target}. Best: {sizing.best?.pvKwp} kWp + {sizing.best?.batteryKwh} kWh.
                A transparent exhaustive search over an explicit grid — not a claim of global optimality.
              </Note>
            </>
          ) : (
            <p className="text-sm text-slate-400">
              Run the search to rank PV/battery combinations against the active scenario.
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}

function FinField({
  label,
  value,
  step,
  onChange,
  disabled,
}: {
  label: string;
  value: number;
  step: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <label className="flex items-center justify-between gap-2">
      <span className="text-xs text-slate-400">{label}</span>
      <input
        type="number"
        disabled={disabled}
        className="input-num disabled:opacity-40"
        value={value}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}
