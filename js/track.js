/* Privacy-friendly first-party analytics for Moses Mastery.
   Sends anonymous events (page views, country/city, time on page, clicks on calls-to-action, scroll depth, form starts and sends, errors, speed) to your own Supabase table.
   No cookies, no names or emails, and your IP address is never stored (it is used once, by a geolocation service, to work out country and city). Honors Do Not Track. Does nothing until js/config.js is filled in. */
(function () {
  'use strict';
  var C = window.MM_CONFIG || {};
  /* save a form request to the database as a backup to the email (runs only when the visitor sends a form) */
  window.mmLead = function (d) {
    try {
      if (!C.supabaseUrl || !C.supabaseAnonKey) return;
      var cut = function (v, n) { return v == null || v === '' ? null : String(v).slice(0, n); };
      var row = { source: d.source === 'calculator' ? 'calculator' : 'contact', name: cut(d.name, 120), email: cut(d.email, 200), link: cut(d.link || d.store, 300), services: cut(d.services, 400), stage: cut(d.stage, 120), budget: cut(d.budget, 80), timeline: cut(d.timeline, 80), how_heard: cut(d.source_how || d.heard, 80), message: cut(d.mesg || d.message, 3000), numbers: d.numbers ? (typeof d.numbers === 'string' ? JSON.parse(d.numbers) : d.numbers) : null };
      fetch(C.supabaseUrl.replace(/\/$/, '') + '/rest/v1/leads', { method: 'POST', keepalive: true, headers: { apikey: C.supabaseAnonKey, 'Content-Type': 'application/json', Prefer: 'return=minimal' }, body: JSON.stringify(row) }).catch(function () {});
    } catch (_) {}
  };

  /* ---------- site controls (Dashboard > Controls): announcement bar, maintenance notice, switches ---------- */
  var T = {}; try { T = JSON.parse(localStorage.getItem('mm_settings') || '{}') || {}; } catch (_) {}
  var ADMINPAGE = /(^|\/)(admin|account)\.html$/.test(location.pathname);
  function mk(tag, css, txt) { var e = document.createElement(tag); if (css) e.style.cssText = css; if (txt) e.textContent = txt; return e; }
  function applyCtl(S) {
    if (ADMINPAGE || !document.body) return;
    var old = document.getElementById('mmAnn'); if (old) old.remove(); old = document.getElementById('mmMaint'); if (old) old.remove();
    if (S.maintenance && S.maintenance.on) {
      var pv = false; try { if (/[?&]preview=1/.test(location.search)) sessionStorage.setItem('mm_preview', '1'); pv = sessionStorage.getItem('mm_preview') === '1'; } catch (_) {}
      if (!pv) {
        var m = mk('div', 'position:fixed;inset:0;z-index:99999;background:#0c0806;color:#fff;display:grid;place-items:center;text-align:center;padding:2rem;font-family:Inter,system-ui,sans-serif'); m.id = 'mmMaint';
        var b = mk('div', 'max-width:560px'); b.appendChild(mk('h1', 'font-size:clamp(1.8rem,6vw,3rem);margin:0 0 1rem;letter-spacing:-.03em', 'Back shortly'));
        b.appendChild(mk('p', 'font-size:1.05rem;line-height:1.6;opacity:.85', (S.maintenance.message || 'We are making improvements. Please check back soon.').slice(0, 300)));
        m.appendChild(b); document.body.appendChild(m); return;
      }
    }
    var a = S.announce, dismissed = false; try { dismissed = sessionStorage.getItem('mm_ann') === (a && a.text); } catch (_) {}
    if (a && a.on && a.text && !dismissed) {
      var bar = mk('div', 'position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:9000;max-width:min(92vw,640px);background:#ff5b00;color:#111;font:600 .92rem Inter,system-ui,sans-serif;padding:.7rem 2.6rem .7rem 1.1rem;border-radius:14px;box-shadow:0 12px 30px -10px rgba(0,0,0,.5)'); bar.id = 'mmAnn';
      var safe = /^(https?:\/\/|\/|[a-z0-9\-]+\.html)/i.test(a.link || '');
      if (safe) { var l = mk('a', 'color:inherit;text-decoration:underline', a.text.slice(0, 160)); l.href = a.link; bar.appendChild(l); } else bar.appendChild(document.createTextNode(String(a.text).slice(0, 160)));
      var x = mk('button', 'position:absolute;right:6px;top:50%;transform:translateY(-50%);width:34px;height:34px;border:0;background:transparent;font-size:1.3rem;cursor:pointer;color:#111', '×'); x.setAttribute('aria-label', 'Dismiss');
      x.addEventListener('click', function () { bar.remove(); try { sessionStorage.setItem('mm_ann', a.text); } catch (_) {} }); bar.appendChild(x); document.body.appendChild(bar);
    }
  }
  function ctlInit() {
    applyCtl(T);
    if (!C.supabaseUrl || !C.supabaseAnonKey || ADMINPAGE) return;
    var age = Date.now() - (T._t || 0); if (age < 60000) return;
    fetch(C.supabaseUrl.replace(/\/$/, '') + '/rest/v1/site_settings?id=eq.1&select=data', { headers: { apikey: C.supabaseAnonKey } }).then(function (r) { return r.ok ? r.json() : []; }).then(function (rows) {
      var d = rows && rows[0] && rows[0].data; if (!d || typeof d !== 'object') return; d._t = Date.now();
      try { localStorage.setItem('mm_settings', JSON.stringify(d)); } catch (_) {}
      T = d; applyCtl(d); if (window.mmStartClarity) window.mmStartClarity();
    }).catch(function () {});
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ctlInit); else ctlInit();

  var off = !C.supabaseUrl || !C.supabaseAnonKey || navigator.doNotTrack === '1' || window.doNotTrack === '1';
  try { if (localStorage.getItem('mm_notrack') === '1') off = true; } catch (_) {}
  if (/(^|\/)(admin|account)\.html$/.test(location.pathname)) off = true;
  if (T.tracking === false) off = true; // switch in Dashboard > Controls
  window.mmTrack = function () {};
  if (off) return;

  function rid() { return (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Math.random()).slice(2) + Date.now().toString(36); }
  function store(area, k) { try { var v = area.getItem(k); if (!v) { v = rid(); area.setItem(k, v); } return v; } catch (_) { return rid(); } }
  var vid = store(localStorage, 'mm_vid'), sid = store(sessionStorage, 'mm_sid');
  var ua = navigator.userAgent, w = window.innerWidth;
  var device = /Mobi|Android|iPhone/i.test(ua) ? 'mobile' : (/iPad|Tablet/i.test(ua) || (w >= 600 && w < 1000 && 'ontouchstart' in window)) ? 'tablet' : 'desktop';
  var browser = /Edg\//.test(ua) ? 'Edge' : /OPR\/|Opera/.test(ua) ? 'Opera' : /SamsungBrowser/.test(ua) ? 'Samsung' : /Firefox\//.test(ua) ? 'Firefox' : /Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : 'Other';
  var os = /Windows/.test(ua) ? 'Windows' : /Android/.test(ua) ? 'Android' : /iPhone|iPad|iOS/.test(ua) ? 'iOS' : /Mac OS/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : 'Other';
  var q = new URLSearchParams(location.search), tz = ''; try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (_) {}
  var refHost = ''; try { if (document.referrer) { refHost = new URL(document.referrer).hostname.replace(/^www\./, ''); if (refHost === location.hostname.replace(/^www\./, '')) refHost = ''; } } catch (_) {}
  var queue = [];

  function send(type, meta) {
    var body = { vid: vid, sid: sid, type: type, path: location.pathname.slice(0, 300), title: document.title.slice(0, 160), ref: refHost || null,
      device: device, browser: browser, os: os, w: w, tz: tz || null, utm_source: q.get('utm_source'), utm_medium: q.get('utm_medium'), utm_campaign: q.get('utm_campaign'), meta: meta || {} };
    try {
      fetch(C.supabaseUrl.replace(/\/$/, '') + '/rest/v1/events', { method: 'POST', keepalive: true,
        headers: { apikey: C.supabaseAnonKey, 'Content-Type': 'application/json', Prefer: 'return=minimal' }, body: JSON.stringify(body) }).catch(function () {});
    } catch (_) {}
  }
  window.mmTrack = send;
  send('page_view');

  // clicks on calls-to-action and outbound social/contact links
  var KEYS = [['calendly.com', 'book_call'], ['mailto:', 'email_click'], ['tel:', 'phone_click'], ['wa.me', 'whatsapp_click'], ['instagram.com', 'instagram_click'],
    ['x.com', 'x_click'], ['t.me', 'telegram_click'], ['pin.it', 'pinterest_click'], ['account.html', 'sign_in_click'], ['contact.html', 'contact_click']];
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]'); if (!a) return;
    var h = a.getAttribute('href') || '', lab = a.getAttribute('data-track') || (a.textContent || '').trim().slice(0, 60);
    for (var i = 0; i < KEYS.length; i++) if (h.indexOf(KEYS[i][0]) !== -1) { send(KEYS[i][1], { label: lab, href: h.slice(0, 200) }); return; }
    if (a.classList.contains('bg-tile') || a.classList.contains('pj-store')) send('store_click', { label: lab, href: h.slice(0, 200) });
  }, true);

  // scroll depth (50% and 90%, once per page)
  var seen = {}, maxScroll = 0;
  window.addEventListener('scroll', function () {
    var d = document.documentElement, h = d.scrollHeight - window.innerHeight; if (h < 200) return;
    var p = (window.scrollY || d.scrollTop) / h; if (p > maxScroll) maxScroll = p;
    [[0.5, 'scroll_50'], [0.9, 'scroll_90']].forEach(function (s) { if (p >= s[0] && !seen[s[1]]) { seen[s[1]] = 1; send(s[1]); } });
  }, { passive: true });

  // where the visitor is (country / region / city, never the IP address). One lookup per session, remembered for a week.
  (function () {
    try { if (sessionStorage.getItem('mm_geo_sent')) return; } catch (_) {}
    function done(g) { try { sessionStorage.setItem('mm_geo_sent', '1'); } catch (_) {} send('visitor_geo', { geo: g }); }
    var c = null; try { c = JSON.parse(localStorage.getItem('mm_geo') || 'null'); } catch (_) {}
    if (c && c.g && Date.now() - c.t < 6048e5) return done(c.g);
    var clip = function (v, n) { return v ? String(v).slice(0, n) : null; };
    fetch('https://ipwho.is/?fields=success,country,country_code,region,city', { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (j) {
      if (!j || !j.success) throw 0;
      var g = { cc: clip(j.country_code, 2), country: clip(j.country, 60), region: clip(j.region, 60), city: clip(j.city, 60) };
      try { localStorage.setItem('mm_geo', JSON.stringify({ t: Date.now(), g: g })); } catch (_) {}
      done(g);
    }).catch(function () { done({ cc: null, tz: tz || null }); });
  })();

  // time on page + deepest scroll, sent when the visitor leaves or switches tab
  var shown = Date.now(), activeMs = 0, vis = !document.hidden;
  function leave() {
    if (vis) { activeMs += Date.now() - shown; vis = false; }
    var s = Math.min(1800, Math.round(activeMs / 1000)); if (s < 1) return;
    send('page_leave', { secs: s, scroll: Math.round(maxScroll * 100) }); activeMs = 0;
  }
  document.addEventListener('visibilitychange', function () { if (document.hidden) leave(); else { vis = true; shown = Date.now(); } });
  window.addEventListener('pagehide', leave);

  // contact form: who starts it (never what they type)
  var formStarted = false;
  document.addEventListener('focusin', function (e) {
    var f = e.target.closest && e.target.closest('form.cont-form'); if (f && !formStarted) { formStarted = true; send('form_start'); }
  });
  document.querySelectorAll('form input, form textarea, form select').forEach(function (i) { i.setAttribute('data-clarity-mask', 'True'); });

  // frustration: rapid repeated taps on the same spot (rage clicks)
  var taps = [], lastRage = 0;
  document.addEventListener('click', function (e) {
    var now = Date.now(); taps = taps.filter(function (t) { return now - t.t < 800 && Math.abs(t.x - e.clientX) < 32 && Math.abs(t.y - e.clientY) < 32; });
    taps.push({ t: now, x: e.clientX, y: e.clientY });
    if (taps.length >= 3 && now - lastRage > 5000) {
      lastRage = now; var el = e.target, tag = (el.tagName || '').toLowerCase(), txt = /^(input|textarea|select)$/.test(tag) ? '' : (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40);
      send('rage_click', { el: (tag + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : '')).slice(0, 80), text: txt });
    }
  }, true);

  // broken things: JavaScript errors (max 3 per page)
  var errs = 0;
  function err(msg, src, line) { if (errs++ >= 3) return; send('js_error', { msg: String(msg || '').slice(0, 160), src: String(src || '').split('/').pop().slice(0, 60), line: line || 0 }); }
  window.addEventListener('error', function (e) { err(e.message, e.filename, e.lineno); });
  window.addEventListener('unhandledrejection', function (e) { err('Promise: ' + (e.reason && e.reason.message || e.reason), '', 0); });

  // speed: largest paint + server response, once per page
  try {
    var lcp = 0; if ('PerformanceObserver' in window) new PerformanceObserver(function (l) { var en = l.getEntries(); if (en.length) lcp = en[en.length - 1].startTime; }).observe({ type: 'largest-contentful-paint', buffered: true });
    window.addEventListener('load', function () { setTimeout(function () {
      var n = performance.getEntriesByType('navigation')[0] || {}; send('perf', { lcp: Math.round(lcp), ttfb: Math.round(n.responseStart || 0), load: Math.round(n.loadEventEnd || 0) });
    }, 3500); });
  } catch (_) {}

  // optional: Microsoft Clarity session recordings + heatmaps. The project ID comes from Dashboard > Recordings (or clarityId in js/config.js).
  // Skipped for Europe-timezone visitors until a consent banner exists. Form fields are masked.
  var clarityOn = false;
  window.mmStartClarity = function () {
    var id = C.clarityId || (T && T.clarityId); if (clarityOn || !id || !/^[a-z0-9]{6,16}$/i.test(id) || (T && T.clarity === false) || /^Europe\//.test(tz)) return;
    clarityOn = true;
    (function (c, l, a, r, i, t, y) { c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); }; t = l.createElement(r); t.async = 1; t.src = 'https://www.clarity.ms/tag/' + i; y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y); })(window, document, 'clarity', 'script', id);
  };
  window.mmStartClarity();
})();
