import { forwardRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { useCardStore } from '../lib/card-store'
import { RATIO_INFO } from '../constants/ratios'
import { FALLBACK_AUTHOR_NAME, FALLBACK_QR_URL } from '../constants/presets'
import { splitSublines } from '../lib/card-text'
import { useUiCopy } from '../lib/i18n'

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

    // Theme styles
    const themeStyles = {
      white: {
        bg: 'bg-white',
        text: 'text-[#111111]',
        subtext: 'text-[#555558]',
        qrBg: 'bg-white',
        qrFg: '#111111',
        border: 'border-black/5',
        avatarBorder: 'ring-1 ring-black/10',
      },
      paper: {
        bg: 'bg-[#FAF9F5]',
        text: 'text-[#1D1D1F]',
        subtext: 'text-[#424245]',
        qrBg: 'bg-white',
        qrFg: '#1D1D1F',
        border: 'border-stone-200/60',
        avatarBorder: 'ring-1 ring-stone-300',
      },
      dark: {
        bg: 'bg-[#121214]',
        text: 'text-[#F4F4F5]',
        subtext: 'text-[#A1A1AA]',
        qrBg: 'bg-white',
        qrFg: '#121214',
        border: 'border-white/10',
        avatarBorder: 'ring-1 ring-white/20',
      },
      mist: {
        bg: 'bg-[#E8EDF0]',
        text: 'text-[#101113]',
        subtext: 'text-[#3D4046]',
        qrBg: 'bg-white',
        qrFg: '#101113',
        border: 'border-slate-300/60',
        avatarBorder: 'ring-1 ring-slate-400/50',
      },
    }[data.theme]

    const sublineList = splitSublines(data.sublines)
    const bioLines = splitSublines(data.authorBio)

    const signatureText = (alignRight: boolean) => (
      <div className={alignRight ? 'text-right' : ''}>
        <h3 className="text-sm font-bold tracking-tight leading-tight break-words">
          {data.authorName || FALLBACK_AUTHOR_NAME}
        </h3>
        {bioLines.length > 0 && (
          <div
            className={`text-xs ${themeStyles.subtext} font-normal italic leading-tight mt-0.5 break-words`}
          >
            {bioLines.map((line, idx) => (
              <p key={idx}>{line}</p>
            ))}
          </div>
        )}
      </div>
    )

    const signatureAvatar = data.avatarUrl ? (
      <div
        className={`w-14 h-14 rounded-full overflow-hidden shrink-0 shadow-sm ${themeStyles.avatarBorder}`}
      >
        <img
          src={data.avatarUrl}
          alt={data.authorName || FALLBACK_AUTHOR_NAME}
          className={`w-full h-full object-cover object-top ${data.avatarGrayscale ? 'grayscale' : ''}`}
        />
      </div>
    ) : null

    return (
      <div
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
        }}
        className={`${
          animated ? 'transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]' : ''
        } card-elevation rounded-[24px]`}
      >
        <div
          ref={ref}
          id="social-card-node"
          style={{
            width: `${width}px`,
            height: `${height}px`,
          }}
          className={`${themeStyles.bg} ${themeStyles.text} relative flex flex-col justify-between p-14 select-none shrink-0 overflow-hidden rounded-[24px]`}
        >
          {/* Top spacer / header room */}
          <div className="h-6" />

          {/* Center Main Content */}
          <div className="flex flex-col items-center justify-center text-center px-4 space-y-4 my-auto">
            <h1
              style={{
                fontSize: `${data.headlineSize}px`,
                letterSpacing: '-0.025em',
                lineHeight: 1.25,
              }}
              className={`font-extrabold max-w-xl break-words ${
                data.uppercaseHeadline ? 'uppercase' : ''
              }`}
            >
              {data.headline || copy.empty_headline_hint}
            </h1>

            {sublineList.length > 0 && (
              <div
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
                  className={`p-1.5 rounded-lg shrink-0 flex items-center justify-center ${themeStyles.qrBg} shadow-sm border ${themeStyles.border}`}
                >
                  <QRCodeSVG
                    value={data.qrUrl || FALLBACK_QR_URL}
                    size={48}
                    fgColor={themeStyles.qrFg}
                    bgColor="transparent"
                    level="M"
                  />
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
                {signatureText(true)}
                {signatureAvatar}
              </div>
            ) : (
              /* Centered signature: avatar first, then name + bio */
              <div className="flex items-center gap-3.5 shrink-0">
                {signatureAvatar}
                {signatureText(false)}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  },
)

CardPreview.displayName = 'CardPreview'
