import { Icon } from '../parts'

// Page 7 of the desk: the one-line start in a terminal beside what owning it means.
const START = 'npx -y @runeditrun/rer dev'
const REPO = 'just-every/run-glove'
const COMMENT = '# clones, installs and starts Glove on your computer'

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
      <div className="terminal" role="img" aria-label={`One command: ${START} ${REPO}. ${COMMENT}`}>
        <div aria-hidden="true"><p className="terminal-dots"><span /><span /><span /></p>
          <p className="terminal-line"><span className="prompt">$</span><span>{START} <span style={{ whiteSpace: 'nowrap' }}>{REPO}</span></span></p>
          <p className="terminal-line">{COMMENT}</p></div>
      </div>
    </div>
  </section>
}
