/* Moses Mastery analytics dashboard. Reads the `events` table (see supabase/schema.sql).
   "Delete" is a soft delete (deleted_at) so every action can be undone. All visitor-supplied text is rendered with textContent. */
(function () {
  'use strict';
  var C = window.MM_CONFIG || {}, $ = function (id) { return document.getElementById(id); };
  var DEMO = /[?&]demo=1/.test(location.search), sb = null;
  var ev = [], range = 30, showTrash = false, selected = {}, undoS = [], redoS = [], truncated = false, adminEmail = '';

  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function gate(msg, actions) {
    $('adGate').hidden = false; $('adApp').hidden = true; $('adGateMsg').textContent = msg;
    var box = $('adGateActions'); box.textContent = '';
    (actions || []).forEach(function (a) { var l = el('a', 'ad-btn', a[0]); l.href = a[1]; box.appendChild(l); });
  }
  function note(t, err) { var n = $('adNote'); n.textContent = t || ''; n.className = 'ad-note' + (err ? ' err' : ''); }
  var tt; function toast(text, withUndo) {
    $('adToastText').textContent = text; $('adToastUndo').hidden = !withUndo; $('adToast').hidden = false; clearTimeout(tt); tt = setTimeout(function () { $('adToast').hidden = true; }, 7000);
  }

  /* ---------- demo data ---------- */
  function demoData() {
    var rows = [], now = Date.now(), pages = ['/', '/', '/', '/projects.html', '/contact.html', '/blog/', '/blog/shopify-seo-guide/', '/blog/shopify-conversion-rate-optimization-checklist/', '/blog/ai-automation-for-shopify-stores/', '/index.html'];
    var refs = [null, null, 'google.com', 'google.com', 'instagram.com', 'x.com', 't.me', 'pinterest.com', 'facebook.com'], devs = ['mobile', 'mobile', 'mobile', 'desktop', 'desktop', 'tablet'], brs = ['Chrome', 'Chrome', 'Safari', 'Safari', 'Edge', 'Firefox', 'Samsung'];
    var tzs = ['America/New_York', 'Europe/London', 'Africa/Lagos', 'America/Los_Angeles', 'Australia/Sydney', 'Asia/Dubai'];
    var id = 1, n = 1400;
    function rnd(a) { return a[Math.floor(Math.random() * a.length)]; }
    var geos = [['US', 'United States', 'California', 'Los Angeles'], ['US', 'United States', 'New York', 'New York'], ['US', 'United States', 'Texas', 'Austin'], ['GB', 'United Kingdom', 'England', 'London'], ['NG', 'Nigeria', 'Lagos', 'Lagos'], ['NG', 'Nigeria', 'Abuja', 'Abuja'],
      ['CA', 'Canada', 'Ontario', 'Toronto'], ['AE', 'United Arab Emirates', 'Dubai', 'Dubai'], ['AU', 'Australia', 'New South Wales', 'Sydney'], ['DE', 'Germany', 'Berlin', 'Berlin'], ['IN', 'India', 'Maharashtra', 'Mumbai'], ['ZA', 'South Africa', 'Gauteng', 'Johannesburg']];
    var utms = [null, null, null, null, 'instagram', 'facebook', 'newsletter'], errs = ['Cannot read properties of null (reading \'style\')', 'Failed to fetch', 'ResizeObserver loop limit exceeded'], rages = [['button.hd-cll', 'Strategy Call'], ['div.pj-card', ''], ['a.bg-tile', 'Ritual']];
    var vgeo = {};
    for (var i = 0; i < n; i++) {
      var t = now - Math.pow(Math.random(), 1.4) * 90 * 864e5, vid = 'v' + Math.floor(Math.random() * 420), sid = vid + '-' + Math.floor(t / 36e5);
      if (!vgeo[vid]) vgeo[vid] = Math.random() < .08 ? null : rnd(geos);
      var u = rnd(utms), dv = rnd(devs);
      var base = { id: id++, created_at: new Date(t).toISOString(), vid: vid, sid: sid, path: rnd(pages), ref: rnd(refs), device: dv, browser: rnd(brs), tz: rnd(tzs), utm_source: u, meta: {}, deleted_at: null };
      rows.push(Object.assign({}, base, { type: 'page_view' }));
      if (vgeo[vid]) rows.push(Object.assign({}, base, { id: id++, type: 'visitor_geo', meta: { geo: { cc: vgeo[vid][0], country: vgeo[vid][1], region: vgeo[vid][2], city: vgeo[vid][3] } } }));
      rows.push(Object.assign({}, base, { id: id++, type: 'page_leave', meta: { secs: 4 + Math.floor(Math.pow(Math.random(), 2) * 200), scroll: Math.floor(Math.random() * 100) } }));
      if (Math.random() < .35) rows.push(Object.assign({}, base, { id: id++, type: 'scroll_50' }));
      if (Math.random() < .12) rows.push(Object.assign({}, base, { id: id++, type: rnd(['book_call', 'book_call', 'whatsapp_click', 'instagram_click', 'store_click', 'email_click']), meta: { label: 'Book a call' } }));
      if (Math.random() < .06) rows.push(Object.assign({}, base, { id: id++, type: 'form_start', path: '/contact.html' }));
      if (Math.random() < .03) rows.push(Object.assign({}, base, { id: id++, type: 'form_submit', path: '/contact.html' }));
      if (Math.random() < .02) { var rg = rnd(rages); rows.push(Object.assign({}, base, { id: id++, type: 'rage_click', meta: { el: rg[0], text: rg[1] } })); }
      if (Math.random() < .015) rows.push(Object.assign({}, base, { id: id++, type: 'js_error', meta: { msg: rnd(errs), src: 'sections.js', line: 42 } }));
      if (Math.random() < .5) rows.push(Object.assign({}, base, { id: id++, type: 'perf', meta: { lcp: Math.round((dv === 'mobile' ? 3200 : 1700) * (.6 + Math.random() * 1.1)), ttfb: Math.round(120 + Math.random() * 380), load: Math.round(2200 + Math.random() * 2600) } }));
    }
    return rows.sort(function (a, b) { return a.created_at < b.created_at ? 1 : -1; });
  }

  /* ---------- data ---------- */
  function sinceISO() { return new Date(Date.now() - range * 864e5).toISOString(); }
  function load() {
    note('Loading...'); selected = {}; updSel();
    if (DEMO) { if (!ev.length) ev = demoData(); note(''); render(); return Promise.resolve(); }
    ev = []; truncated = false;
    function page(from) {
      return sb.from('events').select('*').gte('created_at', sinceISO()).order('created_at', { ascending: false }).range(from, from + 999).then(function (r) {
        if (r.error) throw r.error;
        ev = ev.concat(r.data);
        if (r.data.length === 1000) { if (from >= 19000) { truncated = true; return; } return page(from + 1000); }
      });
    }
    return page(0).then(function () { note(''); render(); }).catch(function (e) { note('Could not load data: ' + (e.message || e), true); });
  }
  function inRange(e) { return e.created_at >= sinceISO(); }
  function live() { return ev.filter(function (e) { return !e.deleted_at && inRange(e) && e.vid !== 'admin-test'; }); }

  /* ---------- aggregate + render ---------- */
  function uniq(arr, f) { var s = {}; arr.forEach(function (x) { s[f(x)] = 1; }); return Object.keys(s).length; }
  function top(arr, f, n) {
    var m = {}; arr.forEach(function (x) { var k = f(x); if (k == null || k === '') return; m[k] = (m[k] || 0) + 1; });
    return Object.keys(m).map(function (k) { return [k, m[k]]; }).sort(function (a, b) { return b[1] - a[1]; }).slice(0, n || 8);
  }
  function bars(host, rows, empty) {
    host.textContent = '';
    if (!rows.length) { host.appendChild(el('p', 'ad-empty', empty || 'No data yet')); return; }
    var max = rows[0][1];
    rows.forEach(function (r) {
      var row = el('div', 'ad-bar-row'), lab = el('span', 'ad-bar-l', r[0]), val = el('b', null, String(r[1])), track = el('i'); track.style.width = Math.max(4, r[1] / max * 100) + '%';
      lab.title = r[0]; row.appendChild(lab); row.appendChild(val); row.appendChild(track); host.appendChild(row);
    });
  }
  function kpi(label, value, sub) {
    var k = el('div', 'ad-kpi'); k.appendChild(el('p', null, label)); k.appendChild(el('b', null, String(value))); if (sub) k.appendChild(el('span', null, sub)); return k;
  }
  var TECH = /^(page_view|visitor_geo|page_leave|perf|test)$/;
  var NAMES = { form_start: 'Started the form', rage_click: 'Rage click', js_error: 'Site error', page_view: 'Page view', scroll_50: 'Scrolled 50%', scroll_90: 'Scrolled 90%', book_call: 'Booked a call click', whatsapp_click: 'WhatsApp click', email_click: 'Email click', phone_click: 'Phone click',
    instagram_click: 'Instagram click', x_click: 'X click', telegram_click: 'Telegram click', pinterest_click: 'Pinterest click', store_click: 'Store opened', form_submit: 'Contact form sent', sign_in_click: 'Sign in click', contact_click: 'Contact click' };
  function nm(t) { return NAMES[t] || t; }

  function render() {
    var L = live(), pv = L.filter(function (e) { return e.type === 'page_view'; });
    var visitors = uniq(pv, function (e) { return e.vid; }), sessions = uniq(pv, function (e) { return e.sid; });
    var forms = L.filter(function (e) { return e.type === 'form_submit'; }).length;
    var cta = L.filter(function (e) { return /^(book_call|whatsapp_click|email_click|phone_click)$/.test(e.type); }).length;
    var k = $('adKpis'); k.textContent = '';
    [kpi('Visitors', visitors, 'unique'), kpi('Sessions', sessions), kpi('Page views', pv.length, sessions ? (pv.length / sessions).toFixed(1) + ' per session' : ''), kpi('Contact forms', forms), kpi('Call-to-action clicks', cta, 'book / WhatsApp / email / phone')].forEach(function (x) { k.appendChild(x); });

    chart(pv);
    bars($('adPages'), top(pv, function (e) { return e.path; }, 8));
    bars($('adRefs'), top(pv, function (e) { return e.ref || 'Direct / unknown'; }, 8));
    bars($('adEvents'), top(L.filter(function (e) { return !TECH.test(e.type); }), function (e) { return nm(e.type); }, 8), 'No actions recorded yet');
    bars($('adDevices'), top(pv, function (e) { return e.device; }, 4));
    bars($('adBrowsers'), top(pv, function (e) { return e.browser; }, 6));
    bars($('adTz'), top(pv, function (e) { return e.tz; }, 6));
    log();
    $('adUndo').disabled = !undoS.length; $('adRedo').disabled = !redoS.length;
    if (truncated) note('Showing the most recent 20,000 events in this range.');
    if (window.MMInsights) window.MMInsights.update(L, range);
  }

  function chart(pv) {
    var host = $('adChart'); host.textContent = '';
    var days = Math.max(range, 1), isHour = range === 1, buckets = isHour ? 24 : days, step = isHour ? 36e5 : 864e5, end = Date.now(), start = end - buckets * step;
    var P = new Array(buckets).fill(0), V = []; for (var i = 0; i < buckets; i++) V.push({});
    pv.forEach(function (e) { var t = new Date(e.created_at).getTime(), b = Math.min(buckets - 1, Math.floor((t - start) / step)); if (b < 0) return; P[b]++; V[b][e.vid] = 1; });
    var Vc = V.map(function (o) { return Object.keys(o).length; }), max = Math.max.apply(null, P.concat([1]));
    var W = 800, H = 230, pl = 34, pr = 10, pt = 12, pb = 26, iw = W - pl - pr, ih = H - pt - pb;
    function x(i) { return pl + (buckets === 1 ? iw / 2 : i / (buckets - 1) * iw); } function y(v) { return pt + ih - v / max * ih; }
    function path(arr) { return arr.map(function (v, i) { return (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(v).toFixed(1); }).join(' '); }
    var NS = 'http://www.w3.org/2000/svg', svg = document.createElementNS(NS, 'svg'); svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H); svg.setAttribute('preserveAspectRatio', 'none');
    function mk(t, a) { var n = document.createElementNS(NS, t); for (var k in a) n.setAttribute(k, a[k]); return n; }
    for (var g = 0; g <= 4; g++) {
      var gy = pt + ih - g / 4 * ih; svg.appendChild(mk('line', { x1: pl, x2: W - pr, y1: gy, y2: gy, class: 'gl' }));
      var tx = mk('text', { x: pl - 6, y: gy + 4, class: 'gt', 'text-anchor': 'end' }); tx.textContent = Math.round(max * g / 4); svg.appendChild(tx);
    }
    var area = mk('path', { d: path(P) + ' L' + x(buckets - 1) + ' ' + (pt + ih) + ' L' + x(0) + ' ' + (pt + ih) + ' Z', class: 'area' }); svg.appendChild(area);
    svg.appendChild(mk('path', { d: path(P), class: 'l-pv' })); svg.appendChild(mk('path', { d: path(Vc), class: 'l-v' }));
    var labelEvery = Math.ceil(buckets / 6);
    for (var j = 0; j < buckets; j++) {
      var d = new Date(start + (j + 1) * step), c = mk('circle', { cx: x(j), cy: y(P[j]), r: 6, class: 'hit' }), tl = mk('title', {});
      tl.textContent = (isHour ? d.getHours() + ':00' : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })) + ': ' + P[j] + ' views, ' + Vc[j] + ' visitors'; c.appendChild(tl); svg.appendChild(c);
      if (j % labelEvery === 0) { var lb = mk('text', { x: x(j), y: H - 6, class: 'gt', 'text-anchor': 'middle' }); lb.textContent = isHour ? d.getHours() + ':00' : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }); svg.appendChild(lb); }
    }
    host.appendChild(svg);
  }

  function log() {
    var rows = ev.filter(function (e) { return inRange(e) && !/^(visitor_geo|page_leave|perf|test)$/.test(e.type) && (showTrash ? !!e.deleted_at : !e.deleted_at); }), tb = $('adRows'); tb.textContent = '';
    $('adLogTitle').textContent = showTrash ? 'Deleted activity (can be restored)' : 'Latest activity';
    rows.slice(0, 120).forEach(function (e) {
      var tr = el('tr'), c0 = el('td'), cb = el('input'); cb.type = 'checkbox'; cb.checked = !!selected[e.id]; cb.setAttribute('aria-label', 'Select row'); cb.addEventListener('change', function () { if (cb.checked) selected[e.id] = 1; else delete selected[e.id]; updSel(); }); c0.appendChild(cb); tr.appendChild(c0);
      tr.appendChild(el('td', 'nw', new Date(e.created_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })));
      var ct = el('td'); ct.appendChild(el('span', 'ad-chip t-' + (e.type === 'page_view' ? 'pv' : /click|call|form/.test(e.type) ? 'cta' : 'ot'), nm(e.type))); tr.appendChild(ct);
      var pth = el('td', 'ad-path', e.path); pth.title = e.path; tr.appendChild(pth);
      tr.appendChild(el('td', null, e.ref || 'Direct'));
      tr.appendChild(el('td', 'nw', [e.device, e.browser].filter(Boolean).join(' / ')));
      var ac = el('td'), b = el('button', 'ad-icon'); b.type = 'button'; b.title = showTrash ? 'Restore' : 'Delete'; b.setAttribute('aria-label', b.title);
      b.innerHTML = showTrash ? '<i class="fa-solid fa-rotate-left"></i>' : '<i class="fa-regular fa-trash-can"></i>'; b.addEventListener('click', function () { act(showTrash ? 'restore' : 'delete', [e.id]); }); ac.appendChild(b); tr.appendChild(ac);
      tb.appendChild(tr);
    });
    if (!rows.length) { var tr0 = el('tr'), td0 = el('td', 'ad-empty', showTrash ? 'Nothing deleted.' : 'No activity in this range yet.'); td0.colSpan = 7; tr0.appendChild(td0); tb.appendChild(tr0); }
    $('adFoot').textContent = rows.length > 120 ? 'Showing 120 of ' + rows.length + ' rows. Use Export CSV for everything.' : '';
    $('adCheckAll').checked = false;
  }
  function updSel() { var n = Object.keys(selected).length; $('adDelSel').disabled = n === 0; $('adDelSel').textContent = showTrash ? 'Restore selected' : 'Delete selected' + (n ? ' (' + n + ')' : ''); }

  /* ---------- do / undo / redo ---------- */
  function setDeleted(ids, deleted) {
    var stamp = deleted ? new Date().toISOString() : null;
    if (DEMO) { ev.forEach(function (e) { if (ids.indexOf(e.id) !== -1) e.deleted_at = stamp; }); return Promise.resolve(); }
    var chunks = [], i; for (i = 0; i < ids.length; i += 200) chunks.push(ids.slice(i, i + 200));
    return chunks.reduce(function (p, ch) {
      return p.then(function () { return sb.from('events').update({ deleted_at: stamp }).in('id', ch).then(function (r) { if (r.error) throw r.error; }); });
    }, Promise.resolve()).then(function () { ev.forEach(function (e) { if (ids.indexOf(e.id) !== -1) e.deleted_at = stamp; }); });
  }
  function record(action, ids) {
    if (DEMO) return; sb.from('admin_log').insert({ admin: adminEmail, action: action, detail: { count: ids.length, ids: ids.slice(0, 50) } }).then(function () {});
  }
  function act(action, ids, fromHistory) {
    if (!ids.length) return;
    setDeleted(ids, action === 'delete').then(function () {
      if (!fromHistory) { undoS.push({ action: action, ids: ids }); redoS = []; }
      record(action, ids); selected = {}; updSel(); render();
      toast((action === 'delete' ? 'Deleted ' : 'Restored ') + ids.length + (ids.length === 1 ? ' event' : ' events'), !fromHistory);
    }).catch(function (e) { note('That did not save: ' + (e.message || e), true); });
  }
  function undo() { var s = undoS.pop(); if (!s) return; redoS.push(s); act(s.action === 'delete' ? 'restore' : 'delete', s.ids, true); toast('Undone', false); }
  function redo() { var s = redoS.pop(); if (!s) return; undoS.push(s); act(s.action, s.ids, true); toast('Redone', false); }

  /* ---------- CSV ---------- */
  function csv() {
    var cols = ['created_at', 'type', 'path', 'ref', 'device', 'browser', 'os', 'tz', 'utm_source', 'utm_medium', 'utm_campaign', 'vid', 'sid', 'deleted_at'];
    function q(v) { v = v == null ? '' : String(v); if (/^[=+\-@\t\r]/.test(v)) v = "'" + v; return '"' + v.replace(/"/g, '""') + '"'; }
    var out = [cols.join(',')].concat(ev.filter(inRange).map(function (e) { return cols.map(function (c) { return q(e[c]); }).join(','); })).join('\n');
    var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([out], { type: 'text/csv' })); a.download = 'moses-mastery-analytics-' + new Date().toISOString().slice(0, 10) + '.csv'; a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
  }

  /* ---------- wiring ---------- */
  function selfLabel() { var off = false; try { off = localStorage.getItem('mm_notrack') === '1'; } catch (_) {} $('adSelf').textContent = off ? 'Start counting my visits again' : 'Stop counting my visits on this device'; }
  function wire() {
    $('adRange').addEventListener('change', function (e) { range = +e.target.value; load(); });
    $('adRefresh').addEventListener('click', function () { if (DEMO) ev = []; load(); });
    $('adCsv').addEventListener('click', csv);
    $('adUndo').addEventListener('click', undo); $('adRedo').addEventListener('click', redo); $('adToastUndo').addEventListener('click', function () { $('adToast').hidden = true; undo(); });
    $('adTrash').addEventListener('click', function () { showTrash = !showTrash; $('adTrash').setAttribute('aria-pressed', showTrash); $('adTrash').querySelector('span').textContent = showTrash ? 'Show activity' : 'Show deleted'; selected = {}; updSel(); log(); });
    $('adDelSel').addEventListener('click', function () { act(showTrash ? 'restore' : 'delete', Object.keys(selected).map(Number)); });
    $('adDelAll').addEventListener('click', function () {
      var ids = ev.filter(function (e) { return inRange(e) && (showTrash ? !!e.deleted_at : !e.deleted_at); }).map(function (e) { return e.id; });
      if (!ids.length) return;
      if (window.confirm((showTrash ? 'Restore ' : 'Delete ') + ids.length + ' events in this range? You can undo this.')) act(showTrash ? 'restore' : 'delete', ids);
    });
    $('adCheckAll').addEventListener('change', function (e) {
      document.querySelectorAll('#adRows input[type=checkbox]').forEach(function (cb) { cb.checked = e.target.checked; });
      selected = {}; if (e.target.checked) ev.filter(function (x) { return inRange(x) && (showTrash ? !!x.deleted_at : !x.deleted_at); }).slice(0, 120).forEach(function (x) { selected[x.id] = 1; }); updSel();
    });
    $('adSelf').addEventListener('click', function () { try { localStorage.getItem('mm_notrack') === '1' ? localStorage.removeItem('mm_notrack') : localStorage.setItem('mm_notrack', '1'); } catch (_) {} selfLabel(); });
    document.addEventListener('keydown', function (e) { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) { e.preventDefault(); e.shiftKey ? redo() : undo(); } });
    selfLabel();
  }
  function history() {
    if (DEMO) return;
    sb.from('admin_log').select('*').order('created_at', { ascending: false }).limit(12).then(function (r) {
      if (r.error || !r.data.length) return; $('adLogCard').hidden = false; var ul = $('adHistory'); ul.textContent = '';
      r.data.forEach(function (h) { ul.appendChild(el('li', null, new Date(h.created_at).toLocaleString() + ': ' + h.admin + ' ' + h.action + ' ' + ((h.detail && h.detail.count) || 0) + ' events')); });
    });
  }
  function start(user) {
    adminEmail = user || 'demo'; $('adGate').hidden = true; $('adApp').hidden = false; $('adUser').textContent = DEMO ? '' : user; $('adDemo').hidden = !DEMO;
    window.MMAdmin = { sb: sb, DEMO: DEMO, email: adminEmail, reload: function () { return load(); } }; if (window.MMProjects) window.MMProjects.init(window.MMAdmin); if (window.MMInsights) window.MMInsights.init(window.MMAdmin);
    wire(); load().then(history);
    $('adOut').addEventListener('click', function () { if (DEMO) { location.href = 'account.html'; return; } sb.auth.signOut().then(function () { location.href = 'account.html'; }); });
  }

  if (DEMO) return start('demo');
  if (!C.supabaseUrl || !C.supabaseAnonKey || !window.supabase) return gate('The dashboard is not connected to a database yet. Add your Supabase URL and key in js/config.js (see SETUP-DASHBOARD.md), or look at it with sample data.', [['View demo', 'admin.html?demo=1']]);
  sb = window.supabase.createClient(C.supabaseUrl, C.supabaseAnonKey, { auth: { persistSession: true, autoRefreshToken: true } });
  sb.auth.getSession().then(function (r) {
    var s = r.data && r.data.session; if (!s) return gate('Please sign in to open the dashboard.', [['Sign in', 'account.html']]);
    sb.from('admins').select('email').limit(1).then(function (a) {
      if (a.error || !a.data || !a.data.length) return gate('This account (' + s.user.email + ') does not have admin access.', [['Switch account', 'account.html'], ['Back to site', 'index.html']]);
      start(s.user.email);
    });
  });
})();
