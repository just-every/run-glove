import { useEffect, useId, useState, type ReactNode } from 'react'
import type { Failure, Outcome } from './api'
import { Glyph, type GlyphName } from './glyphs'

/** A labelled input whose error is announced and tied to it. */
export function Field({ label, error, children, hint }: { label: string; error?: string; hint?: string; children: (props: { id: string; 'aria-invalid'?: boolean; 'aria-describedby'?: string }) => ReactNode }) {
  const id = useId(), described = error ? `${id}-error` : hint ? `${id}-hint` : undefined
  return <div className="field"><label htmlFor={id}>{label}</label>{children({ id, ...(error ? { 'aria-invalid': true } : {}), ...(described ? { 'aria-describedby': described } : {}) })}{hint && !error && <small id={`${id}-hint`}>{hint}</small>}{error && <small className="field-error" id={`${id}-error`}>{error}</small>}</div>
}

/** A refusal in words; its machine code and details go to the console for whoever is debugging. */
export function Problem({ error }: { error: Failure | null }) {
  useEffect(() => { if (error) console.info(`Glove refused: ${error.code}`, error.details ?? '') }, [error])
  if (!error) return null
  return <div className="problem" role="alert"><strong>{error.message}</strong>{Array.isArray(error.details?.conflicts) ? null : error.details?.open ? <p>Still open: {error.details.open.join(', ')}</p> : null}</div>
}

/** A form section that sends one command and shows its refusal beside it. */
export function useAction() {
  const [error, setError] = useState<Failure | null>(null)
  const act = async (outcome: Promise<Outcome>, done?: (result: any) => void) => {
    const result = await outcome
    if (result.ok) { setError(null); done?.(result.result) } else setError(result.error)
    return result
  }
  return { error, setError, act }
}

/** A state pill in its tint and ink; `check` marks a done result. */
export type Tone = 'green' | 'blue' | 'purple' | 'gold' | 'red' | 'grey'
export const Badge = ({ tone, check, children }: { tone: Tone; check?: boolean; children: ReactNode }) => <span className={`badge badge-${tone}`}>{check && <Glyph name="checkCircle" />}{typeof children === 'string' ? children.charAt(0).toUpperCase() + children.slice(1) : children}</span>

/** Nothing here yet: a card with a line glyph in an apricot circle, its title and one line. */
export function Empty({ title, children, glyph = 'doc' }: { title: string; children?: ReactNode; glyph?: GlyphName }) {
  return <div className="empty"><span className="empty-glyph"><Glyph name={glyph} /></span><strong>{title}</strong>{children && <p>{children}</p>}</div>
}

export const money = (value: string | undefined) => value === undefined ? '' : `$${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
