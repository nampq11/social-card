// @vitest-environment jsdom
import { cleanup, fireEvent, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { dictionaries } from '../../lib/i18n'
import { renderWithUiCopy } from '../../test/card-studio'
import { landingDictionaries } from './landing-copy'
import { Landing } from './Landing'

beforeEach(() => {
  // The language provider persists its choice to localStorage; clear it so
  // every test starts in the default Vietnamese regardless of order.
  window.localStorage.clear()
})

afterEach(() => cleanup())

describe('Landing', () => {
  it('renders the hero in the default Vietnamese copy', () => {
    renderWithUiCopy(<Landing />)

    expect(screen.getByText(landingDictionaries.vi.hero_title_a)).toBeTruthy()
    expect(screen.getByText(landingDictionaries.vi.hero_title_b)).toBeTruthy()
    expect(screen.getByAltText(landingDictionaries.vi.hero_shot_alt)).toBeTruthy()
  })

  it('links every "open the studio" call to the studio route', () => {
    renderWithUiCopy(<Landing />)

    const studioLinks = screen
      .getAllByRole('link', { name: landingDictionaries.vi.cta_open_studio })
      .map((link) => link.getAttribute('href'))
    // Nav, hero and final CTA all carry the same destination.
    expect(studioLinks.length).toBeGreaterThanOrEqual(3)
    for (const href of studioLinks) expect(href).toBe('/social-card/studio')
  })

  it('switches Interface Language from the landing nav', () => {
    renderWithUiCopy(<Landing />)

    fireEvent.click(screen.getByRole('button', { name: dictionaries.vi.language_toggle_title }))

    expect(screen.getByText(landingDictionaries.en.hero_title_a)).toBeTruthy()
    expect(screen.queryByText(landingDictionaries.vi.hero_title_a)).toBeNull()
  })

  it('answers FAQ entries through native disclosure widgets', () => {
    renderWithUiCopy(<Landing />)

    const first = landingDictionaries.vi.faq_items[0]
    const summary = screen.getByText(first.question)
    expect(summary.tagName).toBe('SUMMARY')
    fireEvent.click(summary)
    expect(screen.getByText(first.answer)).toBeTruthy()
  })
})
