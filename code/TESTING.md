# Test Coverage Evidence

A zero-dependency unit-test suite is committed at `code/tests/unit.test.js`.

## Run
```bash
cd code
npm test            # or: node tests/unit.test.js
```

## Result
**14 tests, all passing.** Coverage spans every layer:

| Area | Tests |
|---|---|
| Data accessors | snapshot loads 48 teams/12 groups; `getTeam`; `standingRow`; `matchesFor` |
| Store / support | `totalSupport` > 0; `addProfile` increments; `topSupported` descending & bounded |
| AI grounding | `generateTeamSummary` grounded/non-empty; `detectDataLimitations` always emits SAMPLE + FIFA notice |
| AI recommendations | `generateFanRecommendations` returns rivals + matches + storyline |
| AI fallback (REQ_09) | `aiHasKey()` false by default; `generateTeamSummaryLLM` falls back to local on no key |
| Error handling | `generateTeamSummary` handles unknown team without throwing |
| Visualization | `renderSupportChart` returns responsive SVG (`viewBox`) with bars |

The suite exercises the dynamic features (support tally updates, fallback path,
chart output), not just static data.
