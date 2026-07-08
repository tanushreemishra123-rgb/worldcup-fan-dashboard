"use strict";
/* ============================================================
   UNIT TESTS — World Cup 2026 Fan Engagement Prototype
   ============================================================
   Zero-dependency test runner (no jest/mocha needed). Run with:
       node tests/unit.test.js
   Loads the snapshot + logic layers in a minimal shim and asserts
   behavior of the data, store, AI and chart layers.
   Covers: routing constants, data accessors, support tally, AI summary
   grounding + data-limitation notice, recommendations, and no-key fallback. */

var assert = require("assert");
var fs = require("fs");
var path = require("path");
var vm = require("vm");

/* ---- minimal browser-like sandbox so the app modules can load ---- */
var store = new Map();
var sandbox = {
  window: { __WC_LLM__: null },
  document: { querySelectorAll: function(){ return []; }, getElementById: function(){ return null; } },
  localStorage: {
    getItem: function(k){ return store.has(k) ? store.get(k) : null; },
    setItem: function(k,v){ store.set(k, String(v)); },
    removeItem: function(k){ store.delete(k); }
  },
  console: console,
  fetch: function(){ return Promise.reject(new Error("no network in tests")); },
  Promise: Promise, Math: Math, JSON: JSON, Object: Object, Array: Array,
  String: String, Number: Number, Date: Date, parseInt: parseInt, encodeURIComponent: encodeURIComponent
};
sandbox.window.fetch = sandbox.fetch;
vm.createContext(sandbox);

var base = path.join(__dirname, "..", "js");
["snapshot.data.js","data.js","store.js","config.js","ai.js","charts.js"].forEach(function(fname){
  var code = fs.readFileSync(path.join(base, fname), "utf8");
  vm.runInContext(code, sandbox, { filename: fname });
});

/* ---- tiny test harness ---- */
var passed = 0, failed = 0;
function test(name, fn){
  try { fn(); passed++; console.log("  ✓ " + name); }
  catch (e) { failed++; console.log("  ✗ " + name + "  — " + e.message); }
}
console.log("\nWorld Cup 2026 — unit tests\n");

/* ---- DATA layer ---- */
test("snapshot loads with 48 teams and 12 groups", function(){
  assert.strictEqual(sandbox.TEAMS.length, 48);
  assert.strictEqual(sandbox.GROUPS.length, 12);
});
test("getTeam returns a known team and null for unknown", function(){
  assert.ok(sandbox.getTeam("Brazil"));
  assert.strictEqual(sandbox.getTeam("Atlantis"), null);
});
test("standingRow returns a row with points for a real team", function(){
  var r = sandbox.standingRow("Brazil");
  assert.ok(r && typeof r.Pts === "number");
});
test("matchesFor returns only that team's fixtures", function(){
  var ms = sandbox.matchesFor("Brazil");
  assert.ok(ms.length > 0);
  ms.forEach(function(m){ assert.ok(m.home === "Brazil" || m.away === "Brazil"); });
});

/* ---- STORE layer ---- */
test("seeded baseline gives positive total support", function(){
  assert.ok(sandbox.totalSupport() > 0);
});
test("addProfile increments the supported team's count", function(){
  var before = sandbox.getSupport("Japan");
  sandbox.addProfile({name:"T",region:"X",team:"Japan",reason:"",player:"",style:""});
  assert.strictEqual(sandbox.getSupport("Japan"), before + 1);
});
test("topSupported returns a descending, length-bounded list", function(){
  var top = sandbox.topSupported(5);
  assert.strictEqual(top.length, 5);
  var prev = Infinity;
  top.forEach(function(row){ assert.ok(row.count <= prev); prev = row.count; });
});

/* ---- AI layer (grounding) ---- */
test("generateTeamSummary is grounded and non-empty", function(){
  var s = sandbox.generateTeamSummary("Argentina");
  assert.ok(s.text.indexOf("Argentina") >= 0);
  assert.ok(s.text.length > 30);
});
test("detectDataLimitations always notes SAMPLE data + FIFA disclaimer", function(){
  var note = sandbox.detectDataLimitations(sandbox.getTeam("France"));
  assert.ok(note.indexOf("SAMPLE") >= 0);
  assert.ok(note.indexOf("Not affiliated with FIFA") >= 0);
});
test("generateFanRecommendations returns rivals, matches and a storyline", function(){
  var rec = sandbox.generateFanRecommendations({team:"Spain", style:"Possession"});
  assert.ok(Array.isArray(rec.exploreGroup) && rec.exploreGroup.length >= 1);
  assert.ok(Array.isArray(rec.matches));
  assert.ok(typeof rec.storyline === "string" && rec.storyline.length > 0);
});
test("aiHasKey is false by default (no-key fallback path active)", function(){
  assert.strictEqual(sandbox.aiHasKey(), false);
});
test("generateTeamSummaryLLM falls back to local summary when no key", function(){
  return sandbox.generateTeamSummaryLLM("Germany").then(function(s){
    assert.ok(s.text.indexOf("Germany") >= 0);
  });
});
test("generateTeamSummary handles an unknown team without throwing", function(){
  var s = sandbox.generateTeamSummary("Nowhere United");
  assert.ok(s && typeof s.text === "string");
});

/* ---- VISUALIZATION layer ---- */
test("renderSupportChart returns responsive SVG with bars", function(){
  var svg = sandbox.renderSupportChart(sandbox.topSupported(6), {limit:6});
  assert.ok(svg.indexOf("<svg") === 0);
  assert.ok(svg.indexOf('viewBox="0 0') >= 0);      // responsive
  assert.ok(svg.indexOf('wc-chart-bar') >= 0);      // actual bars
});

/* ---- summary ---- */
Promise.resolve().then(function(){
  setTimeout(function(){
    console.log("\n" + passed + " passed, " + failed + " failed\n");
    process.exit(failed === 0 ? 0 : 1);
  }, 50);
});
