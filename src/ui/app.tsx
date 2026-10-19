import { useEffect, useState } from 'react'
import { roleName, today, useGlove } from './api'
import { Empty } from './controls'
import { Glyph } from './glyphs'
import { Dispatch } from './dispatch'
import { Quotes } from './quotes'
import { Jobs } from './jobs'
import { Customers } from './customers'
import { Invoices } from './invoices'
import { MoveIn } from './movein'
import { Activity } from './activity'
import { Team } from './team'
import { Today } from './today'
import { TechnicianApp } from './technician'
import './style'

// The desk (owner, dispatcher, office, agent, viewer) and the technician's
// phone share one sign-in; the role decides which one opens.

const primary = [['today', 'Today'], ['dispatch', 'Dispatch'], ['quotes', 'Quotes'], ['jobs', 'Jobs'], ['invoices', 'Invoices'], ['customers', 'Customers']] as const
const more = [['move-in', 'Move in'], ['activity', 'Activity'], ['team', 'Team']] as const
const views = [...primary, ...more].map(([id]) => id as string)
/** On a narrow phone these primary entries move into More (shell.css). */
const folds = new Set(['today', 'customers'])

async function signOut() {
  await fetch('/auth/signout', { method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json' }, body: '{}' }).catch(() => {})
  window.location.href = '/signin'
}

export function GloveApp() {
  const { state: s, loadError, busy, notice, run, refresh, unconfirmed, retry } = useGlove()
  const [hashView, setView] = useState(''), [focus, setFocus] = useState('')
  const [date, setDate] = useState('')
  useEffect(() => {
    const read = () => { const [name, id = ''] = window.location.hash.slice(1).split('/'); setView(views.includes(name) ? name : ''); setFocus(id) }
    read(); window.addEventListener('hashchange', read); return () => window.removeEventListener('hashchange', read)
  }, [])
  useEffect(() => { if (s && !date) setDate(today(s.business[0]?.timezone ?? 'Australia/Sydney')) }, [s, date])
  if (!s) return <main className="glove-app loading" aria-busy="true"><p role="status">{loadError || 'Loading your work…'}</p>{loadError && <button onClick={() => void refresh()}>Try again</button>}</main>
  if (s.actor.role === 'technician') return <TechnicianApp s={s} refresh={refresh} signOut={() => void signOut()} />
  const setup = !s.business.length, reports = s.actor.reads.includes('reports')
  // Before the business exists, /app opens on Team, where setup starts; after it, the owner's home is Today (REPORT-001).
  const view = hashView || (s.actor.role === 'owner' ? (setup ? 'team' : 'today') : 'dispatch')
  const shown = primary.filter(([id]) => id !== 'today' || (reports && !setup))
  return <div className="glove-app" aria-busy={busy}>
    <header className="header">
      <a className="brand" href="#dispatch"><span className="brand-mark" aria-hidden="true" /><span data-rer-name>Glove</span></a>
      <nav className="nav" aria-label="Main">
        {shown.map(([id, label]) => <a key={id} className={folds.has(id) ? `nav-fold nav-fold-${id}` : undefined} href={`#${id}`} aria-current={view === id ? 'page' : undefined}>{label}</a>)}
        <details className="more"><summary aria-current={more.some(([id]) => id === view) ? 'page' : undefined}>More<Glyph name="chevronDown" /></summary><div>{[...shown.filter(([id]) => folds.has(id)), ...more].map(([id, label]) => <a key={id} className={folds.has(id) ? `more-fold more-fold-${id}` : undefined} href={`#${id}`} aria-current={view === id ? 'page' : undefined} onClick={e => (e.currentTarget.closest('details') as HTMLDetailsElement).open = false}>{label}</a>)}</div></details>
      </nav>
      <div className="account"><span className="avatar" aria-hidden="true">{s.actor.name.split(/\s+/).map(p => p[0]).join('').slice(0, 2).toUpperCase()}</span><span className="who">{s.actor.name} · {s.actor.roleName ?? roleName(s.actor.role)}</span><span className="divider" aria-hidden="true" /><button className="quiet" onClick={() => void signOut()}>Sign out</button></div>
    </header>
    <main className="workspace">
      {unconfirmed && <div className="problem" role="alert"><strong>The last action's result did not come back.</strong><p>Retry sends exactly the same action; if it already happened, you get its recorded result instead of a second one.</p><button onClick={() => void retry()}>Retry</button></div>}
      {notice && <p className="notice-line" role="status">{notice}</p>}
      {setup && <section className="first-run" aria-labelledby="first-run-title"><h2 id="first-run-title">Set up Glove</h2><ol>
        <li><span>{s.actor.role === 'owner' ? <a href="#team">Add your business name and booking timezone</a> : 'The owner adds the business name and booking timezone'}</span></li>
        <li><span><a href="#team">Add your price book and technicians, and invite your team</a></span></li>
        <li><span><a href="#customers">Add a customer and site</a>, or <a href="#move-in">move in from ServiceM8</a></span></li>
      </ol></section>}
      {view === 'dispatch' && date && (s.technicians.length || !setup ? <Dispatch s={s} run={run} date={date} setDate={setDate} /> : <Empty title="No technicians yet"><a href="#team">Add them in Team</a>.</Empty>)}
      {view === 'today' && (reports && !setup ? <Today s={s} /> : setup ? <Empty title="Nothing to show yet">Today fills in once the business is set up.</Empty> : <Empty title="Today is the owner's dashboard">Your role does not read the business's figures.</Empty>)}
      {view === 'quotes' && <Quotes s={s} run={run} />}
      {view === 'jobs' && <Jobs key={focus} s={s} run={run} focus={focus} />}
      {view === 'invoices' && <Invoices s={s} run={run} />}
      {view === 'customers' && <Customers s={s} run={run} />}
      {view === 'move-in' && <MoveIn s={s} run={run} />}
      {view === 'activity' && <Activity s={s} />}
      {view === 'team' && <Team s={s} run={run} refresh={refresh} />}
    </main>
  </div>
}
