import { createMailSender } from './modules/mail/index.mjs'
import { createD1DevelopmentOutbox } from './modules/mail/src/development/index.mjs'
import { demoEffect } from './modules/demo/index.mjs'

function configuredMail(env) {
 return env.MAIL_PROVIDER === 'development'
  ? env.AUTH_LOCAL === 'true' ? createMailSender({ provider: 'development', mode: 'development' }, { outbox: createD1DevelopmentOutbox({ db: env.DB }) }) : undefined
  : env.MAIL_PROVIDER ? createMailSender({ provider: env.MAIL_PROVIDER, mode: 'production', apiKey: env.MAIL_API_KEY, ...(env.MAIL_PROVIDER === 'cloudflare' ? { accountId: env.MAIL_ACCOUNT_ID } : {}) }) : undefined
}

export function operatorMail(env) {
 // Keep ordinary provider validation at construction; a demo needs no credentials.
 if (env.RER_DEMO !== '1') return configuredMail(env)
 if (!env.MAIL_PROVIDER) return undefined
 return { send: message => demoEffect(() => configuredMail(env)?.send(message),
  () => ({ provider: env.MAIL_PROVIDER, status: env.MAIL_PROVIDER === 'development' ? 'development' : 'accepted', providerMessageId: null })) }
}
