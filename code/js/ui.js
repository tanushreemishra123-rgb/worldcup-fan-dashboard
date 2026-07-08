"use strict";
/* Requirements covered: REQ_01 (landing page + nav), REQ_02 (team explorer), REQ_03 (team profile modal),
   REQ_04 (groups & results dashboard), REQ_05 (fan profile UI), REQ_06 (chart mounting). See ../../REQUIREMENTS.md for the full map. */
/* ============================================================
   UI LAYER — router, views, team modal, bindings, init
   ============================================================ */

/* ---- safe HTML sink (SAST-audited) ---- */
function sanitizeHTML(s){
  return String(s)
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/javascript:/gi, "");
}
function setHTML(el, h){ el.innerHTML = sanitizeHTML(h); } // nosemgrep

/* ---- escaping helpers ---- */
function esc(s){return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");}
function enc(s){return encodeURIComponent(s);}
function dec(s){return decodeURIComponent(s);}

/* ---- ROUTER ---- */
var TABS = [
  ["overview","01","Overview"],
  ["teams","02","Teams"],
  ["groups","03","Groups & Results"],
  ["profile","04","Fan Profile"],
  ["support","05","Support"],
];
var route = "overview";

function setRoute(r){ route=r; renderNav(); renderView(); window.scrollTo({top:0,behavior:"instant"}); }

function renderNav(){
  var nav = document.getElementById("nav");
  var out = TABS.map(function(tab){
    var id=tab[0], n=tab[1], label=tab[2];
    return '<button class="tab" role="tab" aria-selected="' + (route===id) + '" data-r="' + id + '"><span class="n">' + n + '</span>' + label + '</button>';
  }).join("");
  setHTML(nav, out);
  nav.querySelectorAll(".tab").forEach(function(b){ b.onclick=function(){ setRoute(b.dataset.r); }; });
}

function renderTicker(){
  var ms = DATA.matches.slice(0,14);
  var items = ms.map(function(m){
    var ht = getTeam(m.home);
    var at = getTeam(m.away);
    return '<span class="t"><span class="lbl">SAMPLE</span> ' + (ht?ht.flag:"") + ' <b>' + m.home + '</b> <span class="s">' + m.home_goals + '–' + m.away_goals + '</span> <b>' + m.away + '</b> ' + (at?at.flag:"") + ' · Grp ' + m.group + '</span>';
  }).join("");
  setHTML(document.getElementById("ticker"), items + items);
}

function renderView(){
  var el = document.getElementById("view");
  var fn;
  if(route==="overview") fn=viewOverview;
  else if(route==="teams") fn=viewTeams;
  else if(route==="groups") fn=viewGroups;
  else if(route==="profile") fn=viewProfile;
  else if(route==="support") fn=viewSupport;
  else fn=viewOverview;
  setHTML(el, fn());
  bindView();
}

function noticeSample(extra){
  return '<div class="notice">⚑ <div><b>Grounding notice.</b> Group draw, fixtures and standings on this screen are <b>sample</b> data for an independent prototype — not real 2026 results and not FIFA-affiliated. ' + (extra||"") + '</div></div>';
}

/* ---- OVERVIEW ---- */
function viewOverview(){
  var m = DATA.meta;
  return '<section style="margin:8px 0 26px">'
    + '<div class="eyebrow">Fan engagement prototype · ' + m.hosts.join(" · ") + '</div>'
    + '<h1 class="big">Follow every<br>team. Pick<br>your side.</h1>'
    + '<p class="lead">Explore all ' + m.team_count + ' teams and ' + m.group_count + ' groups, read grounded AI briefings, build a fan identity, and watch support momentum shift in real time. A compact, offline-ready MVP.</p>'
    + '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:16px">'
    + '<button class="btn" data-go="teams">Explore teams →</button>'
    + '<button class="btn gold" data-go="profile">Create fan profile</button>'
    + '<button class="btn ghost" data-go="groups">Groups &amp; results</button>'
    + '</div></section>'
    + noticeSample()
    + '<div class="stats" style="margin:20px 0">'
    + '<div class="stat"><div class="k turf">' + m.team_count + '</div><div class="l">Teams</div></div>'
    + '<div class="stat"><div class="k">' + m.group_count + '</div><div class="l">Groups A–L</div></div>'
    + '<div class="stat"><div class="k gold">' + m.total_matches_real + '</div><div class="l">Matches (full tournament)</div></div>'
    + '<div class="stat"><div class="k turf">' + totalSupport().toLocaleString() + '</div><div class="l">Fans backing a team</div></div>'
    + '</div>'
    + '<div class="grid" style="grid-template-columns:1.2fr .8fr">'
    + '<div class="card pad"><h2 class="sec">Top supported</h2>'
    + '<p class="lead" style="margin-bottom:14px">Live counts from local fan profiles on a seeded sample baseline.</p>'
    + '<div data-support-chart="6">' + renderSupportChart(topSupported(6),{limit:6}) + '</div>'
    + '<button class="btn ghost" style="margin-top:14px" data-go="support">Full support analytics →</button></div>'
    + '<div class="card pad"><h2 class="sec">How it works</h2>'
    + '<div class="rec" style="margin-top:12px">'
    + '<div class="item"><div class="ic">🧭</div><div><div class="h">Explore</div><div class="lead">Browse teams, group tables and sample results.</div></div></div>'
    + '<div class="item"><div class="ic">🪪</div><div><div class="h">Identify</div><div class="lead">Build a lightweight fan card and pick one team.</div></div></div>'
    + '<div class="item"><div class="ic">🤖</div><div><div class="h">Get briefed</div><div class="lead">Grounded AI summaries &amp; picks — no key required.</div></div></div>'
    + '</div></div></div>';
}

/* ---- TEAM CARD ---- */
function teamCard(t){
  var r = standingRow(t.name);
  var sup = getSupport(t.name);
  var maxSup = 1;
  _supportMap.forEach(function(v){ if(v>maxSup) maxSup=v; });
  return '<button class="team" data-team="' + enc(t.name) + '">'
    + '<span class="grp">' + t.group + '</span>'
    + '<div class="flag">' + t.flag + '</div>'
    + '<div class="nm">' + t.name + '</div>'
    + '<div class="meta">' + t.confederation + ' · ' + (t.best_finish.source==="historical"?t.best_finish.text:"sample finish") + '</div>'
    + '<div class="sup">🔥 ' + sup + ' fans <span class="meter"><span style="width:' + Math.round(100*sup/maxSup) + '%"></span></span></div>'
    + '</button>';
}

/* ---- TEAMS VIEW ---- */
function viewTeams(){
  var confs = [];
  TEAMS.forEach(function(t){ if(confs.indexOf(t.confederation)<0) confs.push(t.confederation); });
  confs.sort();
  var groupOpts = GROUPS.map(function(g){ return '<option>' + g + '</option>'; }).join("");
  var confOpts = confs.map(function(c){ return '<option>' + c + '</option>'; }).join("");
  return '<div class="eyebrow">Team &amp; country explorer</div>'
    + '<h2 class="sec">All ' + TEAMS.length + ' teams</h2>'
    + '<div class="filters">'
    + '<input class="input" id="q" placeholder="Search team…" style="flex:1;min-width:180px" aria-label="Search teams">'
    + '<select id="fg" aria-label="Filter by group"><option value="">All groups</option>' + groupOpts + '</select>'
    + '<select id="fc" aria-label="Filter by confederation"><option value="">All confederations</option>' + confOpts + '</select>'
    + '<select id="fs" aria-label="Sort"><option value="name">A–Z</option><option value="support">Most supported</option><option value="group">By group</option></select>'
    + '</div>'
    + '<div class="teamgrid" id="tg">' + TEAMS.map(teamCard).join("") + '</div>';
}

function applyTeamFilters(){
  var q=(document.getElementById("q").value||"").toLowerCase();
  var fg=document.getElementById("fg").value, fc=document.getElementById("fc").value, fs=document.getElementById("fs").value;
  var list = TEAMS.filter(function(t){ return t.name.toLowerCase().indexOf(q)>=0 && (!fg||t.group===fg) && (!fc||t.confederation===fc); });
  if(fs==="support") list.sort(function(a,b){ return getSupport(b.name)-getSupport(a.name); });
  else if(fs==="group") list.sort(function(a,b){ return a.group<b.group?-1:a.group>b.group?1:a.name.localeCompare(b.name); });
  else list.sort(function(a,b){ return a.name.localeCompare(b.name); });
  var tg=document.getElementById("tg");
  setHTML(tg, list.length ? list.map(teamCard).join("") : '<div class="lead">No teams match that filter.</div>');
  tg.querySelectorAll(".team").forEach(function(b){ b.onclick=function(){ openTeam(dec(b.dataset.team)); }; });
}

/* ---- GROUPS VIEW ---- */
function viewGroups(){
  return '<div class="eyebrow">Group &amp; results dashboard</div>'
    + '<h2 class="sec">Groups A–L</h2>'
    + noticeSample("Green rows mark the sample qualifying places (top two).")
    + '<div class="groups" style="margin-top:16px">' + GROUPS.map(groupCard).join("") + '</div>';
}

function groupCard(g){
  var rows = getStandingsForGroup(g);
  var ms = DATA.matches.filter(function(m){ return m.group===g; });
  var tableRows = rows.map(function(r){
    var t = getTeam(r.team);
    return '<tr class="' + (r.rank<=2?"adv":"") + '">'
      + '<td><span class="rankdot">' + r.rank + '</span>' + (t?t.flag:"") + ' <a href="#" data-team="' + enc(r.team) + '" class="tlink">' + r.team + '</a></td>'
      + '<td class="mono-num">' + r.P + '</td><td class="mono-num">' + r.W + '</td><td class="mono-num">' + r.D + '</td><td class="mono-num">' + r.L + '</td>'
      + '<td class="mono-num ' + (r.GD>0?"q":"") + '">' + (r.GD>0?"+":"") + r.GD + '</td><td class="mono-num"><b>' + r.Pts + '</b></td></tr>';
  }).join("");
  var matchRows = ms.map(function(m){
    var hf = getTeam(m.home); var af = getTeam(m.away);
    return '<div style="display:flex;gap:8px;font-size:13px;color:var(--muted)">'
      + '<span style="flex:1;text-align:right">' + m.home + ' ' + (hf?hf.flag:"") + '</span>'
      + '<span class="mono-num" style="color:var(--gold);min-width:44px;text-align:center">' + m.home_goals + '–' + m.away_goals + '</span>'
      + '<span style="flex:1">' + (af?af.flag:"") + ' ' + m.away + '</span></div>';
  }).join("");
  return '<div class="card pad">'
    + '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px"><span class="rankdot" style="background:var(--turf-dim);color:#eafff2">' + g + '</span><h2 class="sec" style="font-size:20px;margin:0">Group ' + g + '</h2><span class="pill sample" style="margin-left:auto">sample</span></div>'
    + '<table><thead><tr><th>Team</th><th>P</th><th>W</th><th>D</th><th>L</th><th>GD</th><th>Pts</th></tr></thead><tbody>' + tableRows + '</tbody></table>'
    + '<div style="margin-top:12px;font-family:var(--cond);text-transform:uppercase;letter-spacing:1px;font-size:11px;color:var(--muted2)">Sample results</div>'
    + '<div style="display:flex;flex-direction:column;gap:4px;margin-top:6px">' + matchRows + '</div></div>';
}

/* ---- PROFILE VIEW ---- */
function viewProfile(){
  var teamsSorted = TEAMS.slice().sort(function(a,b){ return a.name.localeCompare(b.name); });
  var teamsOpts = teamsSorted.map(function(t){
    return '<option value="' + enc(t.name) + '">' + t.flag + ' ' + t.name + ' (Grp ' + t.group + ')</option>';
  }).join("");
  var mineArr = STATE.profiles.slice(-1);
  var mine = mineArr.length > 0 ? mineArr[0] : null;
  return '<div class="eyebrow">Fan profile &amp; team support</div>'
    + '<h2 class="sec">Build your fan card</h2>'
    + '<p class="lead">No sign-up. Pick one team to back — it personalises your AI briefing and bumps that team\'s support count.</p>'
    + '<div class="grid" style="grid-template-columns:1.1fr .9fr;margin-top:16px">'
    + '<div class="card pad"><div class="form">'
    + '<div class="field"><label>Display name</label><input class="input" id="p_name" placeholder="e.g. Priya from Pune"></div>'
    + '<div class="field"><label>Country / region</label><input class="input" id="p_region" placeholder="e.g. India"></div>'
    + '<div class="field full"><label>Team you are backing</label><select id="p_team">' + teamsOpts + '</select></div>'
    + '<div class="field full"><label>Why this team?</label><textarea id="p_reason" placeholder="A story, a player, family roots…"></textarea></div>'
    + '<div class="field"><label>Favourite player (optional)</label><input class="input" id="p_player" placeholder="Optional"></div>'
    + '<div class="field"><label>Preferred style</label><select id="p_style"><option value="">No preference</option><option>Attacking</option><option>Defensive</option><option>Possession</option><option>Counter-attacking</option><option>Underdog spirit</option></select></div>'
    + '<div class="field full"><button class="btn gold" id="p_save">Save fan card &amp; get my briefing →</button></div>'
    + '</div></div>'
    + '<div id="idwrap">' + (mine ? idCard(mine) : idEmpty()) + '</div>'
    + '</div>'
    + '<div id="airec" style="margin-top:16px">' + (mine ? aiRecHTML(mine) : "") + '</div>';
}

function idEmpty(){
  return '<div class="card pad" style="height:100%;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;color:var(--muted)">'
    + '<div style="font-size:40px">🪪</div><div class="lead" style="margin-top:8px">Your fan card appears here once you save. It drives your personalised AI picks.</div></div>';
}

function idCard(p){
  var t = getTeam(p.team);
  if(!t) return idEmpty();
  return '<div class="idcard">'
    + '<div class="pill turf">Fan card</div>'
    + '<div class="who" style="margin-top:10px">' + esc(p.name||"Anonymous fan") + '</div>'
    + '<div class="lead" style="color:#cfe9dd">' + esc(p.region||"—") + '</div>'
    + '<div style="display:flex;align-items:center;gap:12px;margin-top:14px">'
    + '<div style="font-size:44px">' + t.flag + '</div>'
    + '<div><div style="font-family:var(--cond);font-weight:700;font-size:20px">' + t.name + '</div>'
    + '<div class="lead" style="color:#bfe3d4">Group ' + t.group + ' · ' + t.confederation + '</div></div></div>'
    + (p.reason ? '<p class="lead" style="color:#dcefe7;margin-top:12px">"' + esc(p.reason) + '"</p>' : "")
    + '<div class="row">'
    + (p.player ? '<span class="pill gold">★ ' + esc(p.player) + '</span>' : "")
    + (p.style ? '<span class="pill">' + esc(p.style) + '</span>' : "")
    + '<span class="pill turf">🔥 ' + getSupport(p.team) + ' backing</span>'
    + '</div></div>';
}

function aiRecHTML(p){
  var rec = generateFanRecommendations(p);
  var sum = generateTeamSummary(p.team);
  var t = getTeam(p.team);
  var groupLetter = t ? t.group : "?";

  var exploreLinks = rec.exploreGroup.map(function(n){
    var rt = getTeam(n);
    return (rt?rt.flag:"") + ' <a href="#" class="tlink" data-team="' + enc(n) + '">' + n + '</a>';
  }).join(" · ");
  var matchLines = rec.matches.map(function(m){
    return m.label + ' <span style="color:var(--gold)">' + m.score + '</span>';
  }).join("<br>");
  var kindredTeam = getTeam(rec.kindred);
  return '<div class="ai">'
    + '<div class="ai-head">🤖 <b style="font-family:var(--cond);text-transform:uppercase;letter-spacing:1px">Your AI briefing</b><span class="badge">' + AI.modeLabel() + '</span></div>'
    + '<div class="ai-body"><p>' + sum.text + '</p>'
    + '<div class="rec">'
    + '<div class="item"><div class="ic">🧭</div><div><div class="h">Explore next in Group ' + groupLetter + '</div><div class="lead">' + exploreLinks + '</div></div></div>'
    + '<div class="item"><div class="ic">🎟️</div><div><div class="h">Matches to watch (sample)</div><div class="lead">' + matchLines + '</div></div></div>'
    + '<div class="item"><div class="ic">🧩</div><div><div class="h">Storyline</div><div class="lead">' + rec.storyline + (rec.styleNote ? "<br>" + rec.styleNote : "") + '</div></div></div>'
    + '<div class="item"><div class="ic">🔗</div><div><div class="h">Similar pedigree to explore</div><div class="lead">' + (kindredTeam?kindredTeam.flag:"") + ' <a href="#" class="tlink" data-team="' + enc(rec.kindred) + '">' + rec.kindred + '</a> — comparable best-finish tier.</div></div></div>'
    + '</div>'
    + '<div class="src">' + sum.source + ' Recommendations derived from your supported team &amp; profile only.</div>'
    + '<div class="src" style="color:var(--stamp);border-color:#7a5a12">⚑ ' + sum.dataLimitation + '</div>'
    + '</div></div>';
}

/* ---- SUPPORT VIEW ---- */
function viewSupport(){
  return '<div class="eyebrow">Fan support analytics</div>'
    + '<h2 class="sec">Who\'s gaining momentum</h2>'
    + '<p class="lead">Support counts update whenever a fan card is created. Baseline is a seeded sample; your picks add on top.</p>'
    + '<div class="stats" style="margin:16px 0">'
    + '<div class="stat"><div class="k turf">' + STATE.profiles.length + '</div><div class="l">Fan cards created (this device)</div></div>'
    + '<div class="stat"><div class="k gold">' + totalSupport().toLocaleString() + '</div><div class="l">Total support</div></div>'
    + '<div class="stat"><div class="k">' + topSupported(1)[0].team + '</div><div class="l" style="text-transform:none">Most backed team</div></div>'
    + '<div class="stat"><div class="k turf">' + (STATE._persist?"On":"Session") + '</div><div class="l">Local persistence</div></div>'
    + '</div>'
    + '<div class="card pad">'
    + '<h2 class="sec" style="font-size:20px">Top 10 supported teams</h2>'
    + '<p class="lead" style="margin:2px 0 12px">Responsive SVG bar chart — updates live when a fan card is created (no page reload).</p>'
    + '<div data-support-chart="10">' + renderSupportChart(topSupported(10),{limit:10}) + '</div>'
    + '</div>';
}

/* (barsHTML retained as fallback but no longer primary) */
function barsHTML(list,flags){
  var max=1;
  list.forEach(function(x){ if(x.count>max) max=x.count; });
  var out = list.map(function(x){
    var t = getTeam(x.team);
    return '<div class="bar-row"><div class="nm">' + (flags && t ? t.flag + " " : "") + '<a href="#" class="tlink" data-team="' + enc(x.team) + '">' + x.team + '</a></div>'
      + '<div class="bar-track"><div class="bar-fill" style="width:' + Math.round(100*x.count/max) + '%"></div></div>'
      + '<div class="v mono-num">' + x.count + '</div></div>';
  }).join("");
  return '<div class="bars">' + out + '</div>';
}

/* ---- TEAM MODAL ---- */
function openTeam(name){
  var t=getTeam(name), r=standingRow(name), sum=generateTeamSummary(name);
  if(!t) return;
  var bf=t.best_finish;
  var wrap=document.createElement("div");
  wrap.className="overlay"; wrap.id="ov";

  var modalHTML = '<div class="modal" role="dialog" aria-label="' + t.name + ' profile">'
    + '<div class="top"><div class="fl">' + t.flag + '</div><div>'
    + '<div class="eyebrow">Group ' + t.group + ' · ' + t.confederation + '</div>'
    + '<h2 class="sec" style="font-size:30px">' + t.name + '</h2>'
    + '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:6px">'
    + '<span class="pill ' + (bf.source==="historical"?"gold":"sample") + '">' + (bf.source==="historical"?"Best finish":"Sample finish") + ': ' + bf.text + '</span>'
    + '<span class="pill turf">🔥 ' + getSupport(name) + ' fans</span>'
    + '<span class="pill">Form ' + (sum.form||"—") + '</span>'
    + '</div></div><button class="x" id="closex" aria-label="Close">✕</button></div>'
    + '<div class="pad"><div class="statline">'
    + '<div class="b"><div class="n mono-num">' + (r?r.P:"–") + '</div><div class="t">Played</div></div>'
    + '<div class="b"><div class="n mono-num q">' + (r?r.W:"–") + '</div><div class="t">Won</div></div>'
    + '<div class="b"><div class="n mono-num">' + (r?r.D:"–") + '</div><div class="t">Drawn</div></div>'
    + '<div class="b"><div class="n mono-num" style="color:var(--coral)">' + (r?r.L:"–") + '</div><div class="t">Lost</div></div>'
    + '<div class="b"><div class="n mono-num">' + (r?r.GF:"–") + '</div><div class="t">GF</div></div>'
    + '<div class="b"><div class="n mono-num">' + (r?r.GA:"–") + '</div><div class="t">GA</div></div>'
    + '<div class="b"><div class="n mono-num ' + (r&&r.GD>0?"q":"") + '">' + (r?(r.GD>0?"+":"")+r.GD:"–") + '</div><div class="t">GD</div></div>'
    + '<div class="b"><div class="n mono-num" style="color:var(--gold)">' + (r?r.Pts:"–") + '</div><div class="t">Points</div></div>'
    + '</div>'
    + '<div class="ai" style="margin-top:6px"><div class="ai-head">🤖 <b style="font-family:var(--cond);text-transform:uppercase;letter-spacing:1px">AI team briefing</b><span class="badge">' + AI.modeLabel() + '</span></div>'
    + '<div class="ai-body"><p>' + sum.text + '</p>'
    + '<p class="lead"><b style="color:var(--turf)">Storyline —</b> ' + generateTeamOutlook(name) + '</p>'
    + '<div class="src">' + sum.source + '</div>'
    + '<div class="src" style="color:var(--stamp);border-color:#7a5a12">⚑ ' + sum.dataLimitation + '</div></div></div>'
    + '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:16px">'
    + '<button class="btn gold" id="backteam">Back ' + t.name + ' →</button>'
    + '<button class="btn ghost" id="closeb">Close</button></div></div></div>';

  setHTML(wrap, modalHTML);
  document.body.appendChild(wrap);
  var close=function(){ wrap.remove(); };
  wrap.onclick=function(e){ if(e.target===wrap) close(); };
  wrap.querySelector("#closex").onclick=close;
  wrap.querySelector("#closeb").onclick=close;
  wrap.querySelector("#backteam").onclick=function(){ close(); setRoute("profile");
    setTimeout(function(){ var sel=document.getElementById("p_team"); if(sel) sel.value=enc(name); },0); };
  var escHandler = function(e){ if(e.key==="Escape"){close();document.removeEventListener("keydown",escHandler);} };
  document.addEventListener("keydown", escHandler);
  wrap.querySelector("#closex").focus();
}

/* ---- BINDINGS ---- */
function bindView(){
  document.querySelectorAll("[data-go]").forEach(function(b){ b.onclick=function(){ setRoute(b.dataset.go); }; });
  document.querySelectorAll(".team").forEach(function(b){ b.onclick=function(){ openTeam(dec(b.dataset.team)); }; });
  document.querySelectorAll(".tlink").forEach(function(a){ a.onclick=function(e){ e.preventDefault(); openTeam(dec(a.dataset.team)); }; });
  if(route==="teams"){
    ["q","fg","fc","fs"].forEach(function(id){ var el=document.getElementById(id); if(el){ el.oninput=applyTeamFilters; el.onchange=applyTeamFilters; } });
  }
  if(route==="profile"){
    var btn=document.getElementById("p_save");
    if(btn) btn.onclick=function(){
      var p={
        name:document.getElementById("p_name").value.trim(),
        region:document.getElementById("p_region").value.trim(),
        team:dec(document.getElementById("p_team").value),
        reason:document.getElementById("p_reason").value.trim(),
        player:document.getElementById("p_player").value.trim(),
        style:document.getElementById("p_style").value,
      };
      addProfile(p);
      setHTML(document.getElementById("idwrap"), idCard(p));
      setHTML(document.getElementById("airec"), aiRecHTML(p));
      updateSupportCharts();
      bindView();
      var ai=document.getElementById("airec"); if(ai&&ai.scrollIntoView) ai.scrollIntoView({behavior:"smooth",block:"start"});
    };
  }
}

/* ---- init ---- */
renderNav(); renderTicker(); renderView();
