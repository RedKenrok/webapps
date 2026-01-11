import { create } from '@doars/vroagn'
import { cloneRecursive } from '../utilities/clone.js'
import { callOnce } from '../utilities/singleton.js'

export const apiSettings = Object.freeze({
  code: 'open_ai',
  name: 'OpenAI',
  preferredModel: 'gpt-5-mini',
  requireCredentials: true,
  modelOptionsFilter: model =>
    ![
      '-audio',
      '-codex',
      '-embedding',
      '-image',
      '-moderation',
      '-search',
      '-transcribe',
      '-tts',
      'babbage-',
      'dall-e-',
      'davinci-',
      'sora-',
      'tts-',
      'whisper-',
    ].some(keyword => model.id.toLowerCase().includes(keyword))
    && !model.id.match(/-(?:\d){4}$/)
    && !model.id.match(/-(?:\d){4}-(?:\d){2}-(?:\d){2}$/)
})

const _createMessage = callOnce(
  () => create({
    method: 'post',
    domain: 'https://api.openai.com',
    path: '/v1/responses',
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
    domain: 'https://api.openai.com',
    path: '/v1/models',
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
