"use strict";
/* Requirements covered: REQ_06 (fan support visualization, live-updating SVG bar chart). See ../../REQUIREMENTS.md for the full map. */
/* ============================================================
   VISUALIZATION LAYER — Fan Support charts (native SVG, no library)
   ============================================================
   renderSupportChart()  -> responsive SVG bar chart of support counts.
   updateSupportCharts() -> re-renders charts live when a fan profile changes. */

function escSvg(s){
  return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

/* renderSupportChart: returns a RESPONSIVE SVG bar chart string.
   data = [{team, count}], opts = {limit} */
/**
 * REQ_06 — render a RESPONSIVE SVG bar chart (viewBox scales to any width) of fan
 * support. Native SVG, no external chart library, fully offline.
 * @param {{team:string,count:number}[]} data @param {{limit?:number}} [opts]
 * @returns {string} SVG markup. */
function renderSupportChart(data, opts){
  opts = opts || {};
  var rows = data.slice(0, opts.limit || 10);
  var max = 1;
  rows.forEach(function(d){ if(d.count > max) max = d.count; });
  var rowH=34, padL=150, padR=54, padT=8, w=720;
  var h = padT*2 + rows.length*rowH;
  var bars = rows.map(function(d, idx){
    var y = padT + idx*rowH;
    var bw = Math.round((w - padL - padR) * d.count / max);
    var t = getTeam(d.team);
    var flag = t ? escSvg(t.flag) + " " : "";
    return '<text x="' + (padL-10) + '" y="' + (y+rowH/2) + '" text-anchor="end" dominant-baseline="middle" class="wc-chart-label">' + flag + escSvg(d.team) + '</text>'
      + '<rect x="' + padL + '" y="' + (y+7) + '" width="' + (w-padL-padR) + '" height="' + (rowH-14) + '" rx="6" class="wc-chart-track"/>'
      + '<rect x="' + padL + '" y="' + (y+7) + '" width="' + bw + '" height="' + (rowH-14) + '" rx="6" class="wc-chart-bar"><title>' + escSvg(d.team) + ': ' + d.count + ' fans</title></rect>'
      + '<text x="' + (padL+bw+8) + '" y="' + (y+rowH/2) + '" dominant-baseline="middle" class="wc-chart-value">' + d.count + '</text>';
  }).join("");
  return '<svg class="wc-support-chart" viewBox="0 0 ' + w + ' ' + h + '" width="100%" preserveAspectRatio="xMinYMin meet" role="img" aria-label="Fan support by team">' + bars + '</svg>';
}

/* updateSupportCharts: re-render every mounted chart live, no page reload */
/**
 * REQ_06 constraint — live-refresh every mounted chart when a fan profile changes,
 * WITHOUT a page reload (event-driven from the profile-save handler in ui.js).
 * @returns {void} */
function updateSupportCharts(){
  var els = document.querySelectorAll("[data-support-chart]");
  els.forEach(function(el){
    var limit = parseInt(el.getAttribute("data-support-chart"), 10) || 10;
    setHTML(el, renderSupportChart(topSupported(limit), {limit:limit}));
  });
}
