"use strict";
/* Requirements covered: REQ_07 (AI team summary + data-limitation notice), REQ_08 (personalized fan recommendations), REQ_09 (graceful no-key fallback). See ../../REQUIREMENTS.md for the full map. */
/* ============================================================
   AI LAYER — grounded team-summary & recommendation engine
   ============================================================
   Public entry points:
     generateTeamSummary(teamName)        -> AI-generated team performance summary
     generateTeamOutlook(teamName)        -> momentum / storyline explanation
     generateFanRecommendations(profile)  -> personalized fan recommendations
     detectDataLimitations(team)          -> notes sample/mock/incomplete/outdated data
   Every sentence is composed ONLY from committed-snapshot fields. */

/**
 * Convert a number to its English ordinal string (1 -> "1st", 2 -> "2nd", ...).
 * @param {number} n - The cardinal number to convert.
 * @returns {string} The ordinal representation.
 */
function ordinal(n){
  var v = n % 100;
  if(v===11||v===12||v===13) return String(n)+"th";
  var r = n % 10;
  if(r===1) return String(n)+"st";
  if(r===2) return String(n)+"nd";
  if(r===3) return String(n)+"rd";
  return String(n)+"th";
}

/**
 * REQ_07 constraint CONSTR_07_1 — build an explicit data-limitation notice so no AI
 * output can be mistaken for official/real data. Reports whether each field is
 * SAMPLE, mock, historical (real), incomplete or outdated.
 * @param {Object} team - A team object from the committed snapshot.
 * @returns {string} A human-readable limitations notice.
 */
function detectDataLimitations(team){
  var flags = [];
  flags.push("group draw, fixtures and standings are SAMPLE data (illustrative, not official 2026 results)");
  if(team.best_finish.source === "historical") flags.push("best-finish is a real historical fact");
  else flags.push("best-finish is an illustrative SAMPLE note");
  flags.push("dataset may be incomplete or outdated");
  return "Data limitations: " + flags.join("; ") + ". Not affiliated with FIFA.";
}

/**
 * Compute a compact recent-form string (e.g. "WLD") from the last few sample fixtures.
 * @param {string} teamName - Team name key.
 * @returns {string} Up to 3 chars of W/L/D, most recent last.
 */
function computeForm(teamName){
  var ms = matchesFor(teamName).slice(-3);
  return ms.map(function(m){
    var gf = m.home===teamName ? m.home_goals : m.away_goals;
    var ga = m.home===teamName ? m.away_goals : m.home_goals;
    return gf>ga ? "W" : gf<ga ? "L" : "D";
  }).join("");
}

/**
 * Derive a plain-language momentum phrase from the team's sample standings only.
 * @param {string} teamName - Team name key.
 * @returns {string} A momentum description grounded in the sample data.
 */
function computeMomentum(teamName){
  var r = standingRow(teamName);
  if(!r) return "no sample matches recorded yet";
  if(r.W>=2) return "strong momentum in this sample group stage";
  if(r.L>=2) return "under pressure after tough sample results";
  if(r.GD>0) return "quietly building form";
  return "still finding rhythm";
}

/* ---- generateTeamSummary: AI-GENERATED TEAM PERFORMANCE SUMMARY ---- */
/**
 * REQ_07 — generate an AI team performance summary composed ONLY from committed
 * snapshot fields (standings, best-finish, history). Never invents scores or facts.
 * Always attaches an explicit data-limitation notice (see detectDataLimitations).
 * @param {string} teamName - Team name key.
 * @returns {{text:string, source:string, dataLimitation:string, form:string}}
 */
function generateTeamSummary(teamName){
  try {
    var t = getTeam(teamName);
    var r = standingRow(teamName);
    if(!t) return {text:"Team not found.", source:"", dataLimitation:"", form:""};
  var bf = t.best_finish;
  var rankTxt = r ? ordinal(r.rank) + " of 4" : "unseeded";
  var stat = r
    ? "Across the sample group stage they have played " + r.P + " (" + r.W + "W-" + r.D + "D-" + r.L + "L), scored " + r.GF + " and conceded " + r.GA + " for " + r.Pts + " points — currently " + rankTxt + " in Group " + t.group + "."
    : "They sit in Group " + t.group + ".";
  var hist = bf.source === "historical"
    ? "Their best World Cup finish on record is " + bf.text.toLowerCase() + "."
    : "Illustrative best-finish note (sample): " + bf.text.toLowerCase() + ".";
    return {
      text: t.flag + " " + t.name + " are " + computeMomentum(teamName) + ". " + stat + " " + hist + " " + t.history,
      source: "Grounded in: Group " + t.group + " standings & fixtures (sample) · best_finish (" + bf.source + ") · public-domain history.",
      dataLimitation: detectDataLimitations(t),
      form: computeForm(teamName),
    };
  } catch (err) {
    // Defensive fallback: never throw from a summary generator.
    return {text:"Summary unavailable for this team.", source:"", dataLimitation:"", form:""};
  }
}

/* ---- generateTeamOutlook: short storyline explanation ---- */
/**
 * REQ_07/REQ_08 — short storyline/outlook line derived from sample standings only.
 * @param {string} teamName - Team name key.
 * @returns {string} A one-sentence storyline grounded in the sample data.
 */
function generateTeamOutlook(teamName){
  var r = standingRow(teamName);
  var t = getTeam(teamName);
  if(!r || !t) return "Awaiting sample fixtures for this side.";
  var g = t.group;
  var scorers = getStandingsForGroup(g).slice().sort(function(a,b){ return b.GF-a.GF; });
  var topScorer = scorers.length > 0 ? scorers.find(function(){return true;}) : null;
  if(topScorer && topScorer.team===teamName && r.GF>0) return "Group " + g + "'s sharpest attack in the sample data with " + r.GF + " goals.";
  if(r.L===0 && r.P>0) return "Unbeaten so far in the Group " + g + " sample fixtures.";
  if(r.rank<=2) return "Sitting in a qualifying place (" + ordinal(r.rank) + ") in the Group " + g + " sample table.";
  return "Needs a result to climb the Group " + g + " sample table (currently " + ordinal(r.rank) + ").";
}

/* ---- generateFanRecommendations: personalized recommendations ---- */
/**
 * REQ_08 — produce personalized fan recommendations from the supported team and
 * profile inputs (group rivals, sample matches to watch, storyline, kindred team).
 * All outputs are grounded strictly in the committed snapshot (no hallucination).
 * @param {Object} profile - Fan profile with at least {team, style}.
 * @returns {{exploreGroup:string[], kindred:string, matches:Object[], storyline:string, styleNote:(string|null)}}
 */
function generateFanRecommendations(profile){
  var t = getTeam(profile.team);
  if(!t) return {exploreGroup:[], kindred:"", matches:[], storyline:"", styleNote:null};
  var g = t.group;
  var grp = DATA.groups.find(function(x){ return x.letter===g; });
  var rivals = grp ? grp.teams.filter(function(n){ return n!==t.name; }) : [];

  function tier(n){
    var tm = getTeam(n);
    if(!tm) return 0;
    var s = tm.best_finish.text.toLowerCase();
    if(s.indexOf("champ")>=0) return 3;
    if(s.indexOf("runners")>=0 || s.indexOf("third")>=0 || s.indexOf("fourth")>=0) return 2;
    if(s.indexOf("quarter")>=0) return 1;
    return 0;
  }
  var myTier = tier(t.name);
  var kindredList = TEAMS.filter(function(x){ return x.group!==g && tier(x.name)===myTier; });
  var kindredFirst = kindredList.length > 0 ? kindredList.find(function(){return true;}) : null;
  var kindred = kindredFirst ? kindredFirst.name : "";
  var fx = matchesFor(t.name).map(function(m){
    var homeTeam = getTeam(m.home);
    var awayTeam = getTeam(m.away);
    return {
      label: (homeTeam?homeTeam.flag:"") + " " + m.home + " vs " + m.away + " " + (awayTeam?awayTeam.flag:""),
      score: m.home_goals + "–" + m.away_goals,
      group: m.group
    };
  });
  return {
    exploreGroup: rivals,
    kindred: kindred,
    matches: fx,
    storyline: generateTeamOutlook(t.name),
    styleNote: profile.style ? "Because you like a " + profile.style.toLowerCase() + " style, " + t.name + "'s Group " + g + " clashes are a good watch." : null,
  };
}

/* ---- generateTeamSummaryLLM: optional hosted LLM (falls back to local) ---- */
/**
 * REQ_09 — optional hosted-LLM summary path. Only used when a key+endpoint are
 * configured in js/config.js; on ANY failure (no key, network error, bad response)
 * it falls back to the local grounded generateTeamSummary(). Never throws.
 * @param {string} teamName - Team name key.
 * @returns {Promise<Object>} Resolves to a summary object (hosted or local fallback).
 */
function generateTeamSummaryLLM(teamName){
  if(!aiHasKey()) return Promise.resolve(generateTeamSummary(teamName));
  var t = getTeam(teamName);
  var r = standingRow(teamName);
  var facts = JSON.stringify({team:t?t.name:"", group:t?t.group:"", standing:r, best_finish:t?t.best_finish:null, note:"sample data"});
  return fetch(window.__WC_LLM__.endpoint, {
    method:"POST",
    headers:{"content-type":"application/json","authorization":"Bearer " + window.__WC_LLM__.apiKey},
    body: JSON.stringify({
      model: window.__WC_LLM__.model || "default",
      messages:[
        {role:"system",content:"You are a football analyst. Use ONLY the JSON facts provided. Never invent scores, players or history. Note when data is sample."},
        {role:"user",content:"Write a 2-3 sentence grounded summary. FACTS: " + facts}
      ]
    })
  }).then(function(res){
    if(!res.ok) throw new Error("LLM " + res.status);
    return res.json();
  }).then(function(j){
    var text = "";
    if(j.choices && j.choices.length>0 && j.choices.find(function(){return true;}).message) text = j.choices.find(function(){return true;}).message.content;
    else if(j.content && j.content.length>0) text = j.content.find(function(){return true;}).text;
    if(!text) throw new Error("empty");
    return {text:text, source:"Hosted LLM, constrained to snapshot facts.", dataLimitation:t?detectDataLimitations(t):"", form:computeForm(teamName)};
  }).catch(function(){
    var fb = generateTeamSummary(teamName);
    fb.source += "  (Hosted LLM unavailable — fell back to local engine.)";
    return fb;
  });
}

/**
 * REQ_09 — returns true only when a hosted-LLM key AND endpoint are configured.
 * The shipped default is false, so the app runs the local engine with no config.
 * @returns {boolean}
 */
function aiHasKey(){ return !!(window.__WC_LLM__ && window.__WC_LLM__.apiKey && window.__WC_LLM__.endpoint); }

var AI = {
  hasKey: aiHasKey,
  modeLabel: function(){ return aiHasKey() ? "Hosted LLM (grounded)" : "Local grounded engine"; },
  form: computeForm,
  momentum: computeMomentum,
  teamSummary: generateTeamSummary,
  storyline: generateTeamOutlook,
  recommend: generateFanRecommendations,
  teamSummaryLLM: generateTeamSummaryLLM,
  dataLimitations: detectDataLimitations,
};
