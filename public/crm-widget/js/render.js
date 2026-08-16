/* render.js — self-contained document renderer.
 * No framework. Builds an SVG per template from field values, then rasterizes to
 * a PNG blob (pure canvas) or a PDF blob (jsPDF, loaded on demand). */
(function (global) {
  'use strict';

  var esc = function (s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  };

  // Naive word-wrap → array of lines that fit `maxChars`.
  function wrap(text, maxChars, maxLines) {
    var words = String(text || '').split(/\s+/).filter(Boolean);
    var lines = [], line = '';
    for (var i = 0; i < words.length; i++) {
      var t = line ? line + ' ' + words[i] : words[i];
      if (t.length > maxChars && line) { lines.push(line); line = words[i]; if (lines.length === maxLines - 1) break; }
      else line = t;
    }
    if (line && lines.length < maxLines) lines.push(line);
    return lines;
  }

  function tspans(text, x, y, lh, maxChars, maxLines, attrs) {
    var lines = wrap(text, maxChars, maxLines || 4);
    return lines.map(function (ln, i) {
      return '<text x="' + x + '" y="' + (y + i * lh) + '" ' + (attrs || '') + '>' + esc(ln) + '</text>';
    }).join('');
  }

  // ── Template definitions ────────────────────────────────────────────────
  var TEMPLATES = {
    invoice: {
      label: 'Invoice',
      w: 1240, h: 1754,
      fields: [
        { key: 'business', label: 'Business name', sample: 'Acme Studio' },
        { key: 'client', label: 'Bill to', sample: 'Client Pvt Ltd' },
        { key: 'invoiceNo', label: 'Invoice #', sample: 'INV-001' },
        { key: 'date', label: 'Date', sample: '2026-07-28' },
        { key: 'amount', label: 'Amount', sample: '₹ 25,000' },
        { key: 'notes', label: 'Notes', sample: 'Thank you for your business.' }
      ],
      svg: function (v) {
        return ''
          + '<rect width="1240" height="1754" fill="#ffffff"/>'
          + '<rect width="1240" height="220" fill="#4c1d95"/>'
          + '<text x="80" y="130" fill="#fff" font-size="52" font-weight="800" font-family="Arial">' + esc(v.business || 'Your Business') + '</text>'
          + '<text x="80" y="180" fill="#c4b5fd" font-size="26" font-family="Arial">INVOICE</text>'
          + '<text x="1160" y="130" fill="#fff" font-size="30" font-weight="700" text-anchor="end" font-family="Arial">' + esc(v.invoiceNo || 'INV-001') + '</text>'
          + '<text x="1160" y="172" fill="#ddd6fe" font-size="24" text-anchor="end" font-family="Arial">' + esc(v.date || '') + '</text>'
          + '<text x="80" y="330" fill="#6b7280" font-size="24" font-family="Arial">BILL TO</text>'
          + '<text x="80" y="378" fill="#111827" font-size="34" font-weight="700" font-family="Arial">' + esc(v.client || 'Client') + '</text>'
          + '<rect x="80" y="470" width="1080" height="2" fill="#e5e7eb"/>'
          + '<text x="80" y="600" fill="#6b7280" font-size="26" font-family="Arial">Amount due</text>'
          + '<text x="1160" y="600" fill="#111827" font-size="54" font-weight="800" text-anchor="end" font-family="Arial">' + esc(v.amount || '') + '</text>'
          + tspans(v.notes || '', 80, 720, 40, 70, 4, 'fill="#374151" font-size="26" font-family="Arial"')
          + '<text x="80" y="1680" fill="#9ca3af" font-size="22" font-family="Arial"></text>';
      }
    },
    certificate: {
      label: 'Certificate',
      w: 1754, h: 1240,
      fields: [
        { key: 'title', label: 'Title', sample: 'Certificate of Achievement' },
        { key: 'recipient', label: 'Recipient', sample: 'Sunny Kumar' },
        { key: 'subtitle', label: 'For', sample: 'Outstanding performance' },
        { key: 'date', label: 'Date', sample: '2026-07-28' },
        { key: 'issuer', label: 'Issued by', sample: 'Acme Academy' }
      ],
      svg: function (v) {
        return ''
          + '<rect width="1754" height="1240" fill="#0f172a"/>'
          + '<rect x="40" y="40" width="1674" height="1160" fill="none" stroke="#c4b5fd" stroke-width="4"/>'
          + '<text x="877" y="300" fill="#c4b5fd" font-size="40" text-anchor="middle" font-family="Georgia">' + esc(v.title || 'Certificate') + '</text>'
          + '<text x="877" y="560" fill="#fff" font-size="92" font-weight="800" text-anchor="middle" font-family="Georgia">' + esc(v.recipient || 'Recipient') + '</text>'
          + '<rect x="627" y="600" width="500" height="3" fill="#7c3aed"/>'
          + tspans(v.subtitle || '', 877, 700, 52, 60, 2, 'fill="#cbd5e1" font-size="34" text-anchor="middle" font-family="Arial"')
          + '<text x="877" y="1000" fill="#94a3b8" font-size="30" text-anchor="middle" font-family="Arial">' + esc(v.date || '') + '</text>'
          + '<text x="877" y="1060" fill="#e2e8f0" font-size="34" font-weight="700" text-anchor="middle" font-family="Arial">' + esc(v.issuer || '') + '</text>';
      }
    },
    letter: {
      label: 'Letter',
      w: 1240, h: 1754,
      fields: [
        { key: 'from', label: 'From', sample: 'Acme Studio' },
        { key: 'to', label: 'To', sample: 'The Manager' },
        { key: 'date', label: 'Date', sample: '2026-07-28' },
        { key: 'subject', label: 'Subject', sample: 'Regarding your enquiry' },
        { key: 'body', label: 'Body', sample: 'Dear Sir/Madam, ...' }
      ],
      svg: function (v) {
        return ''
          + '<rect width="1240" height="1754" fill="#ffffff"/>'
          + '<text x="80" y="120" fill="#111827" font-size="34" font-weight="800" font-family="Arial">' + esc(v.from || '') + '</text>'
          + '<text x="1160" y="120" fill="#6b7280" font-size="26" text-anchor="end" font-family="Arial">' + esc(v.date || '') + '</text>'
          + '<text x="80" y="230" fill="#374151" font-size="28" font-family="Arial">To: ' + esc(v.to || '') + '</text>'
          + '<text x="80" y="320" fill="#111827" font-size="30" font-weight="700" font-family="Arial">Subject: ' + esc(v.subject || '') + '</text>'
          + tspans(v.body || '', 80, 430, 48, 74, 22, 'fill="#374151" font-size="28" font-family="Arial"')
          + '<text x="80" y="1680" fill="#9ca3af" font-size="22" font-family="Arial"></text>';
      }
    }
  };

  function buildSvg(templateKey, values) {
    var t = TEMPLATES[templateKey] || TEMPLATES.invoice;
    var inner = t.svg(values || {});
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + t.w + '" height="' + t.h + '" viewBox="0 0 ' + t.w + ' ' + t.h + '">' + inner + '</svg>';
    return { svg: svg, w: t.w, h: t.h };
  }

  // SVG string → canvas (rasterized at a sensible scale for crisp output).
  function svgToCanvas(svg, w, h) {
    return new Promise(function (resolve, reject) {
      var scale = Math.min(2, 1600 / w);
      var img = new Image();
      var url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
      img.onload = function () {
        var cv = document.createElement('canvas');
        cv.width = Math.round(w * scale); cv.height = Math.round(h * scale);
        var ctx = cv.getContext('2d');
        ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, cv.width, cv.height);
        ctx.drawImage(img, 0, 0, cv.width, cv.height);
        resolve(cv);
      };
      img.onerror = function () { reject(new Error('SVG render failed')); };
      img.src = url;
    });
  }

  function canvasToPngBlob(cv) {
    return new Promise(function (resolve) { cv.toBlob(function (b) { resolve(b); }, 'image/png'); });
  }

  // Load jsPDF on demand (only when the user chooses PDF).
  function loadJsPdf() {
    if (global.jspdf && global.jspdf.jsPDF) return Promise.resolve(global.jspdf.jsPDF);
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
      s.onload = function () { resolve(global.jspdf.jsPDF); };
      s.onerror = function () { reject(new Error('Could not load PDF library')); };
      document.head.appendChild(s);
    });
  }

  async function render(templateKey, values, filetype) {
    var built = buildSvg(templateKey, values);
    var cv = await svgToCanvas(built.svg, built.w, built.h);
    if (filetype === 'pdf') {
      var JsPDF = await loadJsPdf();
      var orientation = built.w >= built.h ? 'l' : 'p';
      var pdf = new JsPDF({ orientation: orientation, unit: 'px', format: [built.w, built.h] });
      pdf.addImage(cv.toDataURL('image/png'), 'PNG', 0, 0, built.w, built.h);
      return { blob: pdf.output('blob'), ext: 'pdf', type: 'application/pdf', svg: built.svg };
    }
    var blob = await canvasToPngBlob(cv);
    return { blob: blob, ext: 'png', type: 'image/png', svg: built.svg };
  }

  // ── Custom templates (user-uploaded image + mapped text fields) ──────────
  // A custom template = { id, name, image (dataURL), fields: [{ key, label, map,
  //   x, y, size, align, color, weight, sample }] }. x/y/size are fractions of
  //   the image width/height so the layout scales with the original design.
  function loadImageEl(src) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () { resolve(img); };
      img.onerror = function () { reject(new Error('Could not load the template image')); };
      img.src = src;
    });
  }

  async function renderCustomCanvas(tpl, values) {
    var img = await loadImageEl(tpl.image);
    var w = img.naturalWidth || 1000, h = img.naturalHeight || 1414;
    var cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    var ctx = cv.getContext('2d');
    ctx.drawImage(img, 0, 0, w, h);
    var fields = tpl.fields || [];
    for (var i = 0; i < fields.length; i++) {
      var f = fields[i];
      // Logo / image field — draw the uploaded logo at its position, scaled to width.
      if (f.kind === 'logo' && f.image) {
        try {
          var logo = await loadImageEl(f.image);
          var lw = Math.max(16, Math.round((f.wFrac || 0.2) * w));
          var ratio = (logo.naturalHeight && logo.naturalWidth) ? (logo.naturalHeight / logo.naturalWidth) : 1;
          ctx.drawImage(logo, Math.round((f.x || 0.1) * w), Math.round((f.y || 0.1) * h), lw, Math.round(lw * ratio));
        } catch (e) { /* skip a bad logo */ }
        continue;
      }
      // Text field — value from the record (or its sample).
      var val = (values && values[f.key] != null && values[f.key] !== '') ? values[f.key] : (f.sample || '');
      if (val === '' || val == null) continue;
      var px = Math.max(8, Math.round((f.size || 0.04) * w));
      ctx.font = (f.weight || '600') + ' ' + px + 'px ' + (f.font || 'Arial');
      ctx.fillStyle = f.color || '#111111';
      ctx.textAlign = f.align || 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(val), Math.round((f.x || 0.1) * w), Math.round((f.y || 0.1) * h));
    }
    return cv;
  }

  // A plain white "blank document" canvas (A4 portrait) as a data URL — lets a
  // user start from scratch and just place fields, without uploading a design.
  function blankDocDataUrl(w, h) {
    w = w || 1240; h = h || 1754;
    var cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    var ctx = cv.getContext('2d');
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, w, h);
    return cv.toDataURL('image/jpeg', 0.95);
  }

  async function renderCustom(tpl, values, filetype) {
    var cv = await renderCustomCanvas(tpl, values);
    if (filetype === 'pdf') {
      var JsPDF = await loadJsPdf();
      var orientation = cv.width >= cv.height ? 'l' : 'p';
      var pdf = new JsPDF({ orientation: orientation, unit: 'px', format: [cv.width, cv.height] });
      pdf.addImage(cv.toDataURL('image/png'), 'PNG', 0, 0, cv.width, cv.height);
      return { blob: pdf.output('blob'), ext: 'pdf', type: 'application/pdf' };
    }
    var blob = await canvasToPngBlob(cv);
    return { blob: blob, ext: 'png', type: 'image/png' };
  }

  global.PFRender = {
    TEMPLATES: TEMPLATES, buildSvg: buildSvg, render: render,
    renderCustomCanvas: renderCustomCanvas, renderCustom: renderCustom,
    blankDocDataUrl: blankDocDataUrl
  };
})(window);
