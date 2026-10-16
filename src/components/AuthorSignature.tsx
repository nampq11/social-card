import { FALLBACK_AUTHOR_NAME } from '../constants/presets'

export function AuthorAvatar({
  url,
  name,
  grayscale,
  borderClass,
}: {
  url?: string
  name?: string
  grayscale?: boolean
  borderClass: string
}) {
  if (!url) return null
  return (
    <div className={`size-14 rounded-full overflow-hidden shrink-0 shadow-sm ${borderClass}`}>
      <img
        src={url}
        alt={name || FALLBACK_AUTHOR_NAME}
        className={`h-full w-full object-cover object-top ${grayscale ? 'grayscale' : ''}`}
      />
    </div>
  )
}

export function AuthorBio({
  name,
  bioLines,
  subtextClass,
  align = 'left',
}: {
  name?: string
  bioLines: string[]
  subtextClass: string
  align?: 'left' | 'center' | 'right'
}) {
  return (
    <div className={align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : ''}>
      <h3 className="text-sm font-bold tracking-tight leading-tight break-words">
        {name || FALLBACK_AUTHOR_NAME}
      </h3>
      {bioLines.length > 0 && (
        <div
          data-testid="author-bio"
          className={`text-xs ${subtextClass} font-normal italic leading-tight mt-0.5 break-words`}
        >
          {bioLines.map((line, idx) => (
            <p key={idx}>{line}</p>
          ))}
        </div>
      )}
    </div>
  )
}
