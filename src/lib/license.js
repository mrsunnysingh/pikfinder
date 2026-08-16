// License helpers for Wikimedia Commons images.
// Only surface images whose licenses are safe for commercial reuse:
// Public Domain, CC0, CC BY, CC BY-SA (attribution required for the last two).

const SAFE_LICENSE_PATTERNS = [
  { re: /^(public domain|pd\b|pd-)/i, id: 'PD', attribution: false },
  { re: /^cc0/i, id: 'CC0', attribution: false },
  { re: /^cc[ -]by[ -]sa\b/i, id: 'CC BY-SA', attribution: true },
  { re: /^cc[ -]by\b/i, id: 'CC BY', attribution: true },
  { re: /^attribution\b/i, id: 'CC BY', attribution: true },
  { re: /^no restrictions/i, id: 'PD', attribution: false },
];

// Strip HTML tags Wikimedia embeds in extmetadata values.
export function stripHtml(value) {
  if (!value) return '';
  return String(value).replace(/<[^>]*>?/gm, '').trim();
}

/**
 * Parse extmetadata into a normalized license object.
 * Returns null when the license is unknown or unsafe (fair use, non-free, etc.)
 * or when the file carries restrictions (trademark, personality rights...).
 */
export function parseLicense(extmetadata) {
  if (!extmetadata) return null;

  // Files with restrictions (trademarked, insignia, personality rights) are excluded.
  const restrictions = stripHtml(extmetadata.Restrictions?.value);
  if (restrictions) return null;

  const shortName = stripHtml(extmetadata.LicenseShortName?.value);
  const licenseUrl = stripHtml(extmetadata.LicenseUrl?.value) || null;
  if (!shortName) return null;

  for (const pattern of SAFE_LICENSE_PATTERNS) {
    if (pattern.re.test(shortName)) {
      return {
        shortName,
        id: pattern.id,
        url: licenseUrl,
        requiresAttribution: pattern.attribution,
      };
    }
  }
  return null; // unknown / non-free license -> exclude
}

/** Ready-to-copy attribution string, e.g. "Photo by Jane Doe, CC BY-SA 4.0, via Wikimedia Commons". */
export function attributionText(photo) {
  const author = photo?.user?.name || 'Unknown author';
  const license = photo?.license?.shortName || 'Public domain';
  return `Photo by ${author}, ${license}, via Wikimedia Commons`;
}

/** Link to the original Commons file page. */
export function commonsPageUrl(photo) {
  if (photo?.sourceTitle) {
    return `https://commons.wikimedia.org/wiki/${encodeURIComponent(photo.sourceTitle)}`;
  }
  return 'https://commons.wikimedia.org';
}
