import { SiteFooter } from '../shell/SiteFooter'
import { Board } from './drawings/Board'
import { InvoiceCard } from './drawings/InvoiceCard'
import { Licence } from './drawings/Licence'
import { MoveInCard } from './drawings/MoveInCard'
import { OfflinePhone } from './drawings/OfflinePhone'
import { QuoteCard } from './drawings/QuoteCard'
import { Section } from './parts'
import { Closing } from './sections/Closing'
import { Hero } from './sections/Hero'
import { Included } from './sections/Included'
import './styles'

/**
 * Glove's run-site homepage: daylight on site around the real product, drawn exactly. Static: no script, no other origin.
 */
export function Landing() {
  return (
    <div className="gl-site">
      <Hero />
      <main id="main">
        <Section id="free" side="left" eyebrow="Open source" heading="100% free. Yours to keep." body="Glove is MIT licensed. Run it on your own computer, change anything, keep every record."><Licence /></Section>
        <Section id="signal" side="right" eyebrow="On site" heading="Signal drops. The work stays." body="Checklist, notes, photos and materials stay on the phone and send once when it reconnects."><OfflinePhone /></Section>
        <Section id="dispatch" side="left" eyebrow="Dispatch" heading="The whole day on one board." body="Every tech’s visits across the day, accepted work waiting to book, and any overlap held for you to review."><Board /></Section>
        <Section id="quotes" side="right" eyebrow="Quotes" heading="A price the customer said yes to." body="Lines from your price book, GST worked out to the cent, and the customer’s answer recorded with how they gave it."><QuoteCard /></Section>
        <Section id="invoices" side="left" eyebrow="Invoices" heading="Ready for your books." body="The accepted work plus materials used on site, approved once and exported as a CSV in Xero’s import columns."><InvoiceCard /></Section>
        <Section id="move-in" side="right" eyebrow="Move in" heading="Bring your ServiceM8 history." body="Preview what moves, commit exactly that, and undo it if you change your mind. Every ServiceM8 ID is kept."><MoveInCard /></Section>
        <Included />
        <Closing />
      </main>
      <SiteFooter />
    </div>
  )
}
