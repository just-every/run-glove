import { pathToFileURL } from 'node:url'
import { join } from 'node:path'
const { installation, revenueCorrection } = await import(pathToFileURL(join(process.cwd(), 'tests/api/harness.mjs')))
const h = await installation({ at: '2026-10-30T16:00:00.000Z' })
try {
 const { b, invoice, correctionLines } = await revenueCorrection(h)
 const october='/api/glove/reports/revenue.json?from=2026-10-31&to=2026-10-31'
 const november='/api/glove/reports/revenue.json?from=2026-11-01&to=2026-11-30'
 const read=async path=>{ const response=await h.request(path,{as:b.office.cookie}); return {status:response.status,body:await response.json()} }
 const initial=await read(october)
 await h.setTime('2026-11-01T04:05:00.000Z')
 const corrected=await b.office.run('invoice.correct',{invoiceId:invoice.id,version:invoice.version,reason:'Probe corrected work',lines:correctionLines})
 await h.restart()
 const prepared=await read(october)
 const denied=await h.request(october,{as:b.priyaPerson.cookie})
 await b.office.run('invoice.approve',{invoiceId:corrected.id,version:corrected.version,revision:2})
 await h.restart()
 const approved=await read(october), next=await read(november)
 const filtered=await read(october+'&jobType=Maintenance')
 const csv=await h.request(october.replace('.json?','.csv?'),{as:b.office.cookie}).then(r=>r.text())
 console.log('PROBE REPORT-002 3: native completed jobs and ordinary invoice commands across New York month end, then revenue JSON and CSV after Worker restart -> initial '+initial.body.total.revenue+', prepared '+prepared.body.total.revenue+', approved '+approved.body.total.revenue+' across '+approved.body.total.invoices+' invoices on October 31; November '+next.body.total.revenue+'; Maintenance '+filtered.body.total.revenue+'; technician read '+denied.status)
 console.log(JSON.stringify({initial,prepared,approved,next,filtered,technicianStatus:denied.status,csv},null,2))
} finally { await h.close() }
