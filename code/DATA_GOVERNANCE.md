# Data Source Governance & Audit (REQ_11)

## Policy
This project uses **only public/open data**. No paid APIs, restricted sites, unofficial
scraping, or private credentials are used for football data. There are **no runtime network
calls for football data** — the app is fully offline.

## Sources (audit)
| Data | Source | License | Where |
|---|---|---|---|
| Team names, flags, confederations, historical best-finish | Public-domain football history, in the spirit of openfootball/worldcup.json | Public domain (Unlicense / CC0) | `data/worldcup.json`, `js/snapshot.data.js` |
| Group draw, fixtures, standings | Synthetic **sample** data generated for this prototype | N/A (original, sample) | `data/worldcup.json` |
| Fan profiles & support counts | User-generated at runtime (no external source) | N/A | `localStorage` via `js/store.js` |

## Enforcement / verification mechanism
- **No secrets:** there is no API key, token, subscription, or credential anywhere in the code
  for data access. (An OPTIONAL hosted-LLM key may be supplied by the user in `js/config.js`
  for AI commentary only — it is never used to fetch football data, and the app runs fully
  without it.)
- **No network fetches for data:** grep the codebase for `fetch`/`XMLHttpRequest` — the only
  `fetch` is the optional LLM call in `js/ai.js`, guarded by `aiHasKey()` and defaulted off.
- **Data limitations are surfaced in-product:** `detectDataLimitations()` labels sample vs.
  historical data in every AI summary, so no output can be mistaken for official results.
