import { installation, business } from '/workspace/glove-f205/tests/api/harness.mjs'
const h = await installation({ at: '2026-11-09T02:00:00Z' })
try {
 const b = await business(h)
 const material = await h.command('service.save', { code: 'SYNTHETIC-MATERIAL', name: 'Synthetic costed material', kind: 'material', unit: 'each', unitCost: '11.00', unitPrice: '22.00', tax: 'GST' })
 const job = await h.command('job.create', { customerId:b.customer.id,siteId:b.site.id,title:'Synthetic retained cost',lines:[{description:'Synthetic work',quantity:'1',unitPrice:'100.00'}] })
 const visit = await h.command('visit.book', {jobId:job.id,technicianId:b.priya.id,date:'2026-11-10',start:'09:00',end:'10:00'})
 await b.priyaPerson.run('visit.capture',{visitId:visit.id,deviceTime:visit.startAt,kind:'material',serviceId:material.id,quantity:'2'})
 const read = async()=> (await (await h.request(`/api/glove/jobs/${job.id}/cost`)).json()).costing.actual
 const before = await read()
 const preview=await h.command('privacy.preview',{customerId:b.customer.id,version:b.customer.version})
 await h.command('privacy.erase',{customerId:b.customer.id,version:b.customer.version,confirm:'ERASE',fingerprint:preview.fingerprint})
 const after=await read()
 console.log(JSON.stringify({door:'native privacy.erase and job costing',before:{materials:before.materials,cost:before.cost},after:{materials:after.materials,cost:after.cost}}))
} finally {await h.close()}
