import type { CSSProperties } from 'react'
import { MONTHS, PLAN, PLAN_EVENTS } from '../job'
import { Avatar, Chip, Copy, d, Drawing, Section } from '../parts'
import '../../styles/sections/plans.css'

// Page 08 of page-s1: Ellen's first year of Comfort Club (PLAN-002, PLAN-003), billed on the 22nd, her join date; a
// declined card fixed by an update link (PAY-008). The strip is built from job.ts: Oct-Jan paid, Feb-Sep due, and the
// renewal sits past the end of the axis, on Oct 22. At 900 px and under it is the desk's vertical list.
const LABEL = `${PLAN.name}, ${PLAN.price}: ${PLAN.visits}. ${PLAN.member}: ${PLAN.left}. Her first year: ${PLAN_EVENTS.map(e => `${e.date}, ${e.text.toLowerCase()}`).join('; ')}. ${PLAN.paid} of 12 monthly payments made, Oct to Jan; Feb to Sep due.`
// The callouts, left to right; the Jan 22 decline and its Jan 24 fix stack on one stem.
const CALLOUTS = [[0], [1], [2, 3], [4], [5]]

export function Plans() {
  return <Section id="plans" className="plans">
    <div className="pl-top">
      <Copy id="plans" eyebrow="Next 12 months · Maintenance plans" title="The plan books itself.">
        Ellen joined Comfort Club at checkout. Glove schedules each visit, bills monthly and renews.
      </Copy>
      <Drawing className="pl-plan-wrap" label={`${PLAN.name}, ${PLAN.price}: ${PLAN.visits}. ${PLAN.member}: ${PLAN.left}.`}>
        <div className="card pl-plan">
          <div className="pl-plan-head"><Chip name="calendar" tone="purple" size="lg" /><div><p className="card-title">{d(`${PLAN.name} · ${PLAN.price}`)}</p><p className="pl-soft">{d(PLAN.visits)}</p></div></div>
          <p className="pl-member"><Avatar initials="EB" tone="sky" /><span><b>{PLAN.member}</b>{d(` · ${PLAN.left}`)}</span></p>
        </div>
      </Drawing>
    </div>
    <Drawing className="pl-strip-wrap" label={LABEL}>
      <div className="card pl-strip">
        <div className="pl-year">
          {CALLOUTS.map(group => { const first = PLAN_EVENTS[group[0]]
            return <div key={first.tag} className={`pl-callout${first.month === 12 ? ' pl-callout-end' : ''}`} style={{ '--m': first.month } as CSSProperties}>
              {group.map((i, k) => <p key={i} className={`pl-tag pl-${PLAN_EVENTS[i].tone}${k ? ' pl-then' : ''}`}>{d(PLAN_EVENTS[i].tag)}</p>)}
              <i className={`pl-stem pl-${first.tone}`} />
            </div> })}
          <ol className="pl-axis">{MONTHS.map((month, i) => { const event = PLAN_EVENTS.find(e => e.month === i)
            return <li key={month} className={event ? `pl-${event.tone}` : ''}><i /><b>{month}</b>
              {i < PLAN.paid ? <span className={i === 3 ? 'pl-late' : ''}>$19 paid{i === 3 && <><br />Jan&nbsp;24</>}</span> : <span className="pl-due">$19 due</span>}</li> })}
            <li className="pl-end pl-purple"><i /></li></ol>
        </div>
        <ol className="pl-list">{PLAN_EVENTS.map(e => <li key={e.tag} className={`pl-${e.tone}`}><i /><b>{e.date}</b><span>{d(e.text)}</span></li>)}</ol>
        <p className="pl-foot">{d(`$19 a month · ${PLAN.paid} of 12 paid`)}</p>
      </div>
    </Drawing>
  </Section>
}
