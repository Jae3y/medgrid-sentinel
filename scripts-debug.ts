import { scenarioById } from "./src/engine/scenarios";
import { runSimulation } from "./src/engine/simulate";
import { evaluateForecast } from "./src/engine/forecast";
import { REFERENCE_HOSPITAL } from "./src/engine/facility";

for (const id of ["B", "I"]) {
  const sim = runSimulation(scenarioById(id).build());
  const m = sim.metrics;
  console.log(id, "diesel", m.dieselLitres.toFixed(0), "gensetKwh", m.gensetKwh.toFixed(0),
    "runtime", m.gensetRuntimeH.toFixed(1), "pvUsed", m.pvUsedKwh.toFixed(0), "battDis", m.battDischargedKwh.toFixed(0),
    "outage", m.outageHours, "critH", m.criticalServiceHours.toFixed(2));
  const genSteps = sim.steps.filter(s => s.gensetOn);
  console.log("  genset steps:", genSteps.length, "avgKw", (genSteps.reduce((a,s)=>a+s.gensetKw,0)/Math.max(1,genSteps.length)).toFixed(0));
  // steps where genset charges battery
  const chargeSteps = sim.steps.filter(s => s.gensetOn && s.battKw > 1);
  console.log("  genset-charging steps:", chargeSteps.length, "kWh charged:", (chargeSteps.reduce((a,s)=>a+s.battKw*0.25,0)).toFixed(0));
}

const ev = evaluateForecast(REFERENCE_HOSPITAL.loads, 7);
console.log("anomalies:", ev.anomalies.length, ev.anomalies.slice(0,5));
console.log("MAE persist", ev.persistenceMAE, "aware", ev.scheduleAwareMAE);
console.log("day6 h17-20:", ev.history[5].slice(17,21).map(v=>v.toFixed(0)).join(","), "vs d1:", ev.history[1].slice(17,21).map(v=>v.toFixed(0)).join(","));
