# PikFinder — Browser Extension (MVP)

A lightweight Chrome/Edge extension that brings PikFinder's free stock search everywhere:

- **Toolbar popup** — search millions of free, copyright-safe **photos & videos**; open the full
  asset, or send any photo straight into **PikFinder Studio** to edit.
- **Right-click menus** — select text on any page → *"Search PikFinder for …"*; right-click any
  image → *"Edit this image in PikFinder Studio"*.

It reuses the live PikFinder API (`/api/search`), which already sends permissive CORS, so there's
no server work to do.

## Files
```
chrome-extension/
├── manifest.json    # MV3 config
├── background.js    # context-menu service worker
├── popup.html       # popup UI (brand theme + animated logo)
├── popup.js         # search logic (calls /api/search)
└── README.md
```

## Load it locally (test in seconds)
1. Open `chrome://extensions` (or `edge://extensions`).
2. Toggle **Developer mode** (top-right).
3. Click **Load unpacked** and select this `chrome-extension/` folder.
4. Pin the PikFinder icon and click it — search away.

## Add icons (recommended before publishing)
Chrome shows a default icon without these. Add PNGs and reference them in `manifest.json`:
```json
"action": { "default_popup": "popup.html", "default_icon": { "16": "icons/icon16.png", "48": "icons/icon48.png", "128": "icons/icon128.png" } },
"icons": { "16": "icons/icon16.png", "48": "icons/icon48.png", "128": "icons/icon128.png" }
```
Export the PikFinder logo from Studio at 16 / 48 / 128 px into `chrome-extension/icons/`.

## Publish (when ready)
1. Zip the `chrome-extension/` folder contents (not the parent folder).
2. Chrome Web Store: **Developer Dashboard** → **Add new item** → upload the zip
   (one-time \$5 developer registration).
3. Fill in the listing (screenshots of the popup, description), then submit for review.
   Edge Add-ons is free and accepts the same MV3 package.

## Notes
- Targets `https://www.pikfinder.com`. If you use another domain, change `BASE` in `background.js`
  and `popup.js`, and the `host_permissions` in `manifest.json`.
- Video results **open** (they aren't edited in Studio, which is an image editor).
- Roadmap: an **Icons** tab (Iconify), one-click **download**, and **save to your PikFinder
  collections** once signed in.
