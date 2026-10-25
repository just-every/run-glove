import { createMailSender } from './modules/mail/index.mjs'
import { isLoopbackHost } from './modules/operator-auth/loopback.mjs'

// Local dev and demos suppress mail silently: one-click sign-in has no email
// step, and a hosted demo's invitations and sign-in links complete as sent.
function localDevelopment(env) {
 if (env.AUTH_LOCAL !== 'true' || typeof env.AUTH_ORIGIN !== 'string') return false
 try { const url = new URL(env.AUTH_ORIGIN); return url.origin === env.AUTH_ORIGIN && isLoopbackHost(url.hostname) } catch { return false }
}

export function operatorMail(env) {
 if (env.RER_DEMO === '1' || localDevelopment(env)) return createMailSender({ provider: 'development', mode: 'development' })
 if (!env.MAIL_PROVIDER || env.MAIL_PROVIDER === 'development') return undefined
 // Base refuses a relay URL for any provider but rer; an Assisted install's
 // empty MAIL_RELAY_URL var counts as absent.
 return createMailSender({ provider: env.MAIL_PROVIDER, mode: 'production', apiKey: env.MAIL_API_KEY, ...(env.MAIL_PROVIDER === 'rer' && env.MAIL_RELAY_URL?.trim() ? { relayUrl: env.MAIL_RELAY_URL } : {}), ...(env.MAIL_PROVIDER === 'cloudflare' ? { accountId: env.MAIL_ACCOUNT_ID } : {}) })
}
