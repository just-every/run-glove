// The pieces every section is made of. Text in the drawings is real text; the drawings are HTML, CSS and inline
// SVG (styles/cards.css), never screenshots. Sample data is one US business (Austin, Texas) on Tue, Oct 20, 2026.
import type { CSSProperties, ReactNode } from 'react'

/** One idea per row: eyebrow, heading and a short paragraph beside its drawing; `flip` puts the drawing first.
 * `size` is the heading's size at 1440 wide, measured from the desk page (its headings differ page to page). */
export function Feature({ id, eyebrow, title, children, art, flip = false, label, className = '', size }: { id: string; eyebrow: string; title: ReactNode; children: ReactNode; art: ReactNode; flip?: boolean; label: string; className?: string; size: number }) {
  return <section id={id} className={`feature${flip ? ' flip' : ''} ${className}`.trim()} aria-labelledby={`${id}-title`} style={{ '--h2': `${size}px` } as CSSProperties}>
    <div className="site-wrap feature-row">
      <div className="feature-copy"><p className="eyebrow">{eyebrow}</p><h2 id={`${id}-title`}>{title}</h2><p className="feature-body">{children}</p></div>
      <div className="feature-art" role="img" aria-label={label}><div aria-hidden="true" className="feature-drawing">{art}</div></div>
    </div>
  </section>
}

/** A painted plate: AVIF, then WebP, at the widths public/site holds; `phone` swaps in a crop on narrow screens. */
export function Painting({ name, widths, sizes, className, phone, eager = false }: { name: string; widths: number[]; sizes: string; className?: string; phone?: { name: string; widths: number[]; media: string }; eager?: boolean }) {
  const set = (n: string, ws: number[], ext: string) => ws.map(w => `/site/${n}-${w}.${ext} ${w}w`).join(', ')
  const largest = Math.max(...widths)
  return <picture className={className}>
    {phone && <source media={phone.media} type="image/avif" srcSet={set(phone.name, phone.widths, 'avif')} sizes="100vw" />}
    {phone && <source media={phone.media} type="image/webp" srcSet={set(phone.name, phone.widths, 'webp')} sizes="100vw" />}
    <source type="image/avif" srcSet={set(name, widths, 'avif')} sizes={sizes} />
    <img src={`/site/${name}-${largest}.webp`} srcSet={set(name, widths, 'webp')} sizes={sizes} alt="" loading={eager ? 'eager' : 'lazy'} decoding="async" fetchPriority={eager ? 'high' : undefined} />
  </picture>
}

const PATHS = {
  phone: <path d="M6.6 3.5h2.6l1.4 3.8-1.9 1.3a10.6 10.6 0 0 0 6.7 6.7l1.3-1.9 3.8 1.4v2.6a2 2 0 0 1-2.1 2A15.4 15.4 0 0 1 4.6 5.6a2 2 0 0 1 2-2.1z" />,
  doc: <><path d="M7 3h7l4 4v14H7z" /><path d="M14 3v4h4M10 12h5M10 16h5" /></>,
  calendar: <><rect x="4" y="5.5" width="16" height="14.5" rx="2" /><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4M8.5 14h.01M12 14h.01M15.5 14h.01M8.5 17h.01M12 17h.01" /></>,
  swap: <path d="M4 8.5h15l-3.5-3.5M20 15.5H5l3.5 3.5" />,
  wrench: <path d="M14.6 6.1a4.2 4.2 0 0 0-5.3 5.4L4 16.8 7.2 20l5.3-5.3a4.2 4.2 0 0 0 5.4-5.3l-2.6 2.6-2.5-.6-.6-2.5z" />,
  star: <path d="m12 3.6 2.6 5.3 5.8.9-4.2 4.1 1 5.8L12 16.9l-5.2 2.8 1-5.8-4.2-4.1 5.8-.9z" />,
  bolt: <path d="M13.2 3 5.5 13.6h5.6L10.4 21l7.9-10.7h-5.7z" />,
  cloud: <path d="M7.2 18.5h10a4.2 4.2 0 0 0 .5-8.4 6 6 0 0 0-11.5 1.6 3.4 3.4 0 0 0 1 6.8z" />,
  card: <><rect x="3" y="5.5" width="18" height="13" rx="2.2" /><path d="M3 10h18M6.5 14.5h4" /></>,
  clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.6V12l3 1.8" /></>,
  alert: <><circle cx="12" cy="12" r="9" /><path d="M12 7.2v6M12 16.6v.1" /></>,
  box: <><path d="m12 3 8 4.4v9.2L12 21l-8-4.4V7.4z" /><path d="m4 7.4 8 4.4 8-4.4M12 11.8V21M8 5.2l8 4.4" /></>,
  refresh: <><path d="M19.5 11A7.6 7.6 0 0 0 6 6.7L4.5 8.3" /><path d="M4.5 4.5v3.8h3.8M4.5 13A7.6 7.6 0 0 0 18 17.3l1.5-1.6" /><path d="M19.5 19.5v-3.8h-3.8" /></>,
  bars: <path d="M6.5 19v-5M12 19V9.5M17.5 19V5.5" />,
  clipboard: <><path d="M9 3.5h6v3H9z" /><path d="M7.4 5H5.5v15.5h13V5h-1.9" /><path d="m8.8 13.4 2.3 2.3 4.2-4.6" /></>,
  laptop: <><rect x="4.5" y="4.5" width="15" height="10.5" rx="1.6" /><path d="M2.5 18.5h19" /></>,
  users: <><circle cx="9" cy="8.2" r="3.3" /><path d="M3.2 19.5a5.8 5.8 0 0 1 11.6 0" /><circle cx="16.8" cy="9.6" r="2.4" /><path d="M16.2 14.2a4.6 4.6 0 0 1 4.8 5.3" /></>,
  export: <><path d="M12 3.8v10.8M7.6 10.3 12 14.6l4.4-4.3" /><path d="M5 13v6.5h14V13" /></>,
  tag: <><path d="M3.8 12.6V4.2h8.4l8.2 8.2-8.1 8.1z" /><circle cx="8.3" cy="8.6" r="1.3" /></>,
  file: <><path d="M6 3.5h8.8l3.2 3.2v13.8H6z" /><path d="M9.2 10h5.6M9.2 13.5h5.6M9.2 17h3.6" /></>,
  check: <path d="m5.5 12.6 4.2 4.2 8.8-9.3" />,
  chevron: <path d="m9.5 5.5 6.5 6.5-6.5 6.5" />,
  van: <><path d="M2.5 7.5h11.5v8.5H2.5zM14 10h3.8l3.7 3.4V16H14z" /><circle cx="6.5" cy="17" r="1.8" /><circle cx="17.5" cy="17" r="1.8" /></>,
} satisfies Record<string, ReactNode>
export type IconName = keyof typeof PATHS

/** A stroke icon, 24 by 24. */
export const Icon = ({ name, className = '' }: { name: IconName; className?: string }) => <svg className={`icon ${className}`.trim()} viewBox="0 0 24 24">{PATHS[name]}</svg>

/** An icon in a tinted round chip: `tone` picks the tint and the ink. */
export const Chip = ({ name, tone, size = 'md' }: { name: IconName; tone: 'orange' | 'green' | 'blue' | 'purple' | 'grey' | 'amber' | 'solid'; size?: 'sm' | 'md' | 'lg' }) => <span className={`chip chip-${tone} chip-${size}`}><Icon name={name} /></span>

/** The green filled check used for done steps. */
export const Done = ({ className = '' }: { className?: string }) => <span className={`done ${className}`.trim()}><Icon name="check" /></span>

/** A person, by initials, on their tint. */
export const Avatar = ({ initials, tone }: { initials: string; tone: 'peach' | 'mint' | 'sky' | 'lilac' }) => <span className={`avatar avatar-${tone}`}>{initials}</span>

/** Text with its " · " separators set as spaced, softer middots, as the desk draws them. */
export const d = (text: string): ReactNode => text.includes(' · ') ? text.split(' · ').flatMap((part, i) => i ? [' ', <span className="dot" key={i}>·</span>, ' ', part] : [part]) : text

export const Pill = ({ children, tone = 'green' }: { children: ReactNode; tone?: 'green' | 'orange' }) => <span className={`pill pill-${tone}`}>{children}</span>
export const Chevron = () => <Icon name="chevron" className="chevron" />

/** The hand-drawn orange accent strokes the desk puts beside the headline and the hero cards. */
export const Sparks = ({ className }: { className: string }) => <svg className={`sparks ${className}`} viewBox="0 0 60 60" aria-hidden="true"><path d="M8 34 34 12M18 44 50 34M14 54l30 2" /></svg>

/** The brush underline under a word. */
export const Brush = () => <svg className="brush" viewBox="0 0 200 14" preserveAspectRatio="none" aria-hidden="true"><path d="M3 9.5C46 6.8 118 5 197 6.5" /></svg>

/** A street map tile: blocks, a river, parks, roads, and each van's route with its stops. */
export function StreetMap({ routes, className = '' }: { routes: { color: string; d: string; stops: [number, number][]; van?: [number, number] }[]; className?: string }) {
  return <svg className={`street-map ${className}`.trim()} viewBox="0 0 640 120" preserveAspectRatio="xMidYMid slice">
    <rect width="640" height="120" className="map-ground" />
    <path className="map-park" d="M30 70q30-20 60 0t40 40H20zM300 0h70l-10 40h-60zM520 80q40-10 80 10v30h-90z" />
    <path className="map-river" d="M-10 52C60 40 120 74 190 66s110-40 180-30 120 60 200 50 80-20 90-30" />
    <path className="map-road" d="M0 20h640M0 96h640M110 0v120M240 0v120M410 0v120M560 0v120M0 0l170 120M300 120 470 0M480 120l160-80" />
    <path className="map-street" d="M0 40h640M0 74h640M60 0v120M170 0v120M320 0v120M480 0v120M610 0v120" />
    {routes.map(route => <g key={route.d} style={{ color: route.color }}>
      <path className="map-route" d={route.d} />
      {route.stops.map(([x, y]) => <circle key={`${x}-${y}`} className="map-stop" cx={x} cy={y} r="5.5" />)}
      {route.van && <g transform={`translate(${route.van[0] - 14} ${route.van[1] - 11})`}><rect className="map-van-bg" width="28" height="22" rx="6" /><path className="map-van" d="M5 7h11v8H5zM16 9.5h3.5l3 3V15H16z" /><circle className="map-van" cx="9" cy="16" r="1.6" /><circle className="map-van" cx="19" cy="16" r="1.6" /></g>}
    </g>)}
  </svg>
}
