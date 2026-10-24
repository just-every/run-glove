import { DurableObject } from 'cloudflare:workers'

// One transient counter per hashed source address, shared by Worker isolates.
// No storage API is used: eviction or restart discards this abuse allowance.
export class MailRejections extends DurableObject {
  private minute = -1
  private count = 0
  async fetch(request: Request) {
    const { minute } = await request.json() as { minute: number }
    if (!Number.isSafeInteger(minute) || minute < 0) return new Response(null, { status: 429 })
    if (this.minute !== minute) { this.minute = minute; this.count = 0 }
    this.count = Math.min(21, this.count + 1)
    return new Response(null, { status: this.count > 20 ? 429 : 204 })
  }
}
