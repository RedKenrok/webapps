import { isReady } from '../../shared/apis/apis.js'
import { SCREENS } from '../data/screens.js'
import { setScreen } from './screen.js'

export const handleStartup = (
  state,
) => {
  const searchParameters = new URLSearchParams(
    window.location.search,
  )

  // Don't handle specialised startup unless ready.
  if (!isReady(state)) {
    return
  }

  // Switch to the specified screen.
  const screen = searchParameters.get('screen')
  // Don't allow the user to go back to the setup screen.
  if (screen !== SCREENS.setup) {
    setScreen(state, screen)
  }
}
