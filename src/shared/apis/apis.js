import {
  apiSettings as apiSettingsAnthropic,
  createMessage as createMessageAnthropic,
  getModels as getModelsAnthropic,
} from './anthropic.js'
import {
  apiSettings as apiSettingsDeepseek,
  createMessage as createMessageDeepseek,
  getModels as getModelsDeepseek,
} from './deepseek.js'
import {
  apiSettings as apiSettingsGoogle,
  createMessage as createMessageGoogle,
  getModels as getModelsGoogle,
} from './google.js'
import {
  apiSettings as apiSettingsOpenAI,
  createMessage as createMessageOpenAI,
  getModels as getModelsOpenAI,
} from './open-ai.js'
import {
  apiSettings as apiSettingsOpenRouter,
  createMessage as createMessageOpenRouter,
  getModels as getModelsOpenRouter,
} from './open-router.js'

export const APIS = Object.freeze({
  [apiSettingsAnthropic.code]: apiSettingsAnthropic,
  [apiSettingsDeepseek.code]: apiSettingsDeepseek,
  [apiSettingsGoogle.code]: apiSettingsGoogle,
  [apiSettingsOpenAI.code]: apiSettingsOpenAI,
  [apiSettingsOpenRouter.code]: apiSettingsOpenRouter,
})

const callApi = (
  lookupTable,
  state,
  ...parameters
) => {
  let method = null
  if (state.apiProvider) {
    method = lookupTable[state.apiProvider]
  }
  if (method) {
    return method(state, ...parameters)
  }
  return Promise.resolve(
    [new Error('No api selected, or function not supported.'), null, null],
  )
}

export const createMessage = (
  state,
  messages,
  context = null,
  instructions = null,
) => callApi({
  [apiSettingsAnthropic.code]: createMessageAnthropic,
  [apiSettingsDeepseek.code]: createMessageDeepseek,
  [apiSettingsGoogle.code]: createMessageGoogle,
  [apiSettingsOpenAI.code]: createMessageOpenAI,
  [apiSettingsOpenRouter.code]: createMessageOpenRouter,
}, state, messages, context, instructions)

export const getModels = (
  state,
) => callApi({
  [apiSettingsAnthropic.code]: getModelsAnthropic,
  [apiSettingsDeepseek.code]: getModelsDeepseek,
  [apiSettingsGoogle.code]: getModelsGoogle,
  [apiSettingsOpenAI.code]: getModelsOpenAI,
  [apiSettingsOpenRouter.code]: getModelsOpenRouter,
}, state)

export const isReady = (
  state,
) => {
  return (
    state.apiProvider
    && APIS[state.apiProvider]
    && (
      !APIS[state.apiProvider]?.requireCredentials
      || state.apiCredentialsTested
    )
    && (state.apiModel ?? APIS[state.apiProvider].preferredModel)
    && state.apiModels?.data?.some(
      (model) => model.id === (state.apiModel ?? APIS[state.apiProvider].preferredModel)
    )
  )
}
