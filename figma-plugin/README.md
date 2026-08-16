# PikFinder — Figma plugin

Search PikFinder's library of free, copyright-safe stock photos and videos and
drop them straight onto your Figma canvas. Light theme, one-click insert.

## Files
- `manifest.json` — plugin manifest (name, entry points, network access)
- `code.js` — runs in Figma's sandbox; turns the chosen image into an image fill on a new rectangle
- `ui.html` — the light-mode panel (search box, Photos/Videos tabs, results grid, your animated PikFinder logo)

## How it works
1. The UI calls your live API: `GET https://www.pikfinder.com/api/search?q=…&type=photo|video`.
2. When you click a result, the UI fetches the full image **through your own proxy**
   (`/api/proxy-image`) so the bytes are CORS-safe, then hands them to `code.js`.
3. `code.js` runs `figma.createImage(bytes)` and places a rectangle (image fill)
   at the centre of the viewport, sized to the photo (capped at 900px).

## Install (development / testing)
1. Open the Figma desktop app.
2. Menu → **Plugins → Development → Import plugin from manifest…**
3. Select this folder's `manifest.json`.
4. Run it: **Plugins → Development → PikFinder — Free Stock Media**.

## Publishing to the Figma Community (optional, later)
1. **Plugins → Development → Publish** from inside Figma (or the Community tab).
2. Add a name, tagline, description, icon (use your PikFinder mark), and cover art.
3. Submit for review. Figma assigns the final plugin `id` on publish.

## Notes
- `networkAccess.allowedDomains` is `"*"` because thumbnails come from many stock
  CDNs (Pexels, Unsplash, Pixabay, Openverse). You can tighten this later by
  routing thumbnails through `/api/proxy-image` too and listing only `pikfinder.com`.
- Photo search needs provider keys set on the server (`UNSPLASH_ACCESS_KEY`,
  `PEXELS_API_KEY`, `PIXABAY_API_KEY`); Openverse needs none. The API returns a
  clear message if none are configured.
- Videos are searched and previewed; inserting a video adds its poster frame as an
  image (Figma image fills are still images). A future version can use Figma's
  video-fill API for motion.
