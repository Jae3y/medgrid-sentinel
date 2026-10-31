import { evaluateSolarForecast } from "../../src/engine";
const r = evaluateSolarForecast();
console.log(r.models, r.blend, r.confidenceCoverage, r.meanTestKwhM2, r.testDays);
