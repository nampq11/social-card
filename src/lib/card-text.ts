const FALLBACK_FILENAME_STEM = 'social-card'

// Windows reserves these device names even with an extension — "con.png"
// cannot be saved there — so a slug matching one falls back to the default.
const RESERVED_STEMS = new Set([
  'con',
  'prn',
  'aux',
  'nul',
  ...Array.from({ length: 9 }, (_, i) => `com${i + 1}`),
  ...Array.from({ length: 9 }, (_, i) => `lpt${i + 1}`),
])

// Longest slug kept in a filename, cut at a word boundary so names stay
// readable well under the 255-character filesystem limit.
const MAX_SLUG_LENGTH = 64

// Trims an over-long slug at its last full word instead of cutting mid-word.
const clampSlug = (slug: string): string => {
  const cut = slug.slice(0, MAX_SLUG_LENGTH)
  if (cut.length === slug.length) return slug
  const lastDash = cut.lastIndexOf('-')
  return lastDash > 0 ? cut.slice(0, lastDash) : cut
}

// Slugifies a headline into a PNG filename. NFKD normalization peels tone
// marks off Vietnamese letters ("ỪA" → "ua") instead of collapsing each into
// a dash; everything still outside [a-z0-9] — emoji included — becomes a
// single dash run.
export const toFilename = (headline: string): string => {
  const slug = clampSlug(
    headline
      // The stroke d has no combining-mark decomposition, so map it by hand
      // before normalizing.
      .replace(/[đĐ]/g, 'd')
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, ''),
  )
  const stem = slug && !RESERVED_STEMS.has(slug) ? slug : FALLBACK_FILENAME_STEM
  return `${stem}.png`
}

// Splits any multi-line text field (sublines, bio) into rendered lines,
// dropping blanks.
export const splitLines = (text: string): string[] =>
  text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
