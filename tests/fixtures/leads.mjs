// Lead-source network edges (BOOK-004): Yelp's Leads API, Google's OAuth token
// endpoint and the Google Ads API search for Local Services leads, plus
// recorded-shape lead payloads for each provider. Thumbtack's body follows its
// Partner API v4 NegotiationCreatedV4 field names, Angi's its CRM lead
// delivery, Yelp's its Leads API lead, Google's a LocalServicesLead row.
export function leadsEdge() {
  const edge = { yelp: new Map(), google: [], googlePages: new Map(), calls: [] }
  edge.answer = async request => {
    const url = new URL(request.url)
    if (url.origin === 'https://api.yelp.com' && url.pathname.startsWith('/v3/leads/')) {
      const id = decodeURIComponent(url.pathname.slice('/v3/leads/'.length))
      edge.calls.push({ api: 'yelp', authorization: request.headers.get('authorization'), id })
      return edge.yelp.has(id) ? Response.json(edge.yelp.get(id)) : Response.json({ error: { code: 'NOT_FOUND' } }, { status: 404 })
    }
    if (url.href === 'https://oauth2.googleapis.com/token') {
      const form = Object.fromEntries(new URLSearchParams(await request.text()))
      edge.calls.push({ api: 'google-token', form })
      return form.grant_type === 'refresh_token' && form.refresh_token ? Response.json({ access_token: 'synthetic-glove-access-1', expires_in: 3599, token_type: 'Bearer', scope: 'https://www.googleapis.com/auth/adwords' }) : Response.json({ error: 'invalid_grant' }, { status: 400 })
    }
    const ads = /^\/v\d+\/customers\/(\d{10})\/googleAds:search$/.exec(url.pathname)
    if (url.origin === 'https://googleads.googleapis.com' && ads) {
      const body = await request.json()
      edge.calls.push({ api: 'google-ads', customerId: ads[1], authorization: request.headers.get('authorization'), developerToken: request.headers.get('developer-token'), query: body.query, pageToken: body.pageToken ?? null })
      if (edge.googlePages.size) {
        const page = edge.googlePages.get(body.pageToken ?? '')
        return page instanceof Response ? page : Response.json(page ?? { results: [] })
      }
      return Response.json({ results: edge.google, fieldMask: 'localServicesLead.id,localServicesLead.categoryId,localServicesLead.contactDetails,localServicesLead.leadType,localServicesLead.leadStatus,localServicesLead.creationDateTime,localServicesLead.leadCharged' })
    }
    return null
  }
  return edge
}

const minutesAgo = n => new Date(Date.now() - n * 60_000)
const iso = n => minutesAgo(n).toISOString()

// Reserve payload follows the official REST Booking, Slot and UserInformation
// definitions linked in docs/lead-sources.md. Synthetic record, not a live receipt.
export const recorded = {
  reserveGoogle: (booking_id = 'synthetic-glove-20') => ({ booking_id, status: 'CONFIRMED', slot: { merchant_id: 'synthetic-glove-21', service_id: 'synthetic-glove-22', start_sec: String(Math.floor(Date.now() / 1000) + 86400), duration_sec: '3600' }, user_information: { user_id: 'synthetic-glove-23', given_name: 'Mei', family_name: 'Lin', telephone: '+1 312-555-0100', email: 'Accounts@Harbourview.example' } }),
  thumbtack: (negotiationID = '511234567890123456', ago = 4) => ({ event: { webhookID: 'synthetic-glove-webhook-1', eventType: 'NegotiationCreatedV4', description: 'Water heater leaking from the bottom, 50 gallon gas.' }, data: { negotiationID, createTimestamp: iso(ago), customer: { customerID: '400000001', firstName: 'Dana', lastName: 'Reyes', phone: '+1 312-555-0142' }, request: { requestID: '600000001', customerID: '400000001', category: { categoryID: '122', name: 'Water Heater Repair' }, description: 'Water heater leaking from the bottom, 50 gallon gas.', location: { address1: '2300 N Lincoln Park W', address2: 'Unit 4', city: 'Chicago', state: 'IL', zipCode: '60614' } }, business: { businessID: '286845156044809661', phoneNumber: '+13125550100' }, leadPrice: '35.50' } }),
  angi: () => ({ leadOid: '700123456', srOid: '330012345', createDate: iso(3), firstName: 'Mei', lastName: 'Lin', address: '14 Harbour St', city: 'Balmain', stateProvince: 'NSW', postalCode: '2041', primaryPhone: '', secondaryPhone: '', email: 'Accounts@Harbourview.example', taskName: 'Repair a Central A/C', comments: 'Second unit is not cooling.' }),
  yelpNotice: leadId => ({ time: iso(2), object: 'business', data: { id: 'synthetic-glove-yelp-business', updates: [{ event_type: 'NEW_EVENT', lead_id: leadId, interaction_time: iso(2) }] } }),
  yelpLead: leadId => ({ id: leadId, business_id: 'synthetic-glove-yelp-business', conversation_id: 'synthetic-glove-yelp-conversation-1', time_created: iso(2), last_event_time: iso(2), temporary_email_address: 'synthetic-glove-relay-1@example.test', temporary_email_address_expiry: new Date(Date.now() + 7 * 86_400_000).toISOString(), user: { display_name: 'Sam T.' }, project: { survey_answers: [{ question_text: 'What kind of water heater?', answer_text: ['Tankless'] }], location: { postal_code: '60657' }, additional_info: 'The pilot keeps going out.', job_names: ['Water Heater Installation/Repair'] } }),
  google: (id = '887766', ago = 6) => ({ localServicesLead: { resourceName: `customers/1234567890/localServicesLeads/${id}`, id, categoryId: 'xcat:service_area_business_plumber', serviceId: 'water_heater_repair', contactDetails: { phoneNumber: '+13125550199', email: 'pat.kim@example.test', consumerName: 'Pat Kim' }, leadType: 'MESSAGE', leadStatus: 'NEW', creationDateTime: minutesAgo(ago).toISOString().slice(0, 19).replace('T', ' '), locale: 'en_US', leadCharged: true } }),
}
