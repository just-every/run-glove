set -e
. /tmp/rer-cloud-toolchain.sh
export PATH="$HOME/.rer/node/node-v22.20.0-linux-x64/bin:$PATH"
export CI=true
export GLOVE_VERIFY_SHARD=browser-1
export SHARD=browser-1
export WRANGLER_SEND_METRICS=false
export PLAYWRIGHT_SKIP_BROWSER_GC=1
export GLOVE_CI_PREBUILT=1
export PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium
export GLOVE_SCREENSHOTS=/tmp/glove-f159-reproduce-screens
export GLOVE_BROWSER_OUTPUT=/tmp/glove-f159-reproduce
cloud_run timeout 1200 node scripts/verify-ci.mjs browser-1
