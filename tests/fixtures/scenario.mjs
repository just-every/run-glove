// A named step within one behavior, without another test registration.
// Each step owns its cleanup so an independent installation closes before the
// next one starts. Assertion failures retain the step name and original stack.
export async function scenario(t, name, run) {
  const cleanups = []
  t.diagnostic(name)
  try {
    await run({
      after: cleanup => cleanups.push(cleanup),
      diagnostic: message => t.diagnostic(message),
    })
  } finally {
    for (const cleanup of cleanups.reverse()) await cleanup()
  }
}
