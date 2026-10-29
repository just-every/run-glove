/** Disposable verification uses the declared native setup-token owner lifecycle. */
export default async function ({ request, origin, claim, displayName, returnTo }) {
  const response = await request(origin + claim.path, { method: 'POST', redirect: 'manual', headers: { Origin: origin, 'Content-Type': 'application/json' }, body: JSON.stringify({ token: claim.token, displayName, returnTo }) })
  const cookie = response.headers.getSetCookie().map(value => value.split(';', 1)[0]).join('; ')
  if (response.status !== 303 || !cookie) return response
  async function command(type, payload) {
    const result = await request(origin + '/api/glove/commands', { method: 'POST', headers: { Origin: origin, Cookie: cookie, 'Content-Type': 'application/json' }, body: JSON.stringify({ commandId: crypto.randomUUID(), type, payload }) })
    const body = await result.json()
    if (!result.ok || !body.ok) throw Error('Native price-book fixture preparation failed')
    return body.result
  }
  await command('business.save', { name: 'Avery Field Service', timezone: 'America/Chicago', currency: 'USD' })
  await command('service.save', { code: 'FILTER', name: 'Replace air filter', kind: 'material', category: 'Parts', unitCost: '12.00', unitPrice: '25.00', tax: 'TAXABLE' })
  return response
}
