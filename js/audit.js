(function () {
  var f = document.getElementById('auditForm'); if (!f) return;
  var st = document.getElementById('auditStatus'), started = false;
  var C = window.MM_CONFIG || {};
  f.addEventListener('input', function () { if (!started) { started = true; if (window.mmTrack) window.mmTrack('form_start', { form: 'audit' }); } });

  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
  function cal() { var a = el('a', null, 'Book a free strategy call'); a.href = 'https://calendly.com/onwenmoses/30min'; a.onclick = function () { if (window.Calendly) { Calendly.initPopupWidget({ url: 'https://calendly.com/onwenmoses/30min?hide_gdpr_banner=1&primary_color=f7cb1a' }); return false; } }; return a; }
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
      cats.push({ name: 'Page Speed', w: 20, score: perf, items: it, hint: 'Mobile load speed (Google PageSpeed)' });
    }
    var mob = ['viewport', 'tap-targets', 'target-size', 'font-size', 'content-width'].filter(function (id) { return A[id] && A[id].score != null && A[id].scoreDisplayMode !== 'notApplicable'; });
    if (mob.length) { var ms = Math.round(mob.reduce(function (s, id) { return s + A[id].score; }, 0) / mob.length * 100); cats.push({ name: 'Mobile Experience', w: 15, score: ms, items: mob.map(function (id) { return { label: A[id].title, ok: A[id].score >= 0.9 }; }), hint: 'Viewport, tap targets, readable text' }); }
    var seo = pc('seo'); if (seo != null) cats.push({ name: 'SEO Basics', w: 15, score: seo, items: failing(lr, 'seo', 4).concat(seo >= 90 ? [{ label: 'Core search checks passed', ok: true }] : []), hint: 'Titles, descriptions, crawlability' });
    var bp = pc('best-practices'); if (bp != null) cats.push({ name: 'Technical Health', w: 10, score: bp, items: failing(lr, 'best-practices', 4).concat(bp >= 90 ? [{ label: 'HTTPS, scripts and browser checks look healthy', ok: true }] : []), hint: 'HTTPS, errors, modern code' });
    var ax = pc('accessibility'); if (ax != null) cats.push({ name: 'UX & Accessibility', w: 10, score: ax, items: failing(lr, 'accessibility', 4).concat(ax >= 90 ? [{ label: 'Contrast, labels and structure look good' , ok: true }] : []), hint: 'Contrast, labels, usability' });
    var nr = (A['network-requests'] && A['network-requests'].details && A['network-requests'].details.items) || [], urls = nr.map(function (x) { return x.url || ''; }).join(' ').toLowerCase();
    if (nr.length) {
      var tools = [['Analytics (Google Analytics / Tag Manager)', /googletagmanager|google-analytics|gtag/], ['Ad pixel (Meta or TikTok)', /connect\.facebook|facebook\.net|analytics\.tiktok|snap(chat)?\.com\/scevent/], ['Email / SMS capture (Klaviyo, Omnisend...)', /klaviyo|omnisend|mailchimp|privy|attentive|postscript|smsbump/], ['Reviews app (Judge.me, Loox, Yotpo...)', /judge\.me|loox|yotpo|stamped|okendo|junip|trustpilot/]];
      var found = tools.map(function (t) { return { label: t[0], ok: t[1].test(urls) }; });
      cats.push({ name: 'Marketing Tools', w: 10, score: Math.round(found.filter(function (x) { return x.ok; }).length / found.length * 100), items: found, hint: 'Tracking and growth tools detected on load', note: 'Detected when the page loads. Tools that load only after cookie consent or run server-side may not show.' });
    }
    if (srv) {
      if (srv.trust) cats.push({ name: 'Trust & Credibility', w: 7, score: srv.trust.score, items: srv.trust.items, hint: 'Policies, contact, reviews, payments' });
      if (srv.conversion) cats.push({ name: 'Conversion Signals', w: 7, score: srv.conversion.score, items: srv.conversion.items, hint: 'Buttons, search, offers, email capture' });
      if (srv.product) cats.push({ name: 'Product Page SEO', w: 6, score: srv.product.score, items: srv.product.items, hint: 'Schema, price, images, headings' });
    }
    var have = {}; cats.forEach(function (c) { have[c.name] = 1; });
    var missing = ['Trust & Credibility', 'Conversion Signals', 'Product Page SEO'].filter(function (n) { return !have[n]; });
    return { cats: cats, missing: missing };
  }

  function render(box, res, name) {
    box.innerHTML = '';
    var tw = res.cats.reduce(function (s, c) { return s + c.w; }, 0), overall = Math.round(res.cats.reduce(function (s, c) { return s + c.score * c.w; }, 0) / (tw || 1));
    var head = el('div', 'aud-score ' + tone(overall)); head.appendChild(el('strong', null, String(overall)));
    var sp = el('span'); sp.appendChild(el('b', null, 'Overall store score')); sp.appendChild(el('em', null, overall >= 80 ? 'Strong base. Fine-tuning will pay off.' : overall >= 55 ? 'Average. There is clear room to improve.' : 'Needs attention. Fixing these will likely lift sales.')); head.appendChild(sp); box.appendChild(head);
    var list = el('div', 'aud-cats');
    res.cats.forEach(function (c) {
      var d = el('details', 'aud-cat ' + tone(c.score)), s = el('summary');
      var l = el('span', 'aud-cn'); l.appendChild(el('b', null, c.name)); l.appendChild(el('i', null, c.hint)); s.appendChild(l);
      var r = el('span', 'aud-cr'); r.appendChild(el('strong', null, String(c.score))); r.appendChild(el('em', null, label(c.score))); s.appendChild(r);
      var bar = el('span', 'aud-bar'); var bi = el('b'); bi.style.width = c.score + '%'; bar.appendChild(bi); s.appendChild(bar); d.appendChild(s);
      var ul = el('ul', 'aud-its'); c.items.forEach(function (i) { var li = el('li', i.ok ? 'ok' : 'no', i.label); ul.appendChild(li); }); d.appendChild(ul);
      if (c.note) d.appendChild(el('p', 'aud-fine', c.note));
      list.appendChild(d);
    });
    res.missing.forEach(function (n) { var d = el('div', 'aud-cat aud-soon'), s = el('div', 'aud-sum'); var l = el('span', 'aud-cn'); l.appendChild(el('b', null, n)); l.appendChild(el('i', null, 'Included in my personal review')); s.appendChild(l); d.appendChild(s); list.appendChild(d); });
    box.appendChild(list);
    var n = el('p', 'aud-next'); n.appendChild(el('strong', null, 'Next: ')); n.appendChild(document.createTextNode(name + ', I will personally go through your design, product pages and checkout and email you my top fixes within 24 hours. Want to talk sooner? ')); n.appendChild(cal()); n.appendChild(document.createTextNode('.')); box.appendChild(n);
    box.appendChild(el('p', 'aud-fine', 'Speed, SEO, mobile and technical data come from Google PageSpeed Insights (mobile, lab test). Scores shift a little between runs. This is an automated check of what can be measured from outside your store, not a guarantee of sales.'));
  }

  f.addEventListener('submit', function (e) {
    e.preventDefault();
    if (f.elements.botcheck && f.elements.botcheck.checked) return;
    var data = {}, fd = new FormData(f);
    fd.forEach(function (v, k) { data[k] = v; });
    delete data.botcheck;
    data.store = normUrl(data.store);
    var name = String(data.name).split(/\s+/)[0].replace(/[<>&"]/g, '');
    var msg = 'FREE AUDIT REQUEST (instant scan run)\nStore: ' + data.store + '\nBiggest problem: ' + data.problem + (data.note ? '\nNote: ' + data.note : '');
    data.message = msg;
    if (window.mmLead) window.mmLead({ source: 'contact', name: data.name, email: data.email, store: data.store, stage: 'Free audit', message: msg });
    var btn = f.querySelector('button'), tx = btn.querySelector('.mm-cta-tx'), label0 = tx.textContent;
    btn.disabled = true; tx.textContent = 'Scanning...'; st.className = 'calc-status'; st.textContent = '';
    var sent = fetch('https://api.web3forms.com/submit', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(data) }).then(function (r) { return r.json(); }).catch(function () { return { success: false }; });
    var box = el('div', 'aud-res'); box.setAttribute('aria-live', 'polite');
    var load = el('div', 'aud-load'); load.appendChild(el('i')); var lp = el('p', null, 'Scanning ' + data.store + ' ... about 20 to 40 seconds. Checking speed, mobile, SEO, trust and conversion signals.'); load.appendChild(lp); box.appendChild(load);
    f.parentNode.insertBefore(box, f); f.style.display = 'none';
    box.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (window.mmTrack) window.mmTrack('form_submit', { form: 'audit' });
    var t0 = Date.now();
    Promise.all([psi(data.store).catch(function () { return null; }), server(data.store)]).then(function (r) {
      var lr = r[0], srv = r[1];
      if (!lr && !srv) throw new Error('none');
      var res = lr ? build(lr, srv) : build({ audits: {}, categories: {} }, srv);
      if (!res.cats.length) throw new Error('none');
      render(box, res, name);
      if (window.mmTrack) window.mmTrack('audit_scan', { ok: true, ms: Date.now() - t0, cats: res.cats.length });
    }).catch(function () {
      box.innerHTML = '';
      sent.then(function (j) {
        var p = el('p', 'aud-next');
        if (j && j.success) { p.appendChild(el('strong', null, 'Thank you, ' + name + '. ')); p.appendChild(document.createTextNode('The instant scan could not read that store right now (it may be password protected, or the scanning service is busy). Your request reached me, and I will email you my review within 24 hours. Want to talk sooner? ')); p.appendChild(cal()); p.appendChild(document.createTextNode('.')); box.appendChild(p); }
        else { f.style.display = ''; box.remove(); btn.disabled = false; tx.textContent = label0; st.className = 'calc-status err'; st.textContent = 'Sorry, that did not work. Please check the link and try again, or email info@mosesecom.com.'; }
      });
    });
  });
})();
