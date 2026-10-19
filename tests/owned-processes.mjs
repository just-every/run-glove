import { execFileSync } from 'node:child_process'

/** Stop only the runtime PID we launched and its recorded descendants. */
export async function stopOwnedRuntime(runtime) {
  const announced = Number(runtime.output().match(/background \(PID (\d+)\)/)?.[1])
  const root = announced || runtime.proc.pid
  const rows = execFileSync('ps', ['-axo', 'pid=,ppid='], { encoding: 'utf8' }).trim().split('\n').map(l => l.trim().split(/\s+/).map(Number))
  const owned = new Set([root])
  for (let changed = true; changed;) { changed = false; for (const [pid, parent] of rows) if (owned.has(parent) && !owned.has(pid)) { owned.add(pid); changed = true } }
  for (const pid of [...owned].reverse()) { try { process.kill(pid, 'SIGTERM') } catch (e) { if (e.code !== 'ESRCH') throw e } }
  await Promise.race([runtime.done, new Promise(resolve => setTimeout(resolve, 5000))])
  for (const pid of owned) { try { process.kill(pid, 0); process.kill(pid, 'SIGKILL') } catch (e) { if (e.code !== 'ESRCH') throw e } }
}

