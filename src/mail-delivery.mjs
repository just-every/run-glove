// COMM-001, COMM-010, COMM-011, COMM-012, COMM-013, COMM-014, COMM-015, COMM-016, COMM-017, COMM-018: Glove's customer email uses Base's one mail module for sending and
// for verified delivery-event intake (src/modules/mail/README.md).
export { createMailSender, createDeliveryEventIntake, createD1EventStore } from './modules/mail/index.mjs'

export { verifyWebhook } from './modules/mail/src/events/verify.mjs'
