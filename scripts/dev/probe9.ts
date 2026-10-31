import { smsFeed, runSimulation, lineOutageConfig, ussdStatus, isGsm7 } from "../../src/engine";
const sim = runSimulation(lineOutageConfig());
const f = smsFeed(sim, 15);
for (const a of f) console.log(a.chars, isGsm7(a.text), a.text);
const s = sim.steps[500]; const u = ussdStatus(s, 600, 0.15, 0.95); console.log(u.length); console.log(u);
