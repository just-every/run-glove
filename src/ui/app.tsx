import { useEffect, useState } from 'react'
import { roleName, today, useGlove } from './api'
import { Empty } from './controls'
import { Glyph, type GlyphName } from './glyphs'
import { Dispatch } from './dispatch'
import { Quotes } from './quotes'
import { Jobs } from './jobs'
import { Customers } from './customers'
import { Invoices } from './invoices'
import { MoveIn } from './movein'
import { Activity } from './activity'
import { Team } from './team'
import { Today } from './today'
import { Stock } from './stock'
import { Reports } from './reports'
import { forgetDay } from './offline-day'
import { forgetPush, OwnerPush } from './push'
import { Rules, RuleNotices } from './rules'
import { MarginWarnings } from './costing'
import { TechnicianApp } from './technician'
import './style'

// The desk (owner, dispatcher, office, agent, viewer) and the technician's
// phone share one sign-in; the role decides which one opens. The desk is a
// white left rail (the glove lockup, the screens, the business and the person
// at its foot) beside the work; on a phone the rail folds into a menu.

const primary = [['today', 'Today', 'home'], ['dispatch', 'Dispatch', 'calendar'], ['quotes', 'Quotes', 'doc'], ['jobs', 'Jobs', 'clipboard'], ['invoices', 'Invoices', 'receipt'], ['customers', 'Customers', 'people']] as const
const more = [['reports', 'Reports', 'chart'], ['stock', 'Stock', 'box'], ['rules', 'Rules', 'bolt'], ['move-in', 'Move in', 'download'], ['activity', 'Activity', 'pulse'], ['team', 'Team', 'gear']] as const
const views = [...primary, ...more].map(([id]) => id as string)
const initials = (name: string) => name.split(/\s+/).map(p => p[0]).join('').slice(0, 2).toUpperCase()

async function signOut() {
  forgetDay()
  await forgetPush()
  await fetch('/auth/signout', { method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json' }, body: '{}' }).catch(() => {})
  window.location.href = '/signin'
}

export function GloveApp() {
  const { state: s, loadError, busy, notice, setNotice, run, refresh, unconfirmed, retry, keptAt } = useGlove()
  const [hashView, setView] = useState(''), [focus, setFocus] = useState('')
  const [date, setDate] = useState(''), [menu, setMenu] = useState(false)
  useEffect(() => {
    const read = () => { const [name, id = ''] = window.location.hash.slice(1).split('/'); setView(views.includes(name) ? name : ''); setFocus(id) }
    read(); window.addEventListener('hashchange', read); return () => window.removeEventListener('hashchange', read)
  }, [])
  // The saved toast leaves after a few seconds.
  useEffect(() => { if (!notice) return; const timer = window.setTimeout(() => setNotice(''), 4000); return () => window.clearTimeout(timer) }, [notice])
  useEffect(() => { if (s && !date) setDate(today(s.business[0]?.timezone ?? 'Australia/Sydney')) }, [s, date])
  if (!s) return <main className="glove-app loading" aria-busy="true"><p role="status">{loadError || 'Loading your work…'}</p>{loadError && <button onClick={() => void refresh()}>Try again</button>}</main>
  if (s.actor.role === 'technician') return <TechnicianApp s={s} refresh={refresh} keptAt={keptAt} signOut={() => void signOut()} />
  const setup = !s.business.length, reports = s.actor.reads.includes('reports')
  // Before the business exists, /app opens on Team, where setup starts; after it, the owner's home is Today (REPORT-001).
  const view = hashView || (s.actor.role === 'owner' ? (setup ? 'team' : 'today') : 'dispatch')
  const shown = primary.filter(([id]) => id !== 'today' || (reports && !setup))
  const link = ([id, label, glyph]: readonly [string, string, GlyphName]) => <a key={id} href={`#${id}`} aria-current={view === id ? 'page' : undefined} onClick={() => setMenu(false)}><Glyph name={glyph} /><span>{label}</span></a>
  const here = [...primary, ...more].find(([id]) => id === view)?.[1] ?? 'Menu'
  return <div className={`glove-app${menu ? ' menu-open' : ''}`} aria-busy={busy}>
    <aside className="rail">
      <a className="brand" href="#dispatch"><img className="brand-mark" src="/brand/mark.svg" alt="" width="30" height="30" /><span data-rer-name>Glove</span></a>
      <button className="menu-toggle" aria-expanded={menu} aria-controls="main-nav" onClick={() => setMenu(!menu)}><Glyph name={menu ? 'close' : 'menu'} /><span>{here}</span></button>
      <nav className="nav" id="main-nav" aria-label="Main">
        <div className="nav-group">{shown.map(link)}</div>
        <div className="nav-group">{more.map(link)}</div>
      </nav>
      <div className="account">
        {s.business[0]?.name && <p className="business-name">{s.business[0].name}</p>}
        <div className="who"><span className="avatar" aria-hidden="true">{initials(s.actor.name)}</span><span><strong>{s.actor.name}</strong><span className="muted">{s.actor.roleName ?? roleName(s.actor.role)}</span></span></div>
        <button className="quiet" onClick={() => void signOut()}>Sign out</button>
      </div>
    </aside>
    <main className="workspace">
      {unconfirmed && <div className="problem" role="alert"><strong>The last action's result did not come back.</strong><p>Retry sends exactly the same action; if it already happened, you get its recorded result instead of a second one.</p><button onClick={() => void retry()}>Retry</button></div>}
      {notice && <p className="notice-line" role="status">{notice}</p>}
      <MarginWarnings s={s} />
      <RuleNotices s={s} />
      {setup && <section className="first-run" aria-labelledby="first-run-title"><h2 id="first-run-title">Set up Glove</h2><ol>
        <li><span>{s.actor.role === 'owner' ? <a href="#team">Add your business name and booking timezone</a> : 'The owner adds the business name and booking timezone'}</span></li>
        <li><span><a href="#team">Add your price book and technicians, and invite your team</a></span></li>
        <li><span><a href="#customers">Add a customer and site</a>, or <a href="#move-in">move in from ServiceM8</a></span></li>
      </ol></section>}
      {view === 'dispatch' && date && (s.technicians.length || !setup ? <Dispatch s={s} run={run} date={date} setDate={setDate} /> : <div className="page"><section className="titlebar"><div><h1>Dispatch</h1></div></section><Empty title="No technicians yet" glyph="calendar"><a href="#team">Add them in Team</a>, then book their visits here.</Empty></div>)}
      {view === 'today' && (reports && !setup ? <Today s={s} /> : setup ? <Empty title="Nothing to show yet">Today fills in once the business is set up.</Empty> : <Empty title="Today is the owner's dashboard">Your role does not read the business's figures.</Empty>)}
      {view === 'quotes' && <Quotes s={s} run={run} />}
      {view === 'jobs' && <Jobs key={focus} s={s} run={run} focus={focus} />}
      {view === 'invoices' && <Invoices s={s} run={run} />}
      {view === 'customers' && <Customers s={s} run={run} />}
      {view === 'reports' && <Reports s={s} />}
      {view === 'rules' && <Rules s={s} run={run} />}
      {view === 'stock' && <Stock s={s} run={run} />}
      {view === 'move-in' && <MoveIn s={s} run={run} />}
      {view === 'activity' && <Activity s={s} />}
      {view === 'team' && <Team s={s} run={run} refresh={refresh} />}
    </main>
  </div>
}
