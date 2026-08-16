// PikFinder Figma plugin — main thread (runs in Figma's sandbox).
// The UI (ui.html) searches PikFinder and, when the user picks a result, sends
// the raw image bytes (or an icon SVG) here; we turn them into a node at the
// centre of the viewport.
//
// Monetisation: free users get a daily insert cap; PikFinder Pro removes it.
// The cap is tracked in figma.clientStorage (persists across sessions and can't
// be reset by reloading the UI). The UI does the network licence check (only the
// iframe has fetch) and tells us the result to persist.

figma.showUI(__html__, { width: 360, height: 600, themeColors: false, title: 'PikFinder' });

var FREE_DAILY_LIMIT = 10;
var pro = false;
var licenseKey = '';
var usage = { date: '', n: 0 };

function todayStr() { return new Date().toISOString().slice(0, 10); }

async function loadState() {
  try {
    pro = (await figma.clientStorage.getAsync('pf_pro')) === true;
    licenseKey = (await figma.clientStorage.getAsync('pf_key')) || '';
    var u = await figma.clientStorage.getAsync('pf_usage');
    usage = (u && u.date === todayStr()) ? u : { date: todayStr(), n: 0 };
  } catch (e) { usage = { date: todayStr(), n: 0 }; }
}
async function setPro(v, key) {
  pro = v === true;
  if (key != null) licenseKey = String(key);
  try {
    await figma.clientStorage.setAsync('pf_pro', pro);
    await figma.clientStorage.setAsync('pf_key', licenseKey);
  } catch (e) { /* non-fatal */ }
}
async function bumpUsage() {
  if (pro) return;
  if (usage.date !== todayStr()) usage = { date: todayStr(), n: 0 };
  usage.n += 1;
  try { await figma.clientStorage.setAsync('pf_usage', usage); } catch (e) { /* non-fatal */ }
}
function overQuota() {
  if (pro) return false;
  if (usage.date !== todayStr()) usage = { date: todayStr(), n: 0 };
  return usage.n >= FREE_DAILY_LIMIT;
}
function sendState() {
  figma.ui.postMessage({ type: 'state', pro: pro, key: licenseKey, used: usage.n, limit: FREE_DAILY_LIMIT });
}

figma.ui.onmessage = async (msg) => {
  if (!msg || !msg.type) return;

  if (msg.type === 'get-state') {
    await loadState();
    sendState();
    return;
  }

  if (msg.type === 'set-pro') {
    await setPro(msg.pro, msg.key);
    sendState();
    if (!msg.silent) {
      figma.notify(pro ? '✅ PikFinder Pro activated — enjoy unlimited inserts!' : 'That key isn’t Pro. Check it and try again.', { error: !pro });
    }
    return;
  }

  if (msg.type === 'insert-image') {
    if (overQuota()) { figma.ui.postMessage({ type: 'limit' }); figma.notify('Daily free limit reached. Upgrade to Pro for unlimited inserts.'); return; }
    try {
      const bytes = new Uint8Array(msg.bytes);
      const image = figma.createImage(bytes);
      let w = 800, h = 600;
      try {
        const size = await image.getSizeAsync();
        w = size.width; h = size.height;
      } catch (e) { /* fall back to defaults */ }

      // Cap the longest side so huge photos don't dwarf the canvas.
      const MAX = 900;
      const scale = Math.min(1, MAX / Math.max(w, h));
      const rw = Math.max(1, Math.round(w * scale));
      const rh = Math.max(1, Math.round(h * scale));

      const rect = figma.createRectangle();
      rect.resize(rw, rh);
      const c = figma.viewport.center;
      rect.x = Math.round(c.x - rw / 2);
      rect.y = Math.round(c.y - rh / 2);
      rect.fills = [{ type: 'IMAGE', scaleMode: 'FILL', imageHash: image.hash }];
      rect.name = (msg.name || 'PikFinder image').slice(0, 60);

      figma.currentPage.appendChild(rect);
      figma.currentPage.selection = [rect];
      figma.viewport.scrollAndZoomIntoView([rect]);

      await bumpUsage();
      figma.ui.postMessage({ type: 'inserted', id: msg.id });
      sendState();
      figma.notify('Added to canvas');
    } catch (err) {
      figma.ui.postMessage({ type: 'insert-error', id: msg.id });
      figma.notify('Could not insert that image — try another.', { error: true });
    }
    return;
  }

  if (msg.type === 'insert-svg') {
    if (overQuota()) { figma.ui.postMessage({ type: 'limit' }); figma.notify('Daily free limit reached. Upgrade to Pro for unlimited inserts.'); return; }
    try {
      const node = figma.createNodeFromSvg(String(msg.svg || ''));
      // Scale to a sensible default size (longest side ~120px) for icons.
      const MAX = 120;
      const w = node.width || 24, h = node.height || 24;
      const scale = Math.min(1, MAX / Math.max(w, h));
      if (scale < 1 && node.rescale) node.rescale(scale);

      const c = figma.viewport.center;
      node.x = Math.round(c.x - (node.width || 0) / 2);
      node.y = Math.round(c.y - (node.height || 0) / 2);
      node.name = (msg.name || 'PikFinder icon').slice(0, 60);

      figma.currentPage.appendChild(node);
      figma.currentPage.selection = [node];
      figma.viewport.scrollAndZoomIntoView([node]);

      await bumpUsage();
      figma.ui.postMessage({ type: 'inserted', id: msg.id });
      sendState();
      figma.notify('Icon added to canvas');
    } catch (err) {
      figma.ui.postMessage({ type: 'insert-error', id: msg.id });
      figma.notify('Could not insert that icon — try another.', { error: true });
    }
    return;
  }

  if (msg.type === 'notify') {
    figma.notify(String(msg.text || ''));
    return;
  }

  if (msg.type === 'close') {
    figma.closePlugin();
  }
};
