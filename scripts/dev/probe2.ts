import { lineOutageConfig, runSimulation, withStrategy } from "../../src/engine";
const sim = runSimulation(withStrategy(lineOutageConfig({ weeklySupplyLitres: 12000 }), "baseline"));
let prev = "";
for (const s of sim.steps) {
  const ok = s.servedKw[1] >= 0.995 * s.demandKw[1];
  const k = `${ok} fuel<1:${s.fuelLitres < 1} unav:${s.gensetUnavailable} on:${s.gensetOn}`;
  if (k !== prev) { console.log(s.day, s.hour, k, Math.round(s.fuelLitres), Math.round(s.gensetKw)); prev = k; }
  if (s.day > 12) break;
}
console.log(sim.events.filter(e=>e.day<=12).map(e=>`${e.day} ${e.hour} ${e.type} ${e.message}`).join("\n"));
