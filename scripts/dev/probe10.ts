import { scenarioById, runSimulation } from "../../src/engine";
const sim = runSimulation(scenarioById("J").build());
for (const s of sim.steps.filter((s) => s.day === 1 && s.t % 4 === 0)) console.log(s.hour, s.islanded, s.socFrac.toFixed(3), Math.round(s.battKw), Math.round(s.gensetKw), Math.round(s.pvKw), Math.round(s.gridKw), Math.round(s.demandKw[1]+s.demandKw[2]+s.demandKw[3]));
