// Consecutive assertions share one public-door journey and retain a named failure.
export async function step(name, action) {
  try {
    await action()
  } catch (error) {
    error.message = `${name}: ${error.message}`
    throw error
  }
}
