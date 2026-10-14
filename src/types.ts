export type AspectRatio = '1:1' | '4:5' | '16:9'

export type CardTheme = 'white' | 'paper' | 'dark' | 'mist'

export interface CardState {
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
}
