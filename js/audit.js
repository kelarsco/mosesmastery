(function () {
  var f = document.getElementById('auditForm'); if (!f) return;
  var st = document.getElementById('auditStatus'), started = false;
  var C = window.MM_CONFIG || {};
  f.addEventListener('input', function () { if (!started) { started = true; if (window.mmTrack) window.mmTrack('form_start', { form: 'audit' }); } });

  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
  function cal() { var a = el('a', null, 'Book a free strategy call'); a.href = 'https://calendly.com/onwenmoses/30min'; a.onclick = function () { if (window.Calendly) { Calendly.initPopupWidget({ url: 'https://calendly.com/onwenmoses/30min?hide_gdpr_banner=1&primary_color=f7cb1a' }); return false; } }; return a; }

  function scan(url) {
    var q = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed?strategy=mobile&category=performance&url=' + encodeURIComponent(url) + (C.psiKey ? '&key=' + encodeURIComponent(C.psiKey) : '');
    return fetch(q).then(function (r) { return r.json().then(function (j) { if (!r.ok || !j.lighthouseResult) throw new Error((j.error && j.error.message) || 'scan failed'); return j.lighthouseResult; }); });
  }

  function render(box, lr, name) {
    box.innerHTML = '';
    var score = Math.round((lr.categories.performance.score || 0) * 100), A = lr.audits;
    var tone = score >= 90 ? 'good' : score >= 50 ? 'mid' : 'bad';
    var verdict = score >= 90 ? 'Fast. Speed is not your main problem.' : score >= 50 ? 'Needs work. Slow pages lose shoppers on mobile.' : 'Slow. On mobile this is likely costing you visitors.';
    var head = el('div', 'aud-score ' + tone); head.appendChild(el('strong', null, String(score))); var sp = el('span'); sp.appendChild(el('b', null, 'Mobile speed score')); sp.appendChild(el('em', null, verdict)); head.appendChild(sp); box.appendChild(head);
    var grid = el('div', 'aud-metrics');
    [['First Contentful Paint', 'first-contentful-paint', 'When something first shows'], ['Largest Contentful Paint', 'largest-contentful-paint', 'When the main content shows'], ['Total Blocking Time', 'total-blocking-time', 'How long the page feels frozen'], ['Layout shift', 'cumulative-layout-shift', 'Does the page jump while loading']].forEach(function (m) {
      if (!A[m[1]]) return; var c = el('div', 'aud-m ' + (A[m[1]].score >= .9 ? 'good' : A[m[1]].score >= .5 ? 'mid' : 'bad')); c.appendChild(el('b', null, A[m[1]].displayValue || '-')); c.appendChild(el('span', null, m[0])); c.appendChild(el('i', null, m[2])); grid.appendChild(c);
    });
    box.appendChild(grid);
    var ops = Object.keys(A).map(function (k) { return A[k]; }).filter(function (a) { return a.details && a.details.type === 'opportunity' && a.score != null && a.score < .9 && a.details.overallSavingsMs > 100; }).sort(function (x, y) { return y.details.overallSavingsMs - x.details.overallSavingsMs; }).slice(0, 4);
    if (ops.length) {
      box.appendChild(el('h3', null, 'Biggest speed problems found'));
      var ul = el('ul', 'aud-ops');
      ops.forEach(function (o) { var li = el('li'); li.appendChild(el('strong', null, o.title)); li.appendChild(el('span', null, 'Could save about ' + (o.details.overallSavingsMs / 1000).toFixed(1) + ' s' + (o.displayValue ? ' (' + o.displayValue.replace(/^Potential savings of /, '') + ')' : ''))); ul.appendChild(li); });
      box.appendChild(ul);
    }
    var n = el('p', 'aud-next'); n.appendChild(el('strong', null, 'Next: ')); n.appendChild(document.createTextNode(name + ', I will personally review your design, product pages and checkout too, and email you my top fixes within 24 hours. Want to talk sooner? ')); n.appendChild(cal()); n.appendChild(document.createTextNode('.')); box.appendChild(n);
    box.appendChild(el('p', 'aud-fine', 'Speed data from Google PageSpeed Insights (mobile, lab test). Scores vary a little between runs. Speed is one part of conversion, not a promise of sales.'));
  }

  f.addEventListener('submit', function (e) {
    e.preventDefault();
    if (f.elements.botcheck && f.elements.botcheck.checked) return;
    var data = {}, fd = new FormData(f);
    fd.forEach(function (v, k) { data[k] = v; });
    delete data.botcheck;
    var name = String(data.name).split(/\s+/)[0].replace(/[<>&"]/g, '');
    var msg = 'FREE AUDIT REQUEST (instant scan run)\nStore: ' + data.store + '\nBiggest problem: ' + data.problem + (data.note ? '\nNote: ' + data.note : '');
    data.message = msg;
    if (window.mmLead) window.mmLead({ source: 'contact', name: data.name, email: data.email, store: data.store, stage: 'Free audit', message: msg });
    var btn = f.querySelector('button'), tx = btn.querySelector('.mm-cta-tx'), label = tx.textContent;
    btn.disabled = true; tx.textContent = 'Scanning...'; st.className = 'calc-status'; st.textContent = '';
    /* the request is emailed to you in the background; the visitor sees the scan result */
    var sent = fetch('https://api.web3forms.com/submit', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(data) }).then(function (r) { return r.json(); }).catch(function () { return { success: false }; });
    var box = el('div', 'aud-res'); box.setAttribute('aria-live', 'polite');
    var load = el('div', 'aud-load'); load.appendChild(el('i')); load.appendChild(el('p', null, 'Scanning ' + data.store + ' ... this takes about 20 to 40 seconds.')); box.appendChild(load);
    f.parentNode.insertBefore(box, f); f.style.display = 'none';
    if (window.mmTrack) window.mmTrack('form_submit', { form: 'audit' });
    var t0 = Date.now();
    scan(data.store).then(function (lr) {
      render(box, lr, name);
      if (window.mmTrack) window.mmTrack('audit_scan', { ok: true, ms: Date.now() - t0 });
    }).catch(function () {
      box.innerHTML = '';
      sent.then(function (j) {
        var p = el('p', 'aud-next');
        if (j && j.success) { p.appendChild(el('strong', null, 'Thank you, ' + name + '. ')); p.appendChild(document.createTextNode('The instant scan could not read that store right now (it may be password protected, or the speed service is busy). Your request reached me, and I will email you my review within 24 hours. Want to talk sooner? ')); p.appendChild(cal()); p.appendChild(document.createTextNode('.')); box.appendChild(p); }
        else { f.style.display = ''; box.remove(); btn.disabled = false; tx.textContent = label; st.className = 'calc-status err'; st.textContent = 'Sorry, that did not work. Please check the link and try again, or email info@mosesecom.com.'; }
      });
    });
  });
})();
