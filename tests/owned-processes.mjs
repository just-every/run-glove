// The harness starts rer in the foreground in its own process group. Let rer
// close its owned servers and leases; never discover or signal a PID tree.
export async function stopOwnedRuntime({ proc, done }) {
  if (proc.exitCode !== null || proc.signalCode !== null) return
  proc.kill('SIGTERM')
  let timer
  try {
    await Promise.race([
      done,
      new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('Owned runtime did not stop within ten seconds.')), 10000) }),
    ])
  } finally { clearTimeout(timer) }
}
