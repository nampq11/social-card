import { DEFAULT_SCRIM_OPACITY } from '../constants/presets'
import { splitLines } from '../lib/card-text'
import { AuthorAvatar, AuthorBio } from './AuthorSignature'
import type { CardState } from '../types'

// The Definition Card Type's preview body (GLOSSARY.md): a full-bleed
// background photo under a dark scrim, white type in three tiers — the bold
// Term with its phonetic tag, the observation paragraph, the punchline — and
// the signature footer. Type is white regardless of theme: the card's one
// fixed look is white-on-photo (the on-photo chrome precedent), so the theme
// tokens the frame paints are covered by the base layer and never read here.
// Renders no QR — the QR block belongs to the Quote Card only, the same rule
// the Showcase Card follows.
export const DefinitionCard = ({ card }: { card: CardState }) => {
  const definition = card.definition
  const bioLines = splitLines(card.authorBio)
  const scrim = definition?.scrimOpacity ?? DEFAULT_SCRIM_OPACITY

  return (
    <>
      {/* Background stack (absolute siblings paint above in-flow content,
          which is why every tier below carries `relative`): a near-black base
          keeps white type legible while the photo loads and stands in when no
          photo was ever set. */}
      <div aria-hidden className="absolute inset-0 bg-neutral-950" />
      {definition?.backgroundImageUrl && (
        <img
          data-testid="definition-background"
          src={definition.backgroundImageUrl}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      <div
        data-testid="definition-scrim"
        aria-hidden
        className="absolute inset-0 bg-black"
        style={{ opacity: scrim }}
      />

      {/* Tier 1: the term and its phonetic tag, at the top of the page. */}
      <div className="relative flex flex-col items-center text-center">
        <h1
          data-testid="definition-term"
          className="text-6xl font-bold tracking-tight text-white break-words"
        >
          {definition?.term}
        </h1>
        {definition?.phonetic && (
          <p
            data-testid="definition-phonetic"
            className="mt-3 text-2xl font-normal italic text-white/75 break-words"
          >
            {definition.phonetic}
          </p>
        )}
      </div>

      {/* Tiers 2 and 3 anchored low: the observation paragraph then the
          punchline sit in the card's lower half, above the footer. */}
      <div className="relative mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-end gap-10 pb-10 text-center">
        {definition?.observation && (
          <p
            data-testid="definition-observation"
            className="text-2xl leading-relaxed text-white/90 break-words"
          >
            {definition.observation}
          </p>
        )}
        {definition?.punchline && (
          <p
            data-testid="definition-punchline"
            className="max-w-lg text-3xl font-extrabold text-white break-words"
          >
            {definition.punchline}
          </p>
        )}
      </div>

      {/* Signature footer: avatar beside name + bio, centered. */}
      <footer
        data-testid="card-footer"
        className="relative flex items-center justify-center gap-3.5 border-t border-transparent pt-6"
      >
        <AuthorAvatar
          url={card.avatarUrl}
          name={card.authorName}
          grayscale={card.avatarGrayscale}
          borderClass="ring-1 ring-white/30"
        />
        <AuthorBio name={card.authorName} bioLines={bioLines} subtextClass="text-white/70" />
      </footer>
    </>
  )
}
