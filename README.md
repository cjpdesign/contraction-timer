# Contraction Timer

A simple, private labor **contraction timer** that tracks the **5-1-1 pattern** and tells you when it may be time to call your provider. Works offline and installs to your home screen.

**Live:** https://cjpdesign.github.io/contraction-timer/

## Features

- **One-tap timing** — start/stop each contraction; the elapsed time shows on the button.
- **Intensity** — tag each contraction Mild / Moderate / Strong (amber → orange → red), set before recording or edit after.
- **5-1-1 tracker** — live stat cards for average time apart, average duration, and how long the pattern has held, each with a progress bar that turns green when its target is met. An alert appears when all three line up (≈5 min apart, ≈1 min long, sustained ~1 hour).
- **History** — grouped by day, with the interval between contractions, and full editing (date, time, duration, intensity) or manual add.
- **Archive** — save a session to a group and start a fresh count.
- **Export / import** — share or back up as JSON, or copy a summary (tab-separated, pastes straight into Google Sheets).
- **Private & offline** — all data stays in your browser (localStorage); nothing is uploaded. Once loaded over HTTPS it works with no connection.

## Tech

A single [`index.html`](index.html) built with **Preact + htm** loaded from a CDN — **no build step, no dependencies, no server**. Styling is Tailwind (Play CDN); icons are Iconoir. PWA support comes from [`sw.js`](sw.js) and [`manifest.webmanifest`](manifest.webmanifest).

## Run locally

```bash
python3 -m http.server
```

Then open http://localhost:8000. Serving over `http://localhost` (or HTTPS) is needed for the Share/Clipboard features and the offline service worker; opening the file directly still works in a degraded mode.

## Disclaimer

This tool is for **tracking only and is not medical advice**. The 5-1-1 rule is a general guideline and providers differ — always follow your own provider's guidance.
