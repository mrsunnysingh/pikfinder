/* widget.js — Document widget for Zoho CRM.
 * Simple flow: upload a template (or blank page) → place fields (each mapped to a
 * CRM field, chosen from the module's API names) → add a logo → save the template
 * (kept for reuse) → pull the record's data → save the finished document to the
 * record (attach) or copy it for an email. */
(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };
  var TPL_KEY = 'crm-doc-templates';

  var rec = { entity: '', id: '', data: null };
  var crmFields = [];        // [{ api, label }] pulled from the module
  var builder = null;        // { image, fields:[], selected }
  var previewTimer = null;

  function status(msg, kind) {
    var el = $('pf-status'); el.hidden = !msg; el.textContent = msg || '';
    el.className = 'pf-status' + (kind ? ' pf-status-' + kind : '');
  }
  var esc = function (s) { return String(s == null ? '' : s).replace(/"/g, '&quot;').replace(/</g, '&lt;'); };
  var slug = function (s, i) {
    return (String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')) || ('field_' + ((i || 0) + 1));
  };

  // ── Template store (per browser). Persists for reuse. ────────────────────
  function loadTpls() { try { return JSON.parse(localStorage.getItem(TPL_KEY) || '[]'); } catch (e) { return []; } }
  function saveTpls(list) {
    try { localStorage.setItem(TPL_KEY, JSON.stringify(list)); return true; }
    catch (e) { status('Template is too large to save. Use a smaller design/logo.', 'err'); return false; }
  }
  function getTpl(id) { return loadTpls().filter(function (t) { return t.id === id; })[0] || null; }

  function selValue() { return $('pf-template').value; }
  function currentTpl() { return selValue() ? getTpl(selValue()) : null; }
  function textFields() {
    var t = currentTpl();
    return (t && t.fields ? t.fields.filter(function (f) { return f.kind !== 'logo'; }) : []);
  }

  function populateTemplates(selectVal) {
    var sel = $('pf-template'), cur = selectVal || sel.value;
    var list = loadTpls();
    sel.innerHTML = '';
    if (!list.length) {
      var o0 = document.createElement('option'); o0.value = ''; o0.textContent = '— no templates yet, create one —'; sel.appendChild(o0);
    }
    list.forEach(function (t) {
      var o = document.createElement('option'); o.value = t.id; o.textContent = t.name; sel.appendChild(o);
    });
    if (cur) sel.value = cur;
    $('pf-del-tpl').hidden = !sel.value;
  }

  // ── Fill-in inputs for the selected template's text fields ───────────────
  function renderFieldInputs(prefill) {
    var wrap = $('pf-fields'); wrap.innerHTML = '';
    textFields().forEach(function (f) {
      var val = (prefill && prefill[f.key] != null) ? prefill[f.key] : (f.sample || '');
      var lab = document.createElement('label');
      lab.className = 'pf-field';
      lab.innerHTML = '<span>' + esc(f.label) + (f.map ? ' <em>↔ ' + esc(f.map) + '</em>' : '') + '</span><input data-k="' + esc(f.key) + '" />';
      wrap.appendChild(lab);
      lab.querySelector('[data-k]').value = val;
    });
    wrap.querySelectorAll('[data-k]').forEach(function (el) { el.oninput = schedulePreview; });
    updatePreview();
  }
  function collectValues() {
    var out = {};
    $('pf-fields').querySelectorAll('[data-k]').forEach(function (el) { out[el.getAttribute('data-k')] = el.value; });
    return out;
  }

  // ── Preview ──────────────────────────────────────────────────────────────
  function schedulePreview() { clearTimeout(previewTimer); previewTimer = setTimeout(updatePreview, 180); }
  function updatePreview() {
    var box = $('pf-preview'); var t = currentTpl();
    if (!t) { box.innerHTML = ''; return; }
    window.PFRender.renderCustomCanvas(t, collectValues()).then(function (cv) {
      box.innerHTML = ''; cv.style.width = '100%'; cv.style.height = 'auto'; box.appendChild(cv);
    }).catch(function () { box.innerHTML = ''; });
  }

  // ── CRM record + field API names ─────────────────────────────────────────
  function flat(v) {
    if (v == null) return '';
    if (typeof v === 'object') return v.name || v.display_value || v.zc_display_value || v.id || '';
    return String(v);
  }
  function fetchRecord(then) {
    if (!rec.entity || !rec.id || !window.ZOHO || !ZOHO.CRM) { if (then) then(); return; }
    ZOHO.CRM.API.getRecord({ Entity: rec.entity, RecordID: rec.id }).then(function (r) {
      rec.data = (r && r.data && r.data[0]) || null;
      $('pf-record').textContent = rec.data
        ? ('Record: ' + (flat(rec.data.Full_Name) || flat(rec.data.Name) || flat(rec.data.Deal_Name) || flat(rec.data.Email) || rec.id) + '  ·  ' + rec.entity)
        : (rec.entity + ' · ' + rec.id);
      if (then) then();
    }).catch(function () { if (then) then(); });
  }
  // Pull the module's field API names so mapping is a dropdown, not typing.
  function loadCrmFields() {
    crmFields = [];
    if (!rec.entity || !window.ZOHO || !ZOHO.CRM || !ZOHO.CRM.META || !ZOHO.CRM.META.getFields) { fallbackFields(); return; }
    ZOHO.CRM.META.getFields({ Entity: rec.entity }).then(function (r) {
      var fs = (r && (r.fields || r.data)) || [];
      crmFields = fs.map(function (f) { return { api: f.api_name || f.apiName, label: f.field_label || f.display_label || f.api_name }; })
                    .filter(function (x) { return x.api; });
      if (!crmFields.length) fallbackFields();
    }).catch(fallbackFields);
  }
  function fallbackFields() {
    if (rec.data) crmFields = Object.keys(rec.data).filter(function (k) { return k[0] !== '$'; }).map(function (k) { return { api: k, label: k }; });
  }

  function pullFromRecord() {
    if (!rec.data) { fetchRecord(function () { if (rec.data) pullFromRecord(); }); return; }
    var lower = {}; Object.keys(rec.data).forEach(function (k) { lower[k.toLowerCase()] = rec.data[k]; });
    var pick = function (name) { if (!name) return null; var v = lower[String(name).toLowerCase()]; return v == null ? null : flat(v); };
    var prefill = {};
    textFields().forEach(function (f) {
      var hit = pick(f.map) != null ? pick(f.map) : (pick(f.key) != null ? pick(f.key) : pick(f.label));
      if (hit != null) prefill[f.key] = hit;
    });
    renderFieldInputs(prefill);
    status('Pulled values from the record.', 'ok');
  }

  // ── Generate + save to record / copy ─────────────────────────────────────
  async function renderNow(filetype) {
    var t = currentTpl();
    var rendered = await window.PFRender.renderCustom(t, collectValues(), filetype);
    return { blob: rendered.blob, name: slug(t.name) + '-' + Date.now() + '.' + rendered.ext, type: rendered.type };
  }
  async function attachToRecord() {
    if (!currentTpl()) { status('Create or select a template first.', 'warn'); return; }
    if (!rec.entity || !rec.id) { status('Open this widget from a record to save.', 'warn'); return; }
    $('pf-attach').disabled = true; status('Rendering document…');
    try {
      var out = await renderNow($('pf-filetype').value);
      var file = new File([out.blob], out.name, { type: out.type });
      status('Saving to the record…');
      await ZOHO.CRM.API.attachFile({ Entity: rec.entity, RecordID: rec.id, File: { Name: out.name, Content: file } });
      status('✅ Saved to the record. Add it to an email via Attachments → From Records.', 'ok');
    } catch (e) {
      status('Save failed: ' + (e && e.message ? e.message : JSON.stringify(e)), 'err');
    } finally { $('pf-attach').disabled = false; }
  }
  async function copyForEmail() {
    if (!currentTpl()) { status('Create or select a template first.', 'warn'); return; }
    $('pf-copy').disabled = true; status('Rendering image…');
    try {
      var built = await window.PFRender.renderCustom(currentTpl(), collectValues(), 'png');
      if (navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': built.blob })]);
        status('✅ Image copied — click into the email body and paste (Ctrl/Cmd+V).', 'ok');
      } else {
        var a = document.createElement('a'); a.href = URL.createObjectURL(built.blob);
        a.download = slug(currentTpl().name) + '.png'; document.body.appendChild(a); a.click(); a.remove();
        status('Clipboard blocked — downloaded the image; drag it into the email.', 'warn');
      }
    } catch (e) { status('Could not copy: ' + (e && e.message ? e.message : e), 'err'); }
    finally { $('pf-copy').disabled = false; }
  }

  // ── Builder ──────────────────────────────────────────────────────────────
  function setBuilderImage(dataUrl) {
    builder.image = dataUrl; $('pf-b-img').src = dataUrl;
    $('pf-b-stage').hidden = false; $('pf-b-hint').hidden = false; drawMarks();
  }
  function openBuilder() {
    builder = { image: '', fields: [], selected: null };
    $('pf-b-name').value = ''; $('pf-b-image').value = ''; $('pf-b-img').removeAttribute('src');
    $('pf-b-stage').hidden = true; $('pf-b-hint').hidden = true; $('pf-b-list').innerHTML = '';
    $('pf-builder').hidden = false;
  }
  function closeBuilder() { builder = null; $('pf-builder').hidden = true; }

  function loadPdfJs() {
    if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
    return new Promise(function (res, rej) {
      var s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      s.onload = function () { try { window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'; } catch (e) {} res(window.pdfjsLib); };
      s.onerror = function () { rej(new Error('Could not load the PDF reader')); };
      document.head.appendChild(s);
    });
  }
  async function pdfToImage(file) {
    var pdfjsLib = await loadPdfJs();
    var buf = await file.arrayBuffer();
    var pdf = await pdfjsLib.getDocument({ data: buf }).promise;
    var page = await pdf.getPage(1);
    var b = page.getViewport({ scale: 1 });
    var vp = page.getViewport({ scale: Math.min(2.5, 1400 / b.width) });
    var cv = document.createElement('canvas'); cv.width = Math.round(vp.width); cv.height = Math.round(vp.height);
    var ctx = cv.getContext('2d'); ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, cv.width, cv.height);
    await page.render({ canvasContext: ctx, viewport: vp }).promise;
    return cv.toDataURL('image/jpeg', 0.92);
  }
  function onBuilderImage(e) {
    var f = e.target.files && e.target.files[0]; if (!f) return;
    if (f.type === 'application/pdf' || /\.pdf$/i.test(f.name)) {
      status('Reading PDF…');
      pdfToImage(f).then(function (u) { setBuilderImage(u); status('PDF loaded — click on it to place fields.', 'ok'); })
        .catch(function (err) { status('Could not read the PDF: ' + (err && err.message ? err.message : err), 'err'); });
    } else {
      var r = new FileReader(); r.onload = function () { setBuilderImage(String(r.result)); }; r.readAsDataURL(f);
    }
  }
  function useBlank() {
    setBuilderImage(window.PFRender.blankDocDataUrl());
    status('Blank page ready — click on it to place fields.', 'ok');
  }

  function addTextField() {
    if (!builder.image) { status('Upload a design or use a blank page first.', 'warn'); return; }
    var i = builder.fields.length;
    builder.fields.push({ kind: 'text', label: 'Field ' + (i + 1), map: '', x: 0.15, y: 0.15 + i * 0.07, size: 0.04, align: 'left', color: '#111111', weight: '600', sample: '' });
    builder.selected = i; renderBuilderList(); drawMarks();
  }
  function addLogoFromFile(file) {
    var r = new FileReader();
    r.onload = function () {
      var i = builder.fields.length;
      builder.fields.push({ kind: 'logo', label: 'Logo', image: String(r.result), x: 0.1, y: 0.06, wFrac: 0.22 });
      builder.selected = i; renderBuilderList(); drawMarks();
      status('Logo added — click on the design to position it.', 'ok');
    };
    r.readAsDataURL(file);
  }

  function mapControl(f) {
    if (crmFields.length) {
      var opts = '<option value="">— choose CRM field —</option>' + crmFields.map(function (c) {
        return '<option value="' + esc(c.api) + '"' + (f.map === c.api ? ' selected' : '') + '>' + esc(c.label) + '  (' + esc(c.api) + ')</option>';
      }).join('');
      return '<select class="pf-b-map">' + opts + '</select>';
    }
    return '<input class="pf-b-map" placeholder="CRM field API name e.g. Last_Name" value="' + esc(f.map) + '" />';
  }
  function renderBuilderList() {
    var box = $('pf-b-list'); box.innerHTML = '';
    builder.fields.forEach(function (f, i) {
      var row = document.createElement('div');
      row.className = 'pf-b-row' + (builder.selected === i ? ' sel' : '');
      if (f.kind === 'logo') {
        row.innerHTML =
          '<div class="pf-b-row-top">' +
            '<img class="pf-b-logo-thumb" src="' + f.image + '" alt="" />' +
            '<span style="flex:1;font-weight:600;">Logo</span>' +
            '<button class="pf-btn pf-btn-ghost pf-btn-sm pf-b-place" type="button">Place</button>' +
            '<button class="pf-x pf-b-del" type="button" aria-label="Remove">×</button>' +
          '</div>' +
          '<div class="pf-b-row-style"><label>Size<select class="pf-b-size">' +
            ['0.15:Small', '0.22:Medium', '0.32:Large', '0.45:XL'].map(function (o) { var p = o.split(':'); return '<option value="' + p[0] + '"' + (String(f.wFrac) === p[0] ? ' selected' : '') + '>' + p[1] + '</option>'; }).join('') +
          '</select></label></div>';
        row.querySelector('.pf-b-size').onchange = function () { f.wFrac = parseFloat(this.value); };
      } else {
        row.innerHTML =
          '<div class="pf-b-row-top">' +
            '<input class="pf-b-label" placeholder="Field label" value="' + esc(f.label) + '" />' +
            '<button class="pf-btn pf-btn-ghost pf-btn-sm pf-b-place" type="button">Place</button>' +
            '<button class="pf-x pf-b-del" type="button" aria-label="Remove">×</button>' +
          '</div>' +
          '<div class="pf-b-row-map"><span>maps to</span>' + mapControl(f) + '</div>' +
          '<div class="pf-b-row-style">' +
            '<label>Size<select class="pf-b-size">' +
              ['0.03:Small', '0.04:Medium', '0.055:Large', '0.08:XL'].map(function (o) { var p = o.split(':'); return '<option value="' + p[0] + '"' + (String(f.size) === p[0] ? ' selected' : '') + '>' + p[1] + '</option>'; }).join('') +
            '</select></label>' +
            '<label>Align<select class="pf-b-align">' +
              ['left', 'center', 'right'].map(function (a) { return '<option value="' + a + '"' + (f.align === a ? ' selected' : '') + '>' + a + '</option>'; }).join('') +
            '</select></label>' +
            '<label>Color<input type="color" class="pf-b-color" value="' + (f.color || '#111111') + '" /></label>' +
          '</div>';
        row.querySelector('.pf-b-label').oninput = function () { f.label = this.value; };
        row.querySelector('.pf-b-map').onchange = function () { f.map = this.value.trim(); };
        row.querySelector('.pf-b-map').oninput = function () { f.map = this.value.trim(); };
        row.querySelector('.pf-b-align').onchange = function () { f.align = this.value; };
        row.querySelector('.pf-b-color').oninput = function () { f.color = this.value; };
        row.querySelector('.pf-b-size').onchange = function () { f.size = parseFloat(this.value); };
      }
      row.querySelector('.pf-b-place').onclick = function () { builder.selected = i; renderBuilderList(); $('pf-b-hint').hidden = false; };
      row.querySelector('.pf-b-del').onclick = function () { builder.fields.splice(i, 1); if (builder.selected === i) builder.selected = null; renderBuilderList(); drawMarks(); };
      box.appendChild(row);
    });
  }
  function onStageClick(e) {
    if (builder == null || builder.selected == null || !builder.image) return;
    var img = $('pf-b-img'); var r = img.getBoundingClientRect();
    builder.fields[builder.selected].x = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    builder.fields[builder.selected].y = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
    drawMarks();
  }
  function drawMarks() {
    var box = $('pf-b-marks'); if (!box || !builder) return; box.innerHTML = '';
    builder.fields.forEach(function (f, i) {
      var m = document.createElement('div');
      m.className = 'pf-b-mark' + (builder.selected === i ? ' sel' : '');
      m.style.left = (f.x * 100) + '%'; m.style.top = (f.y * 100) + '%';
      m.textContent = f.kind === 'logo' ? 'Logo' : (f.label || ('#' + (i + 1)));
      m.onclick = function (ev) { ev.stopPropagation(); builder.selected = i; renderBuilderList(); drawMarks(); };
      box.appendChild(m);
    });
  }
  function saveBuilder() {
    var name = $('pf-b-name').value.trim();
    if (!name) { status('Give the template a name.', 'warn'); return; }
    if (!builder.image) { status('Upload a design or use a blank page.', 'warn'); return; }
    if (!builder.fields.length) { status('Add at least one field or logo.', 'warn'); return; }
    var used = {};
    var fields = builder.fields.map(function (f, i) {
      if (f.kind === 'logo') return { kind: 'logo', label: 'Logo', image: f.image, x: f.x, y: f.y, wFrac: f.wFrac };
      var key = slug(f.label, i); while (used[key]) key = key + '_' + i; used[key] = 1;
      return { kind: 'text', key: key, label: f.label || key, map: f.map || '', x: f.x, y: f.y, size: f.size, align: f.align, color: f.color, weight: f.weight || '600', sample: '' };
    });
    var tpl = { id: 't' + Date.now(), name: name, image: builder.image, fields: fields };
    if (!saveTpls([tpl].concat(loadTpls()))) return;
    closeBuilder(); populateTemplates(tpl.id); renderFieldInputs(null);
    status('Template saved — it’s ready to use above.', 'ok');
  }
  function deleteCurrent() {
    if (!currentTpl() || !confirm('Delete this template?')) return;
    saveTpls(loadTpls().filter(function (t) { return t.id !== selValue(); }));
    populateTemplates(); renderFieldInputs(null); status('Template deleted.', 'ok');
  }

  // ── Boot ─────────────────────────────────────────────────────────────────
  function wireUi() {
    populateTemplates(); renderFieldInputs(null);
    $('pf-template').onchange = function () { $('pf-del-tpl').hidden = !selValue(); renderFieldInputs(null); };
    $('pf-refresh').onclick = pullFromRecord;
    $('pf-attach').onclick = attachToRecord;
    $('pf-copy').onclick = copyForEmail;
    $('pf-new-tpl').onclick = openBuilder;
    $('pf-del-tpl').onclick = deleteCurrent;
    $('pf-builder-close').onclick = closeBuilder;
    $('pf-b-cancel').onclick = closeBuilder;
    $('pf-b-save').onclick = saveBuilder;
    $('pf-b-image').onchange = onBuilderImage;
    $('pf-b-blank').onclick = useBlank;
    $('pf-b-addfield').onclick = addTextField;
    $('pf-b-addlogo').onclick = function () { $('pf-b-logofile').click(); };
    $('pf-b-logofile').onchange = function (e) { var f = e.target.files && e.target.files[0]; if (f) addLogoFromFile(f); e.target.value = ''; };
    $('pf-b-stage').onclick = onStageClick;
  }

  if (window.ZOHO && ZOHO.embeddedApp) {
    ZOHO.embeddedApp.on('PageLoad', function (data) {
      rec.entity = (data && (data.Entity || data.module)) || '';
      rec.id = (data && (data.EntityId || (data.EntityIds && data.EntityIds[0]) || data.RecordID)) || '';
      if (Array.isArray(rec.id)) rec.id = rec.id[0];
      wireUi();
      fetchRecord(loadCrmFields);
      status('Connected to Zoho CRM.', 'ok');
      setTimeout(function () { status('', ''); }, 1500);
    });
    ZOHO.embeddedApp.init();
  } else {
    wireUi();
    $('pf-record').textContent = 'Preview mode (open inside a CRM record to pull fields & save).';
    status('Preview mode.', 'warn');
  }
})();
