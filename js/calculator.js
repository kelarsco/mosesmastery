(function () {
  var $ = function (id) { return document.getElementById(id); };
  var vis = $('cVis'), cr = $('cCr'), aov = $('cAov');
  if (!vis) return;
  var fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  var used = false, last = {};
  function n(el) { var v = parseFloat(el.value); return isFinite(v) && v > 0 ? v : 0; }
  function calc() {
    var V = Math.min(n(vis), 1e8), C = Math.min(n(cr), 100), A = Math.min(n(aov), 1e6);
    var now = V * C / 100 * A;
    var s1 = now * 1.15, s2 = now * 1.30;
    var bench = 2.5, target = Math.max(C * 1.5, bench), hasGap = C < bench;
    var s3 = V * Math.min(target, 100) / 100 * A;
    $('l3').innerHTML = hasGap ? 'Healthy benchmark <em>2.5% conversion</em>' : 'Strong store <em>+50% conversion</em>';
    var rows = [[s1, 'o1', 'b1'], [s2, 'o2', 'b2'], [s3, 'o3', 'b3']];
    var max = Math.max(s3, 1);
    $('oNow').textContent = fmt.format(now);
    rows.forEach(function (r) {
      $(r[1]).textContent = '+' + fmt.format(Math.max(0, r[0] - now)) + '/mo';
      $(r[2]).style.width = Math.max(4, Math.round((r[0] - now) / Math.max(max - now, 1) * 100)) + '%';
    });
    $('oYear').textContent = fmt.format(Math.max(0, (s2 - now) * 12));
    last = { visitors: V, conversion_pct: C, aov: A, monthly_now: Math.round(now), realistic_extra_year: Math.round((s2 - now) * 12) };
    $('lNum').value = JSON.stringify(last);
  }
  function onInput() {
    calc();
    if (!used) { used = true; if (window.mmTrack) window.mmTrack('calc_use', { }); }
  }
  [vis, cr, aov].forEach(function (el) { el.addEventListener('input', onInput); });
  calc();

  var f = $('calcLeadForm'), st = $('calcStatus');
  f.addEventListener('submit', function (e) {
    e.preventDefault();
    if (f.elements.botcheck && f.elements.botcheck.checked) return;
    var data = {}, fd = new FormData(f);
    fd.forEach(function (v, k) { data[k] = v; });
    delete data.botcheck;
    if (window.mmLead) window.mmLead({ source: 'calculator', name: data.name, email: data.email, store: data.store, numbers: data.numbers });
    data.message = 'Store: ' + data.store + '\nNumbers: ' + data.numbers;
    var btn = f.querySelector('button'), label = btn.querySelector('.mm-cta-tx').textContent;
    btn.disabled = true; btn.querySelector('.mm-cta-tx').textContent = 'Sending...'; st.className = 'calc-status'; st.textContent = '';
    fetch('https://api.web3forms.com/submit', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(data) })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (!j.success) throw new Error(j.message || 'fail');
        if (window.mmTrack) window.mmTrack('form_submit', { form: 'calculator' });
        f.innerHTML = '<p class="calc-ok"><strong>Thank you, ' + String(data.name).split(/\s+/)[0].replace(/[<>&"]/g, '') + '.</strong> I will review your store and email you the three biggest fixes within 2 business days.</p>';
      })
      .catch(function () {
        btn.disabled = false; btn.querySelector('.mm-cta-tx').textContent = label;
        st.className = 'calc-status err'; st.textContent = 'Sorry, that did not send. Please try again, or email info@mosesecom.com.';
      });
  });
})();
