import {
  translate as t,
} from '../data/translations.js'

export const convertTemperature = (
  state,
) => {
  const suffix = ' (' + (state.apiModelTemperature ?? 0).toString() + ')'
  if (state.apiModelTemperature <= 0) {
    return t(state, 'api_model-temperature_none') + suffix
  } else if (state.apiModelTemperature <= (1 / 3)) {
    return t(state, 'api_model-temperature_low') + suffix
  } else if (state.apiModelTemperature === 0.5) {
    return t(state, 'api_model-temperature_medium') + suffix
  } else if (state.apiModelTemperature <= (2 / 3)) {
    return t(state, 'api_model-temperature_medium') + suffix
  }
  return t(state, 'api_model-temperature_high') + suffix
}
