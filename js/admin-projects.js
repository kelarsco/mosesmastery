/* Dashboard > Projects: add, edit, hide, reorder and soft-delete the items of "All projects", with undo/redo.
   Data lives in `portfolio_items` (see supabase/schema.sql). All text is rendered with textContent. */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var ctx, sb, DEMO, rows = [], undoS = [], redoS = [], showTrash = false, editing = null, loaded = false;
  var KINDS = { store: 'Store', video: 'Recording', shot: 'Snapshot' };

  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function note(t, err) { var n = $('pjNote'); n.textContent = t || ''; n.className = 'ad-note' + (err ? ' err' : ''); }
  function fail(e) { note('That did not save: ' + ((e && e.message) || e), true); render(); }
  var FIELDS = ['kind', 'title', 'subtitle', 'tag', 'url', 'media_url', 'poster_url', 'alt', 'sort', 'visible', 'deleted_at'];
  function pick(o) { var r = {}; FIELDS.forEach(function (k) { r[k] = o[k]; }); return r; }
  function byId(id) { return rows.filter(function (r) { return r.id === id; })[0]; }
  function sorted() { return rows.slice().sort(function (a, b) { return a.sort - b.sort; }); }

  /* ---------- data layer (real DB, or in-memory demo) ---------- */
  var demoId = 1000;
  function dbUpdate(id, patch) {
    patch = Object.assign({}, patch, { updated_at: new Date().toISOString() });
    if (DEMO) { Object.assign(byId(id), patch); return Promise.resolve(); }
    return sb.from('portfolio_items').update(patch).eq('id', id).then(function (r) { if (r.error) throw r.error; Object.assign(byId(id), patch); });
  }
  function dbInsert(list) {
    if (DEMO) { list.forEach(function (d) { rows.push(Object.assign({ id: 'd' + (demoId++) }, d)); }); return Promise.resolve(); }
    return sb.from('portfolio_items').insert(list).select().then(function (r) { if (r.error) throw r.error; rows = rows.concat(r.data); return r.data; });
  }
  function load() {
    if (DEMO) { if (!loaded) rows = (window.MM_PORTFOLIO_SEED || []).slice(0, 8).map(function (d, i) { return Object.assign({ id: 'd' + i, deleted_at: null }, d); }); loaded = true; render(); return; }
    note('Loading...');
    sb.from('portfolio_items').select('*').order('sort', { ascending: true }).limit(500).then(function (r) {
      if (r.error) return note('Could not load projects. Did you run section 4 of supabase/schema.sql? (' + r.error.message + ')', true);
      rows = r.data; loaded = true; note(''); render();
    });
  }

  /* ---------- history: every change records how to reverse it ---------- */
  function push(entry) { undoS.push(entry); redoS = []; btns(); log(entry.label); }
  function log(action) { if (!DEMO) sb.from('admin_log').insert({ admin: ctx.email, action: 'projects: ' + action, detail: {} }).then(function () {}); }
  function btns() { $('pjUndo').disabled = !undoS.length; $('pjRedo').disabled = !redoS.length; }
  function undo() { var e = undoS.pop(); if (!e) return; e.undo().then(function () { redoS.push(e); note('Undone: ' + e.label); render(); }).catch(fail); }
  function redo() { var e = redoS.pop(); if (!e) return; e.redo().then(function () { undoS.push(e); note('Redone: ' + e.label); render(); }).catch(fail); }

  function change(id, patch, label) {
    var r = byId(id), before = {}; Object.keys(patch).forEach(function (k) { before[k] = r[k]; });
    return dbUpdate(id, patch).then(function () {
      push({ label: label, undo: function () { return dbUpdate(id, before); }, redo: function () { return dbUpdate(id, patch); } });
      render();
    }).catch(fail);
  }
  function move(id, dir) {
    var list = sorted().filter(function (r) { return !r.deleted_at; }), i = list.findIndex(function (r) { return r.id === id; }), j = i + dir;
    if (i < 0 || j < 0 || j >= list.length) return;
    var a = list[i], b = list[j], sa = a.sort, sb2 = b.sort; if (sa === sb2) sb2 = sa + dir;
    Promise.all([dbUpdate(a.id, { sort: sb2 }), dbUpdate(b.id, { sort: sa })]).then(function () {
      push({ label: 'moved ' + (a.title || KINDS[a.kind]), undo: function () { return Promise.all([dbUpdate(a.id, { sort: sa }), dbUpdate(b.id, { sort: sb2 })]); }, redo: function () { return Promise.all([dbUpdate(a.id, { sort: sb2 }), dbUpdate(b.id, { sort: sa })]); } });
      render();
    }).catch(fail);
  }

  /* ---------- list ---------- */
  function thumb(r) {
    var box = el('span', 'pj-th');
    var src = r.kind === 'video' ? r.poster_url : r.media_url;
    if (src) { var i = el('img'); i.src = src; i.alt = ''; i.loading = 'lazy'; box.appendChild(i); } else box.appendChild(el('i', 'fa-solid fa-' + (r.kind === 'video' ? 'film' : 'image')));
    return box;
  }
  function render() {
    var f = $('pjFilter').value, ul = $('pjList'); ul.textContent = '';
    var list = sorted().filter(function (r) { return (showTrash ? !!r.deleted_at : !r.deleted_at) && (f === 'all' || r.kind === f); });
    $('pjImport').hidden = !!rows.length || showTrash;
    list.forEach(function (r, idx) {
      var li = el('li', 'pj-row' + (r.visible ? '' : ' off')); li.appendChild(thumb(r));
      var tx = el('span', 'pj-tx'); tx.appendChild(el('strong', null, r.title || '(no title)'));
      tx.appendChild(el('em', null, KINDS[r.kind] + (r.subtitle ? ' - ' + r.subtitle : '') + (r.visible || r.deleted_at ? '' : ' - hidden'))); li.appendChild(tx);
      var act = el('span', 'pj-act');
      function b(label, icon, fn, dis) { var x = el('button', 'ad-icon'); x.type = 'button'; x.title = label; x.setAttribute('aria-label', label + ': ' + (r.title || KINDS[r.kind])); x.innerHTML = '<i class="' + icon + '"></i>'; if (dis) x.disabled = true; x.addEventListener('click', fn); act.appendChild(x); }
      if (r.deleted_at) b('Restore', 'fa-solid fa-rotate-left', function () { change(r.id, { deleted_at: null }, 'restored ' + r.title); });
      else {
        b('Move up', 'fa-solid fa-arrow-up', function () { move(r.id, -1); }, idx === 0 || f !== 'all');
        b('Move down', 'fa-solid fa-arrow-down', function () { move(r.id, 1); }, idx === list.length - 1 || f !== 'all');
        b(r.visible ? 'Hide from site' : 'Show on site', r.visible ? 'fa-regular fa-eye' : 'fa-regular fa-eye-slash', function () { change(r.id, { visible: !r.visible }, (r.visible ? 'hid ' : 'showed ') + r.title); });
        b('Edit', 'fa-solid fa-pen', function () { openDlg(r); });
        b('Delete', 'fa-regular fa-trash-can', function () { change(r.id, { deleted_at: new Date().toISOString() }, 'deleted ' + r.title); });
      }
      li.appendChild(act); ul.appendChild(li);
    });
    if (!list.length) ul.appendChild(el('li', 'ad-empty', showTrash ? 'Nothing deleted.' : rows.length ? 'Nothing here.' : 'No projects yet. Click "Import the current projects" to bring in the 26 already on your site, or add one.'));
    btns();
  }

  /* ---------- add / edit dialog ---------- */
  var form, dlg;
  function syncKind() {
    var k = $('pjKind').value;
    ['store', 'video', 'shot'].forEach(function (x) { form.querySelectorAll('.pj-f-' + x).forEach(function (n) { n.hidden = (x !== k) && !n.classList.contains('pj-f-' + k); }); });
    $('pjMediaLbl').textContent = k === 'video' ? 'Video file (MP4)' : k === 'shot' ? 'Screenshot image' : 'Homepage screenshot image';
    $('pjFile').accept = k === 'video' ? 'video/mp4' : 'image/jpeg,image/png,image/webp';
  }
  function openDlg(r) {
    editing = r || null; form.reset(); $('pjErr').textContent = '';
    $('pjDlgTitle').textContent = r ? 'Edit project' : 'Add project';
    if (r) ['kind', 'title', 'subtitle', 'tag', 'url', 'media_url', 'alt'].forEach(function (k) { form.elements[k].value = r[k] || ''; });
    $('pjKind').disabled = !!r; syncKind();
    if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
  }
  function closeDlg() { if (dlg.close) dlg.close(); else dlg.removeAttribute('open'); }
  function upload(file, okTypes, max) {
    if (!file) return Promise.resolve('');
    if (okTypes.indexOf(file.type) === -1) return Promise.reject(new Error('That file type is not allowed.'));
    if (file.size > max) return Promise.reject(new Error('File is too large (max ' + Math.round(max / 1048576) + ' MB).'));
    if (DEMO) return Promise.resolve(URL.createObjectURL(file));
    var ext = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'video/mp4': 'mp4' }[file.type];
    var name = Date.now() + '-' + Math.random().toString(36).slice(2, 8) + '.' + ext;
    return sb.storage.from('portfolio').upload(name, file, { contentType: file.type, upsert: false }).then(function (r) {
      if (r.error) throw r.error; return sb.storage.from('portfolio').getPublicUrl(name).data.publicUrl;
    });
  }
  function save(ev) {
    ev.preventDefault(); var err = $('pjErr'); err.textContent = ''; err.className = 'ad-note err';
    var d = {}, F = form.elements; ['kind', 'title', 'subtitle', 'tag', 'url', 'media_url', 'alt'].forEach(function (k) { d[k] = (F[k].value || '').trim(); });
    if (editing) d.kind = editing.kind;
    if (d.kind !== 'store') { d.subtitle = ''; d.tag = ''; d.url = ''; }
    if (d.kind === 'shot' && !d.title) d.title = d.alt.slice(0, 100) || 'Dashboard snapshot';
    if (d.kind !== 'video') $('pjPosterFile').value = '';
    if (d.kind === 'store' && !d.title) return (err.textContent = 'Please enter the store name.');
    if (d.url && !/^https?:\/\//i.test(d.url)) return (err.textContent = 'The link must start with https://');
    if (d.media_url && !/^https:\/\//i.test(d.media_url) && !/^asset\//.test(d.media_url)) return (err.textContent = 'The pasted file link must start with https://');
    var btn = $('pjSave'); btn.disabled = true; btn.textContent = 'Saving...';
    var imgTypes = ['image/jpeg', 'image/png', 'image/webp'];
    var mainP = upload($('pjFile').files[0], d.kind === 'video' ? ['video/mp4'] : imgTypes, d.kind === 'video' ? 52428800 : 10485760);
    var posterP = upload($('pjPosterFile').files[0], imgTypes, 10485760);
    Promise.all([mainP, posterP]).then(function (u) {
      if (u[0]) d.media_url = u[0]; if (u[1]) d.poster_url = u[1];
      if (!d.media_url) throw new Error('Please upload a file or paste a link to it.');
      if (editing) {
        var patch = {}; Object.keys(d).forEach(function (k) { if (d[k] !== editing[k] && !(k === 'poster_url' && !d[k])) patch[k] = d[k]; });
        closeDlg(); if (Object.keys(patch).length) return change(editing.id, patch, 'edited ' + (d.title || KINDS[d.kind]));
        return;
      }
      var top = rows.reduce(function (m, r) { return Math.max(m, r.sort); }, 0);
      d.sort = top + 10; d.visible = true; if (!d.poster_url) d.poster_url = '';
      return dbInsert([d]).then(function (ins) {
        var made = DEMO ? rows[rows.length - 1] : ins[0];
        push({ label: 'added ' + (d.title || KINDS[d.kind]), undo: function () { return dbUpdate(made.id, { deleted_at: new Date().toISOString() }); }, redo: function () { return dbUpdate(made.id, { deleted_at: null }); } });
        closeDlg(); render();
      });
    }).catch(function (e) { err.textContent = (e && e.message) || String(e); }).then(function () { btn.disabled = false; btn.textContent = 'Save'; });
  }

  function importSeed() {
    var seed = window.MM_PORTFOLIO_SEED || []; if (!seed.length || rows.length) return;
    $('pjImport').disabled = true; note('Importing ' + seed.length + ' projects...');
    dbInsert(seed.map(function (s) { return pick(Object.assign({}, s, { deleted_at: null })); }).map(function (s) { delete s.deleted_at; return s; })).then(function () {
      note('Imported ' + seed.length + ' projects. They now show from here.'); log('imported ' + seed.length + ' projects'); $('pjImport').disabled = false; render();
    }).catch(function (e) { $('pjImport').disabled = false; fail(e); });
  }

  function init(c) {
    ctx = c; sb = c.sb; DEMO = c.DEMO; form = $('pjForm'); dlg = $('pjDlg');
    $('pjAdd').addEventListener('click', function () { openDlg(null); });
    $('pjImport').addEventListener('click', importSeed);
    $('pjFilter').addEventListener('change', render);
    $('pjTrash').addEventListener('click', function () { showTrash = !showTrash; $('pjTrash').setAttribute('aria-pressed', showTrash); $('pjTrash').querySelector('span').textContent = showTrash ? 'Show projects' : 'Show deleted'; render(); });
    $('pjUndo').addEventListener('click', undo); $('pjRedo').addEventListener('click', redo);
    $('pjKind').addEventListener('change', syncKind); $('pjCancel').addEventListener('click', closeDlg); form.addEventListener('submit', save);
  }
  window.MMProjects = { init: init, show: function () { if (!loaded) load(); } };
})();
