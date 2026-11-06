// Exercise the runtime's native finalization lifecycle in this process only.
// No Request replacement, provider mock, source edit or assertion override.
const timer = setInterval(() => global.gc(), 500)
timer.unref()
