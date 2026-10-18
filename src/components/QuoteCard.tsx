import { QRCodeSVG } from 'qrcode.react'
import { FALLBACK_QR_URL } from '../constants/presets'
import { splitLines } from '../lib/card-text'
import { useUiCopy } from '../lib/i18n'
import { CARD_THEME_STYLES } from '../constants/card-theme'
import { AuthorAvatar, AuthorBio } from './AuthorSignature'
import type { CardState } from '../types'

// The Quote Card Type's preview body (GLOSSARY.md): the big headline and
// sublines between top breathing room and a footer that carries the QR
// block (left, when on) and the author signature. Extracted verbatim from
// CardPreview when the third Card Type arrived — the preview owns the shared
// frame (ratio box, theme tokens, export node), one component per type owns
// the body (ADR 0009).
export const QuoteCard = ({ card }: { card: CardState }) => {
  const { copy } = useUiCopy()
  const themeStyles = CARD_THEME_STYLES[card.theme]
  const sublineList = splitLines(card.sublines)
  const bioLines = splitLines(card.authorBio)

  return (
    <>
      {/* Top spacer / header room */}
      <div className="h-6" />

      {/* Center Main Content */}
      <div className="flex flex-col items-center justify-center text-center px-4 space-y-4 my-auto">
        <h1
          style={{
            fontSize: `${card.headlineSize}px`,
          }}
          className={`font-extrabold max-w-xl break-words tracking-tight leading-tight ${
            card.uppercaseHeadline ? 'uppercase' : ''
          }`}
        >
          {card.headline || copy.empty_headline_hint}
        </h1>

        {sublineList.length > 0 && (
          <div
            data-testid="sublines"
            style={{
              fontSize: `${Math.max(16, Math.round(card.headlineSize * 0.52))}px`,
              lineHeight: 1.55,
            }}
            className={`space-y-1.5 ${
              card.boldSublines
                ? `${themeStyles.text} font-semibold`
                : `${themeStyles.subtext} font-normal`
            } max-w-lg break-words`}
          >
            {sublineList.map((line, idx) => (
              <p key={idx} className="tracking-normal">
                {line}
              </p>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Footer Section */}
      <div
        data-testid="card-footer"
        className={`flex ${card.qrEnabled ? 'items-center justify-between' : 'justify-center'} pt-6 border-t border-transparent`}
      >
        {/* Left: QR Code & Call to Action */}
        {card.qrEnabled && (
          <div className="flex items-center gap-3.5 max-w-[50%]">
            <div
              data-testid="qr-container"
              className={`p-1.5 rounded-lg shrink-0 flex items-center justify-center bg-white shadow-sm border ${themeStyles.border}`}
            >
              <QRCodeSVG
                value={card.qrUrl || FALLBACK_QR_URL}
                size={48}
                fgColor={themeStyles.qrFg}
                bgColor="transparent"
                level="M"
              />
            </div>
            {card.qrCta && (
              <span
                className={`text-xs ${themeStyles.subtext} font-medium leading-relaxed max-w-[160px] break-words text-balance`}
              >
                {card.qrCta}
              </span>
            )}
          </div>
        )}
        {card.qrEnabled ? (
          /* Right: Circular Avatar & Author Signature */
          <div className="flex items-center gap-3.5 shrink-0 ml-auto">
            <AuthorBio
              name={card.authorName}
              bioLines={bioLines}
              subtextClass={themeStyles.subtext}
              align="right"
            />
            <AuthorAvatar
              url={card.avatarUrl}
              name={card.authorName}
              grayscale={card.avatarGrayscale}
              borderClass={themeStyles.avatarBorder}
            />
          </div>
        ) : (
          /* Centered signature: avatar first, then name + bio */
          <div className="flex items-center gap-3.5 shrink-0">
            <AuthorAvatar
              url={card.avatarUrl}
              name={card.authorName}
              grayscale={card.avatarGrayscale}
              borderClass={themeStyles.avatarBorder}
            />
            <AuthorBio
              name={card.authorName}
              bioLines={bioLines}
              subtextClass={themeStyles.subtext}
            />
          </div>
        )}
      </div>
    </>
  )
}
