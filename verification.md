# Verification — World Cup 2026 Fan Engagement Prototype

Independent, unofficial prototype. **Not affiliated with or endorsed by FIFA.** Group draw,
fixtures and standings are clearly-labelled **sample** data; historical facts are public-domain.

## Submission structure

```
submission/
├── verification.md          ← you are here (how to run & verify)
├── docs/
│   ├── architecture.svg     ← architecture diagram (deliverable)
│   └── demo-cue-sheet.html  ← walkthrough used to record the demo video
└── code/                    ← the codebase
    ├── README.md            ← full documentation (run, data, AI, assumptions, limitations)
    ├── package.json         ← project manifest
    ├── index.html           ← app entry point (markup; links css + js)
    ├── css/styles.css       ← FRONTEND
    ├── js/
    │   ├── snapshot.data.js ← DATA payload (offline-safe global)
    │   ├── data.js          ← DATA accessors
    │   ├── store.js         ← STORE (fan profiles + support)
    │   ├── config.js        ← optional hosted-LLM config
    │   ├── ai.js            ← AI (grounded engine + optional LLM)
    │   └── ui.js            ← UI (router, views, modal)
    └── data/worldcup.json   ← committed data snapshot (48 teams, 12 groups)
```

## How to run (no build step)

From `code/`:

- **Simplest — just open it (works offline):** double-click `code/index.html`.
- **Or serve it:**
  ```bash
  cd code
  python3 -m http.server 8000     # then open http://localhost:8000
  # or:  npm start                 # uses npx serve on port 8000
  ```

## How to verify the deliverables

1. **Working app** — open `code/index.html`; click through Overview, Teams, Groups & Results,
   Fan Profile, Support. Open a team for its profile + AI briefing.
2. **Source code / separation** — see `code/css/` (frontend), `code/js/data.js` +
   `code/js/snapshot.data.js` (data), `code/js/store.js` (fan state), `code/js/ai.js` (AI),
   `code/js/ui.js` (UI). Each layer is its own file, commented.
3. **Data snapshot** — `code/data/worldcup.json` (48 teams, 12 groups, sample fixtures/standings).
4. **README** — `code/README.md` (source, update approach, assumptions, limitations, AI key config).
5. **Architecture diagram** — `docs/architecture.svg`.
6. **Demo video** — https://www.loom.com/share/cda0411b2b854c1db5e408c44ee594e7

## Requirements → code evidence

**See `REQUIREMENTS.md` (submission root) for the full requirement-by-requirement
evidence map** — every requirement ID, its exact file, exact function name, and a
one-line description, so no cross-file searching is needed to verify coverage.

Quick summary (see REQUIREMENTS.md for detail):

| Requirement | Implemented in | Key symbols |
|---|---|---|
| Team/Country explorer + support indicators | `code/js/ui.js`, `code/data/worldcup.json` | `viewTeams`, `teamCard`, `TEAMS` |
| Group & results dashboard | `code/js/ui.js` | `viewGroups`, `groupCard` |
| **Fan support visualization charts** | `code/js/charts.js` | `renderSupportChart` (responsive SVG bar chart), `updateSupportCharts` (live update, no reload) |
| **AI-generated team summary** | `code/js/ai.js` | `generateTeamSummary`, `detectDataLimitations` (notes sample/mock/incomplete/outdated) |
| Personalized fan recommendations | `code/js/ai.js` | `generateFanRecommendations`, `generateTeamOutlook` |
| Fan profile + support | `code/js/store.js`, `code/js/ui.js` | `addProfile`, `viewProfile`, `topSupported` |
| Public/open data + committed snapshot | `code/data/worldcup.json`, `code/js/snapshot.data.js` | `__WC_SNAPSHOT__` |
| No-key AI fallback | `code/js/ai.js`, `code/js/config.js` | `aiHasKey`, `generateTeamSummaryLLM` (falls back to local) |

Charts are rendered with **native inline SVG** (`<rect>` bars + `viewBox` for responsiveness);
no external chart library (chart.js / d3) is needed, which keeps the app fully offline.

## AI notes (grounding + fallback)

- Default: a **local grounded rule engine** — no API key needed. It composes insights **only**
  from the committed snapshot and never invents scores, standings or history.
- Optional hosted LLM: uncomment the block in `code/js/config.js`. On any failure it falls back
  to the local engine automatically.

## Data source

Team list & historical facts adapted from public-domain football history, in the spirit of
openfootball/worldcup.json (https://github.com/openfootball/worldcup.json). Fixtures and
standings are synthetic **sample** data. No paid APIs, no scraping, no credentials.
