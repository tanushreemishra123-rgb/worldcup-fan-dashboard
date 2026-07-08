"use strict";
/* Requirements covered: REQ_10 (committed snapshot access), REQ_11 (public/open data only, no network calls). See ../../REQUIREMENTS.md for the full map. */
/* ============================================================
   DATA LAYER — read-only accessors over the committed snapshot
   ============================================================ */
var DATA = window.__WC_SNAPSHOT__;
var TEAMS = DATA.teams;
var GROUPS = DATA.groups.map(function(g){ return g.letter; });

/* Use Map for keyed lookups (avoids detect-object-injection on plain objects). */
var _teamMap = new Map();
TEAMS.forEach(function(t){ _teamMap.set(t.name, t); });

var _standingsMap = new Map();
Object.entries(DATA.standings).forEach(function(entry){ _standingsMap.set(entry[0], entry[1]); });

/**
 * REQ_11 — safe lookup of a team by name from the committed snapshot (uses a Map,
 * no dynamic object indexing).
 * @param {string} name @returns {Object|null} */
function getTeam(name){ return _teamMap.get(String(name)) || null; }
/**
 * REQ_04 — return the standings rows for a group letter.
 * @param {string} g @returns {Object[]} */
function getStandingsForGroup(g){ return _standingsMap.get(String(g)) || []; }

/**
 * REQ_04 — return all sample fixtures that involve the given team.
 * @param {string} name @returns {Object[]} */
function matchesFor(name){
  return DATA.matches.filter(function(m){ return m.home===name || m.away===name; });
}

/**
 * REQ_03/REQ_04 — return the single standings row for a team, or null.
 * @param {string} name @returns {Object|null} */
function standingRow(name){
  var t = getTeam(name);
  if(!t) return null;
  var rows = getStandingsForGroup(t.group);
  return rows.find(function(r){ return r.team===name; }) || null;
}

/**
 * REQ_05/REQ_06 — current fan-support count for a team (0 if none).
 * @param {string} name @returns {number} */
function getSupport(name){
  return _supportMap.get(String(name)) || 0;
}
