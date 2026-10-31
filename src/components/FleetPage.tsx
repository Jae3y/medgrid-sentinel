"use client";

import { useEffect, useMemo, useState } from "react";
import { clsx } from "clsx";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Globe2, Network } from "lucide-react";
import { ARCHETYPES, FLEET_SITES, evaluateSite, fleetCurve, measuredDataset, type FleetRow } from "@/engine";
import { Badge, Card, Note } from "./ui";
import { fmtNaira, fmtNum, fmtPct, fmtUsd } from "@/lib/format";
import { AXIS_PROPS, GRID_PROPS, TOOLTIP_LABEL, TOOLTIP_STYLE } from "@/lib/chart-theme";

const VERDICT_TONE = { strong: "good", viable: "warn", marginal: "bad" } as const;

const TRANSFER = [
  { id: "accra_2024", country: "Ghana (Accra)", changes: "Cedi tariffs & ECG feeder data; Energy Commission permitting; same IEC equipment family; diesel logistics simpler (coastal)." },
  { id: "nairobi_2024", country: "Kenya (Nairobi)", changes: "Higher commercial tariffs strengthen grid-displacement savings; EPRA net-metering rules; KPLC outage data replaces the feeder regime." },
  { id: "houston_2024", country: "United States (Houston, TX)", changes: "Hospital essential electrical systems governed by NFPA 99/110 and NEC 517 (Type 1 EES, 10-s transfer); UL 1741 / IEEE 1547-2018 interconnection; value shifts from diesel cost to hurricane-outage resilience (e.g. multi-day 2024 outages)." },
];

export function FleetPage() {
  const [rows, setRows] = useState<FleetRow[]>([]);
  const [busy, setBusy] = useState(true);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const out: FleetRow[] = [];
      for (const a of ARCHETYPES) {
        for (const s of FLEET_SITES) {
          await new Promise((r) => setTimeout(r, 0));
          if (cancelled) return;
          out.push(evaluateSite(s, a));
          setRows([...out]);
        }
      }
      if (!cancelled) setBusy(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const total = ARCHETYPES.length * FLEET_SITES.length;
  const referral = rows.filter((r) => r.archetype === ARCHETYPES[0].label);
  const curve = useMemo(() => fleetCurve(rows[0]?.capexUsd ?? 704415), [rows]);
  const transferYield = useMemo(
    () =>
      TRANSFER.map((t) => {
        const d = measuredDataset(t.id);
        return { ...t, ghi: Math.round(d.ghi.reduce((s, v) => s + v, 0) / 1000) };
      }),
    []
  );

  return (
    <div className="space-y-5">
      <div className="card p-5">
        <div className="flex flex-wrap gap-2">
          <Badge tone="cyan"><Network size={11} /> Replication</Badge>
          <Badge>Measured weather per site</Badge>
          <Badge>Same engine, new configuration</Badge>
        </div>
        <p className="mt-3 max-w-[78ch] text-[14.5px] leading-relaxed text-slate-300">
          Ten facility–site combinations, each a full-year 15-minute simulation on its own NASA POWER weather year and grid regime, priced at the
          same national defaults so the differences come from sunshine and grid reliability. The answer is not uniform, and the tool says so.
        </p>
      </div>

      <Card title="Portfolio screen" subtitle={busy ? `Simulating ${rows.length}/${total} site-years…` : `${total} site-years simulated (2 × 35,136 steps each)`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-xs">
            <thead className="text-[11.5px] text-slate-500">
              <tr className="border-b border-surface-border/60">
                {["Site", "Grid regime", "Facility", "GHI kWh/m²·yr", "Yield kWh/kWp", "CapEx", "Payback", "NPV 20 y @18%", "IRR", "Diesel avoided", "T1 breaks avoided/yr", "Verdict"].map((h) => (
                  <th key={h} className="py-2 pr-3 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.siteId + r.archetype} className="border-b border-surface-border/40">
                  <td className="py-1.5 pr-3 font-semibold text-white">{r.site}</td>
                  <td className="py-1.5 pr-3 text-slate-400">{r.regime}</td>
                  <td className="py-1.5 pr-3 text-slate-300">{r.archetype}</td>
                  <td className="num py-1.5 pr-3 num">{fmtNum(r.annualGhiKwhM2)}</td>
                  <td className="num py-1.5 pr-3 num">{fmtNum(r.specificYieldKwhPerKwp)}</td>
                  <td className="num py-1.5 pr-3 num">{fmtUsd(r.capexUsd)}</td>
                  <td className="num py-1.5 pr-3 num">{r.paybackYears ? `${r.paybackYears.toFixed(1)} y` : "—"}</td>
                  <td className={clsx("num py-1.5 pr-3 num", r.npvNaira >= 0 ? "text-energy-green" : "text-energy-red")}>{fmtNaira(r.npvNaira)}</td>
                  <td className="num py-1.5 pr-3 num">{r.irr !== null ? fmtPct(r.irr) : "—"}</td>
                  <td className="num py-1.5 pr-3 num">{fmtNum(r.dieselAvoidedLitres)} L ({fmtPct(r.dieselAvoidedPct, 0)})</td>
                  <td className="num py-1.5 pr-3 num">{fmtNum(r.tier1BreaksAvoided)}</td>
                  <td className="py-1.5 pr-3"><Badge tone={VERDICT_TONE[r.verdict]}>{r.verdict}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Note>
          “Strong” = positive 20-year NPV at an 18 % discount rate and payback &lt; 6 years; “viable” = payback &lt; 10 years. The 80-bed archetype scales
          loads, PV, storage and generator by 0.35. Lagos uses a Band-A-like regime (fewer, shorter interruptions — an assumption); the Maiduguri row
          includes the documented 39-day line outage. Prices are national defaults; local diesel premia in insecure regions would raise savings.
        </Note>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Payback by site (250-bed referral)" subtitle="Years; lower is better">
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={referral.map((r) => ({ site: r.site.split(",")[0].replace(" (NG)", ""), payback: r.paybackYears ?? 0, verdict: r.verdict }))} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid {...GRID_PROPS} />
              <XAxis dataKey="site" {...AXIS_PROPS} />
              <YAxis {...AXIS_PROPS} width={30} />
              <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL} formatter={(v: number) => [`${v.toFixed(1)} years`, "Payback"]} />
              <Bar dataKey="payback" radius={[4, 4, 0, 0]} isAnimationActive={false}>
                {referral.map((r) => <Cell key={r.siteId} fill={r.verdict === "strong" ? "#45E0A0" : r.verdict === "viable" ? "#F2B544" : "#FF4D5E"} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card title="Cost per site as the fleet grows (hypothesis)" subtitle="Standardised Sentinel design + pooled procurement: assumed 6 % per fleet doubling, floored at −25 %">
          <ResponsiveContainer width="100%" height={230}>
            <LineChart data={curve} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid {...GRID_PROPS} />
              <XAxis dataKey="sites" {...AXIS_PROPS} scale="log" domain={[1, 100]} type="number" ticks={[1, 2, 5, 10, 20, 50, 100]} />
              <YAxis {...AXIS_PROPS} width={56} tickFormatter={(v) => `$${Math.round(v / 1000)}k`} />
              <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL} labelFormatter={(n) => `${n} sites`} formatter={(v: number) => [fmtUsd(v), "CapEx per site"]} />
              <Line dataKey="capexPerSiteUsd" stroke="#45E0A0" strokeWidth={2.2} dot={{ r: 3 }} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
          <Note>Labelled as a hypothesis: global PV module learning rates exceed 20 % per doubling of cumulative capacity (IRENA); we assume far less because only design, procurement and installation scale with a hospital fleet. To be validated by the first five quotes.</Note>
        </Card>
      </div>

      <Card title="How it travels to a second country" subtitle="Measured solar resource from the same NASA POWER pipeline; what changes is configuration and compliance — not the engine." right={<Globe2 size={16} className="text-cyan" />}>
        <div className="grid gap-3 md:grid-cols-3">
          {transferYield.map((t) => (
            <div key={t.id} className="rounded-xl border border-surface-border/70 bg-navy-950/50 p-3">
              <div className="flex items-baseline justify-between">
                <div className="text-sm font-semibold text-white">{t.country}</div>
                <div className="num text-xs text-cyan">{fmtNum(t.ghi)} kWh/m²·yr</div>
              </div>
              <p className="mt-1.5 text-[11.5px] leading-relaxed text-slate-400">{t.changes}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
