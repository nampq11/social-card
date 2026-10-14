export type AspectRatio = '1:1' | '4:5' | '16:9'

export type CardTheme = 'white' | 'paper' | 'dark' | 'mist'

export type CardType = 'quote' | 'showcase'

// One uploaded screenshot in a Showcase Card's content, carrying a stable
// identity (GLOSSARY.md "Shot"). Array order is upload order; the first Shot
// renders in the Hero Slot.
export interface Shot {
  id: string
  dataUrl: string
}
// How a Shot meets its Screenshot Slot (GLOSSARY.md "Fit"): cover fills the
// Slot and crops, contain shows the whole Shot over a blurred backdrop of
// itself. Optional — absent means cover with the top-center default below,
// which reproduces the original object-cover/object-top render (ADR 0005).
export type ShotFit = 'cover' | 'contain'

// Which part of a Shot shows when it crops (GLOSSARY.md "Focus"): normalized
// 0..1 anchor, stored per Shot, never alters the Shot's pixels.
export interface ShotFocus {
  x: number
  y: number
}

// One uploaded screenshot in a Showcase Card's content, carrying a stable
// identity (GLOSSARY.md "Shot"). Array order is upload order; the first Shot
// renders in the Hero Slot.
export interface Shot {
  id: string
  dataUrl: string
  fit?: ShotFit
  focus?: ShotFocus
}

export type AnnotationSide = 'left' | 'right' | 'top'

// A handwritten-style callout anchored to one Shot from a fixed side
// (GLOSSARY.md "Annotation"). Follows its Shot, not the Screenshot Slot.
export interface Annotation {
  id: string
  shotId: string
  text: string
  side: AnnotationSide
}

// All Showcase-only Card Content, nested behind the cardType discriminator
// (ADR 0004). Optional: a Quote Card carries none, and an empty Showcase
// shows the dashed Hero Slot placeholder.
export interface ShowcaseContent {
  shots: Shot[]
  annotations: Annotation[]
}

export interface CardState {
  cardType: CardType
  headline: string
  sublines: string
  authorName: string
  authorBio: string
  avatarUrl: string
  qrEnabled: boolean
  qrUrl: string
  qrCta: string
  ratio: AspectRatio
  theme: CardTheme
  headlineSize: number // in rem / px scale
  uppercaseHeadline: boolean
  boldSublines: boolean
  avatarGrayscale: boolean
  showcase?: ShowcaseContent
}
