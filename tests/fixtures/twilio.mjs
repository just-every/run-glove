import { createHash, createHmac } from 'node:crypto'

const syntheticHex = value => createHash('sha256').update(`synthetic-glove-${value}`).digest('hex').slice(0, 32)
const syntheticReference = (prefix, value) => prefix + syntheticHex(value)

// Replaces only Twilio's network edge. Product state and authority remain real.
export function twilioSignature(url, fields, token) {
  const form = fields instanceof URLSearchParams ? fields : new URLSearchParams(fields)
  const names = [...new Set(form.keys())].sort()
  const value = url + names.map(name => name + form.get(name)).join('')
  return createHmac('sha1', token).update(value).digest('base64')
}

export function twilioCallback(url, fields, token) {
  const form = new URLSearchParams(fields)
  return new Request(url, { method: 'POST', headers: { 'content-type': ['application', 'x-www-form-urlencoded'].join('/'), 'x-twilio-signature': twilioSignature(url, form, token) }, body: form })
}

export function twilioEdge({ accountSid = syntheticReference('AC', 'account'), authToken = syntheticHex('auth-token'), fromNumber = '+13125550100' } = {}) {
  const calls = [], messages = new Map()
  let status = 201, unavailable = false, beforeRespond = null
  return {
    calls, messages, accountSid, authToken, fromNumber,
    set beforeRespond(value) { beforeRespond = value },
    set status(value) { status = value },
    set unavailable(value) { unavailable = value },
    async answer(request) {
      const url = new URL(request.url)
      if (url.origin !== 'https://api.twilio.com') return null
      if (request.method !== 'POST' || url.pathname !== `/2010-04-01/Accounts/${accountSid}/Messages.json`) return Response.json({ code: 20404 }, { status: 404 })
      if (request.headers.get('authorization') !== `Basic ${btoa(`${accountSid}:${authToken}`)}`) return Response.json({ code: 20003 }, { status: 401 })
      const form = new URLSearchParams(await request.text()), body = Object.fromEntries(form)
      calls.push({ path: url.pathname, method: request.method, body })
      if (unavailable) throw new TypeError('Synthetic Twilio network unavailable')
      if (status !== 201) return Response.json({ code: status === 429 ? 20429 : 21610 }, { status })
      if (body.From !== fromNumber || !/^\+[1-9]\d{7,14}$/.test(body.To) || !body.Body || !body.StatusCallback) return Response.json({ code: 21604 }, { status: 400 })
      const sid = syntheticReference('SM', `outgoing-${messages.size + 1}`)
      const message = { sid, account_sid: accountSid, from: body.From, to: body.To, body: body.Body, status: 'queued', callback: body.StatusCallback }
      messages.set(sid, message)
      if (beforeRespond) await beforeRespond()
      return Response.json(message, { status: 201 })
    },
    voice(origin, value, extra = {}) {
      return twilioCallback(new URL('/api/glove/voice/inbound', origin).href, { AccountSid: accountSid, CallSid: syntheticReference('CA', `voice-${value}`), CallStatus: 'ringing', From: '+13125550123', To: fromNumber, ...extra }, authToken)
    },
    dial(url, sid, status = 'no-answer', duration = '0', extra = {}) {
      return twilioCallback(url, { AccountSid: accountSid, CallSid: sid, DialCallSid: syntheticReference('CA', `leg-${url}-${sid}`), DialCallStatus: status, DialCallDuration: duration, From: '+13125550123', To: fromNumber, ...extra }, authToken)
    },
    delivery(sid, deliveryStatus = 'delivered', extra = {}) {
      const message = messages.get(sid)
      if (!message) throw new Error('Choose a fixture message')
      return twilioCallback(message.callback, { AccountSid: accountSid, MessageSid: sid, MessageStatus: deliveryStatus, From: message.from, To: message.to, ...extra }, authToken)
    },
    inbound(origin, from, body, extra = {}) {
      const sid = syntheticReference('SM', `incoming-${calls.length + messages.size}`)
      calls.push({ inbound: true, sid })
      return twilioCallback(new URL('/api/glove/sms/inbound', origin).href, { AccountSid: accountSid, MessageSid: sid, From: from, To: fromNumber, Body: body, ...extra }, authToken)
    },
  }
}
