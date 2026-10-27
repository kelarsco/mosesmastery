/* Sign in / sign up / password reset with Supabase Auth. Admin access is decided by the `admins` table (see supabase/schema.sql). */
(function () {
  'use strict';
  var C = window.MM_CONFIG || {}, $ = function (id) { return document.getElementById(id); };
  var form = $('auForm'), msg = $('auMsg'), mode = /[?&]mode=signup/.test(location.search) ? 'signup' : 'signin', sb = null;
  var ok = C.supabaseUrl && C.supabaseAnonKey && window.supabase;
  if (ok) sb = window.supabase.createClient(C.supabaseUrl, C.supabaseAnonKey, { auth: { persistSession: true, autoRefreshToken: true } });

  function say(t, cls) { msg.textContent = t || ''; msg.className = 'au-msg' + (cls ? ' ' + cls : ''); }
  function setMode(m) {
    mode = m;
    $('tabIn').setAttribute('aria-selected', m === 'signin'); $('tabUp').setAttribute('aria-selected', m === 'signup');
    $('auNameWrap').hidden = m !== 'signup';
    $('auTitle').textContent = m === 'signup' ? 'Create your account.' : 'Welcome back.';
    $('auSub').textContent = m === 'signup' ? 'Sign up with your email. You will get a confirmation link.' : 'Sign in to continue.';
    $('auSubmit').textContent = m === 'signup' ? 'Create account' : 'Sign in';
    form.elements.password.setAttribute('autocomplete', m === 'signup' ? 'new-password' : 'current-password');
    $('auForgot').hidden = m === 'signup'; say('');
  }
  document.querySelectorAll('.au-tabs button').forEach(function (b) { b.addEventListener('click', function () { setMode(b.getAttribute('data-mode')); }); });
  setMode(mode);

  if (!ok) {
    var n = $('auNote'); n.hidden = false;
    n.innerHTML = 'Sign-in is not connected yet. Add your Supabase URL and key in <code>js/config.js</code> (steps in <code>SETUP-DASHBOARD.md</code>). To preview the dashboard with sample data, <a href="admin.html?demo=1">open the demo</a>.';
    $('auSubmit').disabled = true; return;
  }

  function isAdmin() {
    return sb.from('admins').select('email').limit(1).then(function (r) { window.__mmAdminErr = r.error ? (r.error.code + ': ' + r.error.message) : ''; return !r.error && r.data && r.data.length > 0; });
  }
  function showDone(user) {
    form.hidden = true; document.querySelector('.au-tabs').hidden = true;
    $('auDone').hidden = false; $('auTitle').textContent = 'You are signed in.'; $('auSub').textContent = user.email;
    isAdmin().then(function (a) {
      if (a) { $('auDoneText').textContent = 'You have admin access to the analytics dashboard.'; }
      else { $('auDoneText').textContent = 'Your account is active. It does not have admin access, so there is nothing more to open here.' + (window.__mmAdminErr ? ' (Technical detail: ' + window.__mmAdminErr + ')' : ' (Technical detail: the admin list is empty or does not include this email.)'); $('auGo').hidden = true; }
    });
  }
  var recovery = false;
  sb.auth.onAuthStateChange(function (ev) {
    if (ev !== 'PASSWORD_RECOVERY') return;
    recovery = true; $('auTitle').textContent = 'Set a new password.'; $('auSub').textContent = 'Choose a new password for your account.';
    document.querySelector('.au-tabs').hidden = true; form.elements.email.closest('label').hidden = true; form.elements.email.required = false; $('auSubmit').textContent = 'Save password'; $('auForgot').hidden = true;
    form.hidden = false; $('auDone').hidden = true;
  });
  sb.auth.getSession().then(function (r) { if (r.data && r.data.session) showDone(r.data.session.user); });
  $('auOut').addEventListener('click', function () { sb.auth.signOut().then(function () { location.href = 'account.html'; }); });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (recovery) {
      var np = form.elements.password.value; if (np.length < 8) return say('Use a password of at least 8 characters.', 'err');
      return sb.auth.updateUser({ password: np }).then(function (r) { if (r.error) return say(r.error.message, 'err'); recovery = false; location.href = 'account.html'; });
    }
    var email = form.elements.email.value.trim(), pw = form.elements.password.value;
    if (!/^\S+@\S+\.\S+$/.test(email)) return say('Enter a valid email address.', 'err');
    if (pw.length < 8) return say('Use a password of at least 8 characters.', 'err');
    var btn = $('auSubmit'); btn.disabled = true; say('Please wait...');
    var p = mode === 'signup'
      ? sb.auth.signUp({ email: email, password: pw, options: { data: { full_name: form.elements.name.value.trim() }, emailRedirectTo: location.origin + location.pathname.replace(/account\.html$/, '') + 'account.html' } })
      : sb.auth.signInWithPassword({ email: email, password: pw });
    p.then(function (r) {
      btn.disabled = false;
      if (r.error) return say(r.error.message, 'err');
      if (mode === 'signup' && !(r.data && r.data.session)) return say('Check your email and click the confirmation link, then sign in.', 'ok');
      var user = (r.data.session && r.data.session.user) || r.data.user; showDone(user);
      isAdmin().then(function (a) { if (a) location.href = 'admin.html'; });
    }).catch(function () { btn.disabled = false; say('Something went wrong. Try again.', 'err'); });
  });
  $('auForgot').addEventListener('click', function () {
    var email = form.elements.email.value.trim();
    if (!/^\S+@\S+\.\S+$/.test(email)) return say('Type your email above first, then tap "Forgot your password?".', 'err');
    sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname }).then(function (r) {
      say(r.error ? r.error.message : 'If that email has an account, a reset link is on its way.', r.error ? 'err' : 'ok');
    });
  });
})();
