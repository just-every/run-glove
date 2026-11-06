// One-off cause isolation in the owned Node process; no Request/test replacement.
console.log('Native GC lifecycle diagnostic active')
const timer = setInterval(() => global.gc(), 50)
timer.unref()
