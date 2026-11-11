(function () {
  var f = document.getElementById('auditForm'); if (!f) return;
  var st = document.getElementById('auditStatus'), started = false, running = false;
  var C = window.MM_CONFIG || {};
  f.addEventListener('input', function () { if (!started) { started = true; if (window.mmTrack) window.mmTrack('form_start', { form: 'audit' }); } });

  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
  function calBtn(txt, cls) { var a = el('a', cls || 'mm-cta aud-btn', txt || 'Book a free strategy call'); a.href = 'https://calendly.com/onwenmoses/30min'; a.onclick = function () { if (window.Calendly) { Calendly.initPopupWidget({ url: 'https://calendly.com/onwenmoses/30min?hide_gdpr_banner=1&primary_color=f7cb1a' }); return false; } }; return a; }
  function normUrl(v) { v = String(v || '').trim(); if (!/^https?:\/\//i.test(v)) v = 'https://' + v; return v; }
  function tone(s) { return s >= 80 ? 'good' : s >= 55 ? 'mid' : 'bad'; }
  function label(s) { return s >= 80 ? 'Strong' : s >= 55 ? 'Average' : 'Needs work'; }

  /* ---------- data sources ---------- */
  function psi(url) {
    var q = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed?strategy=mobile&category=performance&category=seo&category=accessibility&category=best-practices&url=' + encodeURIComponent(url) + (C.psiKey ? '&key=' + encodeURIComponent(C.psiKey) : '');
    return fetch(q).then(function (r) { return r.json().then(function (j) { if (!r.ok || !j.lighthouseResult) throw new Error('psi'); return j.lighthouseResult; }); });
  }
  function server(url) {
    if (!C.supabaseUrl) return Promise.resolve(null);
    var ctl = ('AbortController' in window) ? new AbortController() : null, t = setTimeout(function () { if (ctl) ctl.abort(); }, 20000);
    return fetch(C.supabaseUrl.replace(/\/$/, '') + '/functions/v1/scan', { method: 'POST', signal: ctl ? ctl.signal : undefined, headers: { 'Content-Type': 'application/json', apikey: C.supabaseAnonKey || '', Authorization: 'Bearer ' + (C.supabaseAnonKey || '') }, body: JSON.stringify({ url: url }) })
      .then(function (r) { return r.ok ? r.json() : null; }).then(function (j) { return j && j.ok ? j : null; }).catch(function () { return null; }).then(function (v) { clearTimeout(t); return v; });
  }

  /* ---------- scoring ---------- */
  function failing(lr, cat, n) {
    var cc = lr.categories[cat]; if (!cc) return [];
    return cc.auditRefs.filter(function (r) { var a = lr.audits[r.id]; return r.weight > 0 && a && a.score != null && a.score < 0.9 && a.scoreDisplayMode !== 'notApplicable' && a.scoreDisplayMode !== 'manual'; })
      .sort(function (x, y) { return y.weight - x.weight; }).slice(0, n).map(function (r) { return { label: lr.audits[r.id].title, ok: false }; });
  }
  function build(lr, srv) {
    var A = lr.audits, cats = [], cs = lr.categories;
    function pc(k) { return cs[k] && cs[k].score != null ? Math.round(cs[k].score * 100) : null; }
    var perf = pc('performance');
    if (perf != null) {
      var it = [];
      [['largest-contentful-paint', 'Main content shows in'], ['first-contentful-paint', 'First content shows in'], ['total-blocking-time', 'Page feels frozen for'], ['cumulative-layout-shift', 'Layout shift']].forEach(function (m) { if (A[m[0]]) it.push({ label: m[1] + ' ' + (A[m[0]].displayValue || '-'), ok: A[m[0]].score >= 0.9 }); });
      Object.keys(A).map(function (k) { return A[k]; }).filter(function (a) { return a.details && a.details.type === 'opportunity' && a.score != null && a.score < 0.9 && a.details.overallSavingsMs > 200; }).sort(function (x, y) { return y.details.overallSavingsMs - x.details.overallSavingsMs; }).slice(0, 3).forEach(function (a) { it.push({ label: a.title + ': could save about ' + (a.details.overallSavingsMs / 1000).toFixed(1) + ' s', ok: false }); });
      cats.push({ name: 'Page Speed', w: 20, score: perf, items: it, hint: 'Mobile load speed' });
    }
    var mob = ['viewport', 'tap-targets', 'target-size', 'font-size', 'content-width'].filter(function (id) { return A[id] && A[id].score != null && A[id].scoreDisplayMode !== 'notApplicable'; });
    if (mob.length) { var ms = Math.round(mob.reduce(function (s, id) { return s + A[id].score; }, 0) / mob.length * 100); cats.push({ name: 'Mobile Experience', w: 15, score: ms, items: mob.map(function (id) { return { label: A[id].title, ok: A[id].score >= 0.9 }; }), hint: 'Viewport, tap targets, text' }); }
    var seo = pc('seo'); if (seo != null) cats.push({ name: 'SEO Basics', w: 15, score: seo, items: failing(lr, 'seo', 4).concat(seo >= 90 ? [{ label: 'Core search checks passed', ok: true }] : []), hint: 'Titles, descriptions, crawlability' });
    var bp = pc('best-practices'); if (bp != null) cats.push({ name: 'Technical Health', w: 10, score: bp, items: failing(lr, 'best-practices', 4).concat(bp >= 90 ? [{ label: 'HTTPS, scripts and browser checks look healthy', ok: true }] : []), hint: 'HTTPS, errors, modern code' });
    var ax = pc('accessibility'); if (ax != null) cats.push({ name: 'UX & Accessibility', w: 10, score: ax, items: failing(lr, 'accessibility', 4).concat(ax >= 90 ? [{ label: 'Contrast, labels and structure look good', ok: true }] : []), hint: 'Contrast, labels, usability' });
    var nr = (A['network-requests'] && A['network-requests'].details && A['network-requests'].details.items) || [], urls = nr.map(function (x) { return x.url || ''; }).join(' ').toLowerCase();
    if (nr.length) {
      var tools = [['Analytics (Google Analytics / Tag Manager) not detected', 'Analytics detected', /googletagmanager|google-analytics|gtag/], ['No ad pixel (Meta or TikTok) detected', 'Ad pixel detected', /connect\.facebook|facebook\.net|analytics\.tiktok|snap(chat)?\.com\/scevent/], ['No email / SMS capture tool detected', 'Email / SMS capture tool detected', /klaviyo|omnisend|mailchimp|privy|attentive|postscript|smsbump/], ['No reviews app detected', 'Reviews app detected', /judge\.me|loox|yotpo|stamped|okendo|junip|trustpilot/]];
      var found = tools.map(function (t) { var ok = t[2].test(urls); return { label: ok ? t[1] : t[0], ok: ok }; });
      cats.push({ name: 'Marketing Tools', w: 10, score: Math.round(found.filter(function (x) { return x.ok; }).length / found.length * 100), items: found, hint: 'Tracking and growth tools', note: 'Detected when the page loads. Tools that load only after cookie consent or run server-side may not show.' });
    }
    if (srv) {
      if (srv.trust) cats.push({ name: 'Trust & Credibility', w: 7, score: srv.trust.score, items: srv.trust.items, hint: 'Policies, contact, reviews' });
      if (srv.conversion) cats.push({ name: 'Conversion Signals', w: 7, score: srv.conversion.score, items: srv.conversion.items, hint: 'Buttons, offers, email capture' });
      if (srv.product) cats.push({ name: 'Product Page SEO', w: 6, score: srv.product.score, items: srv.product.items, hint: 'Schema, price, images' });
    }
    var have = {}; cats.forEach(function (c) { have[c.name] = 1; });
    var missing = ['Trust & Credibility', 'Conversion Signals', 'Product Page SEO'].filter(function (n) { return !have[n]; });
    return { cats: cats, missing: missing };
  }

  /* ranked fixes: impact = category weight x how far the category is from 100 */
  function fixes(res) {
    var all = [];
    res.cats.forEach(function (c) { c.items.forEach(function (i) { if (!i.ok) all.push({ cat: c.name, label: i.label, impact: c.w * (100 - c.score) }); }); });
    all.sort(function (a, b) { return b.impact - a.impact; });
    all = all.slice(0, 10);
    all.forEach(function (x, i) { x.sev = i < 3 && x.impact >= 250 ? 'High' : i < 7 && x.impact >= 100 ? 'Medium' : 'Low'; });
    return all;
  }

  function render(box, res, host) {
    box.innerHTML = '';
    var tw = res.cats.reduce(function (s, c) { return s + c.w; }, 0), overall = Math.round(res.cats.reduce(function (s, c) { return s + c.score * c.w; }, 0) / (tw || 1));
    var fx = fixes(res), hi = fx.filter(function (x) { return x.sev === 'High'; }).length, med = fx.filter(function (x) { return x.sev === 'Medium'; }).length;
    var head = el('div', 'aud-score ' + tone(overall)); head.appendChild(el('strong', null, String(overall)));
    var sp = el('span'); sp.appendChild(el('b', null, host + ': overall store score')); sp.appendChild(el('em', null, overall >= 80 ? 'Strong base. Fine-tuning will pay off.' : overall >= 55 ? 'Average. There is clear room to improve.' : 'Needs attention. Fixing these will likely lift sales.')); head.appendChild(sp); box.appendChild(head);

    var sum = el('div', 'aud-sumrow');
    [[hi, 'High priority'], [med, 'Medium'], [fx.length - hi - med, 'Low'], [res.cats.length, 'Areas scanned']].forEach(function (m) { var d = el('div'); d.appendChild(el('strong', null, String(m[0]))); d.appendChild(el('span', null, m[1])); sum.appendChild(d); });
    box.appendChild(sum);

    box.appendChild(el('h3', 'aud-h', 'Category breakdown'));
    var list = el('div', 'aud-cats');
    res.cats.forEach(function (c) {
      var d = el('details', 'aud-cat ' + tone(c.score)), s = el('summary');
      var l = el('span', 'aud-cn'); l.appendChild(el('b', null, c.name)); l.appendChild(el('i', null, c.hint)); s.appendChild(l);
      var r = el('span', 'aud-cr'); r.appendChild(el('strong', null, String(c.score))); r.appendChild(el('em', null, label(c.score))); s.appendChild(r);
      var bar = el('span', 'aud-bar'); var bi = el('b'); bi.style.width = '0%'; bar.appendChild(bi); s.appendChild(bar); d.appendChild(s);
      var ul = el('ul', 'aud-its'); c.items.forEach(function (i) { ul.appendChild(el('li', i.ok ? 'ok' : 'no', i.label)); }); d.appendChild(ul);
      if (c.note) d.appendChild(el('p', 'aud-fine', c.note));
      list.appendChild(d);
      requestAnimationFrame(function () { requestAnimationFrame(function () { bi.style.width = c.score + '%'; }); });
    });
    res.missing.forEach(function (n) { var d = el('div', 'aud-cat aud-soon'), s = el('div', 'aud-sum'); var l = el('span', 'aud-cn'); l.appendChild(el('b', null, n)); l.appendChild(el('i', null, 'Needs a personal review')); s.appendChild(l); d.appendChild(s); list.appendChild(d); });
    box.appendChild(list);

    if (fx.length) {
      box.appendChild(el('h3', 'aud-h', 'Top ' + fx.length + ' priority fixes'));
      var fl = el('ol', 'aud-fx');
      fx.forEach(function (x) { var li = el('li', 'sev-' + x.sev.toLowerCase()); li.appendChild(el('em', null, x.sev)); var t = el('span'); t.appendChild(el('b', null, x.label)); t.appendChild(el('i', null, x.cat)); li.appendChild(t); fl.appendChild(li); });
      box.appendChild(fl);
    }

    var cta = el('div', 'aud-cta'); cta.appendChild(el('h3', null, 'Want these fixed properly?'));
    cta.appendChild(el('p', null, 'I will walk through your results, show what matters most for your store and give you a fixed quote. No obligation.'));
    var row = el('div', 'aud-ctarow'); row.appendChild(calBtn('Book a free strategy call'));
    var wa = el('a', 'aud-btn2', 'Message me on WhatsApp'); wa.href = 'https://wa.me/15818095630?text=' + encodeURIComponent('Hi Moses, I just scanned ' + host + ' on your site (score ' + overall + '). Can you help me fix it?'); wa.target = '_blank'; wa.rel = 'noopener'; row.appendChild(wa);
    var again = el('button', 'aud-btn2', 'Scan another store'); again.type = 'button'; again.onclick = function () { box.remove(); f.style.display = ''; f.elements.store.value = ''; f.elements.store.focus(); running = false; }; row.appendChild(again);
    cta.appendChild(row); box.appendChild(cta);
    box.appendChild(el('p', 'aud-fine', 'Speed, SEO, mobile and technical data come from Google PageSpeed Insights (mobile, lab test), plus my own checks of your public pages. Scores shift a little between runs. This is an automated check of what can be measured from outside your store, not a guarantee of sales.'));
  }

  /* ---------- scanning animation (steps tick as time passes; the last one waits for real data) ---------- */
  var STEPS = ['Validating URL', 'Loading your store on a phone', 'Measuring page speed', 'Checking SEO basics', 'Reading trust signals', 'Detecting marketing tools', 'Analysing product pages', 'Building your report'];
  function loader(host) {
    var w = el('div', 'aud-load2'); w.appendChild(el('i', 'aud-spin'));
    w.appendChild(el('h3', null, 'Scanning ' + host + '...'));
    w.appendChild(el('p', null, 'Usually 10 to 30 seconds. Please keep this page open.'));
    var ul = el('ul', 'aud-steps'), lis = STEPS.map(function (s) { var li = el('li', null, s); ul.appendChild(li); return li; });
    w.appendChild(ul);
    var n = 0, tm = setInterval(function () { if (n < lis.length - 1) { lis[n].className = 'done'; n++; lis[n].className = 'now'; } }, 2200); lis[0].className = 'now';
    w.stop = function () { clearInterval(tm); lis.forEach(function (li) { li.className = 'done'; }); };
    return w;
  }

  f.addEventListener('submit', function (e) {
    e.preventDefault(); if (running) return;
    var url = normUrl(f.elements.store.value), host;
    try { host = new URL(url).hostname.replace(/^www\./, ''); } catch (x) { st.className = 'calc-status err'; st.textContent = 'That does not look like a store link. Try yourstore.com'; return; }
    running = true; st.textContent = '';
    var box = el('div', 'aud-res'); box.setAttribute('aria-live', 'polite');
    var ld = loader(host); box.appendChild(ld);
    f.parentNode.insertBefore(box, f); f.style.display = 'none';
    box.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (window.mmTrack) window.mmTrack('form_submit', { form: 'audit', store: host });
    var t0 = Date.now();
    Promise.all([psi(url).catch(function () { return null; }), server(url)]).then(function (r) {
      var lr = r[0], srv = r[1];
      if (!lr && !srv) throw new Error('none');
      var res = build(lr || { audits: {}, categories: {} }, srv);
      if (!res.cats.length) throw new Error('none');
      ld.stop(); setTimeout(function () { render(box, res, host); box.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 350);
      if (window.mmTrack) window.mmTrack('audit_scan', { ok: true, ms: Date.now() - t0, cats: res.cats.length });
    }).catch(function () {
      ld.stop(); box.remove(); f.style.display = ''; running = false;
      st.className = 'calc-status err'; st.textContent = 'I could not scan that store. Check the link (password-protected stores cannot be scanned) and try again in a minute, or message me on WhatsApp and I will check it for you.';
      if (window.mmTrack) window.mmTrack('audit_scan', { ok: false, ms: Date.now() - t0 });
    });
  });
})();
