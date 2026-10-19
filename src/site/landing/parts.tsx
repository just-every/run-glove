// The pieces every section is made of. Text in the drawings is real text; the drawings are HTML, CSS and inline
// SVG (styles/cards.css and styles/sections), never screenshots. Sample data is one US business (Austin, Texas) and
// one job, Ellen Brooks's water heater, from Tue, Oct 20, 2026 (job.ts).
import type { ReactNode } from 'react'

/** A section of the homepage: its own band of paper with the faint orange and blue corner glows the desk draws. */
export const Section = ({ id, className, children }: { id: string; className: string; children: ReactNode }) =>
  <section id={id} className={`band ${className}`} aria-labelledby={`${id}-title`}><div className="site-wrap">{children}</div></section>

/** A section's words: the eyebrow (clock time, then the product area), the one-size heading and the subhead. */
export const Copy = ({ id, eyebrow, title, children, className = '' }: { id: string; eyebrow: string; title: ReactNode; children: ReactNode; className?: string }) =>
  <div className={`copy ${className}`.trim()}><p className="eyebrow">{d(eyebrow)}</p><h2 id={`${id}-title`}>{title}</h2><p className="lede">{children}</p></div>

/** A drawing of the product: its text is real, and a screen reader hears it once, through the label. */
export const Drawing = ({ label, className, children }: { label: string; className: string; children: ReactNode }) =>
  <div className={className} role="img" aria-label={label}><div aria-hidden="true" className="drawing">{children}</div></div>

/** A painted plate: AVIF, then WebP, at the widths public/site holds; `phone` swaps in a crop on narrow screens. */
export function Painting({ name, widths, sizes, className, phone, eager = false }: { name: string; widths: number[]; sizes: string; className?: string; phone?: { name: string; widths: number[]; media: string }; eager?: boolean }) {
  const set = (n: string, ws: number[], ext: string) => ws.map(w => `/site/${n}-${w}.${ext} ${w}w`).join(', ')
  return <picture className={className}>
    {phone && <source media={phone.media} type="image/avif" srcSet={set(phone.name, phone.widths, 'avif')} sizes="100vw" />}
    {phone && <source media={phone.media} type="image/webp" srcSet={set(phone.name, phone.widths, 'webp')} sizes="100vw" />}
    <source type="image/avif" srcSet={set(name, widths, 'avif')} sizes={sizes} />
    <img src={`/site/${name}-1536.webp`} srcSet={set(name, widths, 'webp')} sizes={sizes} alt="" loading={eager ? 'eager' : 'lazy'} decoding="async" fetchPriority={eager ? 'high' : undefined} />
  </picture>
}

/** The widths every full-bleed plate ships at, up to 3072 for 1920 and 2560 screens at 1.2-2x. */
export const BLEED = [768, 1152, 1536, 2304, 3072]

const PATHS = {
  phone: <path d="M6.6 3.5h2.6l1.4 3.8-1.9 1.3a10.6 10.6 0 0 0 6.7 6.7l1.3-1.9 3.8 1.4v2.6a2 2 0 0 1-2.1 2A15.4 15.4 0 0 1 4.6 5.6a2 2 0 0 1 2-2.1z" />,
  doc: <><path d="M7 3h7l4 4v14H7z" /><path d="M14 3v4h4M10 12h5M10 16h5" /></>,
  calendar: <><rect x="4" y="5.5" width="16" height="14.5" rx="2" /><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4M8.5 14h.01M12 14h.01M15.5 14h.01M8.5 17h.01M12 17h.01" /></>,
  wrench: <path d="M14.6 6.1a4.2 4.2 0 0 0-5.3 5.4L4 16.8 7.2 20l5.3-5.3a4.2 4.2 0 0 0 5.4-5.3l-2.6 2.6-2.5-.6-.6-2.5z" />,
  card: <><rect x="3" y="5.5" width="18" height="13" rx="2.2" /><path d="M3 10h18M6.5 14.5h4" /></>,
  box: <><path d="m12 3 8 4.4v9.2L12 21l-8-4.4V7.4z" /><path d="m4 7.4 8 4.4 8-4.4M12 11.8V21M8 5.2l8 4.4" /></>,
  bars: <path d="M6.5 19v-5M12 19V9.5M17.5 19V5.5" />,
  clipboard: <><path d="M9 3.5h6v3H9z" /><path d="M7.4 5H5.5v15.5h13V5h-1.9" /><path d="M9 11h6M9 14.5h6M9 18h3.5" /></>,
  user: <><circle cx="12" cy="8.3" r="3.6" /><path d="M5 20a7 7 0 0 1 14 0z" /></>,
  message: <><path d="M4 5.5h16v11H9.5L5.5 20v-3.5H4z" /><path d="M8 9.5h8M8 12.8h5" /></>,
  mail: <><rect x="3.5" y="5.5" width="17" height="13" rx="2" /><path d="m4 6.5 8 6.2 8-6.2" /></>,
  file: <><path d="M6 3.5h8.8l3.2 3.2v13.8H6z" /><path d="M9.2 10h5.6M9.2 13.5h5.6M9.2 17h3.6" /></>,
  check: <path d="m5.5 12.6 4.2 4.2 8.8-9.3" />,
  chevron: <path d="m9.5 5.5 6.5 6.5-6.5 6.5" />,
} satisfies Record<string, ReactNode>
export type IconName = keyof typeof PATHS

/** A stroke icon, 24 by 24. */
export const Icon = ({ name, className = '' }: { name: IconName; className?: string }) => <svg className={`icon ${className}`.trim()} viewBox="0 0 24 24">{PATHS[name]}</svg>

/** An icon in a tinted round chip: `tone` picks the tint and the ink. */
export const Chip = ({ name, tone, size = 'md' }: { name: IconName; tone: 'orange' | 'green' | 'blue' | 'purple' | 'red' | 'solid'; size?: 'sm' | 'md' | 'lg' }) => <span className={`chip chip-${tone} chip-${size}`}><Icon name={name} /></span>

/** The green check in its pale round, used for done steps. */
export const Done = ({ className = '' }: { className?: string }) => <span className={`done ${className}`.trim()}><Icon name="check" /></span>

/** A person, by initials, on their tint. */
export const Avatar = ({ initials, tone }: { initials: string; tone: 'peach' | 'mint' | 'sky' | 'lilac' | 'cream' | 'grey' }) => <span className={`avatar avatar-${tone}`}>{initials}</span>

/** Keeps what reads as one thing on one line: a hyphenated or ranged word ("tune-up", "555-0186", "8–10"), a number
 * and its unit ("10:05 am", "12 yrs"), a month or van and its number ("Oct 22", "Van 3"), and an arrow with the word
 * before it. */
export const keep = (text: string) => text
  .replace(/(\w)([-–])(\w)/g, '$1$2\u2060$3')
  .replace(/(\d) (am|pm|yrs|jobs|techs|min|minutes)\b/g, '$1\u00a0$2')
  .replace(/\b(Van|Job|Install|Oct|Nov|Dec|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Tue|Wed|Thu) ([#\d])/g, '$1\u00a0$2')
  .replace(/ →/g, '\u00a0→')
  .replace(/\((\d{3})\) (\d)/g, '($1)\u00a0$2')

/** A phrase that never breaks inside, such as a card's subject ("New 50-gal gas heater"). */
export const glue = (text: string) => text.replace(/ /g, '\u00a0')

/** Text with its " · " separators set as spaced, softer middots, as the desk draws them. A separator stays at the end
 * of its line: the space before it does not break. */
export const d = (text: string): ReactNode => text.includes(' · ') ? keep(text).split(' · ').flatMap((part, i) => i ? ['\u00a0', <span className="dot" key={i}>·</span>, ' ', part] : [part]) : keep(text)

export const Pill = ({ children, tone = 'green' }: { children: ReactNode; tone?: 'green' | 'orange' | 'red' }) => <span className={`pill pill-${tone}`}>{children}</span>
export const Chevron = () => <Icon name="chevron" className="chevron" />

/** The hand-drawn orange accent strokes the desk puts beside the headline and the hero cards. */
export const Sparks = ({ className }: { className: string }) => <svg className={`sparks ${className}`} viewBox="0 0 60 60" aria-hidden="true"><path d="M8 34 34 12M18 44 50 34M14 54l30 2" /></svg>

/** The brush underline under a word. */
export const Brush = () => <svg className="brush" viewBox="0 0 200 14" preserveAspectRatio="none" aria-hidden="true"><path d="M3 9.5C46 6.8 118 5 197 6.5" /></svg>

/** The hero's small street map tile: blocks, a river, parks, roads, and a van's route with its stops. */
export function StreetMap({ routes, className = '' }: { routes: { color: string; d: string; stops: [number, number][] }[]; className?: string }) {
  return <svg className={`street-map ${className}`.trim()} viewBox="0 0 640 120" preserveAspectRatio="xMidYMid slice">
    <rect width="640" height="120" className="map-ground" />
    <path className="map-park" d="M30 70q30-20 60 0t40 40H20zM300 0h70l-10 40h-60zM520 80q40-10 80 10v30h-90z" />
    <path className="map-river" d="M-10 52C60 40 120 74 190 66s110-40 180-30 120 60 200 50 80-20 90-30" />
    <path className="map-road" d="M0 20h640M0 96h640M110 0v120M240 0v120M410 0v120M560 0v120M0 0l170 120M300 120 470 0M480 120l160-80" />
    <path className="map-street" d="M0 40h640M0 74h640M60 0v120M170 0v120M320 0v120M480 0v120M610 0v120" />
    {routes.map(route => <g key={route.d} style={{ color: route.color }}>
      <path className="map-route" d={route.d} />
      {route.stops.map(([x, y]) => <circle key={`${x}-${y}`} className="map-stop" cx={x} cy={y} r="5.5" />)}
    </g>)}
  </svg>
}
