export type MailResult = { provider: string; status: 'accepted' | 'rejected' | 'rate_limited' | 'uncertain' | 'development'; providerMessageId: string | null; code?: string }
export type MailMessage = { deliveryId: string; from: string; to: string[]; subject: string; text: string; replyTo?: string }
export function createMailSender(config: { provider: string; mode: 'production' | 'development' | 'test'; apiKey?: string }): { send(message: MailMessage): Promise<MailResult> }
export type DeliveryEvent = { provider: string; tenantId: string; eventNamespace: string; eventId: string; providerMessageId: string; type: string; status: 'accepted' | 'deferred' | 'delivered' | 'bounced' | 'failed' | 'rejected' | 'complained' | null; occurredAt: number; recipients: string[]; deliveryId: string | null; product: string | null; fingerprint: string }
export type EventStore = { commit(events: DeliveryEvent[]): Promise<unknown> }
export function createD1EventStore(options: { db: D1Database }): EventStore
export function createDeliveryEventIntake(options: { provider: string; tenantId: string; eventNamespace: string; key: string; store: EventStore; authorize(event: DeliveryEvent): Promise<boolean> | boolean }): { ingestWebhook(input: { rawBody: Uint8Array; headers: Headers }): Promise<{ eventId: string; outcome: 'stored' | 'duplicate' }[]> }
