import { forwardRef, lazy, Suspense } from 'react'
import { useCardStore } from '../lib/card-store'
import { RATIO_INFO } from '../constants/ratios'
import { FALLBACK_QR_URL } from '../constants/presets'
import { splitLines } from '../lib/card-text'
import { ShowcaseCard } from './ShowcaseCard'
import { useUiCopy } from '../lib/i18n'
import { CARD_THEME_STYLES } from '../constants/card-theme'
import { AuthorAvatar, AuthorBio } from './AuthorSignature'

const LazyQRCodeSVG = lazy(() => import('qrcode.react').then((m) => ({ default: m.QRCodeSVG })))

interface CardPreviewProps {
  scale?: number
  /** Fit-driven refits change scale per frame; only manual zoom steps animate. */
  animated?: boolean
}

export const CardPreview = forwardRef<HTMLDivElement, CardPreviewProps>(
  ({ scale = 1, animated = true }, ref) => {
    const { copy } = useUiCopy()
    const data = useCardStore((s) => s.card)
    const { width, height } = RATIO_INFO[data.ratio]

    const themeStyles = CARD_THEME_STYLES[data.theme]

    const sublineList = splitLines(data.sublines)
    const bioLines = splitLines(data.authorBio)

    return (
      <div
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          // card-elevation's transform transition (unlayered CSS — Tailwind
          // classes can't override it) trails per-frame fit writes behind the
          // fit target while the Mobile Sheet drags or a window resize
          // streams. Suppressing only transform keeps its other morphs
          // (ratio-swap width/height) animating.
          ...(animated ? {} : { transitionProperty: 'width, height, background-color, color' }),
        }}
        className={`${
          animated ? 'transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]' : ''
        } card-elevation rounded-3xl`}
      >
        <div
          ref={ref}
          id="social-card-node"
          style={{
            width: `${width}px`,
            height: `${height}px`,
          }}
          className={`${themeStyles.bg} ${themeStyles.text} relative flex flex-col justify-between p-14 select-none shrink-0 overflow-hidden rounded-3xl`}
        >
          {data.cardType === 'showcase' ? (
            <ShowcaseCard card={data} />
          ) : (
            <>
              {/* Top spacer / header room */}
              <div className="h-6" />

              {/* Center Main Content */}
              <div className="flex flex-col items-center justify-center text-center px-4 space-y-4 my-auto">
                <h1
                  style={{
                    fontSize: `${data.headlineSize}px`,
                  }}
                  className={`font-extrabold max-w-xl break-words tracking-tight leading-tight ${
                    data.uppercaseHeadline ? 'uppercase' : ''
                  }`}
                >
                  {data.headline || copy.empty_headline_hint}
                </h1>

                {sublineList.length > 0 && (
                  <div
                    data-testid="sublines"
                    style={{
                      fontSize: `${Math.max(16, Math.round(data.headlineSize * 0.52))}px`,
                      lineHeight: 1.55,
                    }}
                    className={`space-y-1.5 ${
                      data.boldSublines
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
                className={`flex ${data.qrEnabled ? 'items-center justify-between' : 'justify-center'} pt-6 border-t border-transparent`}
              >
                {/* Left: QR Code & Call to Action */}
                {data.qrEnabled && (
                  <div className="flex items-center gap-3.5 max-w-[50%]">
                    <div
                      data-testid="qr-container"
                      className={`p-1.5 rounded-lg shrink-0 flex items-center justify-center bg-white shadow-sm border ${themeStyles.border}`}
                    >
                      <Suspense fallback={null}>
                        <LazyQRCodeSVG
                          value={data.qrUrl || FALLBACK_QR_URL}
                          size={48}
                          fgColor={themeStyles.qrFg}
                          bgColor="transparent"
                          level="M"
                        />
                      </Suspense>
                    </div>
                    {data.qrCta && (
                      <span
                        className={`text-xs ${themeStyles.subtext} font-medium leading-relaxed max-w-[160px] break-words text-balance`}
                      >
                        {data.qrCta}
                      </span>
                    )}
                  </div>
                )}
                {data.qrEnabled ? (
                  /* Right: Circular Avatar & Author Signature */
                  <div className="flex items-center gap-3.5 shrink-0 ml-auto">
                    <AuthorBio
                      name={data.authorName}
                      bioLines={bioLines}
                      subtextClass={themeStyles.subtext}
                      align="right"
                    />
                    <AuthorAvatar
                      url={data.avatarUrl}
                      name={data.authorName}
                      grayscale={data.avatarGrayscale}
                      borderClass={themeStyles.avatarBorder}
                    />
                  </div>
                ) : (
                  /* Centered signature: avatar first, then name + bio */
                  <div className="flex items-center gap-3.5 shrink-0">
                    <AuthorAvatar
                      url={data.avatarUrl}
                      name={data.authorName}
                      grayscale={data.avatarGrayscale}
                      borderClass={themeStyles.avatarBorder}
                    />
                    <AuthorBio
                      name={data.authorName}
                      bioLines={bioLines}
                      subtextClass={themeStyles.subtext}
                    />
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    )
  },
)

CardPreview.displayName = 'CardPreview'
