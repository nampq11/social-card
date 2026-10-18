// @vitest-environment jsdom
import { cleanup, fireEvent, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { dictionaries } from '../../lib/i18n'
import { FEEDBACK_PATH, STUDIO_PATH } from '../../lib/view-route'
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
    for (const href of studioLinks) expect(href).toBe(STUDIO_PATH)
  })

  it('links the nav and the footer to the feedback page', () => {
    renderWithUiCopy(<Landing />)

    const feedbackHrefs = screen
      .getAllByRole('link', { name: landingDictionaries.vi.feedback_link })
      .map((link) => link.getAttribute('href'))
    // One in the nav's link group, one in the footer's Product column.
    expect(feedbackHrefs).toHaveLength(2)
    for (const href of feedbackHrefs) expect(href).toBe(FEEDBACK_PATH)
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
    // jsdom keeps <details> content in the DOM unopened, so the answer is
    // asserted structurally — the toggle behavior belongs to the browser.
    expect(screen.getByText(first.answer)).toBeTruthy()
  })

  it('shows every Card Type in the gallery', () => {
    renderWithUiCopy(<Landing />)

    // The gallery answers "what does this app make?" — a Card Type missing
    // from it ships invisible. Scoped to the section because the marquee
    // ticker repeats the card names higher up the page.
    const gallery = within(document.getElementById('cards')!)
    expect(gallery.getByText(landingDictionaries.vi.quote_name)).toBeTruthy()
    expect(gallery.getByText(landingDictionaries.vi.showcase_name)).toBeTruthy()
    expect(gallery.getByText(landingDictionaries.vi.definition_name)).toBeTruthy()
    expect(gallery.getByAltText(landingDictionaries.vi.card_definition_alt)).toBeTruthy()
  })
})
