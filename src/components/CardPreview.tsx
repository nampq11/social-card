import { forwardRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import type { CardState } from '../types';

interface CardPreviewProps {
  data: CardState;
  scale?: number;
}

export const CardPreview = forwardRef<HTMLDivElement, CardPreviewProps>(
  ({ data, scale = 1 }, ref) => {
    // Dimension presets in standard pixels for high-quality export
    const dimensions = {
      '1:1': { width: 720, height: 720 },
      '4:5': { width: 640, height: 800 },
      '16:9': { width: 800, height: 450 },
    }[data.ratio];

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
        bg: 'bg-[#FDFCF9]',
        text: 'text-[#18181B]',
        subtext: 'text-[#52525B]',
        qrBg: 'bg-transparent',
        qrFg: '#18181B',
        border: 'border-stone-200/60',
        avatarBorder: 'ring-1 ring-stone-300',
      },
      dark: {
        bg: 'bg-[#121214]',
        text: 'text-[#F4F4F5]',
        subtext: 'text-[#A1A1AA]',
        qrBg: 'bg-white p-1 rounded-md',
        qrFg: '#121214',
        border: 'border-white/10',
        avatarBorder: 'ring-1 ring-white/20',
      },
    }[data.theme];

    const sublineList = data.sublines
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    return (
      <div
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'top center',
        }}
        className="transition-transform duration-200 ease-out"
      >
        <div
          ref={ref}
          id="social-card-node"
          style={{
            width: `${dimensions.width}px`,
            height: `${dimensions.height}px`,
            fontFamily: "'Be Vietnam Pro', -apple-system, BlinkMacSystemFont, sans-serif",
          }}
          className={`${themeStyles.bg} ${themeStyles.text} relative flex flex-col justify-between p-14 select-none shrink-0 overflow-hidden shadow-2xl rounded-2xl`}
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
              className={`font-extrabold max-w-xl transition-all duration-100 ${
                data.uppercaseHeadline ? 'uppercase' : ''
              }`}
            >
              {data.headline || 'NHẬP TIÊU ĐỀ TẠI ĐÂY'}
            </h1>

            {sublineList.length > 0 && (
              <div
                style={{
                  fontSize: `${Math.max(16, Math.round(data.headlineSize * 0.52))}px`,
                  lineHeight: 1.55,
                }}
                className={`space-y-1.5 ${themeStyles.subtext} font-normal max-w-lg`}
              >
                {sublineList.map((line, idx) => (
                  <p key={idx} className="tracking-tight">
                    {line}
                  </p>
                ))}
              </div>
            )}
          </div>

          {/* Bottom Footer Section */}
          <div className="flex items-center justify-between pt-6 border-t border-transparent">
            {/* Left: QR Code & Call to Action */}
            {data.qrEnabled ? (
              <div className="flex items-center gap-3.5 max-w-[50%]">
                <div
                  className={`p-1.5 rounded-lg shrink-0 flex items-center justify-center ${themeStyles.qrBg} shadow-sm border border-black/5 dark:border-white/10`}
                >
                  <QRCodeSVG
                    value={data.qrUrl || 'https://github.com/nampq'}
                    size={48}
                    fgColor={themeStyles.qrFg}
                    bgColor="transparent"
                    level="M"
                  />
                </div>
                {data.qrCta && (
                  <span
                    className={`text-xs ${themeStyles.subtext} font-medium leading-relaxed max-w-[160px]`}
                  >
                    {data.qrCta}
                  </span>
                )}
              </div>
            ) : (
              <div />
            )}

            {/* Right: Circular Avatar & Author Signature */}
            <div className="flex items-center gap-3.5 shrink-0 ml-auto">
              <div className="text-right">
                <h3 className="text-sm font-bold tracking-tight leading-tight">
                  {data.authorName || 'Nam Pham'}
                </h3>
                {data.authorBio && (
                  <p
                    className={`text-xs ${themeStyles.subtext} font-normal italic leading-tight mt-0.5`}
                  >
                    {data.authorBio}
                  </p>
                )}
              </div>

              {data.avatarUrl && (
                <div
                  className={`w-14 h-14 rounded-full overflow-hidden shrink-0 shadow-sm ${themeStyles.avatarBorder}`}
                >
                  <img
                    src={data.avatarUrl}
                    alt={data.authorName}
                    className="w-full h-full object-cover object-top"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
);

CardPreview.displayName = 'CardPreview';
