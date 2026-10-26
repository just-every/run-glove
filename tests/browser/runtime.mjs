import { spawn } from 'node:child_process'
import { cp, mkdir } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { StringDecoder } from 'node:string_decoder'
import { stopOwnedRuntime } from '../owned-processes.mjs'

export const redact = value => String(value)
  .replace(/^.*(?:RER_OPEN|RER_SIGN_IN|SESSION_SECRET|SETUP_TOKEN|RER_DEV_KEY).*$/gm, '[private runtime entry]')
  .replace(/https?:\/\/[^\s"<>]+/g, '[URL]')
  .replace(/(?:token|rer-dev|password|secret|key)\s*[=:]\s*[^\s"&<>]+/gi, '[private value]')

export async function freshCopy(workspace, root) {
  await mkdir(root, { recursive: true })
  const files = execFileSync('git', ['ls-files', '-z'], { cwd: workspace, maxBuffer: 32 * 1024 * 1024 }).toString().split('\0').filter(Boolean)
  for (const file of files) {
    await mkdir(dirname(join(root, file)), { recursive: true })
    await cp(join(workspace, file), join(root, file), { dereference: false })
  }
  // The native setup may repair pnpm links. Install in this owned tree instead
  // of sharing node_modules with the source checkout.
  await command('corepack', ['pnpm', 'install', '--frozen-lockfile'], root)
}

export function child(command, args, cwd, env = {}, { stream = false } = {}) {
  const environment = { ...globalThis.process.env, CI: 'true', RER_SERVER_JOURNEY: '1', WRANGLER_SEND_METRICS: 'false', ...env }
  // Operation ownership is checkout-specific; never carry the source checkout's
  // live lease into this independently owned fresh installation.
  delete environment.RER_LOCAL_OPERATION
  delete environment.RER_ONBOARDING_PROCESS_OWNER
  const process = spawn(command, args, { cwd, env: environment, stdio: ['ignore', 'pipe', 'pipe'], detached: true })
  let output = ''
  for (const pipe of [process.stdout, process.stderr]) {
    const decoder = new StringDecoder('utf8')
    let pending = ''
    pipe.on('data', chunk => {
      const value = decoder.write(chunk)
      output += value
      if (output.length > 4 * 1024 * 1024) output = output.slice(-4 * 1024 * 1024)
      if (stream) {
        pending += value
        const lines = pending.split('\n')
        pending = lines.pop()
        for (const line of lines) globalThis.process.stdout.write(redact(line) + '\n')
      }
    })
    pipe.on('end', () => {
      const tail = decoder.end()
      output += tail
      if (stream && pending + tail) globalThis.process.stdout.write(redact(pending + tail) + '\n')
    })
  }
  const done = new Promise((resolve, reject) => { process.once('error', () => reject(new Error('Could not start the owned test command.'))); process.once('close', code => resolve(code)) })
  return { process, done, output: () => output }
}

export async function command(executable, args, cwd, env, options) {
  const task = child(executable, args, cwd, env, options)
  const code = await task.done
  if (code !== 0) throw new Error(redact(task.output()).slice(-6000) || `Owned command exited ${code}.`)
  return task.output()
}

export async function startDev(root, port) {
  const executable = join(root, 'node_modules/.bin/rer')
  const runtime = child(executable, ['dev', '--foreground', '--port', String(port)], root)
  const deadline = Date.now() + 10 * 60 * 1000
  try {
    while (Date.now() < deadline) {
      const ready = runtime.output().match(/^RER_READY\s+(\S+)/m)?.[1]
      const entry = runtime.output().match(/^RER_OPEN\s+(\S+)/m)?.[1]
      if (ready && entry) return { ...runtime, origin: new URL(ready).origin, entry }
      if (runtime.process.exitCode !== null) throw new Error(redact(runtime.output()).slice(-6000) || 'Owned dev runtime exited before readiness.')
      await new Promise(resolve => setTimeout(resolve, 200))
    }
    throw new Error('Owned dev runtime did not report readiness within ten minutes.')
  } catch (error) {
    await stopDev(root, runtime)
    throw error
  }
}

export async function stopDev(root, runtime) {
  if (runtime) await stopOwnedRuntime({ ...runtime, proc: runtime.process })
}
