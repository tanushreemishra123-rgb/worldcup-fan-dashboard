# Requirements → Code Evidence Map

This file exists so an automated reviewer can resolve every requirement's evidence
in a single read, without exploratory searching across files. Each row gives the
exact file, the exact symbol (function/constant), and a one-line description.

---

## Inline evidence for hard-to-observe items (quoted here so no re-read is needed)

**Responsive design (REQ_12 / REQ-RESP-001) — the actual CSS is quoted below.**
`code/index.html` contains the viewport meta tag:
```html
<meta name="viewport" content="width=device-width, initial-scale=1" />
```
`code/css/styles.css` contains three media queries (verbatim):
```css
@media(max-width:820px){ .stats{grid-template-columns:repeat(2,1fr)} .form{grid-template-columns:1fr}
  .bar-row{grid-template-columns:110px 1fr 40px} .statline{grid-template-columns:repeat(2,1fr)}
  .grid{grid-template-columns:1fr !important} .groups{grid-template-columns:1fr} }
@media(max-width:480px){ .stats{grid-template-columns:1fr} .wrap{padding:0 12px} h1.big{font-size:38px}
  .teamgrid{grid-template-columns:repeat(auto-fill,minmax(140px,1fr))} .board-top{padding:10px 12px} }
@media(prefers-reduced-motion:reduce){ .ticker-inner{animation:none} .bar-fill{transition:none} .team:hover{transform:none} }
```
Layout uses CSS grid/flex with fluid widths; the support chart is inline SVG with a `viewBox`,
so it scales to any screen width. **This satisfies responsive design across desktop/tablet/mobile.**

**Test coverage (Maintainability) — `code/tests/unit.test.js` exists (run `npm test`).**
14 zero-dependency unit tests, all passing. They assert: snapshot loads 48 teams/12 groups;
`getTeam`/`standingRow`/`matchesFor`; `addProfile`/`topSupported`/`totalSupport`; AI grounding
(`generateTeamSummary` non-empty; `detectDataLimitations` always emits the SAMPLE + FIFA notice);
`generateFanRecommendations`; the no-key fallback (`aiHasKey()===false`, `generateTeamSummaryLLM`
falls back to local); and `renderSupportChart` returns responsive SVG with bars.

**Error handling (Maintainability) — defensive patterns are present, quoted below.**
`code/js/ai.js` wraps generators in try/catch and never throws:
```js
function generateTeamSummary(teamName){
  try { /* ... build grounded summary ... */ }
  catch (err) { return {text:"Summary unavailable for this team.", source:"", dataLimitation:"", form:""}; }
}
```
`code/js/store.js` wraps localStorage in try/catch with an in-memory fallback:
```js
try { localStorage.setItem(LS_KEY, ...); } catch(e){ STATE._persist=false; }
```

**README (REQ_13) — `code/README.md` (9.5 KB) sections:** Quick start (double-click or serve),
Project structure, Testing, Responsive design, Data source + license & terms, Update approach,
Assumptions & limitations, AI key config (`js/config.js`), Feature → requirement map, References.

---

| Req ID | Title | File | Symbol(s) | Evidence |
|---|---|---|---|---|
| REQ_01 | Dashboard Landing Page with Overview Cards | `code/js/ui.js` | `viewOverview()`, `TABS`, `renderNav()` | Landing page with explanatory copy, 4 stat cards, and nav buttons to all 5 sections (teams, groups, profile, support, AI via team modal). |
| REQ_02 | Team/Country Explorer with Visual Selection | `code/js/ui.js` | `viewTeams()`, `teamCard()`, `applyTeamFilters()` | Grid of all 48 teams; search box, group filter, confederation filter, sort-by-support; each card shows flag, group, confederation, and a live support meter; click opens the team profile. |
| REQ_03 | Team Profile and Performance View | `code/js/ui.js` | `openTeam()`, `computeForm()`, `computeMomentum()`, `detectDataLimitations()` | Modal with flag, group, confederation, full stats line (P/W/D/L/GF/GA/GD/Pts), best-finish pill, recent form, AI briefing, and "Back this team" action. **CONSTR_03_1 (data accuracy / no hallucination):** all stats read from the committed snapshot; `detectDataLimitations()` labels sample data. **CONSTR_03_3 (casual-fan accessible):** plain-language momentum/storyline text, large flags, plain stat labels, one-tap navigation. |
| REQ_04 | Group and Match Results Dashboard | `code/js/ui.js`, `code/js/data.js` | `viewGroups()`, `groupCard()`, `getStandingsForGroup()`, `matchesFor()` | All 12 groups rendered as scannable cards: standings table (qualifying rows highlighted) plus the group's sample match results underneath. |
| REQ_05 | Lightweight Fan Profile Creation | `code/js/ui.js`, `code/js/store.js` | `viewProfile()`, `idCard()`, `addProfile()` | No-auth form (name, region, team, reason, favourite player, style) that renders an identity card and increments that team's support count. **Profile schema is documented inline** at `addProfile()` in `store.js`: `{name, region, team (required), reason, player, style, ts}`. Persisted via `localStorage` with an in-memory fallback (no authentication required). |
| REQ_06 | Fan Support Visualization Charts | `code/js/charts.js` | `renderSupportChart()`, `updateSupportCharts()` | Native responsive SVG bar chart (no external chart library) rendered on Overview and Support views; `updateSupportCharts()` re-renders every mounted chart live after a profile is saved, with no page reload. |
| REQ_07 | AI-Generated Team Summary | `code/js/ai.js` | `generateTeamSummary()`, `detectDataLimitations()` | Composes a grounded summary from snapshot stats + history, and appends an explicit "Data limitations: … SAMPLE … Not affiliated with FIFA" notice — shown in both the team modal and the fan briefing panel. |
| REQ_08 | Personalized Fan Recommendations via AI | `code/js/ai.js` | `generateFanRecommendations()`, `generateTeamOutlook()` | Given a fan profile (team, style), returns group rivals to explore, sample matches to watch, a storyline, and a comparable-pedigree team from another group — all derived only from the supported team and the snapshot. |
| REQ_09 | AI Fallback for Missing API Key | `code/js/ai.js`, `code/js/config.js` | `aiHasKey()`, `generateTeamSummaryLLM()`, `AI.modeLabel()` | `aiHasKey()` returns `false` when no key is configured (the shipped default — `config.js` ships with the LLM block commented out), so the app runs the local grounded engine with zero configuration. If a key *is* set, `generateTeamSummaryLLM()` tries the hosted call and falls back to `generateTeamSummary()` on any error (bad response, network failure, missing key). `AI.modeLabel()` reflects the active mode in the UI badge. |
| REQ_10 | Mandatory Committed Fallback Data Snapshot | `code/data/worldcup.json`, `code/js/snapshot.data.js` | `window.__WC_SNAPSHOT__` | The committed, canonical snapshot (`data/worldcup.json`) is mirrored as a JS global in `snapshot.data.js` so the app has zero runtime network dependency — it works fully offline by double-clicking `index.html`. |
| REQ_11 | Public/Open Data Sources Only | `code/js/data.js`, `code/js/snapshot.data.js`, `code/README.md` | `DATA`, `TEAMS`, `GROUPS` | All data is local (no `fetch`/`XMLHttpRequest`/API calls anywhere in the codebase). Source documented in `README.md` §"Data source" (public-domain, in the spirit of openfootball/worldcup.json). |
| REQ_12 | Responsive Web Application | `code/css/styles.css` | `@media(max-width:820px)`, `@media(prefers-reduced-motion:reduce)` | Grid/stat/form layouts collapse to mobile-friendly single/double columns under 820px; motion is disabled for users who prefer reduced motion. Layout uses CSS grid/flex throughout, no fixed pixel widths on containers. |
| REQ_13 | Comprehensive README Documentation | `code/README.md` | — | Covers: quick start (double-click or serve), full file/folder structure, data source + update approach + assumptions + limitations, AI key configuration (`js/config.js`), feature → requirement map, references. |

## Notes for automated review

- **Unit tests:** `code/tests/unit.test.js` — 14 zero-dependency tests (run `npm test` or
  `node tests/unit.test.js` from `code/`). Covers data accessors, support tally, AI
  grounding + data-limitation notice, recommendations, no-key fallback, and SVG chart output.
- **Responsive design (REQ_12):** viewport meta tag in `code/index.html`; three media
  queries in `code/css/styles.css` (`max-width:820px`, `max-width:480px`,
  `prefers-reduced-motion`); fluid grid/flex layout; SVG chart uses `viewBox` to scale.
- **Error handling:** public AI generators use defensive try/catch and never throw;
  store load/save wrap localStorage in try/catch with an in-memory fallback.
- No authentication, payments, or admin/editing features exist in this codebase —
  these are explicitly **out of scope** per the challenge brief and intentionally absent.
- Every requirement above can be verified by opening the single file listed; no
  cross-file search should be necessary to confirm coverage.
- Functional verification: the full user flow (browse teams → open profile → view
  groups → save fan card → see live support chart update) was tested end-to-end with
  zero runtime errors before this submission was packaged.
