import { describe, expect, it } from 'vitest';
import { splitSublines, toFilename } from './card-text';

describe('toFilename', () => {
  it('slugifies a headline into a png filename', () => {
    expect(toFilename('Hello, World!')).toBe('hello-world.png');
  });

  it('collapses consecutive separators into single dashes', () => {
    expect(toFilename('Ship  it   now!!!')).toBe('ship-it-now.png');
  });

  it('trims leading and trailing dashes', () => {
    expect(toFilename('  --quiet title--  ')).toBe('quiet-title.png');
  });

  it('falls back to a default name when nothing slug-safe remains', () => {
    expect(toFilename('')).toBe('social-card.png');
    expect(toFilename('🚀🔥')).toBe('social-card.png');
  });

  it('collapses Vietnamese diacritics into ascii runs', () => {
    // Tone marks and 'đ' sit outside [a-z0-9], so each run becomes a dash.
    expect(toFilename('EM VỪA ĐƯỢC TẬU ĐẤT:')).toBe('em-v-a-c-t-u-t.png');
  });
});

describe('splitSublines', () => {
  it('splits on newlines and trims each line', () => {
    expect(splitSublines('github.com/nampq11\n  threads.net/@nampq  ')).toEqual([
      'github.com/nampq11',
      'threads.net/@nampq',
    ]);
  });

  it('drops blank lines', () => {
    expect(splitSublines('first\n\n   \nsecond')).toEqual(['first', 'second']);
  });

  it('returns no lines for blank input', () => {
    expect(splitSublines('')).toEqual([]);
  });
});
