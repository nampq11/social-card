const FALLBACK_FILENAME_STEM = 'social-card';

// Slugifies a headline into a PNG filename. Everything outside [a-z0-9] —
// including Vietnamese diacritics and emoji — collapses into a single dash.
export const toFilename = (headline: string): string => {
  const slug = headline
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  return `${slug || FALLBACK_FILENAME_STEM}.png`;
};

// Splits the multi-line sublines field into rendered lines, dropping blanks.
export const splitSublines = (sublines: string): string[] =>
  sublines
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
