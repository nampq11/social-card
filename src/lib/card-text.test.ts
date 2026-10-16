import { describe, expect, it } from 'vitest'
import { splitLines, toFilename } from './card-text'

describe('toFilename', () => {
  it('slugifies a headline into a png filename', () => {
    expect(toFilename('Hello, World!')).toBe('hello-world.png')
  })

  it('collapses consecutive separators into single dashes', () => {
    expect(toFilename('Ship  it   now!!!')).toBe('ship-it-now.png')
  })

  it('trims leading and trailing dashes', () => {
    expect(toFilename('  --quiet title--  ')).toBe('quiet-title.png')
  })

  it('falls back to a default name when nothing slug-safe remains', () => {
    expect(toFilename('')).toBe('social-card.png')
    expect(toFilename('🚀🔥')).toBe('social-card.png')
  })

  it('folds Vietnamese diacritics into plain ascii letters', () => {
    expect(toFilename('EM VỪA ĐƯỢC TẬU ĐẤT:')).toBe('em-vua-duoc-tau-dat.png')
  })

  it('maps the stroke d, which normalization cannot decompose', () => {
    expect(toFilename('Đi ngủ sớm')).toBe('di-ngu-som.png')
  })

  it('falls back when the slug is a Windows reserved device name', () => {
    expect(toFilename('CON')).toBe('social-card.png')
    expect(toFilename('nul')).toBe('social-card.png')
  })

  it('caps long headlines at the last full word', () => {
    const long =
      'alpha bravo charlie delta echo foxtrot golf hotel india juliet kilo lima mike november oscar papa quebec romeo sierra tango'
    expect(toFilename(long)).toBe(
      'alpha-bravo-charlie-delta-echo-foxtrot-golf-hotel-india-juliet.png',
    )
  })
})

describe('splitLines', () => {
  it('splits on newlines and trims each line', () => {
    expect(splitLines('github.com/nampq11\n  threads.com/@builtaiwithnam  ')).toEqual([
      'github.com/nampq11',
      'threads.com/@builtaiwithnam',
    ])
  })

  it('drops blank lines', () => {
    expect(splitLines('first\n\n   \nsecond')).toEqual(['first', 'second'])
  })

  it('returns no lines for blank input', () => {
    expect(splitLines('')).toEqual([])
  })
})
