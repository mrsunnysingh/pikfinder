// src/config/socialLinks.js
// Single source of truth for PikFinder's official social profiles.
// Imported by the Footer, About, Contact, Navbar mobile menu, and used to keep
// the Organization schema / Open Graph in index.html consistent.

export const SOCIAL_LINKS = {
  linkedin: 'https://www.linkedin.com/company/pikfinder/',
  x: 'https://x.com/pikfinder',
  facebook: 'https://facebook.com/Pikfinder',
  instagram: 'https://instagram.com/pikfinder',
  youtube: 'https://youtube.com/@pikfinder',
  pinterest: 'https://pinterest.com/pikfinder',
};

// Support inbox used as a guaranteed fallback for the contact form. Change to your
// real address.
export const SUPPORT_EMAIL = 'support@pikfinder.com';

// Ordered list for rendering icon rows. `icon` names map to @phosphor-icons/react.
export const SOCIAL_LIST = [
  { key: 'linkedin', label: 'LinkedIn', href: SOCIAL_LINKS.linkedin, icon: 'LinkedinLogo' },
  { key: 'x', label: 'X (Twitter)', href: SOCIAL_LINKS.x, icon: 'XLogo' },
  { key: 'facebook', label: 'Facebook', href: SOCIAL_LINKS.facebook, icon: 'FacebookLogo' },
  { key: 'instagram', label: 'Instagram', href: SOCIAL_LINKS.instagram, icon: 'InstagramLogo' },
  { key: 'youtube', label: 'YouTube', href: SOCIAL_LINKS.youtube, icon: 'YoutubeLogo' },
  { key: 'pinterest', label: 'Pinterest', href: SOCIAL_LINKS.pinterest, icon: 'PinterestLogo' },
];

// For JSON-LD Organization "sameAs".
export const SOCIAL_SAME_AS = Object.values(SOCIAL_LINKS);
