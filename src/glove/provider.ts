import { providerEvent } from './timeline'
import { fail, type Row, type Context } from './model'

// The owner's model provider (FIELD-006, FIELD-011, AGENT-*): an OpenAI-compatible chat
// completions endpoint (OpenAI, OpenRouter, Cloudflare AI Gateway) at an https
// address, one model id, and the owner's key, kept in glove_provider_keys like
// the marketing keys (never in records, exports, logs or the archive). Glove
// asks for JSON in a strict schema with store off; an answer that does not
// parse is refused, never repaired or retried, and a failure keeps the HTTP
// status only.

/** An https base address without credentials, query or fragment, kept with its path. */
export function modelBase(v: unknown): string {
  try {
    const u = new URL(String(v))
    if (u.protocol === 'https:' && !u.username && !u.password && !u.search && !u.hash) return u.origin + u.pathname.replace(/\/+$/, '')
  } catch { /* refused below */ }
  return fail('INPUT', 'url is the provider\'s https API address, such as https://api.openai.com/v1.', { field: 'url' }, 400)
}

export async function askModel(c: Context, db: D1Database, b: Row, feature: string, messages: unknown[], schema: Record<string, unknown>, beforeSend?: () => Promise<void>): Promise<{ answer: any; model: string }> {
  const settings = b.model
  const key = settings && (await db.prepare("SELECT value FROM glove_provider_keys WHERE provider='model'").first<{ value: string }>())?.value
  if (!settings || !key) fail('MODEL', 'The owner connects a model provider first.')
  await beforeSend?.()
  let res: Response
  try {
    res = await fetch(`${settings.url}/chat/completions`, { method: 'POST', redirect: beforeSend ? 'manual' : 'follow', headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' }, body: JSON.stringify({ model: settings.model, messages, store: false, response_format: { type: 'json_schema', json_schema: { name: feature, strict: true, schema } } }) })
  } catch {
    await providerEvent(db, { id: `${c.commandId}:model:${feature}`, at: c.now, commandId: c.commandId, provider: 'Model provider', subjectKind: 'business', subjectId: b.id, kind: 'model.outcome', summary: `${feature}: model provider outcome not confirmed`, data: { feature, model: settings.model, status: 0 } }).run()
    return fail('MODEL', 'The model provider could not be reached.', { status: 0 }, 502)
  }
  await providerEvent(db, { id: `${c.commandId}:model:${feature}`, at: c.now, commandId: c.commandId, provider: 'Model provider', subjectKind: 'business', subjectId: b.id, kind: 'model.outcome', summary: `${feature}: model provider answered HTTP ${res.status}`, data: { feature, model: settings.model, status: res.status } }).run()
  if (!res.ok) fail('MODEL', `The model provider refused the request (HTTP ${res.status}).`, { status: res.status }, 502)
  try {
    const answer = JSON.parse((await res.json() as any)?.choices?.[0]?.message?.content)
    if (!answer || typeof answer !== 'object' || Array.isArray(answer)) throw new Error('not an object')
    return { answer, model: settings.model }
  } catch { return fail('MODEL', 'The model answered outside the requested form.', null, 502) }
}
