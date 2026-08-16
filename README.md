# PikFinder

**Free creator platform** — search millions of royalty-free images and videos, edit PDFs, use 30+ design tools, and build documents, all in one place.

**Live:** [www.pikfinder.com](https://www.pikfinder.com)

## What's inside

- **Multi-provider media search** — Unsplash, Pexels, Pixabay, Openverse in one unified interface
- **Creator Studio** — canvas-based design editor (text, shapes, images, templates, export)
- **PDF Editor** — edit text, draw, highlight, whiteout, add links, fill & sign, compress, share — runs entirely in-browser
- **30+ free tools** — resize, compress, convert, crop, rotate, remove background (AI), QR generator, metadata viewer, OCR, and more
- **Document Generator** — invoice, resume, certificate, business card, flyer, letterhead, and more from templates
- **Blog** — SEO-optimized Markdown-based blog system
- **Figma plugin** — search and insert media directly inside Figma
- **Chrome extension** — right-click search on any image
- **PWA** — installable, works offline

## Tech stack

| Layer | Tech |
|-------|------|
| Frontend | React 19, Vite, react-router-dom v7 |
| Styling | Custom CSS (dark/light theme system) |
| Icons | @phosphor-icons/react |
| Auth | Firebase Authentication |
| Database | Cloud Firestore |
| API | Vercel Serverless Functions |
| Payments | Razorpay (one-time + recurring subscriptions) |
| AI | Google Gemini (background removal, smart search) |
| PDF | pdfjs-dist v4 (render) + pdf-lib (export) |

## Project structure

```
src/              → React app (pages, components, tools, studio, PDF editor)
api/              → Vercel serverless functions (search, proxy, AI, payments)
public/           → Static assets, PWA manifest, sitemap
figma-plugin/     → Figma plugin source
chrome-extension/ → Chrome extension source
```

## Getting started

```bash
# Install dependencies
npm install

# Copy environment template and fill in your keys
cp .env.example .env

# Start dev server
npm run dev
```

See `.env.example` for all required environment variables.

## Deployment

Deployed on **Vercel**. Push to `main` triggers auto-deploy.

```bash
git push origin main
```

## Author

**Sunny Kumar Singh** — [@pikfinder](https://www.pikfinder.com)

## License

All rights reserved. This source code is provided for reference and educational purposes.
