// src/pages/templates/seoData.js
// SEO landing-page metadata for template categories. Plain JS (no JSX) so the
// prerender script can import it too. `businessCategory` maps each landing page
// to templates in src/business/templates.js (BUSINESS_TEMPLATES[].category).

// Canonical host — MUST match SITE_URL in src/tools/registry.js, index.html's
// <link rel="canonical">, and robots.txt. www is the Vercel PRODUCTION domain
// (the apex pikfinder.com 308-redirects to it), so canonicals must use www or
// they point at a redirect and Google won't index them.
export const SITE = 'https://www.pikfinder.com';

export const TEMPLATE_SEO = [
  {
    slug: 'free-certificate-templates',
    businessCategory: 'Education',
    name: 'Certificate templates',
    title: 'Free Certificate Templates — Customize & Download (No Signup) | PikFinder',
    description: 'Free, professionally designed certificate templates — of achievement, completion, appreciation and participation. Customize online in minutes and download as PDF or PNG. No design skills needed.',
    h1: 'Free Certificate Templates',
    intro: 'Design a polished certificate of achievement, completion or appreciation in minutes. Every template below is fully editable — change the name, course, date, colours and fonts, then download a print-ready PDF or a high-resolution PNG. No watermarks, no signup.',
    keyword: 'certificate',
    faq: [
      { q: 'Are these certificate templates free?', a: 'Yes — every certificate template is free to customize and download as PDF or PNG, with no watermark and no account required.' },
      { q: 'Can I add my logo and signature?', a: 'Yes. Open any template in the editor, then add your logo in a corner and drop a signature image above the signature line.' },
      { q: 'Can I make hundreds of certificates at once?', a: 'Yes. In the Document Generator you can generate one finished certificate per row of a list or per record in your CRM, automatically — ideal for a whole cohort.' },
    ],
  },
  {
    slug: 'free-invoice-templates',
    businessCategory: 'Documents',
    name: 'Invoice templates',
    title: 'Free Invoice Templates — Professional & Printable | PikFinder',
    description: 'Free professional invoice templates you can customize online. Add your company, line items and totals, then export a clean PDF. Perfect for freelancers and small businesses.',
    h1: 'Free Invoice Templates',
    intro: 'Send invoices that look professional. Pick a template, add your company details, the amount due and a due date, then export a tidy PDF ready to email. Clean layouts, clear totals, and a look that gets you paid.',
    keyword: 'invoice',
    faq: [
      { q: 'Can I use these invoices for my business?', a: 'Yes — they are free for commercial use. Customize with your company name, logo and details and export a PDF.' },
      { q: 'Can I auto-fill invoices from my records?', a: 'Yes. Connect the Document Generator to generate invoices directly from your CRM or a spreadsheet — no copy-and-paste.' },
    ],
  },
  {
    slug: 'free-business-card-templates',
    businessCategory: 'Branding',
    name: 'Business card templates',
    title: 'Free Business Card Templates — Modern & Printable | PikFinder',
    description: 'Free modern business card templates. Customize your name, title and contact details online and download a print-ready file in minutes.',
    h1: 'Free Business Card Templates',
    intro: 'Make a business card that looks designed, not templated. Add your name, role and contact details, match your brand colours, and download a crisp, print-ready card in minutes.',
    keyword: 'business card',
    faq: [
      { q: 'What size are the business cards?', a: 'The templates use a standard card proportion and export at high resolution, so they print sharply at typical business-card sizes.' },
    ],
  },
  {
    slug: 'free-flyer-templates',
    businessCategory: 'Flyers',
    name: 'Flyer templates',
    title: 'Free Flyer Templates — Events & Promotions | PikFinder',
    description: 'Free event and promotion flyer templates. Customize the title, date, venue and details online, then download a bold, share-ready flyer.',
    h1: 'Free Flyer Templates',
    intro: 'Promote an event or offer with a flyer that stops the scroll. Swap in your title, date and venue, choose a colour theme, and download a bold flyer ready to print or post.',
    keyword: 'flyer',
    faq: [
      { q: 'Can I use a flyer for social media?', a: 'Yes — export a high-resolution image and post it anywhere, or resize it to any social format in the editor.' },
    ],
  },
  {
    slug: 'free-gift-certificate-templates',
    businessCategory: 'Gift Cards',
    name: 'Gift certificate templates',
    title: 'Free Gift Certificate & Gift Card Templates | PikFinder',
    description: 'Free gift certificate and gift card templates. Add your brand, amount and code, then download a beautiful voucher to print or send.',
    h1: 'Free Gift Certificate Templates',
    intro: 'Offer a gift your customers will love to receive. Add your brand, the amount and a unique code, and download an elegant gift certificate to print or email.',
    keyword: 'gift certificate',
    faq: [
      { q: 'Can I add a unique code to each gift card?', a: 'Yes — edit the code field per card, or generate a batch automatically from a list in the Document Generator.' },
    ],
  },
  {
    slug: 'free-coupon-templates',
    businessCategory: 'Coupons',
    name: 'Coupon templates',
    title: 'Free Coupon Templates — Discount Vouchers | PikFinder',
    description: 'Free discount coupon templates. Customize the offer, code and expiry, then download a ticket-style voucher for your promotion.',
    h1: 'Free Coupon Templates',
    intro: 'Run a promotion with a coupon that looks the part. Set the offer, the code and an expiry date, then download a clean, ticket-style voucher ready to share.',
    keyword: 'coupon',
    faq: [
      { q: 'Can I make a coupon for online use?', a: 'Yes — download it as an image and add it to your emails, social posts or website.' },
    ],
  },
  {
    slug: 'free-proposal-templates',
    businessCategory: 'Proposals',
    name: 'Proposal templates',
    title: 'Free Business Proposal Cover Templates | PikFinder',
    description: 'Free business proposal cover templates. Add your title, client name and date for a professional first impression, then export a PDF.',
    h1: 'Free Proposal Templates',
    intro: 'Win the deal before they read a word. Start your proposal with a cover that signals quality — add your title, client and date, and export a clean PDF cover page.',
    keyword: 'proposal',
    faq: [
      { q: 'Is this a full proposal or just the cover?', a: 'These are designed cover pages — the professional first impression. Add your content pages in your document tool and lead with this cover.' },
    ],
  },
  {
    slug: 'free-letterhead-templates',
    businessCategory: 'Letterhead',
    name: 'Letterhead templates',
    title: 'Free Letterhead Templates — Branded Stationery | PikFinder',
    description: 'Free company letterhead templates. Add your logo, company name and contact details for branded stationery you can print or export as PDF.',
    h1: 'Free Letterhead Templates',
    intro: 'Give every letter a professional, branded header and footer. Add your company name, tagline and contact details, and export a clean A4 letterhead ready to write on.',
    keyword: 'letterhead',
    faq: [
      { q: 'Can I type my letter into the template?', a: 'Yes — open it in the editor and replace the body text, or export a blank branded letterhead to write on.' },
    ],
  },
  {
    slug: 'free-thank-you-card-templates',
    businessCategory: 'Cards',
    name: 'Thank-you card templates',
    title: 'Free Thank You Card Templates — Customize & Print | PikFinder',
    description: 'Free thank-you card templates. Personalize the message and colours, then download a beautiful card to print or send.',
    h1: 'Free Thank-You Card Templates',
    intro: 'Say thank you in style. Personalise the message and colours and download an elegant card to print or send — perfect for customers, clients and guests.',
    keyword: 'thank you card',
    faq: [
      { q: 'Can I personalise each card?', a: 'Yes — edit the message for each recipient, or generate a batch from a list in the Document Generator.' },
    ],
  },
  {
    slug: 'free-resume-templates',
    businessCategory: 'Resume',
    name: 'Resume templates',
    title: 'Free Resume & CV Templates — Modern & Editable | PikFinder',
    description: 'Free modern resume and CV templates. Customize your details online and download a clean, professional PDF. No signup, no watermark.',
    h1: 'Free Resume & CV Templates',
    intro: 'Land the interview with a resume that looks professionally designed. Edit your name, experience, skills and education, and download a clean PDF — no watermark, no signup.',
    keyword: 'resume',
    faq: [
      { q: 'Are these resume templates free?', a: 'Yes — customize and download as PDF with no watermark and no account required.' },
      { q: 'Can I export as PDF?', a: 'Yes — export a clean, print-ready PDF (recruiters prefer PDF).' },
    ],
  },
  {
    slug: 'free-menu-templates',
    businessCategory: 'Menus',
    name: 'Menu templates',
    title: 'Free Restaurant Menu Templates — Customize & Print | PikFinder',
    description: 'Free restaurant and cafe menu templates. Add your dishes and prices, customize colours, and download a print-ready menu.',
    h1: 'Free Menu Templates',
    intro: 'Design a menu your guests will love to read. Add your dishes and prices, match your restaurant’s style, and download a print-ready menu in minutes.',
    keyword: 'menu',
    faq: [
      { q: 'Can I add my own dishes and prices?', a: 'Yes — every item and price is editable in the free editor.' },
      { q: 'Can I print it?', a: 'Yes — export a high-resolution PDF or PNG for printing.' },
    ],
  },
  {
    slug: 'free-id-card-templates',
    businessCategory: 'ID Cards',
    name: 'ID card templates',
    title: 'Free ID Card Templates — Employee & Student IDs | PikFinder',
    description: 'Free ID card templates for employees, students and members. Add a name, role, photo and ID number, then download a print-ready card.',
    h1: 'Free ID Card Templates',
    intro: 'Create professional identity cards for staff, students or members. Add a name, role, ID number and photo, match your brand, and download a print-ready card.',
    keyword: 'ID card',
    faq: [
      { q: 'Can I add a photo?', a: 'Yes — replace the photo placeholder with any image in the editor.' },
      { q: 'Can I make a batch of ID cards?', a: 'Yes — generate one per person from a list in the Document Generator.' },
    ],
  },
];

export const seoBySlug = (slug) => TEMPLATE_SEO.find((c) => c.slug === slug) || null;
