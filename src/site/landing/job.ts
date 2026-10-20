// The one job the homepage follows end to end (design desk, page-s1 rev 3, 17 Oct 2026): Ellen Brooks's leaking
// 50-gal gas water heater at Oak Street Plumbing & Air in Austin, Texas. Tue, Oct 20, 2026: she calls at 7:42 am,
// is booked for 11:00 am-12:30 pm with Luis in Van 3 (the hero's "Booked 11:00 am"), Luis arrives at 10:52 am (the
// hero's ETA), the repair is paid on site ($412.00) and she picks the $1,850 heater; at 12:40 pm it is backordered
// and the install moves to Thu, Oct 22 (the hero's "Rebooked Thu, Oct 22"); Thursday she pays the balance and joins
// Comfort Club, whose next visit is Apr 3 (the hero's "1 visit left · next Apr 3"). Every figure on the page is here.

export type Tone = 'orange' | 'blue' | 'green' | 'purple' | 'red' | 'amber'

/** The 8 am-2 pm board for Tue, Oct 20 at 8:05 am: 6 techs, 31 jobs (the closing's "31 jobs done"). */
export const BOARD = { day: 'Tue, Oct 20', techs: 6, jobs: 31, from: 8, to: 14, now: 8 + 5 / 60 }
export type Visit = { start: number; end: number; name: string; work: string; ours?: boolean }
export type Lane = { initials: string; tint: 'peach' | 'sky' | 'mint' | 'lilac' | 'cream'; tech: string; van: string; tone: Tone; jobs: number; visits: Visit[] }
export const LANES: Lane[] = [
  { initials: 'LR', tint: 'peach', tech: 'Luis', van: 'Van 3', tone: 'orange', jobs: 5, visits: [
    { start: 8.5, end: 10, name: 'Ortiz', work: 'drain' },
    { start: 11, end: 12.5, name: 'Brooks', work: 'water heater', ours: true }] },
  { initials: 'PS', tint: 'sky', tech: 'Priya', van: 'Van 2', tone: 'blue', jobs: 5, visits: [
    { start: 8, end: 9.5, name: 'Chen', work: 'AC tune-up' },
    { start: 10.5, end: 11.5, name: 'Patel', work: 'faucet' },
    { start: 12.5, end: 13.5, name: 'Nguyen', work: 'furnace check' }] },
  { initials: 'MO', tint: 'mint', tech: 'Marcus', van: 'Van 1', tone: 'green', jobs: 5, visits: [
    { start: 9, end: 10.5, name: 'Kim', work: 'AC repair' },
    { start: 11.5, end: 13, name: 'Lopez', work: 'sewer camera' }] },
  { initials: 'DW', tint: 'lilac', tech: 'Dana', van: 'Van 4', tone: 'purple', jobs: 6, visits: [
    { start: 8, end: 9, name: 'Reed', work: 'disposal' },
    { start: 9.5, end: 11, name: 'Shah', work: 'thermostat' },
    { start: 12, end: 13.5, name: 'Grant', work: 'AC tune-up' }] },
  { initials: 'TJ', tint: 'cream', tech: 'Tom', van: 'Van 5', tone: 'red', jobs: 5, visits: [
    { start: 8.5, end: 10.5, name: 'Moore', work: 'repipe' },
    { start: 11, end: 12, name: 'Ali', work: 'toilet' },
    { start: 12.5, end: 13.5, name: 'Fox', work: 'water softener' }] },
  { initials: 'AB', tint: 'peach', tech: 'Ana', van: 'Van 6', tone: 'amber', jobs: 5, visits: [
    { start: 9, end: 10, name: 'Ruiz', work: 'sump pump' },
    { start: 10.5, end: 12, name: 'Bell', work: 'duct cleaning' },
    { start: 12.5, end: 13.5, name: 'West', work: 'AC tune-up' }] },
]

/** 12-hour clock for a decimal hour: 8.5 -> "8:30", with " am"/" pm" when asked. */
export function clock(hour: number, meridiem = false) {
  const h = Math.floor(hour), m = Math.round((hour - h) * 60)
  const text = `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')}`
  return meridiem ? `${text} ${h < 12 ? 'am' : 'pm'}` : text
}

/** Van 3's parts check for job #4417 at 8:05 am, each row backed by CONTRACT.md as it stands: the day's parts check
 * (STOCK-001, src/glove/stock.ts), the problem the 7:42 call put on the request (AGENT-001) and the on-my-way text on
 * departure (COMM-004). The day-before ready check (AGENT-002: gate codes, permits) covers next-day visits only. */
export const PARTS_CHECK = ['Drain valve and anode on Van 3', 'Shutoff valve off, from the 7:42 call', 'On-my-way text goes when Luis leaves Ortiz']

/** Good, better, best for the replacement (QUOTE-001); Ellen accepts Better, the hero's "Quote $1,850 · Accepted". */
export const OPTIONS = [
  { tier: 'Good', what: '40-gal gas', price: '$1,450' },
  { tier: 'Better', what: '50-gal gas', price: '$1,850', picked: true },
  { tier: 'Best', what: 'Tankless', price: '$4,200' },
]

/** 12:40 pm: the backorder and the job agent's fix (AGENT-003), 6 minutes from problem to Ellen's "Y". A step's text is
 * its parts, shown with " · " between them where they fit. */
export const REBOOK = {
  problem: { time: '12:40 pm', text: 'Supply house: 50-gal gas heater backordered to Oct 29' },
  fixed: 'Fixed in 6 minutes',
  steps: [
    { time: '12:41 pm', text: ['2 at Northside branch', 'ready for pickup Thu 7:00 am'] },
    { time: '12:42 pm', text: ['Install moved Wed Oct 21 → Thu Oct 22', '8–10 am · Luis · Van 3'] },
    { time: '12:43 pm', text: ['Maya tapped Send', 'new time texted to Ellen'], who: 'MK' },
    { time: '12:46 pm', text: ['Ellen replied “Y” to the new time'], done: true },
  ],
  text: 'Your heater arrives Thursday. Luis will install it 8–10 am. Reply Y to confirm.',
}

/** Thursday 10:05 am: the install's invoice and both visits' job costing (COST-004) at a $90/h loaded labor rate:
 * estimate ($2,262 - 4.0 h x $90 - $860) / $2,262 = 46.1%, actual ($2,262 - 4.5 h x $90 - $884) / $2,262 = 43.0%. */
export const INVOICE = {
  number: 'INV-2291', lines: [['50-gal gas water heater, installed', '$1,850.00'], ['Deposit paid Oct 20', '−$500.00']] as [string, string][],
  balance: '$1,350.00', paid: 'Tap to pay · 10:05 am', synced: 'Synced to QuickBooks Online · 10:06 am',
}
export const COSTING: [string, string, string][] = [['Price', '$2,262', '$2,262'], ['Labor hours', '4.0', '4.5'], ['Parts', '$860', '$884'], ['Margin', '46%', '43%']]

/** Comfort Club over its first year: joined at checkout Thu, Oct 22, billed $19 on the 22nd of each month. "Now" is
 * between Jan 24 and Apr 3 (the hero's "1 visit left · next Apr 3"), so Oct-Jan are paid and Feb-Sep are due. */
export const PLAN = { name: 'Comfort Club', price: '$19/mo', visits: '2 visits a year · furnace and AC tune-ups', member: 'Ellen Brooks', left: '1 visit left · next Apr 3', paid: 4 }
export const MONTHS = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep']
export type PlanEvent = { month: number; date: string; text: string; tag: string; tone: 'purple' | 'green' | 'red' }
export const PLAN_EVENTS: PlanEvent[] = [
  { month: 0, date: 'Oct 22', text: 'Joined at checkout', tag: 'Oct 22 · Joined at checkout', tone: 'purple' },
  { month: 1, date: 'Nov 12', text: 'Furnace tune-up done', tag: 'Nov 12 · Furnace tune-up done', tone: 'green' },
  { month: 3, date: 'Jan 22', text: 'Card declined', tag: 'Jan 22 · Card declined', tone: 'red' },
  { month: 3, date: 'Jan 24', text: 'Update link texted · paid', tag: 'Update link texted · paid Jan 24', tone: 'green' },
  { month: 6, date: 'Apr 3', text: 'AC tune-up booked', tag: 'Apr 3 · AC tune-up booked', tone: 'purple' },
  { month: 12, date: 'Oct 22', text: 'Renews', tag: 'Renews Oct 22', tone: 'purple' },
]

/** What a move from Jobber brings (MOVE-001); 214 recurring jobs. */
export const IMPORTED: [string, string][] = [['Customers', '3,418'], ['Jobs', '12,906'], ['Open quotes', '47'], ['Recurring jobs', '214'], ['Open balances', '$38,210.55 · matched']]
export const START = ['git clone https://github.com/just-every/run-glove.git glove', 'cd glove', 'rer install', 'rer setup', 'rer dev']
