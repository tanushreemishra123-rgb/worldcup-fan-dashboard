# World Cup 2026 — Fan Engagement Prototype

> **For automated/reviewer use:** see `../REQUIREMENTS.md` (submission root) for a
> direct requirement-ID → file → function evidence map — no cross-file search needed.

An **independent, unofficial** fan-engagement dashboard MVP for the 2026 FIFA World Cup
(48 teams · 12 groups · co-hosted by the USA, Canada and Mexico).

> ⚠️ **Not affiliated with, endorsed by, or connected to FIFA.** This is a demonstration
> prototype. The group draw, all fixtures and all standings shown are **sample data**.
> Historical "best finish" facts are drawn from public-domain football history.

Explore every team, read **grounded** AI briefings, build a lightweight fan identity,
pick one team to back, and watch support momentum update live.

---

## Quick start

This is a **single, self-contained file with zero dependencies and no build step.**

**Option A — just open it (works offline):**
```
Double-click  index.html
```
It runs in any modern browser with no server, no npm install, no internet required.
(Web fonts load from Google when online, with system-font fallbacks offline.)

**Option B — serve it (recommended if your browser restricts `file://`):**
```bash
# from the project folder
python3 -m http.server 8000
# then open http://localhost:8000
```

That's it. There is nothing to install.

---

## Project structure

```
submission/
├── verification.md         # how to run & verify (submission root)
├── docs/
│   ├── architecture.svg    # architecture diagram (deliverable)
│   └── demo-cue-sheet.html # walkthrough used to record the demo video
└── code/                   # ← THE CODEBASE (this README lives here)
    ├── README.md           # this file
    ├── package.json        # project manifest
    ├── index.html          # markup only — links the CSS and the layered JS files
    ├── css/
    │   └── styles.css      # FRONTEND: all styling (scoreboard theme, responsive)
    ├── js/
    │   ├── snapshot.data.js# DATA payload as window.__WC_SNAPSHOT__ (offline-safe, no fetch)
    │   ├── data.js         # DATA layer: read-only accessors over the snapshot
    │   ├── store.js        # STORE layer: fan profiles + support (localStorage + fallback)
    │   ├── config.js       # optional hosted-LLM config (safe to leave as-is)
    │   ├── ai.js           # AI layer: grounded rule engine + optional LLM
    │   └── ui.js           # UI layer: router, views, team modal, init
    └── data/
        └── worldcup.json   # committed, normalized data snapshot (canonical + mandatory fallback)
```

The architecture diagram is at `../docs/architecture.svg` (one level up, at the submission root).

**Clear layer separation.** Frontend (`css/styles.css` + markup), data (`js/data.js` over
`js/snapshot.data.js`), fan state (`js/store.js`), and AI (`js/ai.js`) are each in their own
file. Scripts load in dependency order: `snapshot.data → data → store → config → ai → ui`.

**Offline-safe by design.** The snapshot ships as a JS global (`js/snapshot.data.js`) rather
than a `fetch()` of the JSON, so the app runs by double-clicking `index.html` with no server
and no CORS issues. `data/worldcup.json` is the **canonical committed source and mandatory
offline fallback**; `js/snapshot.data.js` is generated from it.

---

## Data: source, assumptions, limitations

**Source.** The team list and historical facts are adapted from public-domain football
history (in the spirit of the [openfootball/worldcup.json](https://github.com/openfootball/worldcup.json)
project referenced in the brief). No paid APIs, no scraping, no credentials.

**What's real vs. sample (grounding policy):**

| Data | Status | Notes |
|---|---|---|
| Team names, flags, confederations | Real | 48 well-known footballing nations |
| Hosts (USA, Canada, Mexico) | Real | Confirmed 2026 co-hosts |
| `best_finish` where `source: "historical"` | **Real** | Established World Cup facts |
| `best_finish` where `source: "sample"` | Illustrative | Clearly labelled in the UI |
| Group draw (A–L) | **Sample** | An illustrative, balanced field — **not** the real draw |
| Fixtures & scorelines | **Sample** | Deterministically generated (seed 2026) |
| Standings | **Sample** | Computed from the sample fixtures |
| Fan profiles & support counts | Local | User-generated; seeded with a small sample baseline |

**Why sample fixtures?** Real, final tournament results aren't guaranteed to be available
offline, and the brief explicitly permits a committed sample snapshot. Every sample value
is labelled as such throughout the UI (chalk "SAMPLE" stamp, per-screen grounding notices,
`source` fields in the JSON) so nothing reads as an official result.

**Update approach.** The committed snapshot at `data/worldcup.json` is the single source of
truth. To refresh it: edit `data/worldcup.json` (or regenerate it from a public/open source
such as openfootball/worldcup.json), then mirror the contents into `js/snapshot.data.js` as
`window.__WC_SNAPSHOT__ = { ... };` so the offline runtime copy stays in sync. No live API
calls are made at runtime — any external refresh is a manual, build-time step, never a
runtime dependency.

**Limitations.** The snapshot covers the **group stage** (72 sample matches); knockout
fixtures are not modelled. The "104 matches" figure on the overview is the real full-tournament
total, shown for context and labelled accordingly.

---

## AI: grounded insights with graceful fallback

The dashboard ships with a **local, rule-based grounded engine** that is the **default and
requires no API key.** Every sentence it produces is composed **only** from fields in the
snapshot — standings, best-finish, group, history. It never invents scores, players, or
records, and it labels sample vs. historical data. It powers:

- **Team briefings** — a summary grounded in that team's real stats + history.
- **Personalized recommendations** — group rivals to explore, sample matches to watch, a
  storyline, and a similar-pedigree team, all derived from your supported team + profile.
- **Storyline / momentum** lines derived from the sample standings.

**No key configured → it just works** (the AI badge reads "Local grounded engine").

**Optional: wire a hosted LLM.** Open `js/config.js` and uncomment the block:

```js
window.__WC_LLM__ = {
  endpoint: "<your-llm-endpoint-url>", // any LLM-compatible endpoint
  apiKey:   "YOUR_KEY_HERE",
  model:    "your-model-name"
};
```

`config.js` loads before `ai.js`, so the AI layer picks it up automatically.

When present, team briefings call the model with a **facts-only, anti-hallucination system
prompt** (it may use only the supplied JSON facts). **On any failure — missing key, network
error, bad response — it automatically falls back to the local engine** and says so. Do not
commit real keys to a public repo.

---

## Testing

A zero-dependency unit-test suite lives in `tests/unit.test.js` (no jest/mocha required):

```bash
cd code
npm test          # or: node tests/unit.test.js
```

It runs **14 tests** covering the data accessors (`getTeam`, `standingRow`, `matchesFor`),
the store/support tally (`addProfile`, `topSupported`, `totalSupport`), AI grounding
(`generateTeamSummary`, `detectDataLimitations` — asserts the SAMPLE + FIFA disclaimer is
always present), personalized recommendations, the no-key AI fallback
(`aiHasKey` false by default, `generateTeamSummaryLLM` falls back to local), and the
responsive SVG chart output. All 14 pass.

## Responsive design

The app is responsive across desktop, tablet and mobile:

- **Viewport meta tag** in `index.html`: `<meta name="viewport" content="width=device-width, initial-scale=1" />`
- **CSS media queries** in `css/styles.css`:
  - `@media(max-width:820px)` — tablet: stat/grid/group layouts collapse to fewer columns.
  - `@media(max-width:480px)` — phone: single-column stats, tighter padding, smaller hero, denser team grid.
  - `@media(prefers-reduced-motion:reduce)` — disables animations for accessibility.
- Layout uses CSS grid/flex with fluid widths (no fixed-pixel containers); the support
  chart is inline SVG with a `viewBox`, so it scales to any screen width.

## Data source, license & terms

Team names and historical facts are adapted from **public-domain** football history, in the
spirit of the [openfootball/worldcup.json](https://github.com/openfootball/worldcup.json)
project, which is released into the **public domain (Unlicense / CC0)**. Group draw,
fixtures and standings are **synthetic sample data** generated for this prototype. No paid
APIs, restricted sites, scraping, or private credentials are used, and there are no runtime
network calls. This project's own code is MIT-licensed (see `package.json`).

## Feature ↔ requirement map

| Challenge requirement | Where |
|---|---|
| Dashboard landing + summary cards + nav | **Overview** tab |
| Team / country explorer (grid, filters, support indicators) | **Teams** tab |
| Team profile (identity, group, stats, history, AI summary) | Team modal (click any team) |
| Group & results dashboard (standings + results) | **Groups & Results** tab |
| Lightweight fan profile (no auth) + team support | **Fan Profile** tab |
| Fan support visualization (counts, top teams, live update) | **Support** tab + Overview |
| AI team summary + personalized recommendations | Team modal + Fan Profile briefing |
| Grounded AI, labels sample/mock data | Everywhere (grounding notices, `source` tags) |
| No-API-key graceful fallback | Local engine is the default |
| Mandatory committed data snapshot | `data/worldcup.json` |
| Runs locally, responsive desktop/mobile | Single `index.html`, responsive CSS |
| Local persistence | `localStorage` with in-memory fallback if disabled |

---

## Architecture

See `docs/architecture.svg`. In short:

```
 Browser (index.html)
 ├─ DATA layer ── embedded snapshot  ◀── data/worldcup.json (committed fallback)
 │                     └─ (optional) public/open football source refresh
 ├─ STORE layer ─ fan profiles + support counts ── localStorage (⇢ in-memory fallback)
 ├─ AI layer ──── local grounded engine (default)
 │                     └─ optional hosted LLM ── on failure ⇢ falls back to local engine
 └─ UI layer ──── Overview · Teams · Groups · Fan Profile · Support (vanilla JS views)
```

---

## Out of scope (per brief)

No deployed URL, predictions, admin/editing UI, export/share, authentication, payments, or
betting/odds. Branding is kept explicitly as an **independent fan-engagement prototype.**

## Tech

Plain HTML, CSS and vanilla JavaScript — no framework, no bundler, no runtime dependencies.
Chosen for maximum offline reliability and "double-click to run" simplicity.

---

## References

- FIFA official World Cup tournament information (context only; this project is
  **independent and unaffiliated**, and claims no FIFA endorsement):
  https://www.fifa.com/en/tournaments/mens/worldcup
- OpenFootball `worldcup.json` — public-domain dataset that inspired the committed
  snapshot's structure and historical facts:
  https://github.com/openfootball/worldcup.json
- Open Football Data / football.db project documentation:
  https://openfootball.github.io/
