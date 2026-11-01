# Voice-over Script (read-aloud versions, no stage directions)


## Demo (≈ 4:15)
This is MedGrid Sentinel, built this weekend for Brief 13, power for a city the grid can't protect. On the 22nd of September 2024 insurgents cut the 330 kV line into Maiduguri. The city was off the grid for 39 days.

Same hospital, same moment, run the way most hospitals run today: grid plus a diesel generator. It's day five. The tank is empty, the generator can't run, and the ICU, theatres and cold chain have no power. The generator didn't fail. The fuel ran out. That happened to two hospitals in this city in 2022.

Now add 600 kilowatts of solar and a 600 kilowatt-hour battery, run by an ordinary hybrid inverter. It survives today with 2,800 litres left. Sentinel, on the identical hardware, has 3,826 litres, because it has been budgeting fuel against the next delivery since the line went down.

Everything in this model is driven by the simulation: the sun from NASA's measured irradiance for these exact dates, the panels, the battery gauge, the diesel level, and the lights in each ward.

Over the whole outage, with six thousand litres delivered each week, Sentinel keeps critical services on for 937 of 937 hours. The status quo manages 449. It burns 2,841 fewer litres. Life-critical circuits are never interrupted. On the same solar and battery, the software alone adds 179 hours.

Each row is one controller, hour by hour. Red means the ICU and theatres are dark. The fixed-rule hybrid goes dark too, from the 3rd of October. Sentinel never does. It defers laundry, admin and non-critical cooling first, and only when the fuel runway requires it.

This is the honest test. With plenty of fuel every option converges, so we only claim a benefit where the real constraint binds. And when fuel is very short, Sentinel deliberately trades ward hours to keep life-critical circuits on.

Every decision states its arithmetic. The duty engineer gets it as a single SMS, or a USSD menu, on any phone, with no data connection.

One replay is one story. Here the next outage is run three hundred times, with generator failure rates from NREL, late and missing convoys, and three years of real weather. The probability that life-critical power holds for fourteen days: zero for the status quo, three percent for the hybrid, seventy-eight percent with Sentinel.

It pays for itself. 940 million naira, about 704 thousand dollars, saves 311 million naira a year: a 3.3-year payback and a 30 percent IRR after battery replacement. Under energy-as-a-service the hospital pays nothing upfront and saves from month one.

The same engine screens other cities. It's strong in four of them and only viable in Lagos, so it tells you where it pays. Everything here was built this weekend, it runs offline, and every number is reproducible from the repository. Loads are illustrative; the next step is real metering in one hospital.

## Pitch (≈ 4:20)
See `Pitch_Video_Script.md`; the narration column reads straight through.
