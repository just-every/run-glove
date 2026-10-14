import { OfflineBanner, Phone, Stage, Tick } from '../parts'

/** The technician's phone with no signal: every item kept and waiting to send. */
export function OfflinePhone() {
  return (
    <Stage className="gl-stage--phone">
      <Phone className="gl-phone--section">
        <OfflineBanner items={5} />
        <div className="gl-phone-list">
          <Tick label="Isolate power" pill="Waiting to send" />
          <Tick label="Clean filters" pill="Waiting to send" />
          <div className="gl-photo-row">
            <span className="gl-photo" aria-hidden="true">
              <svg viewBox="0 0 120 80"><rect width="120" height="80" fill="#d9d4cc" /><rect x="14" y="12" width="92" height="58" rx="6" fill="#f3f1ec" stroke="#b9b2a7" /><circle cx="60" cy="41" r="22" fill="#8b857c" /><g stroke="#cfc9bf" strokeWidth="2.5">{[0, 1, 2, 3, 4, 5, 6, 7].map(i => <line key={i} x1="40" y1={25 + i * 4.5} x2="80" y2={25 + i * 4.5} />)}</g></svg>
            </span>
            <span className="gl-pill gl-pill--waiting">Waiting to send</span>
          </div>
        </div>
        <span className="gl-fake-button gl-fake-button--full">Complete visit</span>
      </Phone>
    </Stage>
  )
}
