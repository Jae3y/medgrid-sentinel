"""Convert raw NASA POWER hourly JSON (data/raw/nasa-power) into compact engine datasets.

Output: src/data/irradiance/<site>_<year>.json with
  { site, lat, lon, year, source, ghi: int[] (W/m2, hourly, local standard time), t2m: int[] (0.1 degC) }
Missing values (-999) are replaced by the same hour on the previous day (logged).
"""
import json, os, sys, glob

RAW = os.path.join(os.path.dirname(__file__), "..", "data", "raw", "nasa-power")
OUT = os.path.join(os.path.dirname(__file__), "..", "src", "data", "irradiance")
os.makedirs(OUT, exist_ok=True)
index = []
for path in sorted(glob.glob(os.path.join(RAW, "*.json"))):
    name = os.path.basename(path)[:-5]
    site, year = name.rsplit("_", 1)
    d = json.load(open(path))
    lon, lat, elev = d["geometry"]["coordinates"]
    p = d["properties"]["parameter"]
    keys = sorted(p["ALLSKY_SFC_SW_DWN"].keys())
    ghi, t2m, fixed = [], [], 0
    for i, k in enumerate(keys):
        g = p["ALLSKY_SFC_SW_DWN"][k]; t = p["T2M"][k]
        if g is None or g < -900:
            g = ghi[i - 24] if i >= 24 else 0; fixed += 1
        if t is None or t < -900:
            t = t2m[i - 24] / 10 if i >= 24 else 25; fixed += 1
        ghi.append(int(round(max(0, g))))
        t2m.append(int(round(t * 10)))
    rec = {"site": site, "lat": lat, "lon": lon, "elevationM": elev, "year": int(year),
           "source": "NASA POWER hourly API (community=RE, ALLSKY_SFC_SW_DWN, T2M, time-standard=LST), accessed 2026-10-31",
           "hours": len(ghi), "filledMissing": fixed, "ghi": ghi, "t2m": t2m}
    json.dump(rec, open(os.path.join(OUT, f"{name}.json"), "w"), separators=(",", ":"))
    kwh = sum(ghi) / 1000
    index.append({"id": name, "site": site, "year": int(year), "lat": lat, "lon": lon,
                  "annualGhiKwhM2": round(kwh, 1), "meanT2mC": round(sum(t2m) / len(t2m) / 10, 1), "filledMissing": fixed})
    print(f"{name}: {len(ghi)} h, GHI {kwh:.0f} kWh/m2/yr, filled {fixed}")
json.dump(index, open(os.path.join(OUT, "index.json"), "w"), indent=1)
