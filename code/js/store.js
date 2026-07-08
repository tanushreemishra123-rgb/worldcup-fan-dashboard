"use strict";
/* Requirements covered: REQ_05 (lightweight, no-auth fan profile + support tally). See ../../REQUIREMENTS.md for the full map. */
/* ============================================================
   STORE LAYER — fan profiles & support counts (localStorage + fallback)
   ============================================================ */
var LS_KEY = "wc26_fan_state_v1";
var _supportMap = new Map();

function seedBaseline(){
  var seeds = new Map();
  seeds.set("Brazil",52); seeds.set("Argentina",61); seeds.set("France",44);
  seeds.set("England",39); seeds.set("Mexico",47); seeds.set("United States",41);
  seeds.set("Morocco",33); seeds.set("Japan",28); seeds.set("Germany",36);
  seeds.set("Spain",31); seeds.set("Portugal",35); seeds.set("Netherlands",24);
  seeds.set("Croatia",19); seeds.set("Senegal",17); seeds.set("Canada",22);
  seeds.set("South Korea",21); seeds.set("Nigeria",20); seeds.set("Italy",26);
  seeds.set("Colombia",18); seeds.set("Uruguay",16);
  var result = new Map();
  TEAMS.forEach(function(t){
    var val = seeds.has(t.name) ? seeds.get(t.name) : (6 + (t.name.length % 7));
    result.set(t.name, val);
  });
  return result;
}

var STATE = loadState();
function loadState(){
  _supportMap = seedBaseline();
  var fresh = { profiles:[], _persist:true };
  try{
    var raw = localStorage.getItem(LS_KEY);
    if(raw){
      var p = JSON.parse(raw);
      fresh.profiles = p.profiles || [];
      fresh._persist = true;
      if(p.support){
        Object.entries(p.support).forEach(function(entry){ _supportMap.set(entry[0], entry[1]); });
      }
      return fresh;
    }
  }catch(e){ fresh._persist=false; }
  return fresh;
}

function saveState(){
  if(!STATE._persist) return;
  var supEntries = [];
  _supportMap.forEach(function(v,k){ supEntries.push([k,v]); });
  var supObj = Object.fromEntries(supEntries);
  try{ localStorage.setItem(LS_KEY, JSON.stringify({profiles:STATE.profiles, support:supObj})); }
  catch(e){ STATE._persist=false; }
}

/**
 * REQ_05 — persist a new fan profile (no auth) and increment its team's support.
 * Profile schema: { name, region, team, reason, player, style, ts }.
 * @param {{name:string,region:string,team:string,reason:string,player:string,style:string}} p */
function addProfile(p){
  /* Fan profile schema (REQ_05):
       name   {string}  display name (optional)
       team   {string}  supported team name key (required)
       region {string}  country/region (optional)
       reason {string}  why they back the team (optional, free text)
       player {string}  favourite player (optional)
       style  {string}  preferred play style (optional, from a fixed list)
       ts     {number}  creation timestamp (auto)
     No authentication is used; profiles persist in localStorage with an
     in-memory fallback when storage is unavailable. */
  STATE.profiles.push({name:p.name, team:p.team, region:p.region, reason:p.reason, player:p.player, style:p.style, ts:Date.now()});
  var teamName = String(p.team);
  _supportMap.set(teamName, (_supportMap.get(teamName)||0) + 1);
  saveState();
}

/**
 * REQ_06 — total support across all teams (seeded baseline + live picks).
 * @returns {number} */
function totalSupport(){
  var sum = 0;
  _supportMap.forEach(function(v){ sum += v; });
  return sum;
}

/**
 * REQ_06 — return the top-N teams by support count, descending.
 * @param {number} [n=10] @returns {{team:string,count:number}[]} */
function topSupported(n){
  n = n || 10;
  var entries = [];
  _supportMap.forEach(function(count, team){ entries.push({team:team, count:count}); });
  entries.sort(function(a,b){ return b.count - a.count; });
  return entries.slice(0, n);
}
