import { Icon } from '../parts'

// Page 7 of the desk: the clone-and-run terminal beside what owning it means.
const commands = ['git clone https://github.com/just-every/run-glove.git glove', 'cd glove', 'rer install', 'rer setup', 'rer dev']

export function Ownership() {
  return <section id="ownership" className="ownership" aria-labelledby="ownership-title">
    <div className="site-wrap ownership-row">
      <div className="feature-copy">
        <p className="eyebrow">Ownership</p>
        <h2 id="ownership-title">Your shop, your<br /> system.</h2>
        <p className="feature-body"><a href="/run">Run Glove</a> on your own computer or server and keep every customer, job and payment. Export everything, any time.</p>
        <ul className="owned">
          <li><Icon name="laptop" />Your own computer or server</li>
          <li><Icon name="users" />Your customers, your data</li>
          <li><Icon name="export" />Export any time</li>
        </ul>
      </div>
      <div className="terminal" role="img" aria-label={`A terminal: ${commands.join(', then ')}`}>
        <div aria-hidden="true"><p className="terminal-dots"><span /><span /><span /></p>
          {commands.map(command => <p className="terminal-line" key={command}><span className="prompt">$</span>{command}</p>)}</div>
      </div>
    </div>
  </section>
}
