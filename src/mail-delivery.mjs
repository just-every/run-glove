// COMM-001: Glove's customer email uses Base's one mail module for sending and
// for verified delivery-event intake (src/modules/mail/README.md).
export { createMailSender, createDeliveryEventIntake, createD1EventStore } from './modules/mail/index.mjs'

export { verifyWebhook } from './modules/mail/src/events/verify.mjs'
