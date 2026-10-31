# Screen Recording Runbook (Windows)

Plan about 75 minutes for both videos, including retakes. Record the **demo** first: the pitch reuses its app clips.

## 0. Public live link
The app is published at https://medgrid-sentinel.vercel.app (Vercel; mirror https://jae3y.github.io/medgrid-sentinel/), and both redeploy on every push to main. You can record from the live link instead of a local build; the local build below is the fallback if your connection is slow.

## 1. Prepare the app (5 min)
```bash
npm install
npm run build
npm run serve
```
Then open **http://localhost:3003**. This is the production static build: no dev overlay, and it works offline.
- Chrome, window maximised at **1920×1080**, zoom **100%** (`Ctrl+0`), bookmarks bar hidden (`Ctrl+Shift+B`), no other tabs visible.
- Reload once. Wait for the 3D model to appear (about 2 s). The scene should read **Thu 26 Sept, 10:00** with **Sentinel** selected.
- If the laptop is slow, close other apps. The 3D scene and the Monte Carlo need roughly 1 GB of free memory.

## 2. Prepare recording (5 min)
- **OBS Studio** (free; recommended): Display Capture → 1920×1080, 30 fps, MP4, bitrate around 8,000 kbps, so a 5-minute video is about 300 MB (well under the 500 MB limit). Or use **Xbox Game Bar** (`Win+Alt+R`), which records the active window.
- Microphone: headset or phone earbuds. Windows → Sound → Input at about 70%. Record a 10 s test and listen back.
- Focus Assist on; Slack, WhatsApp and email closed; phone silent.
- Keep `Demo_Video_Script.md` open on a second screen or printed.

## 3. Record the demo (by script row)
1. Read the row's narration aloud once.
2. Set the exact screen state (the storyboard lists what must be visible).
3. Record one row or two rows per take; join them in any editor (Clipchamp, which is built into Windows, is fine).
4. Replay each take and check that the audio is clear and every narrated number is visible on screen.
5. Move the cursor slowly; pause 1 s before each click; don't cover the number you're reading.

**Reset tips**
- To return to the opening moment: click **First blackout**.
- To reset the controller: click **Sentinel**.
- The Resilience lab runs automatically with 120 trials on first open. Select **300**, then click **Run Monte Carlo** and wait about 5 s.
- The fleet table fills over about 5 s. Wait for "10 site-years simulated".

## 4. Numbers you will see (from `results/demo-results.json`)
| Narrated | Where |
|---|---|
| Thu 26 Sept, 10:00; tank 0 L (status quo); 2,800 L (hybrid); 3,826 L (Sentinel) | 3D scene HUD |
| 937 of 937 h; 449 h; 2,841 L; +179 hours | Ledger under the 3D scene |
| 78% / 3% / 0% (14 days) | Resilience lab, 300 trials |
| ₦940.4M ($704,415); ₦311.2M; 3.3 yr; ₦553.2M; IRR 30.0%; 91,654 L/yr; 23.6% | Financials KPIs |
| strong / viable verdicts | Fleet & scale table |

## 5. Record the pitch
Open `submission/MedGrid_Sentinel_Pitch_Deck.pdf` full-screen (`F5` in a PDF viewer, or present the `.pptx`). Record the narration over the slides per `Pitch_Video_Script.md`, and insert the demo clips D2 → D1 and D5 at 1:30. Face cam is optional.

## 6. Export & upload
- Export MP4 H.264, 1080p or lower, under 500 MB, 3–5 min (demo) and ≤ 5 min (pitch).
- Name the files `MedGridSentinel_Brief13_Demo.mp4` and `MedGridSentinel_Brief13_Pitch.mp4`.
- Upload to YouTube (Unlisted) or Google Drive ("Anyone with the link"). **Test the link in a private window**.
