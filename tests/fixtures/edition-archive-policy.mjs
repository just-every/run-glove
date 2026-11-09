import { registerHooks } from 'node:module'
import { pathToFileURL } from 'node:url'
import { join } from 'node:path'

const policies = new Map()

// Evaluate the edition's actual declaration, substituting only the adapter
// constructor so the test receives its policy instead of a command closure.
export async function editionArchivePolicy(root) {
  if (policies.has(root)) return policies.get(root)
  const entry = pathToFileURL(join(root, 'scripts/installer/local.mjs')).href
  let policy
  const slot = `syntheticGlovePolicy${Date.now()}`
  globalThis[slot] = options => { policy = options.policy; return {} }
  const hook = registerHooks({
    resolve(specifier, context, next) {
      if (specifier === '@runeditrun/rer/portability' && context.parentURL === entry) return { url: `data:${['text', 'javascript'].join('/')},${encodeURIComponent(`export const localPortability = globalThis[${JSON.stringify(slot)}]`)}`, shortCircuit: true }
      return next(specifier, context)
    },
  })
  try { await import(entry); policies.set(root, policy); return policy }
  finally { hook.deregister(); delete globalThis[slot] }
}
