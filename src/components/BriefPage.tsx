"use client";

import { useEffect } from "react";
import { Target } from "lucide-react";
import { useApp } from "@/lib/store";
import { MAIDUGURI_EVENT } from "@/engine";
import { Badge, Card, Note } from "./ui";
import { fmtNaira, fmtNum, fmtPct, fmtUsd } from "@/lib/format";

function QA({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-surface-border/70 bg-navy-950/50 p-3.5">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-cyan">{q}</div>
      <div className="mt-1.5 text-[13px] leading-relaxed text-slate-300">{children}</div>
    </div>
  );
}

export function BriefPage() {
  const { missionResults, econ, econBusy, ensureEcon, mission } = useApp();
  useEffect(() => {
    if (!econ && !econBusy) ensureEcon();
  }, [econ, econBusy, ensureEcon]);
  const r = missionResults!;
  const s = r.sentinel.metrics;
  const b = r.baseline.metrics;
  const outageH = s.outageHours;
  const supply = mission.weeklySupplyLitres ?? 6000;

  return (
    <div className="space-y-5">
      <div className="card p-5">
        <div className="flex flex-wrap gap-2">
          <Badge tone="cyan">Brief #13</Badge>
          <Badge>Track 2 · Digital Solutions &amp; AI</Badge>
          <Badge>Setting B · Non-residential (healthcare)</Badge>
          <Badge>Solo entry · Jackson Sixtus Abetianbe</Badge>
        </div>
        <h2 className="mt-3 text-xl font-bold text-white">Power for a city the grid can&apos;t protect</h2>
        <div className="mt-3 rounded-xl border border-cyan/30 bg-cyan/5 p-4">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-cyan"><Target size={13} /> Success metric — Handbook Appendix B, verbatim</div>
          <p className="mt-1 text-base font-semibold text-white">“Hours of critical service maintained during a line outage, and diesel litres avoided.”</p>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-surface-border bg-navy-950/50 p-3">
            <div className="label">Critical-service hours maintained</div>
            <div className="num text-2xl font-bold text-white">{fmtNum(b.criticalMaintainedHours)} → <span className="text-energy-green">{fmtNum(s.criticalMaintainedHours)}</span> <span className="text-sm text-slate-400">/ {fmtNum(outageH)} h</span></div>
            <div className="text-xs text-slate-400">39-day Maiduguri line outage, {fmtNum(supply)} L/week diesel supply</div>
          </div>
          <div className="rounded-xl border border-surface-border bg-navy-950/50 p-3">
            <div className="label">Diesel litres avoided</div>
            <div className="num text-2xl font-bold text-energy-green">{fmtNum(b.dieselLitres - s.dieselLitres)} L <span className="text-sm text-slate-400">in the outage</span></div>
            <div className="text-xs text-slate-400">{econ ? `${fmtNum(econ.dieselLitresAvoidedPerYear)} L/yr (−${fmtPct(econ.dieselAvoidedPct, 0)}) across a full measured year` : "annual figure computing…"}</div>
          </div>
          <div className="rounded-xl border border-surface-border bg-navy-950/50 p-3">
            <div className="label">Life-critical (Tier-1) hours</div>
            <div className="num text-2xl font-bold text-white">{fmtNum(b.tier1MaintainedHours)} → <span className="text-energy-green">{fmtNum(s.tier1MaintainedHours)}</span></div>
            <div className="text-xs text-slate-400">Tier-1 interruptions {b.tier1Interruptions} → {s.tier1Interruptions}</div>
          </div>
        </div>
      </div>

      <Card title="The seven questions judges cannot ask live (Handbook §6) — answered with computed numbers">
        <div className="grid gap-3 lg:grid-cols-2">
          <QA q="Who, specifically? User and payer">
            <b>Users:</b> the works engineer and duty manager of a referral hospital in a city whose transmission line is repeatedly cut —
            Maiduguri, Borno (330 kV line vandalised 22 Sep 2024, restored 31 Oct 2024; also 2021). <b>Beneficiaries:</b> the patients in its
            ICU, theatres, maternity and cold chain. <b>Payer:</b> the hospital management (federal/state teaching or specialist hospital
            budget) — or, under EaaS, an energy-service company that is repaid from the diesel the hospital no longer buys.
          </QA>
          <QA q="What fails today, and why? (root cause)">
            The generator is not the weak link — the <b>fuel supply chain</b> is. Hospitals size backup in kW, but a multi-week line outage is
            an energy-logistics problem: diesel need roughly quadruples while deliveries, budgets and convoys do not. In Dec 2022 two Maiduguri
            hospitals sat dark for days with working generators and empty tanks (ICIR). Nobody decides, in advance and quantitatively,
            which loads the remaining litres should protect.
          </QA>
          <QA q="What did we build, and how does it work?">
            A deterministic 15-minute hospital microgrid engine plus a predictive controller. Its <b>fuel-runway governor</b> compares diesel +
            battery + forecast solar against the energy each service tier needs until the next expected delivery, and defers the least critical
            loads first; a <b>clinical ride-through reserve</b> keeps the ICU powered through generator failures; <b>generator cycling</b> cuts
            low-load run-hours. Validated on real NASA POWER weather, published generator reliability data and a held-out solar forecast test.
          </QA>
          <QA q="What does it cost, and who pays?">
            {econ ? (
              <>
                Reference design 600 kWp + 600 kWh + 510 kW PCS + Sentinel: <b>{fmtUsd(econ.capex.totalUsd)}</b> ({fmtNaira(econ.capex.totalNaira)}).
                Savings {fmtNaira(econ.annualSavingsNaira)}/yr → payback <b>{econ.simplePaybackYears?.toFixed(1)} yr</b>, IRR {econ.irr !== null ? fmtPct(econ.irr) : "n/a"}.
                Under EaaS the hospital pays {fmtNaira(econ.eaasAnnualFeeNaira / 12)}/month, zero CapEx, and still saves 20 % from month one;
                energy cost per bed-day falls ₦{fmtNum(econ.baselineEnergyCostPerBedDayNaira)} → ₦{fmtNum(econ.proposedEnergyCostPerBedDayNaira)} —
                nothing is passed to the lowest-income patients.
              </>
            ) : (
              "Computing the full-year economics…"
            )}
          </QA>
          <QA q="What changes in 6–18 months?">
            M1–3: metering + load audit at one Maiduguri-class hospital (Sentinel runs in shadow mode on real data). M4–6: engineering design,
            EaaS term sheet with a licensed installer. M7–12: install PV + storage, Sentinel controls dispatch, SMS alerts live; measured vs
            predicted reported monthly. M13–18: second and third sites using the fleet screen. Detailed in the deployment roadmap.
          </QA>
          <QA q="How does it travel?">
            Only configuration changes: measured weather (the same NASA POWER pipeline), load profile, tariffs, feeder regime and local standards.
            The Fleet tab runs 10 site-years: strong in Maiduguri, Kano and Abuja; viable but weaker in Lagos and Port Harcourt — the tool says
            where it pays instead of claiming it pays everywhere.
          </QA>
          <QA q="What could go wrong — and how we test it early">
            <b>Biggest risk: modelled loads differ from the real hospital</b> (tiering, demand, generator condition). Test in month 1–3 by
            running Sentinel in shadow mode on circuit-level metering before any capital is committed; the plan only proceeds if measured
            vs predicted daily energy error is within ±15 %. Second risk: theft/vandalism of panels in an insecure city — mitigated by
            on-campus siting and insurance in the EaaS fee.
          </QA>
          <QA q="What existed before the event vs this weekend?">
            Nothing existed before 30 Oct 2026, 12:00 PM ET. A first prototype was built on 30 Oct with another AI coding model; on 31 Oct the
            engine was rebuilt (real weather, fuel logistics, four strategies, Monte Carlo, annual economics, forecasting on held-out data) — see
            the git history and disclosure statement.
          </QA>
        </div>
        <Note>
          Simulation, not field-measured performance. The hospital is an illustrative 250-bed referral profile (16 tiered circuits); no named
          hospital&apos;s data is used or implied. Full Brief #13 text is released at kick-off: if the partner defines “critical service” differently,
          only the tier mapping changes — the engine computes both metrics generically.
        </Note>
      </Card>
    </div>
  );
}
