/* Privacy-friendly first-party analytics for Moses Mastery.
   Sends anonymous events (page views, clicks on calls-to-action, scroll depth, contact form sends) to your own Supabase table.
   No cookies, no IP address, no names or emails. Honors Do Not Track. Does nothing until js/config.js is filled in. */
(function () {
  'use strict';
  var C = window.MM_CONFIG || {};
  var off = !C.supabaseUrl || !C.supabaseAnonKey || navigator.doNotTrack === '1' || window.doNotTrack === '1';
  try { if (localStorage.getItem('mm_notrack') === '1') off = true; } catch (_) {}
  if (/(^|\/)(admin|account)\.html$/.test(location.pathname)) off = true;
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
        headers: { apikey: C.supabaseAnonKey, Authorization: 'Bearer ' + C.supabaseAnonKey, 'Content-Type': 'application/json', Prefer: 'return=minimal' }, body: JSON.stringify(body) }).catch(function () {});
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
  var seen = {};
  window.addEventListener('scroll', function () {
    var d = document.documentElement, h = d.scrollHeight - window.innerHeight; if (h < 200) return;
    var p = (window.scrollY || d.scrollTop) / h;
    [[0.5, 'scroll_50'], [0.9, 'scroll_90']].forEach(function (s) { if (p >= s[0] && !seen[s[1]]) { seen[s[1]] = 1; send(s[1]); } });
  }, { passive: true });
})();
