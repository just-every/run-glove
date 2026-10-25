import { allow } from './access'
import { bump, business, event, expectVersion, fail, find, text } from './model'
import { queueSms } from './sms-channel'
import type { Handler } from './commands/types'

/** Desk replies always begin with a received message and an explicit person action. */
export const smsInbox: Handler = async (c, type, p) => {
  if (!['sms.inboxConfigure', 'sms.reply', 'sms.thread', 'sms.assign'].includes(type)) return undefined
  allow(c.actor, type)
  if (!c.actor.sessionId || c.actor.token || c.actor.custom || !['owner', 'office', 'dispatcher'].includes(c.actor.role)) fail('FORBIDDEN', 'Only a signed-in desk person manages the text inbox.', null, 403)
  if (type === 'sms.inboxConfigure') {
    if (c.actor.role !== 'owner' || c.actor.branch) fail('FORBIDDEN', 'Only the unscoped owner enables inbox text retention.', null, 403)
    const b = business(c.s); expectVersion(b, p.version)
    if (!b.sms) fail('SMS', 'Connect the registered business number first.')
    if (typeof p.enabled !== 'boolean' || p.enabled && p.approved !== true) fail('INPUT', 'Explicitly approve keeping incoming text for the desk inbox.', null, 400)
    event(c, { jobId: null, subjectKind: 'business', subjectId: b.id, kind: 'sms.inboxConfigured', summary: `${c.actor.name} ${p.enabled ? 'enabled' : 'disabled'} retaining incoming customer text for the desk inbox`, data: { enabled: p.enabled } })
    return bump(c.s, 'business', b, { sms: { ...b.sms, inboxEnabled: p.enabled, inboxApprovedBy: c.actor.id, inboxApprovedAt: c.now } })
  }
  const message = find(c.s, 'messages', p.messageId); expectVersion(message, p.version)
  if (message.channel !== 'sms' || message.direction !== 'inbound') fail('INPUT', 'Choose a received customer text.', null, 400)
  const customer = find(c.s, 'customers', message.customerId)
  if (customer.mergedInto || message.ambiguousSender) fail('SMS_CUSTOMER', 'Resolve the sender identity before answering this text.')
  if (type === 'sms.assign') {
    const changes = { assignedTo: p.release === true ? null : { id: c.actor.id, name: c.actor.name }, readAt: c.now }
    event(c, { jobId: message.jobId, subjectKind: 'message', subjectId: message.id, kind: 'sms.assigned', summary: `${c.actor.name} ${p.release === true ? 'released' : 'took'} the incoming text`, data: { messageId: message.id, assignedTo: changes.assignedTo?.id ?? null } })
    return bump(c.s, 'messages', message, changes)
  }
  if (type === 'sms.thread') {
    const job = p.jobId ? find(c.s, 'jobs', p.jobId) : null
    if (job && job.customerId !== customer.id) fail('CUSTOMER', 'Choose a job belonging to this customer.')
    event(c, { jobId: job?.id ?? null, subjectKind: 'message', subjectId: message.id, kind: 'sms.threaded', summary: `${c.actor.name} linked the received text to ${job ? job.number : 'the customer'}`, data: { messageId: message.id, customerId: customer.id, jobId: job?.id ?? null } })
    return bump(c.s, 'messages', message, { jobId: job?.id ?? null, readAt: c.now })
  }
  if (business(c.s).sms?.inboxEnabled !== true) fail('SMS_INBOX', 'The owner must enable the text inbox before a reply is sent.')
  if (message.assignedTo && message.assignedTo.id !== c.actor.id) fail('SMS_ASSIGNED', 'Take this conversation before replying.')
  const body = text(p.text, 'reply', { max: 1200 })
  const reply = queueSms(c, { kind: 'inboxReply', subjectKind: 'customer', subjectId: customer.id, customerId: customer.id, jobId: message.jobId ?? null, to: customer.phone, text: body, label: 'desk reply' })
  reply.body = body; reply.inReplyTo = message.id
  bump(c.s, 'messages', message, { readAt: c.now, answeredAt: c.now })
  return reply
}
