import { localParts } from '../glove/time'
import type { MoveInFile } from '../glove/movein/servicem8'

// The ServiceM8 lists Harbour Air saved when it moved to Glove: its staff, its
// three longest-standing clients and their last jobs there. Authored in the
// shape of ServiceM8's REST API (as tests/fixtures/servicem8-small-hvac), with
// dates relative to the demo's start so the history stays recent.

export const DEMO_STAFF = ['f0e1d2c3-1111-4a5b-9c8d-7e6f5a4b3c01', 'f0e1d2c3-2222-4a5b-9c8d-7e6f5a4b3c02', 'f0e1d2c3-3333-4a5b-9c8d-7e6f5a4b3c03']
export const DEMO_CLIENTS = ['2a8c4e60-1b3d-4f5a-9c7e-1d2f3a4b5c01', '6b1f3a52-1c2e-4d8a-9a5e-0d3c2b7f0a11', '9d0e4c71-5b2a-4f39-8e61-7a4b3c2d1e22']

export function demoServiceM8Export(now: Date, zone: string): MoveInFile[] {
 const today = localParts(now.toISOString(), zone).date
 const at = (offset: number, time: string) => `${new Date(Date.parse(today + 'T12:00:00Z') + offset * 86400000).toISOString().slice(0, 10)} ${time}:00`
 const edited = at(-31, '16:40')
 const staff = [['Priya', 'Nair', 'priya@harbourair.example', '0400 000 100'], ['Tom', 'Brooks', 'tom@harbourair.example', '0400 000 101'], ['Alex', 'Nguyen', 'alex@harbourair.example', '0400 000 102']]
  .map(([first, last, email, mobile], i) => ({ uuid: DEMO_STAFF[i], active: 1, edit_date: edited, first, last, email, mobile }))
 const clients = [
  ['Harbourview Dental', '51 112 334 556', '14 Harbour St, Balmain NSW 2041', 'Mei', 'Lin', 'accounts@harbourview.example', '02 9555 0110'],
  ['Balmain Bakehouse', '12 345 678 901', '88 Darling St, Balmain NSW 2041', 'Luca', 'Marino', 'accounts@balmainbakehouse.example', '02 9555 0111'],
  ['Rozelle Physio', '', '5 Victoria Rd, Rozelle NSW 2039', 'Emma', 'Chen', 'accounts@rozellephysio.example', '02 9555 0112'],
 ]
 const company = clients.map(([name, abn_number, address], i) => ({ uuid: DEMO_CLIENTS[i], active: 1, edit_date: edited, name, abn_number, address, billing_address: address, is_individual: 0 }))
 const companycontact = clients.map(([, , , first, last, email, phone], i) => ({ uuid: `a1b2c3d4-00${i + 1}0-4e5f-8a9b-c0d1e2f3a4${i + 1}0`, active: 1, edit_date: edited, company_uuid: DEMO_CLIENTS[i], first, last, email, phone, mobile: '', is_primary_contact: '1', type: 'Billing' }))
 const history = [
  { client: 0, staff: 0, offset: -74, id: '412', description: 'Treatment room split system not cooling', done: 'Cleared blocked condensate drain, cleaned filters and coil; cooling restored.', materials: [['Split system service', '1', '189.00'], ['Condensate drain clear', '1', '85.00']] },
  { client: 1, staff: 1, offset: -58, id: '418', description: 'Coolroom compressor not starting\nCustomer reports tripping breaker', done: 'Replaced failed start capacitor; compressor starts and holds temperature.', materials: [['Electrical fault finding', '1', '145.00'], ['Start capacitor 45uF', '1', '68.00']] },
  { client: 2, staff: 2, offset: -41, id: '431', description: 'Annual service of two split systems', done: 'Both systems serviced; filters replaced in consult room 2.', materials: [['Split system service', '2', '189.00']] },
 ]
 const job = history.map((h, i) => ({ uuid: `3e4f5a6b-${'abc'[i].repeat(4)}-4c7d-8e9f-0a1b2c3d4e0${i + 1}`, active: 1, edit_date: at(h.offset + 2, '17:05'), company_uuid: DEMO_CLIENTS[h.client], status: 'Completed', generated_job_id: h.id, job_address: clients[h.client][2], job_description: h.description, work_done_description: h.done, purchase_order_number: '', date: at(h.offset - 3, '00:00'), completion_date: at(h.offset, '15:30'), invoice_sent: '1' }))
 const jobactivity = history.map((h, i) => ({ uuid: `5a6b7c8d-000${i + 1}-4e9f-8a0b-1c2d3e4f5a0${i + 1}`, active: 1, edit_date: at(h.offset, '15:30'), job_uuid: job[i].uuid, staff_uuid: DEMO_STAFF[h.staff], start_date: at(h.offset, '13:00'), end_date: at(h.offset, '15:00'), activity_was_scheduled: '1', activity_was_recorded: '1' }))
 const jobmaterial = history.flatMap((h, i) => h.materials.map(([name, quantity, price], n) => ({ uuid: `7c8d9e0f-00${i + 1}${n}-4a1b-8c2d-3e4f5a6b7c${i + 1}${n}`, active: 1, edit_date: at(h.offset, '15:30'), job_uuid: job[i].uuid, name, quantity, price, sort_order: n + 1 })))
 const list = (name: string, rows: unknown[]) => ({ name: `${name}.json`, text: JSON.stringify(rows) })
 return [list('company', company), list('companycontact', companycontact), list('staff', staff), list('job', job), list('jobactivity', jobactivity), list('jobmaterial', jobmaterial)]
}
