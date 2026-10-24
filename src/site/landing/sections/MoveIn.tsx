import { ALTERNATIVE, IMPORTED, START } from '../job'
import { links } from '../../shell/links'
import { Copy, Done, Drawing, Groups, Icon, keep, Section } from '../parts'
import '../../styles/sections/move-in.css'

/** A command that wraps only between words, keeping the installer's `install.sh | sh` together. */
function words(line: string) {
  return line.split(/(\S*install\.sh \| sh|\S+)/).map((part, index) => {
    const pipe = /^(.*\/)(install\.sh \| sh)$/.exec(part)
    if (pipe) return <span key={index}><span className="nw">{pipe[1]}</span><wbr /><span className="nw">{pipe[2]}</span></span>
    return part.trim() ? <span key={index} className="nw">{part}</span> : part
  })
}

// Page 09 of page-s1: the move from Jobber (MOVE-001): customers, jobs, quotes, recurring jobs and open balances in
// one import, shared phone numbers sent to merge review (CUST-005); then the five lines a stranger can run, and the
// limits, worded as the contract's Honest boundaries.

// "$38,210.55 · matched": the figure in ink, its note soft; on small phones the note sits under the figure.
const Count = ({ value }: { value: string }) => { const [figure, note] = value.split(' · ')
  return <span className="mv-count"><span>{figure}</span>{note && <span className="mv-note"><span className="dot">·</span>{note}</span>}</span> }

export function MoveIn() {
  return <Section id="move-in" className="move-in">
    <div className="mv-grid">
      <Copy id="move-in" eyebrow="Moving in" title={<>Bring your shop<br /> from Jobber.</>}>
        Customers, jobs, quotes, recurring jobs and open balances come across in one import, onto your office computer or your own server.
      </Copy>
      <Drawing className="mv-import-wrap" label={`Import from Jobber, 100%: ${IMPORTED.map(([what, count]) => `${what} ${count.replace(' · ', ', ')}`).join('; ')}. 9 customers share a phone number: review merge.`}>
        <div className="card mv-import">
          <p className="mv-title">Import from Jobber</p>
          <div className="mv-progress"><span /><b>100%</b></div>
          <ul className="mv-rows">{IMPORTED.map(([what, count]) => <li key={what}><Done /><span>{keep(what)}</span><Count value={count} /></li>)}</ul>
          <p className="mv-warn"><span className="mv-warn-dot">!</span><Groups parts={['9 customers share a phone number', 'review merge']} /></p>
        </div>
      </Drawing>
      <div className="terminal mv-terminal" role="img" aria-label={`One command: ${START}. Already have Node 22 or later? ${ALTERNATIVE} does the same.`}>
        <div aria-hidden="true"><p className="terminal-dots"><span /><span /><span /></p>
          <p className="terminal-line"><span className="prompt">$</span><span>{words(START)}</span></p>
          <p className="terminal-line terminal-comment"><span className="prompt">#</span><span>{words(`Already have Node 22 or later? ${ALTERNATIVE}`)}</span></p></div>
      </div>
      <p className="mv-limits"><span className="mv-limits-icon"><Icon name="wrench" /></span><span><b>What it doesn’t do:</b> payroll, GPS hardware or marketing campaigns. <a href={`${links.docs}/limits`}>Read the limits</a></span></p>
    </div>
  </Section>
}
