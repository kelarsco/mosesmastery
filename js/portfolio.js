/* "All projects" on projects.html: when the dashboard's Projects manager is in use, render the grid from the database.
   If it is not configured, unreachable or empty, the static markup stays exactly as published (safe fallback). */
(function () {
  'use strict';
  var C = window.MM_CONFIG || {}, grid = document.querySelector('.pj-grid');
  if (!grid || !C.supabaseUrl || !C.supabaseAnonKey || !window.fetch) return;
  var H = { apikey: C.supabaseAnonKey };
  function safe(u) { return /^(https:\/\/|asset\/)/.test(u || '') ? u : ''; }
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function img(src, alt) { var i = el('img'); i.src = src; i.alt = alt || ''; i.loading = 'lazy'; i.decoding = 'async'; return i; }

  function build(r) {
    var m = safe(r.media_url); if (!m) return null;
    if (r.kind === 'video') {
      var f = el('figure', 'pj-item pj-video'), v = el('video'); f.setAttribute('data-type', 'video');
      v.muted = true; v.loop = true; v.setAttribute('playsinline', ''); v.preload = 'none'; v.setAttribute('data-src', m);
      if (safe(r.poster_url)) v.poster = r.poster_url; v.setAttribute('aria-label', r.title || 'Screen recording');
      f.appendChild(v); if (r.title) f.appendChild(el('figcaption', null, r.title)); return f;
    }
    if (r.kind === 'shot') {
      var b = el('button', 'dash-item pj-item'); b.type = 'button'; b.setAttribute('data-type', 'shot'); b.setAttribute('aria-label', 'Enlarge: ' + (r.alt || r.title || 'dashboard snapshot'));
      b.appendChild(img(m, r.alt || r.title)); return b;
    }
    var link = /^https?:\/\//.test(r.url || '') ? r.url : '';
    var a = el(link ? 'a' : 'div', 'pj-item pj-store'); a.setAttribute('data-type', 'store');
    if (link) { a.href = link; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.setAttribute('aria-label', (r.title || 'Store') + (r.tag ? ', ' + r.tag : '') + ' store (opens in a new tab)'); }
    var im = img(m, r.alt || (r.title + ' Shopify store homepage')); im.width = 1440; im.height = 900; a.appendChild(im);
    var cap = el('span', 'pj-cap'), l = el('span'); l.appendChild(el('strong', null, r.title)); if (r.subtitle) l.appendChild(el('em', null, r.subtitle));
    cap.appendChild(l); if (r.tag) cap.appendChild(el('span', 'brand-tag', r.tag)); a.appendChild(cap); return a;
  }

  function get(path) { return fetch(C.supabaseUrl + path, { headers: H }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }); }
  var managedP = fetch(C.supabaseUrl + '/rest/v1/rpc/portfolio_managed', { method: 'POST', headers: Object.assign({ 'Content-Type': 'application/json' }, H), body: '{}' }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); });
  Promise.all([managedP, get('/rest/v1/portfolio_items?select=*&visible=eq.true&deleted_at=is.null&order=sort.asc&limit=300')])
  .then(function (res) {
    var managed = res[0] === true, rows = res[1] || [];
    if (!managed) return;
    var nodes = rows.map(build).filter(Boolean);
    grid.textContent = ''; nodes.forEach(function (n) { grid.appendChild(n); });
    var counts = { all: nodes.length, store: 0, video: 0, shot: 0 };
    nodes.forEach(function (n) { counts[n.getAttribute('data-type')]++; });
    document.querySelectorAll('.pj-chips button').forEach(function (b) { var s = b.querySelector('small'); if (s) s.textContent = counts[b.getAttribute('data-pj')] || 0; });
    var on = document.querySelector('.pj-chips button[aria-pressed="true"]'); if (on && on.getAttribute('data-pj') !== 'all') on.click();
    if (window.mmPjVideos) window.mmPjVideos();
  }).catch(function () { /* keep the static grid */ });
})();
