import { describe, expect, it } from 'vitest'
import { UI_LANGUAGE_STORAGE_KEY, dictionaries, resolveInitialLanguage } from './i18n'

describe('dictionary parity', () => {
  it('exposes identical key sets for both languages', () => {
    expect(Object.keys(dictionaries.en).sort()).toEqual(Object.keys(dictionaries.vi).sort())
  })
})

describe('resolveInitialLanguage', () => {
  it('falls back to Vietnamese when nothing is persisted', () => {
    expect(resolveInitialLanguage({ getItem: () => null })).toBe('vi')
  })

  it('restores a persisted language', () => {
    expect(
      resolveInitialLanguage({ getItem: (key) => (key === UI_LANGUAGE_STORAGE_KEY ? 'en' : null) }),
    ).toBe('en')
    expect(
      resolveInitialLanguage({ getItem: (key) => (key === UI_LANGUAGE_STORAGE_KEY ? 'vi' : null) }),
    ).toBe('vi')
  })

  it('falls back to Vietnamese on garbage or stale values', () => {
    expect(resolveInitialLanguage({ getItem: () => 'fr' })).toBe('vi')
    expect(resolveInitialLanguage({ getItem: () => '' })).toBe('vi')
    expect(resolveInitialLanguage({ getItem: () => 'english' })).toBe('vi')
  })
})
