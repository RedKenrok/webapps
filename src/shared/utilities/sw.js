let appState
let messages = []
const handleMessage = (
  state,
  event,
) => {
  switch (event?.data?.type) {
    case 'cacheUpdate':
      state.appUpdateAvailable = true
      break
  }
}

if ('serviceWorker' in navigator) {
  // Register service worker.
  navigator.serviceWorker.register((
    process.env.NODE_ENV === 'production'
      ? './sw.min.js'
      : './sw.js'
  ), {
    scope: './',
  })

  // Start listening to incoming messages.
  navigator.serviceWorker.addEventListener('message', (
    event,
  ) => {
    if (appState) {
      handleMessage(appState, event)
    } else {
      messages.push(event)
    }
  })
}

export const handleUpdates = (
  state,
) => {
  // Handle earlier messages.
  for (const message of messages) {
    handleMessage(state, message)
  }
  // Store state so new messages can be handled directly.
  appState = state
  messages = null
}
