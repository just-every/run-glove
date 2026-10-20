import { REBOOK } from '../job'
import { Avatar, Chip, Copy, d, Done, Drawing, Groups, Icon, Pill, Section } from '../parts'
import '../../styles/sections/job-agent.css'

// Page 05 of page-s1: 12:40 pm, the heater Ellen picked is backordered. The job agent finds stock at a branch and a
// new slot (AGENT-003, STOCK-002); Maya, the dispatcher, sends the moved appointment (GLOVE-07); Ellen confirms by
// reply (COMM-003). No approval wording: the human step is Maya tapping Send.
const LABEL = `Job #4418, a new 50-gal gas heater, worked by the job agent. ${REBOOK.problem.time}, problem: ${REBOOK.problem.text}. ${REBOOK.fixed}: ${REBOOK.steps.map(s => `${s.time}, ${s.text.join(', ').replace(/ · /g, ', ')}`).join('; ')}. The text Ellen got: “${REBOOK.text}”`

export function JobAgent() {
  return <Section id="job-agent" className="job-agent">
    <Copy id="job-agent" eyebrow="12:40 pm · Job agent" title="Rebooked before anyone called.">
      The heater Ellen picked is backordered. The job agent finds stock and a new slot; Maya in dispatch just taps Send.
    </Copy>
    <Drawing className="ja-art" label={LABEL}>
      <div className="card ja-card">
        <div className="ja-head"><p className="ja-title"><Groups stack parts={['Job #4418', 'New 50-gal gas heater']} /></p><p className="ja-chip"><Icon name="clipboard" />Job agent</p></div>
        <ol className="ja-log">
          <li className="ja-problem"><span className="ja-time">{REBOOK.problem.time}</span><span className="ja-mark"><i className="ja-dot ja-red" /></span><span className="ja-text">{d(REBOOK.problem.text)}</span><Pill tone="red">Problem</Pill></li>
          <li className="ja-fixed"><ol>{REBOOK.steps.map((step, i) => <li key={step.time}>
            <span className="ja-time">{step.time}</span><span className="ja-mark">{step.who ? <><Avatar initials={step.who} tone="sky" /><i className="ja-dot ja-green ja-phone-dot" /></> : <i className="ja-dot ja-green" />}</span>
            <span className="ja-text"><Groups parts={step.text.map((part, k) => k || !step.who ? part : <><span className="ja-by"><Avatar initials={step.who} tone="sky" /></span>{d(part)}</>)} /></span>
            {i === 0 && <Pill>{REBOOK.fixed}</Pill>}{step.done && <Done className="ja-done" />}
          </li>)}</ol><p className="ja-fixed-foot"><Pill>{REBOOK.fixed}</Pill></p></li>
        </ol>
      </div>
      <div className="ja-sms"><Chip name="message" tone="blue" size="md" /><p>{d(REBOOK.text)}</p></div>
    </Drawing>
  </Section>
}
