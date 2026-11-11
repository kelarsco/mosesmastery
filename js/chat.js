(function () {
  var C = window.MM_CONFIG || {};
  if (!C.chat || !C.supabaseUrl || /(^|\/)(admin|account)\.html$/.test(location.pathname)) return;
  var URL_ = C.supabaseUrl.replace(/\/$/, '') + '/functions/v1/chat', KEY = 'mm_chat_v1';
  var msgs = [], busy = false, open = false, userCount = 0, leadShown = false, leadDone = false;
  try { var sv = JSON.parse(sessionStorage.getItem(KEY) || 'null'); if (sv && Array.isArray(sv.m)) { msgs = sv.m.slice(-20); userCount = sv.u | 0; leadDone = !!sv.l; } } catch (_) {}
  function save() { try { sessionStorage.setItem(KEY, JSON.stringify({ m: msgs.slice(-20), u: userCount, l: leadDone })); } catch (_) {} }
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function track(n, d) { if (window.mmTrack) try { window.mmTrack(n, d || {}); } catch (_) {} }

  // launcher + panel
  var btn = el('button', 'mmc-btn'); btn.type = 'button'; btn.setAttribute('aria-label', 'Chat with our AI assistant');
  btn.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.5 7.2L4 20l1-4.3A8 8 0 1 1 21 12z"/></svg><span>Ask AI</span>';
  var panel = el('section', 'mmc-panel'); panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', 'AI assistant'); panel.hidden = true;
  var head = el('header', 'mmc-head'); var ht = el('div'); ht.appendChild(el('b', null, 'Moses Mastery AI')); ht.appendChild(el('span', null, 'Ask about services, pricing or your store')); head.appendChild(ht);
  var x = el('button', 'mmc-x', '×'); x.type = 'button'; x.setAttribute('aria-label', 'Close chat'); head.appendChild(x);
  var log = el('div', 'mmc-log'); log.setAttribute('role', 'log'); log.setAttribute('aria-live', 'polite');
  var chips = el('div', 'mmc-chips');
  var form = el('form', 'mmc-form'); var inp = el('input'); inp.type = 'text'; inp.maxLength = 500; inp.placeholder = 'Type your question'; inp.setAttribute('aria-label', 'Your message'); inp.autocomplete = 'off';
  var send = el('button', 'mmc-send', 'Send'); send.type = 'submit'; form.appendChild(inp); form.appendChild(send);
  var fine = el('p', 'mmc-fine', 'AI assistant, so answers can be wrong. Moses confirms every quote. Never share passwords or card details.');
  panel.appendChild(head); panel.appendChild(log); panel.appendChild(chips); panel.appendChild(form); panel.appendChild(fine);

  // safe linkify: escape first, then link only trusted domains
  var OK = /^(https?:\/\/)(www\.mosesmastery\.com|mosesmastery\.com|calendly\.com\/onwenmoses|wa\.me\/15818095630)([\/?#][^\s]*)?$/i;
  function fill(node, text) {
    String(text).split(/(https?:\/\/[^\s]+)/g).forEach(function (part) {
      var m = part.match(/^(https?:\/\/[^\s]*?)([).,!?;:]*)$/);
      if (m && OK.test(m[1])) { var a = el('a', null, m[1].replace(/^https?:\/\/(www\.)?/, '')); a.href = m[1]; a.target = '_blank'; a.rel = 'noopener'; node.appendChild(a); if (m[2]) node.appendChild(document.createTextNode(m[2])); }
      else node.appendChild(document.createTextNode(part));
    });
  }
  function add(role, text) { var b = el('div', 'mmc-m mmc-' + (role === 'user' ? 'u' : 'a')); fill(b, text); log.appendChild(b); log.scrollTop = log.scrollHeight; return b; }
  function typing() { var b = el('div', 'mmc-m mmc-a mmc-t'); b.innerHTML = '<i></i><i></i><i></i>'; log.appendChild(b); log.scrollTop = log.scrollHeight; return b; }

  function leadBox() {
    if (leadShown || leadDone) return; leadShown = true;
    var b = el('form', 'mmc-lead'); b.appendChild(el('b', null, 'Want Moses to follow up?')); b.appendChild(el('span', null, 'Leave your email and he will reply personally.'));
    var n = el('input'); n.placeholder = 'Your name'; n.required = true; n.maxLength = 100; n.autocomplete = 'name';
    var e = el('input'); e.type = 'email'; e.placeholder = 'Email'; e.required = true; e.maxLength = 160; e.autocomplete = 'email';
    var s = el('button', null, 'Send my details'); s.type = 'submit';
    b.appendChild(n); b.appendChild(e); b.appendChild(s);
    b.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var tr = msgs.map(function (m) { return (m.role === 'user' ? 'Visitor: ' : 'AI: ') + m.content; }).join('\n').slice(-2400);
      if (window.mmLead) window.mmLead({ source: 'contact', name: n.value, email: e.value, stage: 'AI chat', message: 'AI CHAT LEAD (transcript)\n' + tr });
      track('chat_lead', {}); leadDone = true; save(); b.remove(); add('assistant', 'Thank you, ' + n.value.split(/\s+/)[0] + '. Moses will reply to ' + e.value + '. You can keep asking me anything meanwhile.');
    });
    log.appendChild(b); log.scrollTop = log.scrollHeight;
  }

  function ask(text) {
    text = String(text || '').trim().slice(0, 500); if (!text || busy) return;
    busy = true; send.disabled = true; chips.style.display = 'none'; inp.value = '';
    msgs.push({ role: 'user', content: text }); userCount++; add('user', text); save(); track('chat_message', { n: userCount });
    var ty = typing();
    var ctl = ('AbortController' in window) ? new AbortController() : null, tm = setTimeout(function () { if (ctl) ctl.abort(); }, 30000);
    fetch(URL_, { method: 'POST', signal: ctl ? ctl.signal : undefined, headers: { 'Content-Type': 'application/json', apikey: C.supabaseAnonKey || '', Authorization: 'Bearer ' + (C.supabaseAnonKey || '') }, body: JSON.stringify({ messages: msgs.slice(-10) }) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (j && !j.ok && !j.detail) j.detail = 'HTTP ' + r.status; return j; }); })
      .then(function (j) {
        ty.remove();
        if (j && j.ok && j.reply) { msgs.push({ role: 'assistant', content: j.reply }); add('assistant', j.reply); if (userCount >= 2) leadBox(); }
        else { msgs.pop(); userCount--; var dt = j && j.detail ? ' [' + String(j.detail).slice(0, 220) + ']' : ''; add('assistant', j && j.error === 'limit' ? 'You have reached today\'s message limit here. Please message Moses directly on WhatsApp: https://wa.me/15818095630' : 'I cannot answer right now. Please message Moses on WhatsApp: https://wa.me/15818095630 or use https://www.mosesmastery.com/contact.html' + dt); }
      }).catch(function () { ty.remove(); msgs.pop(); userCount--; add('assistant', 'I could not connect. Please try again, or message Moses on WhatsApp: https://wa.me/15818095630'); })
      .then(function () { clearTimeout(tm); busy = false; send.disabled = false; save(); if (open) inp.focus(); });
  }

  function show(v) {
    open = v; panel.hidden = !v; btn.classList.toggle('is-open', v); document.documentElement.classList.toggle('mmc-lock', v && window.innerWidth < 600);
    if (v) { track('chat_open'); if (!log.children.length) init(); setTimeout(function () { inp.focus(); }, 50); } else btn.focus();
  }
  function init() {
    if (msgs.length) { msgs.forEach(function (m) { add(m.role, m.content); }); chips.style.display = 'none'; if (userCount >= 2) leadBox(); return; }
    add('assistant', 'Hi, I am the Moses Mastery AI assistant. Ask me about our Shopify services, pricing or how to fix a slow or low-converting store.');
    [['What do you offer?', 'What services do you offer?'], ['Pricing', 'How much do your packages cost?'], ['Free store scan', 'How does the free store scan work?'], ['Talk to Moses', 'I would like to talk to Moses']].forEach(function (c) { var b = el('button', null, c[0]); b.type = 'button'; b.onclick = function () { ask(c[1]); }; chips.appendChild(b); });
  }
  btn.onclick = function () { show(!open); }; x.onclick = function () { show(false); };
  form.addEventListener('submit', function (e) { e.preventDefault(); ask(inp.value); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && open) show(false); });
  document.body.appendChild(btn); document.body.appendChild(panel);
})();
