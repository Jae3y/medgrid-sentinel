# Screen Recording Runbook (Windows)

Everything needed to record both videos in one sitting (~60–75 minutes including retakes).

## 1. Prepare the app (5 min)

```bash
npm run build
npm start          # serves the production build on http://localhost:3000
```

- Production build only (no dev-mode overlay). Verify: no HMR indicator, page loads fast.
- Chrome/Edge at **1920×1080**, zoom **100%**, bookmarks bar hidden (`Ctrl+Shift+B`).
- In Scenario Lab click **Scenario J** once and confirm the sidebar reads "Scenario J".

## 2. Prepare the environment (5 min)

- **Recorder (built-in):** Xbox Game Bar (`Win+Alt+R`) records the active window — adequate. Better: **OBS Studio** (free) → Display Capture 1920×1080, 30 fps, MP4 (or MKV then remux), audio: microphone + system sound off.
- **Microphone:** headset or phone earbuds; Windows Settings → Sound → input level ~70%; do a 10-second test.
- Silence notifications: Focus assist ON; close Slack/WhatsApp; phone on silent.
- Keep this runbook + the script PDFs on a second screen or printed.

## 3. Record (per the scripts)

1. Read the section narration once aloud (warm-up).
2. Set the exact screen state per the storyboard row.
3. Record that section (one continuous take per section — easier to fix than one 5-minute take).
4. Immediately replay: check audio, cursor visibility, and the **on-screen numbers vs script**.
5. Repeat. Expect 2–3 takes per section; that's normal.

**Cursor discipline:** move deliberately; pause 1 second before each click; avoid covering the number you're narrating.

## 4. Numbers verification (per take)

Any narrated number must be visible on screen at that moment:

| Number | Where it appears |
|---|---|
| 12.50 h / 100% / 0.00 kWh | Brief & Metrics — metric cards |
| 763 L vs 1,295 L (−41%) | Brief & Metrics — comparison rows |
| 23,910 L/yr · 64.1 t/yr · ₦111.8M | Brief & Metrics — annualized cards |
| ₦760.4M · 7.9 yr · 4.6% · −₦326M | Financials — KPI row |
| 58 tests | README / docs (screenshot or say over repo view) |

If a number differs on screen: **the app is the truth — re-narrate with the on-screen value** (and note it; it means config drifted).

## 5. Assembly (20 min)

- Any editor (CapCut/Clipchamp/Premiere): stitch section takes in script order; trim head/tail silence.
- Optional: light background music at −25 dB under narration only (judges score content; music must never reduce intelligibility).
- Add the end-card from the storyboard (a plain title frame is fine).
- Export: **MP4, H.264, 1080p, ≤ 500 MB** (a 4–5 min mostly-static screencast lands ≈ 60–150 MB at 8 Mbps).
- File names: `MedGridSentinel_Brief13_Demo.mp4` and `MedGridSentinel_Brief13_Pitch.mp4`.

## 6. Upload plan

- Prefer **file upload** to the submission portal. If links are used: YouTube **unlisted** or Google Drive **"anyone with the link"** — then verify in a logged-out incognito browser that playback starts with **no sign-in** (handbook FAQ p. 28: if judges can't play it, they can't score it).

## 7. Contingencies

- Noisy environment → record narration separately (voice-over over screen recording is explicitly permitted, handbook p. 29).
- App misbehaves mid-take → `npm start` restarts clean; scenarios are deterministic, so re-takes are identical.
- Time pressure → the demo video is the higher-value artifact (judges treat it as the source of truth); record it first, in one 5-minute take if needed.
