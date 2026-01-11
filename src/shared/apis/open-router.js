import { create } from '@doars/vroagn'
import { cloneRecursive } from '../utilities/clone.js'
import { callOnce } from '../utilities/singleton.js'

export const apiSettings = Object.freeze({
  code: 'open_router',
  name: 'Open Router',
  preferredModel: 'deepseek/deepseek-chat:free',
  requireCredentials: true,
})

const _createMessage = callOnce(
  () => create({
    method: 'post',
    domain: 'https://openrouter.ai',
    path: '/api/v1/responses',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
  }),
)
export const createMessage = (
  state,
  messages,
  context = null,
  instructions = null,
) => {
  messages = messages.map(message => {
    message = cloneRecursive(message)
    message.type = 'message'
    return message
  })

  return _createMessage()({
    headers: {
      Authorization: 'Bearer ' + state.apiCredentials,
    },
    body: {
      input: messages,
      instructions: context + "\n" + instructions,
      model: state.apiModel ?? apiSettings.preferredModel,
      prompt_cache_key: state.userIdentifier,
      safety_identifier: state.userIdentifier,
      temperature: state.apiModelTemperature * 2,
    },
  }).then(([error, response, result]) => {
    if (!error) {
      result = {
        role: 'assistant',
        content: result?.output?.[0]?.content?.map(entry => entry.text).join("\n"),
      }
    }
    return [error, response, result]
  })
}

const _getModels = callOnce(
  () => create({
    domain: 'https://openrouter.ai',
    path: '/api/v1/models',
    headers: {
      'Accept': 'application/json',
    },
  }),
)
export const getModels = (
  state,
) => _getModels()({
  headers: {
    Authorization: 'Bearer ' + state.apiCredentials,
  },
})
