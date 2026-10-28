/* Dashboard tabs: Locations (live visitors, countries, cities, journeys), Insights (funnel, engagement, best times, campaigns,
   frustration, errors, speed), Recordings (Microsoft Clarity) and Controls (site switches + health check).
   Reads the same `events` rows as the Analytics tab. Everything visitor-supplied is rendered with textContent. */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var ctx = null, sb = null, DEMO = false, L = [], range = 30, settings = {}, setLoaded = false, setErr = '', undoS = [], redoS = [], current = 'A', liveTimer = null;
  var TABS = { A: 'tabAnalytics', L: 'tabLocations', I: 'tabInsights', R: 'tabRecordings', C: 'tabControls', P: 'tabProjects' };
  var SAFE_LINK = /^(https?:\/\/|\/|[a-z0-9\-]+\.html)/i, CLARITY_ID = /^[a-z0-9]{6,16}$/i;

  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function clear(n) { n.textContent = ''; return n; }
  function pct(a, b) { return b ? Math.round(a / b * 100) : 0; }
  function fmtSecs(s) { if (!isFinite(s) || s <= 0) return '0s'; s = Math.round(s); return s >= 60 ? Math.floor(s / 60) + 'm ' + (s % 60) + 's' : s + 's'; }
  function median(a) { if (!a.length) return 0; a = a.slice().sort(function (x, y) { return x - y; }); var m = a.length >> 1; return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2; }
  function avg(a) { return a.length ? a.reduce(function (x, y) { return x + y; }, 0) / a.length : 0; }
  function flag(cc) { if (!cc || !/^[A-Za-z]{2}$/.test(cc)) return '🌐'; return String.fromCodePoint.apply(null, cc.toUpperCase().split('').map(function (c) { return 127397 + c.charCodeAt(0); })); }
  function ago(t) { var s = Math.max(0, Math.round((Date.now() - new Date(t).getTime()) / 1000)); return s < 60 ? s + 's ago' : s < 3600 ? Math.round(s / 60) + ' min ago' : s < 86400 ? Math.round(s / 3600) + ' h ago' : Math.round(s / 86400) + ' d ago'; }
  function uniq(arr, f) { var s = {}; arr.forEach(function (x) { s[f(x)] = 1; }); return Object.keys(s); }
  function topN(map, n) { return Object.keys(map).map(function (k) { return [k, map[k]]; }).sort(function (a, b) { return b[1] - a[1]; }).slice(0, n || 8); }
  function bars(host, rows, empty, fmt) {
    clear(host); if (!rows.length) { host.appendChild(el('p', 'ad-empty', empty || 'No data yet')); return; }
    var max = Math.max.apply(null, rows.map(function (r) { return r[1]; })) || 1;
    rows.forEach(function (r) {
      var row = el('div', 'ad-bar-row'), lab = el('span', 'ad-bar-l', r[0]), val = el('b', null, fmt ? fmt(r[1]) : String(r[1])), track = el('i'); track.style.width = Math.max(4, r[1] / max * 100) + '%';
      lab.title = r[0]; row.appendChild(lab); row.appendChild(val); row.appendChild(track); host.appendChild(row);
    });
  }
  function kpi(label, value, sub) { var k = el('div', 'ad-kpi'); k.appendChild(el('p', null, label)); k.appendChild(el('b', null, String(value))); if (sub) k.appendChild(el('span', null, sub)); return k; }
  function card(title, sub, wide) {
    var c = el('section', 'ad-card' + (wide ? ' ad-wide' : '')), h = el('div', 'ad-card-h'); h.appendChild(el('h2', null, title)); c.appendChild(h);
    if (sub) c.appendChild(el('p', 'ad-p ad-sub', sub));
    var body = el('div', 'ad-body-in'); c.appendChild(body); c._body = body; return c;
  }
  function table(cols, rows) {
    var w = el('div', 'ad-table-wrap'), t = el('table', 'ad-table ad-table-s'), th = el('thead'), tr = el('tr');
    cols.forEach(function (c) { tr.appendChild(el('th', null, c)); }); th.appendChild(tr); t.appendChild(th);
    var tb = el('tbody'); rows.forEach(function (r) { var x = el('tr'); r.forEach(function (c) { var td = el('td'); if (c instanceof Node) td.appendChild(c); else td.textContent = c == null ? '' : String(c); x.appendChild(td); }); tb.appendChild(x); });
    t.appendChild(tb); w.appendChild(t); return w;
  }

  /* ---------- data prep ---------- */
  function prep() {
    var asc = L.slice().sort(function (a, b) { return a.created_at < b.created_at ? -1 : 1; }), S = {}, order = [];
    asc.forEach(function (e) {
      var s = S[e.sid]; if (!s) { s = S[e.sid] = { sid: e.sid, vid: e.vid, first: e.created_at, last: e.created_at, ev: [], pages: [], geo: null, device: e.device, browser: e.browser, os: e.os, ref: e.ref, utm: e.utm_source || null, secs: 0, scroll: 0 }; order.push(s); }
      s.ev.push(e); s.last = e.created_at;
      if (e.type === 'page_view') s.pages.push(e.path);
      if (e.type === 'visitor_geo' && e.meta && e.meta.geo) s.geo = e.meta.geo;
      if (e.type === 'page_leave' && e.meta) { s.secs += +e.meta.secs || 0; s.scroll = Math.max(s.scroll, +e.meta.scroll || 0); }
      if (!s.ref && e.ref) s.ref = e.ref; if (!s.utm && e.utm_source) s.utm = e.utm_source;
    });
    return order;
  }
  function placeOf(g) { if (!g || !g.cc) return null; return { cc: g.cc, country: g.country || g.cc, city: g.city || '', region: g.region || '' }; }

  /* ---------- LOCATIONS ---------- */
  function renderLocations() {
    var host = clear($('tabLocations')), S = prep(), now = Date.now();
    var pvS = S.filter(function (s) { return s.pages.length; });
    var liveSet = {}; L.forEach(function (e) { if (now - new Date(e.created_at).getTime() < 5 * 60e3) liveSet[e.vid] = e; });
    var liveVids = Object.keys(liveSet);
    var byCountry = {}, byCity = {}, withGeo = 0, cVis = {};
    pvS.forEach(function (s) {
      var p = placeOf(s.geo); if (p) withGeo++;
      var ck = p ? p.country : 'Unknown'; var c = byCountry[ck] || (byCountry[ck] = { cc: p && p.cc, vids: {}, sessions: 0, secs: [], cta: 0 });
      c.vids[s.vid] = 1; c.sessions++; if (s.secs) c.secs.push(s.secs);
      c.cta += s.ev.filter(function (e) { return /^(book_call|whatsapp_click|email_click|phone_click|form_submit)$/.test(e.type); }).length;
      if (p && p.city) { var k = p.city + (p.country ? ', ' + p.country : ''); var cv = byCity[k] || (byCity[k] = { cc: p.cc, vids: {} }); cv.vids[s.vid] = 1; }
    });
    var kp = el('section', 'ad-kpis'); host.appendChild(kp);
    var countries = Object.keys(byCountry).filter(function (k) { return k !== 'Unknown'; }), topC = countries.sort(function (a, b) { return Object.keys(byCountry[b].vids).length - Object.keys(byCountry[a].vids).length; })[0];
    [kpi('Live now', liveVids.length, 'active in the last 5 minutes'), kpi('Countries', countries.length), kpi('Cities', Object.keys(byCity).length), kpi('Top country', topC ? flag(byCountry[topC].cc) + ' ' + topC : 'None yet', topC ? Object.keys(byCountry[topC].vids).length + ' visitors' : ''),
      kpi('Location known', pct(withGeo, pvS.length) + '%', 'of sessions')].forEach(function (k) { kp.appendChild(k); });

    var lv = card('Live now', 'Updates every 30 seconds while this tab is open.', true); host.appendChild(lv);
    if (!liveVids.length) lv._body.appendChild(el('p', 'ad-empty', 'Nobody on the site right now.'));
    else {
      var rows = liveVids.map(function (v) {
        var s = S.filter(function (x) { return x.vid === v; }).pop(), p = s && placeOf(s.geo), last = liveSet[v];
        return [(p ? flag(p.cc) + ' ' + (p.city ? p.city + ', ' : '') + p.country : '🌐 Unknown'), last.path, [last.device, last.browser].filter(Boolean).join(' / '), s && s.ref || 'Direct', ago(last.created_at)];
      });
      lv._body.appendChild(table(['Where', 'On page', 'Device', 'From', 'Last seen'], rows));
    }

    var grid = el('div', 'ad-grid ad-grid2'); host.appendChild(grid);
    var c1 = card('Countries', 'Unique visitors'); grid.appendChild(c1);
    bars(c1._body, topN(Object.keys(byCountry).reduce(function (m, k) { m[(k === 'Unknown' ? '🌐 ' : flag(byCountry[k].cc) + ' ') + k] = Object.keys(byCountry[k].vids).length; return m; }, {}), 10), 'Locations appear once the new tracker has recorded visits.');
    var c2 = card('Cities', 'Unique visitors'); grid.appendChild(c2);
    bars(c2._body, topN(Object.keys(byCity).reduce(function (m, k) { m[flag(byCity[k].cc) + ' ' + k] = Object.keys(byCity[k].vids).length; return m; }, {}), 10), 'No cities yet.');

    var ct = card('Which countries take action', 'Average time on the site, and calls to action (book, WhatsApp, email, phone, form) per country', true); host.appendChild(ct);
    var crow = Object.keys(byCountry).sort(function (a, b) { return Object.keys(byCountry[b].vids).length - Object.keys(byCountry[a].vids).length; }).slice(0, 12).map(function (k) {
      var c = byCountry[k]; return [(k === 'Unknown' ? '🌐 ' : flag(c.cc) + ' ') + k, Object.keys(c.vids).length, c.sessions, fmtSecs(avg(c.secs)), c.cta];
    });
    if (crow.length) ct._body.appendChild(table(['Country', 'Visitors', 'Sessions', 'Avg time', 'Actions'], crow)); else ct._body.appendChild(el('p', 'ad-empty', 'No data yet'));

    var jr = card('Visitor journeys', 'The latest sessions: where they came from, the pages they opened in order, and what they did. Tap one to open it.', true); host.appendChild(jr);
    var recent = S.filter(function (s) { return s.pages.length; }).slice().sort(function (a, b) { return a.last < b.last ? 1 : -1; }).slice(0, 30);
    if (!recent.length) jr._body.appendChild(el('p', 'ad-empty', 'No sessions in this range yet.'));
    recent.forEach(function (s) {
      var d = el('details', 'ad-j'), sm = el('summary'), p = placeOf(s.geo);
      sm.appendChild(el('span', 'ad-j-w', (p ? flag(p.cc) + ' ' + (p.city ? p.city + ', ' : '') + p.country : '🌐 Unknown location')));
      sm.appendChild(el('span', 'ad-j-m', [s.device, s.browser].filter(Boolean).join(' / ') + ' · ' + (s.ref || 'Direct') + ' · ' + s.pages.length + (s.pages.length === 1 ? ' page' : ' pages') + (s.secs ? ' · ' + fmtSecs(s.secs) : '') + ' · ' + ago(s.last)));
      d.appendChild(sm);
      var ol = el('ol', 'ad-j-l');
      s.ev.filter(function (e) { return !/^(visitor_geo|perf|page_leave)$/.test(e.type); }).slice(0, 40).forEach(function (e) {
        var li = el('li'); li.appendChild(el('time', null, new Date(e.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })));
        li.appendChild(el('span', 'ad-chip t-' + (e.type === 'page_view' ? 'pv' : /click|call|form_submit/.test(e.type) ? 'cta' : 'ot'), nameOf(e.type)));
        li.appendChild(el('span', 'ad-j-p', e.type === 'page_view' ? e.path : (e.meta && (e.meta.label || e.meta.msg || e.meta.el) || e.path))); ol.appendChild(li);
      });
      d.appendChild(ol); jr._body.appendChild(d);
    });
  }
  function nameOf(t) { var N = { page_view: 'Page view', scroll_50: 'Scrolled 50%', scroll_90: 'Scrolled 90%', book_call: 'Booked a call click', whatsapp_click: 'WhatsApp click', email_click: 'Email click', phone_click: 'Phone click', store_click: 'Store opened', form_start: 'Started the form', form_submit: 'Sent the form', rage_click: 'Rage click', js_error: 'Site error', contact_click: 'Contact click', sign_in_click: 'Sign in click' }; return N[t] || t; }

  /* ---------- INSIGHTS ---------- */
  function renderInsights() {
    var host = clear($('tabInsights')), S = prep().filter(function (s) { return s.pages.length; });
    var pv = L.filter(function (e) { return e.type === 'page_view'; });
    var vis = uniq(pv, function (e) { return e.vid; }).length;
    function sessionsWith(re) { return S.filter(function (s) { return s.ev.some(function (e) { return re.test(e.type); }); }); }
    var steps = [['Visited', S.length], ['Scrolled halfway', sessionsWith(/^scroll_50$/).length], ['Clicked a call to action', sessionsWith(/^(book_call|whatsapp_click|email_click|phone_click|contact_click)$/).length],
      ['Started the form', sessionsWith(/^form_start$/).length], ['Sent the form', sessionsWith(/^form_submit$/).length]];
    var fu = card('Conversion funnel', 'Share of sessions that reach each step. The biggest drop is the first thing to fix.', true); host.appendChild(fu);
    steps.forEach(function (s, i) {
      var row = el('div', 'ad-fn'), lab = el('span', 'ad-fn-l', s[0]), bar = el('div', 'ad-fn-b'), fill = el('i'), val = el('b', null, s[1] + '  (' + pct(s[1], steps[0][1]) + '%)');
      fill.style.width = Math.max(steps[0][1] ? 3 : 0, pct(s[1], steps[0][1])) + '%'; bar.appendChild(fill);
      row.appendChild(lab); row.appendChild(bar); row.appendChild(val);
      if (i) { var lost = steps[i - 1][1] - s[1]; if (steps[i - 1][1] && lost > 0) row.appendChild(el('small', null, 'Lost ' + lost + ' (' + pct(lost, steps[i - 1][1]) + '%) from the step above')); }
      fu._body.appendChild(row);
    });

    var secs = S.filter(function (s) { return s.secs; }).map(function (s) { return s.secs; }), scrolls = S.filter(function (s) { return s.scroll; }).map(function (s) { return s.scroll; });
    var byV = {}; S.forEach(function (s) { byV[s.vid] = (byV[s.vid] || 0) + 1; }); var back = Object.keys(byV).filter(function (k) { return byV[k] > 1; }).length;
    var quick = S.filter(function (s) { return s.pages.length === 1 && s.secs && s.secs < 10; }).length;
    var kp = el('section', 'ad-kpis'); host.appendChild(kp);
    [kpi('Avg time on site', fmtSecs(avg(secs)), 'median ' + fmtSecs(median(secs))), kpi('Avg scroll depth', Math.round(avg(scrolls)) + '%', 'of the page'), kpi('Came back', back, pct(back, vis) + '% of visitors, 2+ sessions'),
      kpi('Left within 10 s', quick, pct(quick, S.length) + '% of sessions'), kpi('Contact conversion', pct(steps[4][1], steps[0][1]) + '%', steps[4][1] + ' forms from ' + steps[0][1] + ' sessions')].forEach(function (k) { kp.appendChild(k); });

    var g = el('div', 'ad-grid ad-grid2'); host.appendChild(g);
    var hh = card('Best hour to be visible', 'Visits by hour of day, in your time'); g.appendChild(hh);
    var hrs = {}; for (var h = 0; h < 24; h++) hrs[h] = 0; pv.forEach(function (e) { hrs[new Date(e.created_at).getHours()]++; });
    var hm = el('div', 'ad-hours'); var hmax = Math.max.apply(null, Object.keys(hrs).map(function (k) { return hrs[k]; }).concat([1]));
    Object.keys(hrs).forEach(function (k) { var c = el('div', 'ad-hr'); c.title = k + ':00 – ' + hrs[k] + ' views'; var i = el('i'); i.style.height = Math.max(3, hrs[k] / hmax * 100) + '%'; c.appendChild(i); c.appendChild(el('span', null, k % 3 === 0 ? k : '')); hm.appendChild(c); }); hh._body.appendChild(hm);
    var dd = card('Best day of the week', 'Visits by weekday'); g.appendChild(dd);
    var days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], dm = {}; days.forEach(function (d) { dm[d] = 0; }); pv.forEach(function (e) { dm[days[new Date(e.created_at).getDay()]]++; });
    bars(dd._body, days.map(function (d) { return [d, dm[d]]; }));

    var cp = card('Campaigns and sources', 'Which sources bring people who act. Tag your links with ?utm_source=instagram&utm_campaign=name to see them here.', true); host.appendChild(cp);
    var src = {}; S.forEach(function (s) { var k = s.utm || s.ref || 'Direct'; var o = src[k] || (src[k] = { v: {}, n: 0, act: 0, secs: [] }); o.v[s.vid] = 1; o.n++; if (s.secs) o.secs.push(s.secs); if (s.ev.some(function (e) { return /^(book_call|whatsapp_click|email_click|phone_click|form_submit)$/.test(e.type); })) o.act++; });
    var srows = Object.keys(src).sort(function (a, b) { return src[b].n - src[a].n; }).slice(0, 10).map(function (k) { var o = src[k]; return [k, Object.keys(o.v).length, o.n, fmtSecs(avg(o.secs)), o.act + ' (' + pct(o.act, o.n) + '%)']; });
    if (srows.length) cp._body.appendChild(table(['Source', 'Visitors', 'Sessions', 'Avg time', 'Took action'], srows)); else cp._body.appendChild(el('p', 'ad-empty', 'No data yet'));

    var pg = card('Pages people actually read', 'Average time on each page', true); host.appendChild(pg);
    var pm = {}; L.forEach(function (e) { if (e.type === 'page_leave' && e.meta && e.meta.secs) { var o = pm[e.path] || (pm[e.path] = []); o.push(+e.meta.secs); } });
    bars(pg._body, Object.keys(pm).map(function (k) { return [k, Math.round(avg(pm[k]))]; }).sort(function (a, b) { return b[1] - a[1]; }).slice(0, 8), 'Time on page is recorded when visitors leave a page.', fmtSecs);

    var g2 = el('div', 'ad-grid ad-grid2'); host.appendChild(g2);
    var fr = card('Frustration: rage clicks', 'Three or more fast taps on the same spot. These are things that look clickable but are not, or are broken.'); g2.appendChild(fr);
    var rc = {}; L.forEach(function (e) { if (e.type === 'rage_click') { var k = (e.meta && (e.meta.text || e.meta.el) || '?') + '  •  ' + e.path; rc[k] = (rc[k] || 0) + 1; } });
    bars(fr._body, topN(rc, 8), 'None. Nobody is rage-clicking.');
    var er = card('Site errors', 'JavaScript errors that visitors hit'); g2.appendChild(er);
    var em = {}; L.forEach(function (e) { if (e.type === 'js_error') { var k = ((e.meta && e.meta.msg) || 'Error') + (e.meta && e.meta.src ? '  (' + e.meta.src + ':' + (e.meta.line || 0) + ')' : ''); em[k] = (em[k] || 0) + 1; } });
    bars(er._body, topN(em, 8), 'No errors recorded. Good.');

    var sp = card('Real-world speed', 'Measured on your visitors’ own devices. Good: LCP under 2.5 s.', true); host.appendChild(sp);
    var perf = L.filter(function (e) { return e.type === 'perf' && e.meta && e.meta.lcp; });
    if (!perf.length) sp._body.appendChild(el('p', 'ad-empty', 'Speed is recorded about 4 seconds after each page loads.'));
    else {
      var rowsP = ['mobile', 'tablet', 'desktop'].map(function (d) {
        var p = perf.filter(function (e) { return e.device === d; }); if (!p.length) return null;
        var lcp = median(p.map(function (e) { return +e.meta.lcp; })) / 1000, ttfb = median(p.map(function (e) { return +e.meta.ttfb || 0; })), ld = median(p.map(function (e) { return +e.meta.load || 0; })) / 1000;
        var badge = el('span', 'ad-chip ' + (lcp <= 2.5 ? 't-pv' : lcp <= 4 ? 't-ok' : 't-cta'), lcp.toFixed(1) + ' s' + (lcp <= 2.5 ? ' good' : lcp <= 4 ? ' needs work' : ' slow'));
        return [d, p.length, badge, Math.round(ttfb) + ' ms', ld.toFixed(1) + ' s'];
      }).filter(Boolean);
      sp._body.appendChild(table(['Device', 'Samples', 'Largest paint (LCP)', 'Server response', 'Full load'], rowsP));
    }
  }

  /* ---------- SETTINGS (site_settings row) ---------- */
  function loadSettings() {
    if (DEMO) { try { settings = JSON.parse(localStorage.getItem('mm_demo_settings') || '{}') || {}; } catch (_) { settings = {}; } setLoaded = true; return Promise.resolve(); }
    return sb.from('site_settings').select('data').eq('id', 1).maybeSingle().then(function (r) {
      if (r.error) { setErr = r.error.message || String(r.error); return; } settings = (r.data && r.data.data) || {}; setLoaded = true; setErr = '';
    });
  }
  function saveSettings(next, fromHistory) {
    var clean = JSON.parse(JSON.stringify(next)); delete clean._t;
    var p = DEMO ? (function () { try { localStorage.setItem('mm_demo_settings', JSON.stringify(clean)); } catch (_) {} return Promise.resolve(); })()
      : sb.from('site_settings').update({ data: clean, updated_at: new Date().toISOString() }).eq('id', 1).select('id').then(function (r) { if (r.error) throw r.error; if (!r.data || !r.data.length) throw new Error('The settings row is missing. Run section 5 of supabase/schema.sql once.'); });
    return p.then(function () {
      if (!fromHistory) { undoS.push(settings); redoS = []; } settings = clean;
      if (!DEMO) sb.from('admin_log').insert({ admin: ctx.email, action: 'changed site controls', detail: { keys: Object.keys(clean) } }).then(function () {});
      renderControls(); renderRecordings(); toastMsg('Saved. Visitors get it within about a minute.');
    }).catch(function (e) { toastMsg('Could not save: ' + (e.message || e), true); });
  }
  function toastMsg(t, err) { var n = $('ctlNote'); if (n) { n.textContent = t; n.className = 'ad-note' + (err ? ' err' : ' ok'); } }
  function g(path, d) { var o = settings; for (var i = 0; i < path.length; i++) { if (o == null) return d; o = o[path[i]]; } return o == null ? d : o; }

  /* ---------- CONTROLS ---------- */
  function sw(id, label, hint, on) {
    var l = el('label', 'ad-sw'), i = el('input'); i.type = 'checkbox'; i.id = id; i.checked = !!on; l.appendChild(i); l.appendChild(el('span', 'ad-sw-t')); var tx = el('span', 'ad-sw-x'); tx.appendChild(el('b', null, label)); if (hint) tx.appendChild(el('small', null, hint)); l.appendChild(tx); return l;
  }
  function field(id, label, val, ph, max) { var l = el('label', 'ad-fl', label), i = el('input'); i.id = id; i.value = val || ''; i.placeholder = ph || ''; if (max) i.maxLength = max; l.appendChild(i); return l; }

  function renderControls() {
    var host = clear($('tabControls'));
    var bar = el('div', 'ad-bar'), bl = el('div', 'ad-bar-l'), br = el('div', 'ad-bar-r'); bar.appendChild(bl); bar.appendChild(br); host.appendChild(bar);
    var save = el('button', 'ad-btn ad-primary', 'Save changes'); save.type = 'button'; bl.appendChild(save);
    var u = el('button', 'ad-btn', 'Undo'); u.type = 'button'; u.disabled = !undoS.length; var rd = el('button', 'ad-btn', 'Redo'); rd.type = 'button'; rd.disabled = !redoS.length; br.appendChild(u); br.appendChild(rd);
    var note = el('p', 'ad-note'); note.id = 'ctlNote'; note.setAttribute('role', 'status'); note.setAttribute('aria-live', 'polite'); host.appendChild(note);
    if (setErr) {
      var w = el('div', 'ad-warn'); w.appendChild(el('b', null, 'The controls table is not set up yet. ')); w.appendChild(document.createTextNode('Run the new SQL block once (it is at the bottom of supabase/schema.sql, section 5, and in SETUP-DASHBOARD.md). Then press Refresh. Technical detail: ' + setErr)); host.appendChild(w);
    }
    var grid = el('div', 'ad-grid ad-grid2'); host.appendChild(grid);

    var a = card('Announcement bar', 'A small banner at the bottom of every page. Good for a promo, a new service or holiday hours.'); grid.appendChild(a);
    a._body.appendChild(sw('cAnnOn', 'Show the announcement', '', g(['announce', 'on'], false)));
    a._body.appendChild(field('cAnnText', 'Text (up to 160 characters)', g(['announce', 'text'], ''), 'Free store audit this week. Book now.', 160));
    a._body.appendChild(field('cAnnLink', 'Link (optional)', g(['announce', 'link'], ''), 'contact.html or https://...', 300));

    var m = card('Maintenance notice', 'Covers the whole public site with a message. You can still open the site with ?preview=1 on the end of the address.'); grid.appendChild(m);
    m._body.appendChild(sw('cMaintOn', 'Turn maintenance mode on', 'Leave it off normally. Visitors and Google would see only the message.', g(['maintenance', 'on'], false)));
    m._body.appendChild(field('cMaintMsg', 'Message (up to 300 characters)', g(['maintenance', 'message'], ''), 'We are making improvements. Please check back soon.', 300));

    var t = card('Tracking and recordings', 'What gets recorded about visitors.'); grid.appendChild(t);
    t._body.appendChild(sw('cTrack', 'Count visits (analytics)', 'Off = nothing is recorded, anywhere on the site.', g(['tracking'], true) !== false));
    t._body.appendChild(sw('cClar', 'Session recordings and heatmaps (Microsoft Clarity)', 'Needs a Clarity ID. See the Recordings tab.', g(['clarity'], true) !== false));
    t._body.appendChild(field('cClarId', 'Clarity project ID', g(['clarityId'], ''), 'e.g. k7x2abc9de', 16));

    var s = card('Site features', 'Switch parts of the site on or off without touching any code.'); grid.appendChild(s);
    s._body.appendChild(sw('cHero', 'Hero video on the home page', 'Off = the still picture only. Faster on slow connections.', g(['heroVideo'], true) !== false));

    save.addEventListener('click', function () {
      var next = JSON.parse(JSON.stringify(settings)), txt = $('cAnnText').value.trim(), link = $('cAnnLink').value.trim(), cid = $('cClarId').value.trim();
      if (link && !SAFE_LINK.test(link)) return toastMsg('The announcement link must start with https://, / or end in .html.', true);
      if (cid && !CLARITY_ID.test(cid)) return toastMsg('The Clarity ID is 6 to 16 letters and numbers (for example k7x2abc9de), nothing else.', true);
      if ($('cAnnOn').checked && !txt) return toastMsg('Add the announcement text first, or switch it off.', true);
      if ($('cMaintOn').checked && !g(['maintenance', 'on'], false) && !window.confirm('Turn on maintenance mode? Your whole public site will show only the message until you turn this off.')) return;
      next.announce = { on: $('cAnnOn').checked, text: txt, link: link };
      next.maintenance = { on: $('cMaintOn').checked, message: $('cMaintMsg').value.trim() };
      next.tracking = $('cTrack').checked; next.clarity = $('cClar').checked; next.clarityId = cid; next.heroVideo = $('cHero').checked;
      saveSettings(next);
    });
    u.addEventListener('click', function () { var p = undoS.pop(); if (!p) return; redoS.push(settings); saveSettings(p, true); });
    rd.addEventListener('click', function () { var p = redoS.pop(); if (!p) return; undoS.push(settings); saveSettings(p, true); });

    renderHealth(host);
  }

  function renderHealth(host) {
    var c = card('Health check', 'What the dashboard can see right now. Use it to find out why something is not showing.', true); host.appendChild(c);
    var C = window.MM_CONFIG || {}, now = Date.now(), recent = L.filter(function (e) { return now - new Date(e.created_at).getTime() < 864e5; });
    var S = prep().filter(function (s) { return s.pages.length; }), geoS = S.filter(function (s) { return s.geo && s.geo.cc; }).length, last = L.length ? L[0].created_at : null;
    last = L.reduce(function (m, e) { return !m || e.created_at > m ? e.created_at : m; }, null);
    var clId = C.clarityId || g(['clarityId'], '');
    var rows = [
      ['Database connection', DEMO ? 'Demo data (not connected)' : 'Connected', DEMO ? 'warn' : 'ok'],
      ['Signed in as', ctx.email, 'ok'],
      ['Visits recorded in the last 24 hours', String(recent.filter(function (e) { return e.type === 'page_view'; }).length), recent.length ? 'ok' : 'warn'],
      ['Last event received', last ? ago(last) : 'Nothing yet', last ? 'ok' : 'warn'],
      ['Visitor location coverage', S.length ? pct(geoS, S.length) + '% of sessions' : 'No sessions yet', !S.length ? 'warn' : pct(geoS, S.length) >= 60 ? 'ok' : 'warn'],
      ['Controls table', setErr ? 'Missing. Run the SQL block' : 'Ready', setErr ? 'bad' : 'ok'],
      ['Session recordings (Clarity)', clId && g(['clarity'], true) !== false ? 'On (ID ' + clId + ')' : clId ? 'ID saved but switched off' : 'No ID yet', clId && g(['clarity'], true) !== false ? 'ok' : 'warn'],
      ['Tracking switch', g(['tracking'], true) !== false ? 'On' : 'Off', g(['tracking'], true) !== false ? 'ok' : 'bad']
    ];
    var ul = el('ul', 'ad-health'); rows.forEach(function (r) { var li = el('li', 'h-' + r[2]); li.appendChild(el('span', null, r[0])); li.appendChild(el('b', null, r[1])); ul.appendChild(li); }); c._body.appendChild(ul);
    var tb = el('button', 'ad-btn', 'Send a test event'); tb.type = 'button'; var tn = el('span', 'ad-sub', ''); tb.addEventListener('click', function () {
      if (DEMO) { tn.textContent = 'Demo mode: nothing is sent.'; return; }
      tb.disabled = true; tn.textContent = 'Sending...';
      sb.from('events').insert({ vid: 'admin-test', sid: 'admin-test', type: 'test', path: '/admin-test', title: 'Dashboard test' }).then(function (r) { tb.disabled = false; tn.textContent = r.error ? 'Failed: ' + r.error.message : 'Works. The database accepted a test event (it is hidden from your numbers).'; });
    });
    var wrap = el('div', 'ad-test'); wrap.appendChild(tb); wrap.appendChild(tn); c._body.appendChild(wrap);
    var ex = el('button', 'ad-btn', 'Download my settings (JSON)'); ex.type = 'button'; ex.addEventListener('click', function () {
      var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' })); a.download = 'moses-mastery-settings.json'; a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
    }); wrap.appendChild(ex);
  }

  /* ---------- RECORDINGS ---------- */
  function renderRecordings() {
    var host = clear($('tabRecordings')), C = window.MM_CONFIG || {}, id = C.clarityId || g(['clarityId'], ''), on = id && g(['clarity'], true) !== false;
    var st = card('Session recordings and heatmaps', 'Watch real visits as videos, see where people click and scroll, and spot rage clicks. Powered by Microsoft Clarity (free, no traffic limit).', true); host.appendChild(st);
    var badge = el('p', 'ad-status ' + (on ? 's-on' : 's-off'), on ? 'Recording is ON for your site (project ' + id + ').' : id ? 'Your ID is saved but recording is switched off in Controls.' : 'Recording is OFF. It needs a free Clarity project ID. Three steps below.');
    st._body.appendChild(badge);
    if (id) {
      var open = el('a', 'ad-btn ad-primary', 'Open Clarity (recordings, heatmaps)'); open.href = 'https://clarity.microsoft.com/projects/view/' + encodeURIComponent(id) + '/dashboard'; open.target = '_blank'; open.rel = 'noopener noreferrer'; st._body.appendChild(open);
    } else {
      var ol = el('ol', 'ad-steps');
      ['Go to clarity.microsoft.com and sign in with any Microsoft or Google account. It is free.', 'Click New project. Name: Moses Mastery. Website URL: https://www.mosesmastery.com. Choose "Install manually" and skip the code (this site loads it for you).',
        'Open Settings > Overview and copy the Project ID (about 10 letters and numbers). Paste it here and press Save.'].forEach(function (t) { ol.appendChild(el('li', null, t)); });
      st._body.appendChild(ol);
      var form = el('div', 'ad-inline'), inp = el('input'); inp.placeholder = 'Clarity project ID'; inp.maxLength = 16; inp.setAttribute('aria-label', 'Clarity project ID'); var sv = el('button', 'ad-btn ad-primary', 'Save ID'); sv.type = 'button';
      var msg = el('p', 'ad-note'); sv.addEventListener('click', function () {
        var v = inp.value.trim(); if (!CLARITY_ID.test(v)) { msg.textContent = 'That does not look like a Clarity ID (6 to 16 letters and numbers).'; msg.className = 'ad-note err'; return; }
        var n = JSON.parse(JSON.stringify(settings)); n.clarityId = v; n.clarity = true; saveSettings(n);
      }); form.appendChild(inp); form.appendChild(sv); st._body.appendChild(form); st._body.appendChild(msg);
    }
    var pv = card('What gets recorded, and what never does', null, true); host.appendChild(pv);
    var ul = el('ul', 'ad-list'); [
      'Every form field and anything you tag is masked, so nobody’s name, email or message is ever recorded.',
      'Recording starts as soon as a visitor lands, and is skipped for visitors in European time zones until a consent banner is added. This is deliberate: European law needs consent first.',
      'Your own visits are not recorded if you pressed "Stop counting my visits on this device" in Analytics.',
      'The privacy page (privacy.html) already tells visitors about this. Do not remove it.'].forEach(function (t) { ul.appendChild(el('li', null, t)); }); pv._body.appendChild(ul);
    var why = card('Why Clarity and not a recorder built into this dashboard', null, true); host.appendChild(why);
    why._body.appendChild(el('p', 'ad-p', 'A video-style recorder stores every mouse move, click and page change. One busy day would fill the free database in a few weeks, it needs careful masking to stay legal, and Microsoft already does it free, with heatmaps and rage-click detection. This dashboard keeps the lighter, always-on parts: visitor journeys (Locations tab), rage clicks, errors and speed (Insights tab).'));
  }

  /* ---------- tabs ---------- */
  function show(key) {
    if (!TABS[key]) key = 'A'; current = key;
    Object.keys(TABS).forEach(function (k) { var b = $('tabBtn' + k), p = $(TABS[k]); if (b) b.setAttribute('aria-selected', k === key ? 'true' : 'false'); if (p) p.hidden = k !== key; });
    clearInterval(liveTimer); liveTimer = null;
    if (key === 'L') { renderLocations(); liveTimer = setInterval(function () { if (!document.hidden && ctx.reload && !DEMO) ctx.reload(); }, 30000); }
    if (key === 'I') renderInsights();
    if (key === 'R') renderRecordings();
    if (key === 'C') renderControls();
    if (key === 'P' && window.MMProjects && window.MMProjects.show) window.MMProjects.show();
  }
  function init(c) {
    ctx = c; sb = c.sb; DEMO = c.DEMO;
    Object.keys(TABS).forEach(function (k) { var b = $('tabBtn' + k); if (b) b.addEventListener('click', function () { show(k); }); });
    var m = /[?&]tab=(analytics|locations|insights|recordings|controls|projects)/.exec(location.search);
    loadSettings().then(function () { if (m) show({ analytics: 'A', locations: 'L', insights: 'I', recordings: 'R', controls: 'C', projects: 'P' }[m[1]]); else if (current === 'C') renderControls(); });
  }
  /* called by admin.js after every (re)load of events */
  function update(events, r) {
    L = events.filter(function (e) { return e.vid !== 'admin-test'; }); range = r;
    if (current === 'L') renderLocations(); else if (current === 'I') renderInsights();;
  }
  window.MMInsights = { init: init, update: update, show: show };
})();
