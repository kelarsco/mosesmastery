(function () {
  var f = document.getElementById('auditForm'); if (!f) return;
  var st = document.getElementById('auditStatus'), started = false;
  f.addEventListener('input', function () { if (!started) { started = true; if (window.mmTrack) window.mmTrack('form_start', { form: 'audit' }); } });
  f.addEventListener('submit', function (e) {
    e.preventDefault();
    if (f.elements.botcheck && f.elements.botcheck.checked) return;
    var data = {}, fd = new FormData(f);
    fd.forEach(function (v, k) { data[k] = v; });
    delete data.botcheck;
    var msg = 'FREE AUDIT REQUEST\nStore: ' + data.store + '\nBiggest problem: ' + data.problem + (data.note ? '\nNote: ' + data.note : '');
    data.message = msg;
    if (window.mmLead) window.mmLead({ source: 'contact', name: data.name, email: data.email, store: data.store, stage: 'Free audit', message: msg });
    var btn = f.querySelector('button'), tx = btn.querySelector('.mm-cta-tx'), label = tx.textContent;
    btn.disabled = true; tx.textContent = 'Sending...'; st.className = 'calc-status'; st.textContent = '';
    fetch('https://api.web3forms.com/submit', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(data) })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (!j.success) throw new Error(j.message || 'fail');
        if (window.mmTrack) window.mmTrack('form_submit', { form: 'audit' });
        var nm = String(data.name).split(/\s+/)[0].replace(/[<>&"]/g, '');
        f.innerHTML = '<p class="calc-ok"><strong>Thank you, ' + nm + '.</strong> I will review your store and email you the three biggest fixes within 2 business days.</p><p class="calc-ok">Want to talk sooner? <a href="https://calendly.com/onwenmoses/30min" onclick="Calendly.initPopupWidget({url: \'https://calendly.com/onwenmoses/30min?hide_gdpr_banner=1&primary_color=f7cb1a\'});return false;">Book a free strategy call</a>.</p>';
      })
      .catch(function () {
        btn.disabled = false; tx.textContent = label;
        st.className = 'calc-status err'; st.textContent = 'Sorry, that did not send. Please try again, or email info@mosesecom.com.';
      });
  });
})();
