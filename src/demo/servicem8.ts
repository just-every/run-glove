import { localParts } from '../glove/time'
import type { MoveInFile } from '../glove/movein/servicem8'

// The ServiceM8 lists Pacheco Plumbing & HVAC saved when it moved to Glove: its
// six technicians, its three longest-standing clients and their last jobs there. Authored in the
// shape of ServiceM8's REST API (as tests/fixtures/servicem8-small-hvac), with
// dates relative to the demo's start so the history stays recent.

export const DEMO_STAFF = ['f0e1d2c3-1111-4a5b-9c8d-7e6f5a4b3c01', 'f0e1d2c3-2222-4a5b-9c8d-7e6f5a4b3c02', 'f0e1d2c3-3333-4a5b-9c8d-7e6f5a4b3c03', 'f0e1d2c3-4444-4a5b-9c8d-7e6f5a4b3c04', 'f0e1d2c3-5555-4a5b-9c8d-7e6f5a4b3c05', 'f0e1d2c3-6666-4a5b-9c8d-7e6f5a4b3c06']
export const DEMO_CLIENTS = ['2a8c4e60-1b3d-4f5a-9c7e-1d2f3a4b5c01', '6b1f3a52-1c2e-4d8a-9a5e-0d3c2b7f0a11', '9d0e4c71-5b2a-4f39-8e61-7a4b3c2d1e22']

/** Pacheco's technicians, first and last name, in the order the board lists them. */
export const DEMO_TECHNICIANS = [['Luis', 'Ortega'], ['Tamika', 'Reed'], ['Greg', 'Hollis'], ['Marcus', 'Chen'], ['Priya', 'Nair'], ['Sam', 'Okafor']]

export function demoServiceM8Export(now: Date, zone: string): MoveInFile[] {
 const today = localParts(now.toISOString(), zone).date
 const at = (offset: number, time: string) => `${new Date(Date.parse(today + 'T12:00:00Z') + offset * 86400000).toISOString().slice(0, 10)} ${time}:00`
 const edited = at(-31, '16:40')
 const staff = DEMO_TECHNICIANS.map(([first, last], i) => [first, last, `${first.toLowerCase()}@pachecoplumbing.example`, `(512) 555-01${20 + i}`])
  .map(([first, last, email, mobile], i) => ({ uuid: DEMO_STAFF[i], active: 1, edit_date: edited, first, last, email, mobile }))
 const clients = [
  ['Karen Wilson', '', '123 Maple St, Austin, TX 78704', 'Karen', 'Wilson', 'karen.wilson@example.com', '(512) 555-0110'],
  ['Hendricks Family', '', '2214 Oak Ridge Dr, Austin, TX 78741', 'Paul', 'Hendricks', 'paul.hendricks@example.com', '(512) 555-0111'],
  ['Bell Dental Group', '74-2219053', '11800 Domain Blvd, Austin, TX 78758', 'Laura', 'Bell', 'accounts@belldental.example', '(512) 555-0112'],
 ]
 const company = clients.map(([name, abn_number, address], i) => ({ uuid: DEMO_CLIENTS[i], active: 1, edit_date: edited, name, abn_number, address, billing_address: address, is_individual: 0 }))
 const companycontact = clients.map(([, , , first, last, email, phone], i) => ({ uuid: `a1b2c3d4-00${i + 1}0-4e5f-8a9b-c0d1e2f3a4${i + 1}0`, active: 1, edit_date: edited, company_uuid: DEMO_CLIENTS[i], first, last, email, phone, mobile: '', is_primary_contact: '1', type: 'Billing' }))
 const history = [
  { client: 0, staff: 0, offset: -74, id: '412', description: 'Water heater pilot keeps going out', done: 'Replaced the thermocouple and cleaned the burner; pilot holds and the tank heats.', materials: [['Diagnostic service call', '1', '89.00'], ['Thermocouple', '1', '38.00']] },
  { client: 1, staff: 2, offset: -58, id: '418', description: 'Upstairs AC not cooling\nCustomer reports ice on the line', done: 'Cleared the clogged condensate line and replaced the filter; cooling restored. Condensate pump is near the end of its life.', materials: [['AC not cooling diagnosis', '1', '149.00'], ['Condensate line flush', '1', '95.00']] },
  { client: 2, staff: 3, offset: -41, id: '431', description: 'Spring maintenance on both rooftop units', done: 'Both units serviced; filters and belts replaced on unit 2.', materials: [['Maintenance plan visit', '2', '149.00']] },
 ]
 const job = history.map((h, i) => ({ uuid: `3e4f5a6b-${'abc'[i].repeat(4)}-4c7d-8e9f-0a1b2c3d4e0${i + 1}`, active: 1, edit_date: at(h.offset + 2, '17:05'), company_uuid: DEMO_CLIENTS[h.client], status: 'Completed', generated_job_id: h.id, job_address: clients[h.client][2], job_description: h.description, work_done_description: h.done, purchase_order_number: '', date: at(h.offset - 3, '00:00'), completion_date: at(h.offset, '15:30'), invoice_sent: '1' }))
 const jobactivity = history.map((h, i) => ({ uuid: `5a6b7c8d-000${i + 1}-4e9f-8a0b-1c2d3e4f5a0${i + 1}`, active: 1, edit_date: at(h.offset, '15:30'), job_uuid: job[i].uuid, staff_uuid: DEMO_STAFF[h.staff], start_date: at(h.offset, '13:00'), end_date: at(h.offset, '15:00'), activity_was_scheduled: '1', activity_was_recorded: '1' }))
 const jobmaterial = history.flatMap((h, i) => h.materials.map(([name, quantity, price], n) => ({ uuid: `7c8d9e0f-00${i + 1}${n}-4a1b-8c2d-3e4f5a6b7c${i + 1}${n}`, active: 1, edit_date: at(h.offset, '15:30'), job_uuid: job[i].uuid, name, quantity, price, sort_order: n + 1 })))
 const list = (name: string, rows: unknown[]) => ({ name: `${name}.json`, text: JSON.stringify(rows) })
 return [list('company', company), list('companycontact', companycontact), list('staff', staff), list('job', job), list('jobactivity', jobactivity), list('jobmaterial', jobmaterial)]
}
