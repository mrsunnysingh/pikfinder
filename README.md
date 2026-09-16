<div align="center">

  <a href="https://www.pikfinder.com" target="_blank" rel="noopener noreferrer">
    <img src="public/favicon.svg" alt="PikFinder Logo" width="96" height="96" />
  </a>

  <h1 align="center">PikFinder</h1>

  <p align="center">
    <strong>The All-in-One Creative Workspace & Free Media Discovery Platform</strong>
  </p>

  <p align="center">
    Search millions of copyright-safe photos and videos, design in Creator Studio, edit PDFs with zero server uploads, and automate documents from Zoho CRM and Creator in real time.
  </p>

  <p align="center">
    <a href="https://www.pikfinder.com"><strong>Explore the Live Platform »</strong></a>
    <br />
    <br />
    <a href="https://www.pikfinder.com/studio">Creator Studio</a>
    ·
    <a href="https://www.pikfinder.com/pdf-editor">PDF Editor</a>
    ·
    <a href="https://www.pikfinder.com/tools">Free Tools</a>
    ·
    <a href="https://www.pikfinder.com/business-automation">Document Automation</a>
    ·
    <a href="https://www.pikfinder.com/blog">Guides & Blog</a>
  </p>

  <p align="center">
    <a href="https://github.com/mrsunnysingh/pikfinder/stargazers"><img src="https://img.shields.io/github/stars/mrsunnysingh/pikfinder?style=for-the-badge&logo=starship&color=8b5cf6&logoColor=white" alt="GitHub Stars" /></a>
    <a href="https://github.com/mrsunnysingh/pikfinder/network/members"><img src="https://img.shields.io/github/forks/mrsunnysingh/pikfinder?style=for-the-badge&color=ec4899" alt="GitHub Forks" /></a>
    <a href="https://github.com/mrsunnysingh/pikfinder/issues"><img src="https://img.shields.io/github/issues/mrsunnysingh/pikfinder?style=for-the-badge&color=3b82f6" alt="Issues" /></a>
    <a href="https://github.com/mrsunnysingh/pikfinder/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-Proprietary-blue.svg?style=for-the-badge" alt="License" /></a>
    <a href="https://vercel.com"><img src="https://img.shields.io/badge/Deployed%20with-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel" /></a>
  </p>

  <p align="center">
    <a href="https://www.producthunt.com/products/pik-finder" target="_blank">
      <img src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1204323&theme=dark" alt="PikFinder - Featured on Product Hunt" width="250" height="54" />
    </a>
  </p>

</div>

---

## 🌟 Why PikFinder?

Most creator workflows require switching between 10 different tabs: an image search engine, a bulky design suite, a suspicious PDF editor, and multiple single-purpose compression websites that upload your personal files to external servers.

**PikFinder brings everything into one unified, ultra-fast workspace:**
- 🔒 **100% Client-Side Privacy:** Image compression, PDF editing, format conversion, and EXIF cleaning run entirely in your browser using WebAssembly and Web Workers. Your files never leave your device.
- ⚡ **No Sign-Up Paywalls:** Use 55+ design and image tools instantly without creating an account or paying per-tool fees.
- 🎯 **Aggregated Multi-Library Search:** Query Unsplash, Pexels, Pixabay, Openverse, and Wikimedia Commons simultaneously with transparent licensing.
- 💼 **Enterprise Automation:** Directly connect Zoho CRM and Zoho Creator to generate personalized certificates, invoices, and cards in bulk.

---

## 🚀 Core Platform Features

### 1. 🔍 Unified Media Discovery Engine
- **Multi-Source Aggregator:** Search 100M+ royalty-free photos, 4K videos, vector icons, and illustrations.
- **Smart AI Search Mode:** Automatically enhances natural language queries into optimized keyword filters and orientation targets.
- **License Transparency:** Displays clear attribution requirements (CC0, CC BY, Unsplash, Pexels, Pixabay) on every card with one-click copyable citations.

### 2. 🎨 PikFinder Creator Studio
- **Canvas Graphic Editor:** Browser-based vector and layout designer with infinite layers, smart snapping, and opacity blending.
- **90+ Designer Templates:** Ready-to-edit presets for social media posts, certificates, invoices, flyers, resumes, and banners.
- **55+ Curated Fonts:** Instant typography pairing with Google Fonts and Fontshare previews.
- **One-Click Effects:** Glassmorphism, drop shadows, neon glows, gradients, and instant AI background removal.

### 3. 📄 Private In-Browser PDF Editor
- **Zero Server Uploads:** Powered by `pdfjs-dist` and `pdf-lib`.
- **Annotation & Editing:** Add text, freehand signatures, shapes, highlighting, stamps, and whiteout.
- **Form Filling & Page Reordering:** Rotate, split, merge, and export print-ready PDFs without watermarks.

### 4. ⚡ 55+ Client-Side Image Tools
- **Exact Size Compression:** Compress images to exact file sizes (20KB, 50KB, 100KB, 200KB) for government and exam portals.
- **Next-Gen Format Conversion:** Convert between PNG, JPG, WebP, AVIF, SVG, and HEIC/HEIF.
- **Security & Metadata Stripper:** Inspect and remove sensitive EXIF metadata, camera settings, and GPS coordinates before sharing photos.
- **OCR & Text Extraction:** Extract text from photos and screenshots locally using Tesseract.js.
- **QR Code & Barcode Generator:** Generate customizable SVG and PNG QR codes with logos and colors.

### 5. 🏢 Document Automation for Zoho CRM & Creator
- **Data-Driven Templating:** Bind dynamic record fields (`{{contact_name}}`, `{{invoice_total}}`, `{{qr_code}}`) directly to layout layers.
- **Native Zoho Extensions:** Includes prebuilt Zoho CRM Widgets and Zoho Creator Widgets for one-click bulk generation.

---

## 🛠️ Technology Stack

| Domain | Technologies |
| :--- | :--- |
| **Frontend Core** | React 19, Vite, React Router v7 |
| **Styling & Theme** | Custom Design System (Dynamic Dark/Light Glassmorphic Theme) |
| **Iconography & Animation** | Phosphor Icons, Framer Motion |
| **In-Browser Processing** | WebAssembly, Web Workers, `@jsquash/avif`, `pdf-lib`, `tesseract.js`, `gifenc` |
| **Authentication & Cloud** | Firebase Authentication, Cloud Firestore |
| **Edge Hosting & API** | Vercel Serverless Functions, Dynamic Edge Rewrites |
| **Integrations** | Figma Plugin SDK, Chrome Extension Manifest v3, Zoho Creator API |

---

## 📁 Repository Structure

```
pikfinder/
├── src/
│   ├── business/          # Document automation, Zoho connectors & template engines
│   ├── components/        # Reusable UI component library (Modals, Navbars, Hero, Cards)
│   ├── content/blog/      # 22+ SEO-optimized markdown guides & tutorials
│   ├── context/           # React Global Context (Auth, Theme, Favorites, History)
│   ├── lib/               # Media APIs, analytics, payment gateways, rendering pipeline
│   ├── locales/           # Multi-language i18n translations (EN, ES, FR, IT, DE, HI, etc.)
│   ├── pages/             # Route views (Home, Studio, PDF Editor, Free Tools, Blog)
│   ├── pdfeditor/         # Standalone in-browser PDF manipulation engine
│   ├── studio/            # Full-featured canvas graphic editor & layer tree
│   └── tools/             # 55+ browser-based image and utility tool engines
├── api/                   # Vercel serverless microservices
├── figma-plugin/          # Official PikFinder Figma Community Plugin
├── chrome-extension/      # Right-click search Chrome Extension
├── prerender.mjs          # Post-build static SEO prerenderer (119+ static HTML pages)
└── public/                # Static assets, PWA manifest, and sitemap.xml
```

---

## 💻 Getting Started Locally

### Prerequisites
- **Node.js:** v18.0.0 or higher
- **npm:** v9.0.0 or higher

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/mrsunnysingh/pikfinder.git
   cd pikfinder
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   ```bash
   cp .env.example .env.local
   ```
   Add your Firebase and third-party API credentials in `.env.local` (see `.env.example` for details).

4. **Start the development server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

5. **Build for Production with Static Prerender:**
   ```bash
   npm run build
   ```

---

## 🧩 Integrations & Ecosystem

- **🎨 Figma Community Plugin:** [Install on Figma](https://www.figma.com/community/plugin/1663285303127319860) to insert stock assets and vector graphics straight into your canvas.
- **🌐 Chrome Extension:** Search visually similar images from any webpage with a single right-click.
- **📱 Progressive Web App (PWA):** Install PikFinder on macOS, Windows, iOS, and Android for instant offline access to local tools.

---

## 🤝 Contributing

Contributions, feature ideas, and feedback are warmly welcomed!
- Check out our [Contributing Guide](CONTRIBUTING.md) to get started.
- Look at the [open issues](https://github.com/mrsunnysingh/pikfinder/issues) or submit a new proposal.
- If you find a bug, please open a [Bug Report](https://github.com/mrsunnysingh/pikfinder/issues/new).

---

## 💖 Support & Community

If you find PikFinder useful, please consider giving it a ⭐ **Star** on GitHub! It helps more creators discover the project and motivates ongoing open-source development.

<p align="center">
  <a href="https://github.com/mrsunnysingh/pikfinder">
    <img src="https://img.shields.io/badge/⭐%20Star%20on%20GitHub-PikFinder-8b5cf6?style=for-the-badge" alt="Star on GitHub" />
  </a>
</p>

- **Website:** [pikfinder.com](https://www.pikfinder.com)
- **LinkedIn:** [PikFinder on LinkedIn](https://www.linkedin.com/company/pikfinder/)
- **X (Twitter):** [@pikfinder](https://x.com/pikfinder)
- **Founder:** [Sunny Kumar Singh](https://github.com/mrsunnysingh)

---

<p align="center">
  Made with 💜 for designers, developers, and creators worldwide.
</p>
