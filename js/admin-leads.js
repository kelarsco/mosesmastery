/* Leads tab: every contact-form and calculator request saved by the site (backup to the email). */
(function () {
  'use strict';
  var ctx = null, sb = null, DEMO = false, rows = [], filter = 'all', err = '', loaded = false;
  var $ = function (id) { return document.getElementById(id); };
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  var STATUS = [['new', 'New'], ['contacted', 'Contacted'], ['won', 'Won'], ['lost', 'Lost']];
  var SAFE = /^https?:\/\//i;
  function when(t) { var d = new Date(t); return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) + ', ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }); }
  function demoRows() {
    var n = Date.now(), h = 3600000;
    return [
      { id: 'd1', created_at: new Date(n - 2 * h).toISOString(), source: 'contact', name: 'Amara Okafor', email: 'amara@example.com', link: 'https://example-store.com', services: 'Store design & build, Conversion optimization', stage: 'Live, $10k+/month', budget: '$2k - $5k', timeline: 'As soon as possible', how_heard: 'Instagram', message: 'Our product pages are getting traffic but few sales.', status: 'new' },
      { id: 'd2', created_at: new Date(n - 26 * h).toISOString(), source: 'calculator', name: 'Daniel Reed', email: 'dan@example.com', link: 'https://reed-goods.com', numbers: { visitors: 18000, conversion_pct: 0.9, aov: 74, realistic_extra_year: 17971 }, status: 'contacted' },
      { id: 'd3', created_at: new Date(n - 70 * h).toISOString(), source: 'contact', name: 'Lina Haddad', email: 'lina@example.com', services: 'Meta & Google ads', stage: 'New store, not launched', budget: 'Not sure yet', timeline: 'Just exploring', status: 'lost' }
    ];
  }
  function load() {
    if (DEMO) { rows = demoRows(); loaded = true; err = ''; render(); return; }
    sb.from('leads').select('*').order('created_at', { ascending: false }).limit(500).then(function (r) {
      if (r.error) { err = r.error.message || 'error'; rows = []; } else { rows = r.data || []; err = ''; }
      loaded = true; render();
    });
  }
  function badge() {
    var b = $('tabBtnD'); if (!b) return; var old = b.querySelector('.ad-badge'); if (old) old.remove();
    var n = rows.filter(function (x) { return x.status === 'new'; }).length;
    if (n) { var s = el('span', 'ad-badge', String(n)); s.setAttribute('aria-label', n + ' new'); b.appendChild(s); }
  }
  function setStatus(row, v, sel) {
    var prev = row.status; row.status = v;
    if (DEMO) { render(); return; }
    sel.disabled = true;
    sb.from('leads').update({ status: v }).eq('id', row.id).select('id').then(function (r) {
      sel.disabled = false;
      if (r.error || !r.data || !r.data.length) { row.status = prev; sel.value = prev; alert('Could not save the status. Press Refresh and try again.'); return; }
      render();
    });
  }
  function csv() {
    var cols = ['created_at', 'source', 'status', 'name', 'email', 'link', 'services', 'stage', 'budget', 'timeline', 'how_heard', 'message'];
    var esc = function (v) { v = v == null ? '' : String(v); if (/^[=+\-@]/.test(v)) v = "'" + v; return '"' + v.replace(/"/g, '""') + '"'; };
    var out = [cols.join(',')].concat(rows.map(function (r) { return cols.map(function (c) { return esc(r[c]); }).join(','); })).join('\n');
    var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([out], { type: 'text/csv' })); a.download = 'leads.csv'; a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
  }
  function render() {
    var host = $('tabLeads'); if (!host) return; host.textContent = '';
    badge();
    if (err) {
      var w = el('div', 'ad-warn'); w.appendChild(el('b', null, 'The leads table is not set up yet. ')); w.appendChild(document.createTextNode('Run section 6 of supabase/schema.sql once in the Supabase SQL editor, then press Refresh. Detail: ' + err)); host.appendChild(w); return;
    }
    var k = el('div', 'ad-kpis'), cnt = function (s) { return rows.filter(function (r) { return r.status === s; }).length; };
    var week = rows.filter(function (r) { return Date.now() - new Date(r.created_at).getTime() < 7 * 864e5; }).length;
    [['New (unanswered)', cnt('new')], ['Last 7 days', week], ['Contacted', cnt('contacted')], ['Won', cnt('won')], ['All time', rows.length]].forEach(function (a) { var d = el('div', 'ad-kpi'); d.appendChild(el('p', null, a[0])); d.appendChild(el('b', null, String(a[1]))); k.appendChild(d); });
    host.appendChild(k);
    var bar = el('div', 'ad-card-h'); bar.appendChild(el('h2', null, 'Requests from your site'));
    var act = el('div', 'ad-card-actions');
    [['all', 'All']].concat(STATUS).forEach(function (s) { var b = el('button', 'ad-btn ad-sm', s[1]); b.type = 'button'; if (filter === s[0]) b.style.background = '#ffd000'; b.addEventListener('click', function () { filter = s[0]; render(); }); act.appendChild(b); });
    var rf = el('button', 'ad-btn ad-sm', 'Refresh'); rf.type = 'button'; rf.addEventListener('click', load); act.appendChild(rf);
    var ex = el('button', 'ad-btn ad-sm', 'Export CSV'); ex.type = 'button'; ex.addEventListener('click', csv); act.appendChild(ex);
    bar.appendChild(act); var card = el('div', 'ad-card'); card.appendChild(bar);
    var list = rows.filter(function (r) { return filter === 'all' || r.status === filter; });
    if (!list.length) card.appendChild(el('p', 'ad-empty', loaded ? 'No requests here yet. They appear the moment someone sends the contact form or the calculator review form.' : 'Loading...'));
    list.forEach(function (r) {
      var it = el('article', 'ld-item' + (r.status === 'new' ? ' is-new' : ''));
      var top = el('div', 'ld-top');
      var who = el('div', 'ld-who'); who.appendChild(el('b', null, r.name || '(no name)'));
      var m = el('a', null, r.email || ''); if (r.email) { m.href = 'mailto:' + encodeURIComponent(r.email).replace('%40', '@'); } who.appendChild(m);
      top.appendChild(who);
      var meta = el('div', 'ld-meta'); meta.appendChild(el('span', 'ld-tag', r.source === 'calculator' ? 'Calculator' : 'Quote form')); meta.appendChild(el('span', null, when(r.created_at)));
      var sel = el('select'); sel.setAttribute('aria-label', 'Status for ' + (r.name || 'lead'));
      STATUS.forEach(function (s) { var o = el('option', null, s[1]); o.value = s[0]; if (r.status === s[0]) o.selected = true; sel.appendChild(o); });
      sel.addEventListener('change', function () { setStatus(r, sel.value, sel); }); meta.appendChild(sel); top.appendChild(meta); it.appendChild(top);
      var dl = el('dl', 'ld-dl');
      [['Needs', r.services], ['Stage', r.stage], ['Budget', r.budget], ['Start', r.timeline], ['Heard via', r.how_heard]].forEach(function (p) { if (p[1]) { dl.appendChild(el('dt', null, p[0])); dl.appendChild(el('dd', null, p[1])); } });
      if (r.link) { dl.appendChild(el('dt', null, 'Store')); var dd = el('dd'); if (SAFE.test(r.link)) { var a = el('a', null, r.link); a.href = r.link; a.target = '_blank'; a.rel = 'noopener noreferrer'; dd.appendChild(a); } else dd.textContent = r.link; dl.appendChild(dd); }
      if (r.numbers) { dl.appendChild(el('dt', null, 'Their numbers')); dl.appendChild(el('dd', null, (r.numbers.visitors || 0) + ' visitors/mo, ' + (r.numbers.conversion_pct || 0) + '% conversion, $' + (r.numbers.aov || 0) + ' orders. Realistic extra: $' + (r.numbers.realistic_extra_year || 0) + '/year')); }
      it.appendChild(dl);
      if (r.message) it.appendChild(el('p', 'ld-msg', r.message));
      card.appendChild(it);
    });
    host.appendChild(card);
  }
  function show() { if (!loaded) { render(); } load(); }
  function init(c) { ctx = c; sb = c.sb; DEMO = c.DEMO; if (!DEMO && sb) { sb.from('leads').select('id,status').eq('status', 'new').then(function (r) { if (!r.error && r.data) { rows = r.data.map(function (x) { return { status: x.status }; }); badge(); rows = []; } }); } else if (DEMO) { rows = demoRows(); badge(); rows = []; } }
  window.MMLeads = { init: init, show: show };
})();
