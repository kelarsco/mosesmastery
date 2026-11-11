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
  var lastErr = '';
  function psi(url, tries) {
    tries = tries || 0;
    var q = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed?strategy=mobile&category=performance&category=seo&category=accessibility&category=best-practices&url=' + encodeURIComponent(url) + (C.psiKey ? '&key=' + encodeURIComponent(C.psiKey) : '');
    return fetch(q).then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) {
      if (r.ok && j.lighthouseResult) return j.lighthouseResult;
      var m = (j.error && j.error.message) || ('HTTP ' + r.status); lastErr = r.status + ': ' + String(m).slice(0, 160);
      if (r.status >= 500 && tries < 1) return new Promise(function (ok) { setTimeout(ok, 2500); }).then(function () { return psi(url, tries + 1); });
      throw new Error(lastErr);
    }); }, function (e) { lastErr = 'network: ' + (e && e.message || 'blocked'); throw e; });
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
      var tools = [['Analytics (Google Analytics / Tag Manager) not detected on page load', 'Analytics detected', /googletagmanager|google-analytics|gtag/], ['No ad pixel (Meta or TikTok) detected on page load', 'Ad pixel detected', /connect\.facebook|facebook\.net|analytics\.tiktok|snap(chat)?\.com\/scevent/], ['No email / SMS capture tool detected on page load', 'Email / SMS capture tool detected', /klaviyo|omnisend|mailchimp|privy|attentive|postscript|smsbump/], ['No reviews app detected on page load', 'Reviews app detected', /judge\.me|loox|yotpo|stamped|okendo|junip|trustpilot/]];
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
    all.forEach(function (x, i) { x.sev = i < 3 && x.impact >= 250 ? 'High' : i < 7 && x.impact >= 100 ? 'Medium' : 'Low'; if (x.cat === 'Marketing Tools' && x.sev === 'High') x.sev = 'Medium'; });
    return all;
  }


  /* ---------- PDF report ---------- */
  function loadPdf() {
    if (window.jspdf) return Promise.resolve();
    return new Promise(function (ok, no) { var sc = document.createElement('script'); sc.src = 'js/vendor/jspdf.min.js'; sc.onload = ok; sc.onerror = no; document.head.appendChild(sc); });
  }
  function ascii(t) { return String(t).replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, '-').replace(/[^\x20-\x7E]/g, ''); }
  function makePdf(res, host, overall, fx) {
    var J = window.jspdf.jsPDF, d = new J({ unit: 'pt', format: 'a4' }), W = 595, H = 842, M = 44, y = 0;
    var COL = { good: [34, 160, 90], mid: [235, 150, 20], bad: [220, 60, 60] };
    function rgb(t) { return COL[t]; }
    function need(h) { if (y + h > H - 60) { d.addPage(); y = 50; } }
    function text(t, x, size, bold, color, maxW) { d.setFont('helvetica', bold ? 'bold' : 'normal'); d.setFontSize(size); d.setTextColor.apply(d, color || [30, 30, 30]); var lines = d.splitTextToSize(ascii(t), maxW || (W - M * 2)); lines.forEach(function (ln) { d.text(ln, x, y); y += size * 1.3; }); return lines.length; }
    // header
    d.setFillColor(20, 20, 20); d.rect(0, 0, W, 96, 'F');
    d.setFont('helvetica', 'bold'); d.setFontSize(20); d.setTextColor(255, 255, 255); d.text('Store Audit Report', M, 46);
    d.setFont('helvetica', 'normal'); d.setFontSize(10); d.setTextColor(200, 200, 200); d.text(ascii(host) + '   |   ' + new Date().toISOString().slice(0, 10) + '   |   by Moses Mastery', M, 68);
    // score
    y = 154; var tn = tone(overall);
    d.setDrawColor.apply(d, rgb(tn)); d.setLineWidth(5); d.circle(M + 36, y - 6, 34, 'S');
    d.setFont('helvetica', 'bold'); d.setFontSize(26); d.setTextColor.apply(d, rgb(tn)); d.text(String(overall), M + 36, y + 3, { align: 'center' });
    d.setFontSize(14); d.setTextColor(30, 30, 30); d.text('Overall store score: ' + label(overall), M + 92, y - 10);
    d.setFont('helvetica', 'normal'); d.setFontSize(10); d.setTextColor(90, 90, 90);
    var hi = fx.filter(function (x) { return x.sev === 'High'; }).length, md = fx.filter(function (x) { return x.sev === 'Medium'; }).length;
    d.text(hi + ' high priority   |   ' + md + ' medium   |   ' + (fx.length - hi - md) + ' low   |   ' + res.cats.length + ' areas scanned', M + 92, y + 8);
    y += 58;
    // categories
    text('Category breakdown', M, 14, true); y += 4;
    res.cats.forEach(function (c) {
      need(34); var t = tone(c.score);
      d.setFont('helvetica', 'bold'); d.setFontSize(10.5); d.setTextColor(30, 30, 30); d.text(ascii(c.name), M, y);
      d.setTextColor.apply(d, rgb(t)); d.text(c.score + '  ' + label(c.score), W - M, y, { align: 'right' });
      d.setFillColor(232, 232, 232); d.roundedRect(M, y + 6, W - M * 2, 6, 3, 3, 'F');
      d.setFillColor.apply(d, rgb(t)); d.roundedRect(M, y + 6, Math.max(6, (W - M * 2) * c.score / 100), 6, 3, 3, 'F'); y += 27;
    });
    res.missing.forEach(function (n) { need(20); d.setFont('helvetica', 'normal'); d.setFontSize(10); d.setTextColor(130, 130, 130); d.text(ascii(n) + ': needs a personal review (not measurable from outside)', M, y); y += 18; });
    // fixes
    y += 10; need(60); text('Top ' + fx.length + ' priority fixes', M, 14, true); y += 4;
    var SC = { High: [220, 60, 60], Medium: [235, 150, 20], Low: [60, 120, 220] };
    fx.forEach(function (x, i) {
      var lines = d.splitTextToSize(ascii(x.label), W - M * 2 - 70); need(lines.length * 13 + 26);
      d.setFillColor.apply(d, SC[x.sev]); d.roundedRect(M, y - 9, 52, 14, 3, 3, 'F'); d.setFont('helvetica', 'bold'); d.setFontSize(8); d.setTextColor(255, 255, 255); d.text(x.sev.toUpperCase(), M + 26, y + 1, { align: 'center' });
      d.setFont('helvetica', 'bold'); d.setFontSize(10.5); d.setTextColor(30, 30, 30); lines.forEach(function (ln, k) { d.text((i + 1) + '. ' + (k ? '   ' : '') + ln, M + 62, y + k * 13); });
      y += lines.length * 13; d.setFont('helvetica', 'normal'); d.setFontSize(8.5); d.setTextColor(120, 120, 120); d.text(ascii(x.cat), M + 62, y); y += 20;
    });
    // detail checklists
    y += 16; need(120); text('Detailed checklist', M, 14, true); y += 4;
    res.cats.forEach(function (c) {
      need(40); d.setFont('helvetica', 'bold'); d.setFontSize(11); d.setTextColor(30, 30, 30); d.text(ascii(c.name) + '  (' + c.score + ')', M, y); y += 15;
      c.items.forEach(function (i) { var lines = d.splitTextToSize(ascii(i.label), W - M * 2 - 22); need(lines.length * 12 + 4); d.setFont('helvetica', 'bold'); d.setFontSize(9.5); d.setTextColor.apply(d, i.ok ? COL.good : COL.bad); d.text(i.ok ? 'PASS' : 'FIX', M, y); d.setFont('helvetica', 'normal'); d.setTextColor(50, 50, 50); lines.forEach(function (ln) { d.text(ln, M + 34, y); y += 12; }); y += 2; });
      y += 8;
    });
    // closing
    need(120); y += 6; d.setFillColor(247, 203, 26); d.roundedRect(M, y, W - M * 2, 78, 8, 8, 'F');
    d.setFont('helvetica', 'bold'); d.setFontSize(13); d.setTextColor(20, 20, 20); d.text('Want these fixed properly?', M + 16, y + 26);
    d.setFont('helvetica', 'normal'); d.setFontSize(10); d.text('Book a free call: calendly.com/onwenmoses/30min   |   WhatsApp: +1 581 809 5630', M + 16, y + 46); d.text('info@mosesecom.com   |   www.mosesmastery.com', M + 16, y + 62); y += 96;
    need(50); text('Data comes from Google PageSpeed Insights (mobile lab test) plus automated checks of public store pages. Scores vary between runs. This automated report cannot see design quality, offer strength, checkout or private settings, and it does not guarantee sales results.', M, 8, false, [130, 130, 130]);
    d.save('store-audit-' + host.replace(/[^a-z0-9.-]/gi, '') + '-' + new Date().toISOString().slice(0, 10) + '.pdf');
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


    /* revenue scenario: all inputs are the owner's own; the lift is an adjustable assumption */
    var rv = el('div', 'aud-rev'); rv.appendChild(el('h3', null, 'What this could be costing you'));
    rv.appendChild(el('p', 'aud-revp', 'Enter your own numbers. This is a what-if scenario, not a prediction or a promise.'));
    var g = el('div', 'aud-revg'), inp = {};
    [['visitors', 'Monthly visitors', '5000', '1'], ['cr', 'Conversion rate (%)', '1.5', '0.1'], ['aov', 'Average order value ($)', '60', '1']].forEach(function (m) { var l = el('label'); l.appendChild(el('span', null, m[1])); var i = el('input'); i.type = 'number'; i.inputMode = 'decimal'; i.min = '0'; i.step = m[3]; i.placeholder = m[2]; l.appendChild(i); g.appendChild(l); inp[m[0]] = i; });
    var lf = el('label', 'aud-revwide'); var lt = el('span', null, 'If fixes lift your conversion rate by: 10%'); lf.appendChild(lt); var lift = el('input'); lift.type = 'range'; lift.min = '5'; lift.max = '30'; lift.step = '5'; lift.value = '10'; lf.appendChild(lift); g.appendChild(lf); rv.appendChild(g);
    var out = el('div', 'aud-revout'); out.setAttribute('aria-live', 'polite'); rv.appendChild(out);
    rv.appendChild(el('p', 'aud-fine', 'Revenue = visitors x conversion rate x order value. The lift percentage is an assumption you can change; the right figure depends on your store, traffic and which fixes are made.'));
    function money(n) { return '$' + Math.round(n).toLocaleString('en-US'); }
    function calc() {
      var v = parseFloat(inp.visitors.value), c = parseFloat(inp.cr.value), a = parseFloat(inp.aov.value), l = +lift.value; lt.textContent = 'If fixes lift your conversion rate by: ' + l + '%';
      out.innerHTML = '';
      if (!(v > 0 && c > 0 && a > 0)) { out.appendChild(el('p', 'aud-revhint', 'Fill in the three boxes to see your numbers.')); return; }
      var cur = v * (c / 100) * a, extra = cur * (l / 100);
      [[money(cur), 'Estimated revenue per month now'], ['+' + money(extra), 'Extra per month at a ' + l + '% lift'], ['+' + money(extra * 12), 'Extra per year at a ' + l + '% lift']].forEach(function (m) { var d = el('div'); d.appendChild(el('strong', null, m[0])); d.appendChild(el('span', null, m[1])); out.appendChild(d); });
    }
    [inp.visitors, inp.cr, inp.aov, lift].forEach(function (i) { i.addEventListener('input', calc); }); calc();
    box.appendChild(rv);

    var cta = el('div', 'aud-cta'); cta.appendChild(el('h3', null, 'Want these fixed properly?'));
    cta.appendChild(el('p', null, 'I will walk through your results, show what matters most for your store and give you a fixed quote. No obligation.'));
    var row = el('div', 'aud-ctarow'); row.appendChild(calBtn('Book a free strategy call'));
    var wa = el('a', 'aud-btn2', 'Message me on WhatsApp'); wa.href = 'https://wa.me/15818095630?text=' + encodeURIComponent('Hi Moses, I just scanned ' + host + ' on your site (score ' + overall + '). Can you help me fix it?'); wa.target = '_blank'; wa.rel = 'noopener'; row.appendChild(wa);
    var dl = el('button', 'aud-btn2', 'Download full report (PDF)'); dl.type = 'button'; dl.onclick = function () { var o = dl.textContent; dl.textContent = 'Preparing PDF...'; dl.disabled = true; loadPdf().then(function () { makePdf(res, host, overall, fx); if (window.mmTrack) window.mmTrack('audit_pdf', { store: host }); }).catch(function () { alert('Could not create the PDF. Please try again.'); }).then(function () { dl.textContent = o; dl.disabled = false; }); }; row.appendChild(dl);
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
      var quota = /quota|429|rate|limit/i.test(lastErr); st.className = 'calc-status err'; st.textContent = (quota ? 'The free Google speed test is busy right now. ' : 'The scan could not read that store this time. ') + 'Please try again in a minute, or message me on WhatsApp and I will run it for you.' + (lastErr ? ' (Details: ' + lastErr + ')' : '');
      if (window.mmTrack) window.mmTrack('audit_scan', { ok: false, ms: Date.now() - t0, err: lastErr });
    });
  });
})();
