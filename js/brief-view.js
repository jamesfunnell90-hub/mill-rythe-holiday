// Shared by the morning brief page (browser) and the Mac script (node, for the PDF). Pure string building.
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const ICON = { swim: '🏊', nap: '😴', meal: '🍽️', show: '🎭', travel: '🚗', activity: '🎨', outing: '🌳', fixed: '🏨', added: '⭐' };
export const BRIEF_CSS = `
*{box-sizing:border-box}
.mb{font:15px/1.45 -apple-system,"Helvetica Neue",Arial,sans-serif;color:#12233F;background:#F3EBDB;min-height:100vh}
.mb .page{max-width:760px;margin:0 auto;padding:0 0 24px}
.mb .hero{background:linear-gradient(150deg,#14305F,#1F4A8F);color:#fff;padding:26px 30px 34px;position:relative}
.hero:after{content:"";position:absolute;left:0;right:0;bottom:-1px;height:22px;background:#F3EBDB;border-radius:50% 50% 0 0/100% 100% 0 0}
.eye{font:600 11px/1 "Arial Narrow",Arial,sans-serif;letter-spacing:.16em;text-transform:uppercase;opacity:.85}
.mb h1{font:700 34px/1.05 Georgia,"Times New Roman",serif;margin:6px 0 2px}
.sub{opacity:.9}
.wrap{padding:0 30px}
.card{background:#FFFCF5;border:1px solid #DCCFB5;border-radius:12px;padding:12px 16px;margin:12px 0}
.mb h2{font:600 12px/1 "Arial Narrow",Arial,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#5B6980;margin:0 0 8px}
.wx{display:flex;align-items:center;gap:14px}
.ico{font-size:40px}.temp{font:700 36px/1 Georgia,serif}.temp small{font-size:16px;color:#5B6980}
.meta{font-size:13px}
.flag{margin-top:8px;background:#FFF1D6;color:#9A5B00;border-radius:8px;padding:6px 10px;font-weight:600}
.mb table{width:100%;border-collapse:collapse}
.mb td{padding:6px 0;border-bottom:1px solid #EBDFC8;vertical-align:top}
tr:last-child td{border:0}
.mb td.t{width:58px;font:700 15px/1.3 "Arial Narrow",Arial,sans-serif;color:#14305F}
.mb td.i{width:28px;font-size:15px}
.mb tr.fx td:nth-child(3){font-weight:700}
.n{font-size:11.5px;color:#5B6980;font-weight:400}
.two{display:flex;gap:12px;flex-wrap:wrap}.two>div{flex:1 1 260px}.mbtn{display:inline-block;margin:6px 0 0;padding:10px 16px;border:0;border-radius:99px;background:#14305F;color:#fff;font:600 14px -apple-system,Arial,sans-serif}@media print{.noprint{display:none}.mb{background:#fff}.card{break-inside:avoid}}
ul{margin:0;padding-left:0;list-style:none}
li{padding:3px 0}
.box{display:inline-block;width:11px;height:11px;border:1.5px solid #1F4A8F;border-radius:3px;margin-right:8px;vertical-align:-1px}
.chips span{display:inline-block;background:#E3ECF7;color:#14305F;border-radius:99px;padding:3px 10px;margin:2px 4px 2px 0;font-size:12px}
.fixedlist li b{color:#14305F;font-family:"Arial Narrow",Arial,sans-serif;font-size:14px;margin-right:6px}
.mb .foot{padding:4px 30px 0;font-size:11.5px;color:#5B6980}
a{color:#1F4A8F}
`;

// p = { long, theme, rainSwap, wx, wxIcon, rows:[{t,slot,title,note,kind,fixed}], toBook:[], bag:[], site, forecastNote }
export function briefBody(p) {
  const { wx } = p;
  const fixed = p.rows.filter((r) => r.fixed && r.t);
  const wxBlock = wx
    ? `<div class="wx"><div class="ico">${p.wxIcon}</div><div class="temp">${wx.hi}°<small> / ${wx.lo}°C</small></div>
       <div class="meta"><b>Rain up to ${wx.rain}%</b>${wx.wet.length ? ` (wet ${wx.wet[0]}:00 to ${wx.wet[wx.wet.length - 1]}:00)` : ''}<br>Gusts up to <b>${wx.gust} mph</b><br>Sunset <b>${wx.sunset}</b></div></div>
       ${wx.rain >= 60 ? `<div class="flag">Rain likely: use the rain swap. ${esc(p.rainSwap)}</div>` : ''}`
    : '<div class="wx"><div class="meta">Weather not available.</div></div>';
  const plan = p.rows.map((r) => `<tr class="${r.fixed ? 'fx' : ''}"><td class="t">${esc(r.t || r.slot.toLowerCase())}</td><td class="i">${ICON[r.kind] || '•'}</td><td>${esc(r.title)}${r.note ? `<div class="n">${esc(r.note)}</div>` : ''}</td></tr>`).join('');
  return `<div class="mb"><div class="page">
<div class="hero"><div class="eye">Morning brief · Mill Rythe Holiday</div><h1>${esc(p.long)}</h1><div class="sub">${esc(p.theme)}</div></div>
<div class="wrap">
<div class="card"><h2>Weather</h2>${wxBlock}${p.forecastNote ? `<div class="n" style="margin-top:6px">${esc(p.forecastNote)}</div>` : ''}</div>
${(p.warnings || []).length ? `<div class="card"><h2>Heads up</h2><ul>${p.warnings.map((w) => `<li>${esc(w)}</li>`).join('')}</ul></div>` : ''}
${fixed.length ? `<div class="card"><h2>Fixed times today</h2><ul class="fixedlist">${fixed.map((r) => `<li><b>${esc(r.t)}</b>${esc(r.title)}</li>`).join('')}</ul></div>` : ''}
<div class="card"><h2>Today's plan</h2><table>${plan}</table></div>
<div class="two">
<div class="card"><h2>Still to book</h2>${p.toBook.length ? `<ul>${p.toBook.map((b) => `<li><span class="box"></span>${esc(b)}</li>`).join('')}</ul>` : '<div class="n">Nothing outstanding.</div>'}</div>
<div class="card"><h2>Day bag</h2><div class="chips">${p.bag.map((b) => `<span>${esc(b)}</span>`).join('')}</div></div>
</div>
<p class="noprint"><button class="mbtn" onclick="window.print()">Print or save as PDF</button></p>
</div>
<div class="foot">Holiday app: <a href="${esc(p.site)}">${esc(p.site)}</a> · Planner: <a href="${esc(p.site)}planner/">${esc(p.site)}planner/</a><br>Built from the shared plan when the brief was sent.</div>
</div></div>`;
}
