import { execFileSync } from 'node:child_process'

/** Stop only the runtime PID we launched and its recorded descendants. */
export async function stopOwnedRuntime(runtime) {
  const announced = Number(runtime.output().match(/background \(PID (\d+)\)/)?.[1])
  const root = announced || runtime.proc.pid
  const rows = execFileSync('ps', ['-axo', 'pid=,ppid='], { encoding: 'utf8' }).trim().split('\n').map(l => l.trim().split(/\s+/).map(Number))
  const owned = new Set([root])
  for (let changed = true; changed;) { changed = false; for (const [pid, parent] of rows) if (owned.has(parent) && !owned.has(pid)) { owned.add(pid); changed = true } }
  for (const pid of [...owned].reverse()) { try { process.kill(pid, 'SIGTERM') } catch (e) { if (e.code !== 'ESRCH') throw e } }
  // A background launcher may already have exited. Wait for the actual owned
  // runtime, giving its finally blocks time to release the operation lease.
  const deadline = Date.now() + 5000
  while (Date.now() < deadline) {
    let state = ''
    try { state = execFileSync('ps', ['-o', 'stat=', '-p', String(root)], { encoding: 'utf8' }).trim() } catch { break }
    if (!state || state.startsWith('Z')) break
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  for (const pid of owned) { try { process.kill(pid, 0); process.kill(pid, 'SIGKILL') } catch (e) { if (e.code !== 'ESRCH') throw e } }
}

