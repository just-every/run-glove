import { randomInt } from 'node:crypto'

// The pinned rer CLI requires a nonzero port and cannot inherit a listener.
// Ask it to bind a candidate directly; retry only an actual address collision.
// Setup and dev must agree on the saved origin, so retry them together.
export async function devInstallation(setup, start) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const port = randomInt(20000, 60000)
    try {
      await setup(port)
      return await start(port)
    } catch (error) {
      if (attempt === 4 || !/(?:EADDRINUSE|ERR_ADDRESS_IN_USE|address already in use|port[^\n]*(?:already in use|is in use|still unavailable for binding))/i.test(error.message)) throw error
    }
  }
}
