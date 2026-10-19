import { OPTIONS } from '../job'
import { Chip, Copy, d, Done, Drawing, glue, Icon, Section } from '../parts'
import { SIGNATURE } from '../signature'
import '../../styles/sections/tech-app.css'

// Page 04 of page-s1: Luis at the tank, offline in the garage (FIELD-001): three photos, the data plate read as
// MFG 2014 (FIELD-006), the checklist (FIELD-002), good / better / best for the replacement (QUOTE-001) and Ellen's
// signature. The phone's clock reads 11:41, after the 11:38 am signature; the eyebrow keeps 10:52, when Luis
// arrived. The photos are the desk's (12ui clean crops); the plate's lettering is HTML.
const Photo = ({ name }: { name: string }) => <picture>
  <source type="image/avif" srcSet={`/site/photo-${name}-106.avif 1x, /site/photo-${name}-212.avif 2x`} />
  <img src={`/site/photo-${name}-106.webp`} srcSet={`/site/photo-${name}-106.webp 1x, /site/photo-${name}-212.webp 2x`} alt="" width="106" height="119" loading="lazy" decoding="async" />
</picture>

export function TechApp() {
  return <Section id="tech-app" className="tech-app">
    <Copy id="tech-app" eyebrow="10:52 am · Tech app" title={<>Quote at<br /> the tank.</>}>Photos, checklist, options and signature on the tech’s phone, with or without signal.</Copy>
    <Drawing className="ta-phone-wrap" label="Job #4417, Brooks, on Luis's phone at 11:41, offline and saved on the phone. 3 photos: the tank's rusted base, the drain valve, and the data plate reading MFG 2014, 50 GAL, NAT GAS. Checklist: leak at drain valve, done; tank made 2014, done. Replace the heater: Good, 40-gal gas, $1,450; Better, 50-gal gas, $1,850, accepted; Best, tankless, $4,200. Signature: signed by Ellen Brooks at 11:38 am.">
      <div className="ta-phone">
        <div className="ta-screen">
          <div className="ta-status"><span>11:41</span><i className="ta-island" /><span className="ta-icons"><svg viewBox="0 0 18 12"><path d="M1 11h2.4V8H1zM5.2 11h2.4V6H5.2zM9.4 11h2.4V3.6H9.4zM13.6 11H16V1h-2.4z" /></svg><svg viewBox="0 0 16 12"><path d="M8 11.2 5.6 8.6a3.4 3.4 0 0 1 4.8 0zM3.4 6.4a6.5 6.5 0 0 1 9.2 0l-1.2 1.2a4.8 4.8 0 0 0-6.8 0zM1 4a9.9 9.9 0 0 1 14 0l-1.2 1.2a8.2 8.2 0 0 0-11.6 0z" /></svg><b /></span></div>
          <div className="ta-head"><Icon name="chevron" className="ta-back" /><p>{d('Job #4417 · Brooks')}</p><span className="ta-offline">{d('Offline · saved on phone')}</span></div>
          <div className="ta-body">
            <div className="ta-card"><p className="ta-h">3 photos</p><div className="ta-photos"><Photo name="tank" /><Photo name="valve" /><span className="ta-plate"><Photo name="plate" /><span className="ta-plate-text">MFG 2014<br />50 GAL<br />NAT GAS</span></span></div></div>
            <div className="ta-card"><p className="ta-h">Checklist</p><ul className="ta-checks"><li><Done />Leak at drain valve</li><li><Done />Tank made 2014</li></ul></div>
            <div className="ta-card"><p className="ta-h">Replace the heater</p><ul className="ta-options">{OPTIONS.map(o => <li key={o.tier} className={o.picked ? 'ta-picked' : ''}><i className="ta-radio" /><span>{d(`${o.tier} · ${glue(o.what)} · `)}{o.picked ? <b>{o.price}</b> : o.price}</span>{o.picked && <span className="ta-accepted">Accepted</span>}</li>)}</ul></div>
            <div className="ta-card"><p className="ta-h">Signature</p><div className="ta-sign"><svg viewBox="0 0 260 80"><path d={SIGNATURE} /></svg></div><p className="ta-signed">{d('Signed · Ellen Brooks · 11:38 am')}</p></div>
          </div>
        </div>
      </div>
    </Drawing>
    <Drawing className="ta-side" label="Paid on site, $412.00: drain valve replaced, leak stopped. $500 deposit paid: install #4418 on Wed, Oct 21.">
      <div className="card ta-note"><Chip name="card" tone="green" size="lg" /><div><p className="ta-note-title">{d('Paid on site · $412.00')}</p><p className="ta-note-sub">Drain valve replaced, leak stopped</p></div><span className="ta-ok"><Icon name="check" /></span></div>
      <div className="card ta-note"><Chip name="calendar" tone="orange" size="lg" /><div><p className="ta-note-title">$500 deposit paid</p><p className="ta-note-sub">{d('Install #4418 · Wed, Oct 21')}</p></div></div>
    </Drawing>
  </Section>
}
