(function () {
  var f = document.querySelector('form.qf');
  if (!f) return;
  var panes = [].slice.call(f.querySelectorAll('.qf-pane')), step = 1, N = panes.length;
  var lab = document.getElementById('qfStep'), bar = document.getElementById('qfBar');
  var back = document.getElementById('qfBack'), next = document.getElementById('qfNext'), send = document.getElementById('qfSend');
  var st = document.getElementById('contStatus');
  function track(n) { if (window.mmTrack) window.mmTrack('form_step', { form: 'contact', step: n }); }
  function show(n) {
    step = n;
    panes.forEach(function (p, i) { p.classList.toggle('is-on', i + 1 === n); });
    lab.textContent = 'Step ' + n + ' of ' + N;
    bar.style.width = (n / N * 100) + '%';
    back.hidden = n === 1; next.hidden = n === N; send.hidden = n !== N;
    st.textContent = ''; st.className = 'cont-status';
    var first = panes[n - 1].querySelector('input:not([type=hidden]),textarea,select');
    if (n > 1 && first) { try { first.focus({ preventScroll: true }); } catch (_) {} }
    var top = f.getBoundingClientRect().top;
    if (top < 0) window.scrollBy({ top: top - 90, behavior: 'smooth' });
  }
  function ok(n) {
    var p = panes[n - 1];
    if (n === 1) {
      if (!p.querySelector('input:checked')) { st.className = 'cont-status err'; st.textContent = 'Please pick at least one option.'; return false; }
      return true;
    }
    var els = [].slice.call(p.querySelectorAll('input[required],textarea[required],select[required],input[type=url],input[type=email]'));
    for (var i = 0; i < els.length; i++) {
      if (!els[i].checkValidity()) {
        var isRadio = els[i].type === 'radio';
        st.className = 'cont-status err';
        st.textContent = isRadio ? 'Please choose one option in each question.' : (els[i].validationMessage || 'Please check this field.');
        if (!isRadio) els[i].focus();
        return false;
      }
    }
    return true;
  }
  next.addEventListener('click', function () { if (ok(step)) { track(step); show(step + 1); } });
  back.addEventListener('click', function () { show(step - 1); });
  f.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA' && step < N) { e.preventDefault(); next.click(); }
  });
  f.addEventListener('submit', function (e) { if (!ok(step)) { e.preventDefault(); e.stopImmediatePropagation(); } }, true);
  show(1);
})();
