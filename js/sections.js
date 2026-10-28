/* Moses Mastery: brands gallery (2-row auto-scroll), analytics video slider, lightbox, scroll motion. */
(function () {
  'use strict';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;


  /* ---------- hero video: start after load, fade in once playing ---------- */
  var hv = document.querySelector('.bg-video[data-src]');
  if (hv && !reduce && !(navigator.connection && navigator.connection.saveData)) {
    var startHero = function () {
      hv.muted = true; hv.defaultMuted = true; hv.setAttribute('muted', ''); hv.playsInline = true;
      if (!hv.getAttribute('src')) hv.src = hv.getAttribute('data-src');
      hv.addEventListener('playing', function () { hv.classList.add('on'); }, { once: true });
      var pr = hv.play(); if (pr && pr.catch) pr.catch(function () {});
    };
    if (document.readyState === 'complete') setTimeout(startHero, 150); else window.addEventListener('load', function () { setTimeout(startHero, 150); });
    if ('IntersectionObserver' in window) new IntersectionObserver(function (en) {
      if (!hv.getAttribute('src')) return;
      if (en[0].isIntersecting) { var q = hv.play(); if (q && q.catch) q.catch(function () {}); } else hv.pause();
    }, { threshold: 0.05 }).observe(hv);
  }

  /* ---------- all projects: type filter + lazy videos ---------- */
  document.addEventListener('click', function (e) {
    var chip = e.target.closest && e.target.closest('.pj-chips button'); if (!chip) return;
    var scope = chip.closest('.pj-all'), f = chip.getAttribute('data-pj');
    scope.querySelectorAll('.pj-chips button').forEach(function (c) { c.setAttribute('aria-pressed', c === chip ? 'true' : 'false'); });
    scope.querySelectorAll('.pj-item').forEach(function (it) { it.hidden = !(f === 'all' || it.getAttribute('data-type') === f); });
  });
  var pio = null;
  window.mmPjVideos = function () {
    var vids = document.querySelectorAll('.pj-video video, .ph-screen video');
    if (!vids.length || !('IntersectionObserver' in window)) return;
    if (!pio) pio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var v = e.target;
        if (e.isIntersecting && !reduce) { if (!v.getAttribute('src')) v.src = v.getAttribute('data-src'); v.muted = true; var pp = v.play(); if (pp && pp.catch) pp.catch(function () {}); }
        else v.pause();
      });
    }, { threshold: 0.25 });
    vids.forEach(function (v) { if (v.__pj) return; v.__pj = 1; v.muted = true; v.setAttribute('muted', ''); pio.observe(v); });
  };
  window.mmPjVideos();

  /* ---------- contact form: send in the background, then show our own thank-you page ---------- */
  var cf = document.querySelector('form.cont-form');
  if (cf) {
    cf.addEventListener('submit', function (e) {
      e.preventDefault();
      var st = cf.querySelector('.cont-status'), btn = cf.querySelector('button[type=submit]');
      if (cf.elements.botcheck && cf.elements.botcheck.checked) return;
      var data = {}, fd = new FormData(cf);
      fd.forEach(function (val, k) { data[k] = data[k] ? data[k] + ', ' + val : val; });
      delete data.botcheck; delete data.redirect;
      var label = btn.textContent; btn.disabled = true; btn.textContent = 'Sending...';
      if (st) { st.className = 'cont-status'; st.textContent = ''; }
      fetch('https://api.web3forms.com/submit', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(data) })
        .then(function (r) { return r.json(); })
        .then(function (j) {
          if (!j.success) throw new Error(j.message || 'Could not send');
          try { sessionStorage.setItem('mmName', String(data.name || '').trim().split(/\s+/)[0]); } catch (_) {}
          if (window.mmTrack) window.mmTrack('form_submit', { form: 'contact' });
          if (window.mmGo) window.mmGo('thankyou'); else window.location.href = 'thankyou.html';
        })
        .catch(function () {
          btn.disabled = false; btn.textContent = label;
          if (st) { st.className = 'cont-status err'; st.textContent = 'Sorry, that did not send. Please try again, or email info@mosesecom.com.'; }
        });
    });
  }
  var tt = document.getElementById('thkTitle');
  if (tt) { try { var nm = sessionStorage.getItem('mmName'); if (nm) tt.textContent = 'Thank you, ' + nm + '.'; } catch (_) {} }

  /* ---------- brands: two-row auto-scrolling gallery ---------- */
  var bt = document.getElementById('brandTrack');
  if (bt) {
    var tiles = Array.prototype.slice.call(bt.querySelectorAll('.bg-tile'));
    var status = document.getElementById('brandCount');
    var bPos = 0, bSet = 0, bLast = 0, bHold = 0, bHover = false, bView = false, bDrag = null, bMoved = false;
    var bSpeed = 34; // px/s, content moves left

    tiles.forEach(function (t) {
      var im = t.querySelector('img');
      if (im) im.addEventListener('error', function () { if (im.parentNode) im.parentNode.removeChild(im); });
    });

    function build() {
      Array.prototype.slice.call(bt.querySelectorAll('[data-clone],.bg-fill')).forEach(function (n) { n.parentNode.removeChild(n); });
      var vis = tiles.filter(function (t) { return !t.hidden; });
      var set = vis.slice();
      if (vis.length % 2) { var f = document.createElement('div'); f.className = 'bg-fill'; f.setAttribute('aria-hidden', 'true'); f.setAttribute('data-clone', ''); bt.appendChild(f); }
      var cols = Math.ceil(vis.length / 2);
      bSet = 0;
      // enough for a seamless loop only when the set is wider than the viewport
      if (cols * (tiles[0].offsetWidth + 16) > bt.clientWidth * 1.05 && vis.length > 2) {
        var cl = vis.map(function (t) {
          var c = t.cloneNode(true); c.setAttribute('data-clone', ''); c.setAttribute('aria-hidden', 'true'); c.tabIndex = -1; return c;
        });
        if (vis.length % 2) { var f2 = document.createElement('div'); f2.className = 'bg-fill'; f2.setAttribute('aria-hidden', 'true'); f2.setAttribute('data-clone', ''); cl.push(f2); }
        cl.forEach(function (c) { bt.appendChild(c); });
        var firstClone = bt.querySelector('[data-clone].bg-tile');
        bSet = firstClone.offsetLeft - vis[0].offsetLeft;
      }
      bt.scrollLeft = 0; bPos = 0;
    }
    function bHoldFor(ms) { bHold = performance.now() + ms; }

    var chips = document.querySelectorAll('.brand-filters button');
    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        var f = chip.getAttribute('data-filter'), shown = 0;
        chips.forEach(function (c) { c.setAttribute('aria-pressed', c === chip ? 'true' : 'false'); });
        tiles.forEach(function (t) { var on = f === 'all' || t.getAttribute('data-cat') === f; t.hidden = !on; if (on) shown++; });
        if (status) status.textContent = shown + ' brand' + (shown === 1 ? '' : 's') + ' shown';
        build();
      });
    });
    build();
    var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(build, 200); });
    window.addEventListener('load', build);

    bt.addEventListener('scroll', function () {
      if (bSet) { if (bt.scrollLeft >= bSet) bt.scrollLeft -= bSet; else if (bt.scrollLeft <= 0 && bDrag === null && bPos > bSet / 2) { /* noop */ } }
      if (Math.abs(bt.scrollLeft - bPos) > 2) bPos = bt.scrollLeft;
    }, { passive: true });

    var vp = bt.parentNode;
    vp.addEventListener('mouseenter', function () { bHover = true; });
    vp.addEventListener('mouseleave', function () { bHover = false; });
    bt.addEventListener('focusin', function () { bHover = true; });
    bt.addEventListener('focusout', function () { bHover = false; });
    bt.addEventListener('touchstart', function () { bHoldFor(3000); }, { passive: true });

    bt.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      bDrag = { x: e.clientX, s: bt.scrollLeft }; bMoved = false;
    });
    bt.addEventListener('pointermove', function (e) {
      if (!bDrag) return;
      var dx = e.clientX - bDrag.x;
      if (!bMoved && Math.abs(dx) > 5) { bMoved = true; bt.classList.add('dragging'); try { bt.setPointerCapture(e.pointerId); } catch (_) {} }
      if (!bMoved) return;
      var target = bDrag.s - dx;
      if (target < 0 && bSet) { bDrag.s += bSet; target += bSet; }
      bt.scrollLeft = target;
    });
    function bEnd() { if (!bDrag) return; bDrag = null; bt.classList.remove('dragging'); bHoldFor(1500); }
    bt.addEventListener('pointerup', bEnd); bt.addEventListener('pointercancel', bEnd);
    bt.addEventListener('click', function (e) { if (bMoved) { e.preventDefault(); e.stopPropagation(); bMoved = false; } }, true);

    function bStep(dir) {
      var t = tiles[0], gap = parseFloat(getComputedStyle(bt).columnGap) || 0, amt = (t.offsetWidth + gap) * 2 * dir;
      if (dir < 0 && bt.scrollLeft < Math.abs(amt) && bSet) bt.scrollLeft += bSet;
      bt.scrollBy({ left: amt, behavior: reduce ? 'auto' : 'smooth' }); bHoldFor(4000);
    }
    var bp = document.querySelector('.bg-prev'), bn = document.querySelector('.bg-next');
    if (bp) bp.addEventListener('click', function () { bStep(-1); });
    if (bn) bn.addEventListener('click', function () { bStep(1); });
    bt.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { bStep(1); e.preventDefault(); } else if (e.key === 'ArrowLeft') { bStep(-1); e.preventDefault(); }
    });
    if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { bView = en[0].isIntersecting; }, { threshold: 0.05 }).observe(bt); else bView = true;

    (function tick(t) {
      var dt = Math.min((t - (bLast || t)) / 1000, 0.1); bLast = t;
      if (!reduce && bView && !bHover && !bDrag && t > bHold && bSet > 0 && bt.offsetParent !== null && !document.hidden) {
        bPos += bSpeed * dt; if (bPos >= bSet) bPos -= bSet; bt.scrollLeft = bPos;
      }
      requestAnimationFrame(tick);
    })(0);
  }

  /* ---------- analytics slider ---------- */
  var track = document.getElementById('anTrack');
  if (track) {
    var originals = Array.prototype.slice.call(track.children);
    originals.forEach(function (el) { // clone once so the loop is seamless
      var c = el.cloneNode(true); c.setAttribute('aria-hidden', 'true'); track.appendChild(c);
    });
    var vids = track.querySelectorAll('video');
    vids.forEach(function (v) { v.muted = true; v.defaultMuted = true; v.setAttribute('muted', ''); v.playsInline = true; });

    // play only what is on screen (keeps phones cool, saves data)
    if ('IntersectionObserver' in window) {
      var vio = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          var v = e.target;
          if (e.isIntersecting && !reduce) {
            if (!v.getAttribute('src')) v.src = v.getAttribute('data-src');
            var p = v.play(); if (p && p.catch) p.catch(function () {});
          } else { v.pause(); }
        });
      }, { threshold: 0.25 });
      vids.forEach(function (v) { vio.observe(v); });
    } else if (!reduce) {
      vids.forEach(function (v) { v.src = v.getAttribute('data-src'); v.play(); });
    }

    var setW = 0, pos = 0, last = 0, holdUntil = 0, hovering = false, inView = false, drag = null;
    function measure() { setW = track.children[originals.length].offsetLeft - track.children[0].offsetLeft; }
    function hold(ms) { holdUntil = performance.now() + ms; }
    measure(); window.addEventListener('resize', measure);

    track.addEventListener('scroll', function () {
      if (setW && track.scrollLeft >= setW) track.scrollLeft -= setW;      // wrap forward
      if (Math.abs(track.scrollLeft - pos) > 2) pos = track.scrollLeft;     // user moved it
    }, { passive: true });

    var slider = track.parentNode;
    slider.addEventListener('mouseenter', function () { hovering = true; });
    slider.addEventListener('mouseleave', function () { hovering = false; });
    slider.addEventListener('focusin', function () { hovering = true; });
    slider.addEventListener('focusout', function () { hovering = false; });
    track.addEventListener('touchstart', function () { hold(2500); }, { passive: true });

    // mouse drag (touch uses native scrolling)
    track.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      drag = { x: e.clientX, s: track.scrollLeft }; track.classList.add('dragging');
      try { track.setPointerCapture(e.pointerId); } catch (_) {}
    });
    track.addEventListener('pointermove', function (e) {
      if (!drag) return;
      var target = drag.s - (e.clientX - drag.x);
      if (target < 0 && setW) { drag.s += setW; target += setW; }
      track.scrollLeft = target;
    });
    function endDrag() { if (!drag) return; drag = null; track.classList.remove('dragging'); hold(1500); }
    track.addEventListener('pointerup', endDrag); track.addEventListener('pointercancel', endDrag);

    function step(dir) {
      var card = track.children[0], gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      var amount = (card.offsetWidth + gap) * 2 * dir;
      if (dir < 0 && track.scrollLeft < Math.abs(amount) && setW) track.scrollLeft += setW;
      track.scrollBy({ left: amount, behavior: reduce ? 'auto' : 'smooth' }); hold(4000);
    }
    var prev = slider.querySelector('.an-prev'), next = slider.querySelector('.an-next');
    if (prev) prev.addEventListener('click', function () { step(-1); });
    if (next) next.addEventListener('click', function () { step(1); });
    track.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { step(1); e.preventDefault(); } else if (e.key === 'ArrowLeft') { step(-1); e.preventDefault(); }
    });
    track.setAttribute('tabindex', '0'); track.setAttribute('aria-label', 'Analytics recordings, use arrow keys to move');

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { inView = en[0].isIntersecting; }, { threshold: 0.05 }).observe(track);
    } else { inView = true; }

    var SPEED = 38; // px per second, moving left => carousel advances to the right
    function tick(t) {
      var dt = Math.min((t - (last || t)) / 1000, 0.1); last = t;
      if (!reduce && inView && !hovering && !drag && t > holdUntil && setW > 0 && track.offsetParent !== null) {
        pos += SPEED * dt; if (pos >= setW) pos -= setW; track.scrollLeft = pos;
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  /* ---------- dashboard screenshots: lightbox ---------- */
  document.addEventListener('click', function (e) {
    var btn = e.target.closest && e.target.closest('.dash-item'); if (!btn) return;
    var dlg = (btn.closest('.pg') || document).querySelector('dialog.lightbox'); if (!dlg) return;
    var big = dlg.querySelector('img'), im = btn.querySelector('img'); big.src = im.currentSrc || im.src; big.alt = im.alt;
    if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
  });
  document.querySelectorAll('dialog.lightbox').forEach(function (dlg) {
    dlg.addEventListener('click', function () { if (dlg.close) dlg.close(); else dlg.removeAttribute('open'); });
  });

  /* ---------- motion: scroll reveal, count-up, progress bar ---------- */
  if (!reduce && 'IntersectionObserver' in window) {
    document.documentElement.classList.add('js-motion');
    var SEL = ['.sec-tit', '.sec-mini-tit', '.ab-hd', '.section > h2', '.mm-h', '.mm-lead', '.bg-head', '.mm-stats li', '.brand-filters', '.an-slider', '.dash-wrap h2', '.dash-item', '.faq-wrap > *', '.faq-list details',
      '.pjs-sec > a', '.psec-list', '.package-box', '.testimonial-slider', '.project-cta > *', '.pj-all-head', '.pj-chips', '.pj-item', '.thk-card > *',
      '.bl-hero > *', '.bl-card', '.bl-cta', '.ar-head > *', '.ar-cover', '.prose > h2', '.prose > p:first-child', '.ar-cta', '.ar-author', '.bl-related h2', '.mm-foot-in > *'].join(',');
    var rv = Array.prototype.filter.call(document.querySelectorAll(SEL), function (el) { return !el.closest('.rv') || el.classList.contains('rv'); });
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -5% 0px' });
    var lastTop = -1, k = 0;
    rv.forEach(function (el) { var t = Math.round(el.getBoundingClientRect().top / 40); k = (t === lastTop) ? k + 1 : 0; lastTop = t; el.classList.add('rv'); el.style.setProperty('--d', Math.min(k, 5) * 0.09 + 's'); io.observe(el); });
    var bar = document.createElement('div'); bar.className = 'mm-progress'; bar.setAttribute('aria-hidden', 'true'); document.body.appendChild(bar);
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return; ticking = true;
      requestAnimationFrame(function () {
        var h = document.documentElement.scrollHeight - innerHeight;
        bar.style.transform = 'scaleX(' + (h > 0 ? Math.min(scrollY / h, 1) : 0) + ')'; ticking = false;
      });
    }, { passive: true });
  }
})();
