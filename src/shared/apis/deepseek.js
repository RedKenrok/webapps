import { create } from '@doars/vroagn'
import { cloneRecursive } from '../utilities/clone.js'
import { callOnce } from '../utilities/singleton.js'

export const apiSettings = Object.freeze({
  code: 'deepseek',
  name: 'DeepSeek',
  preferredModel: 'deepseek-chat',
  // preferredModelName: 'GPT 4o-mini',
  requireCredentials: true,
  // modelOptionsFilter: model =>
  //   ![
  //   ].some(keyword => model.id.toLowerCase().includes(keyword))
  //   && !model.id.match(/-(?:\d){4}$/)
  //   && !model.id.match(/-(?:\d){4}-(?:\d){2}-(?:\d){2}$/)
})

const _createMessage = callOnce(
  () => create({
    method: 'post',
    domain: 'https://api.deepseek.com',
    path: '/v1/chat/completions',
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
  messages = cloneRecursive(messages)

  const prependAppRole = (
    message,
  ) => {
    if (message) {
      if (
        messages.length > 0
        && messages[0].role === 'system'
      ) {
        messages[0].content = message + ' ' + messages[0].content
      } else {
        messages.unshift({
          role: 'system',
          content: message,
        })
      }
    }
  }
  prependAppRole(instructions)
  // Check context afterwards so the instructions come after the context.
  prependAppRole(context)

  return _createMessage()({
    headers: {
      Authorization: 'Bearer ' + state.apiCredentials,
    },
    body: {
      messages: messages,
      model: state.apiModel ?? apiSettings.preferredModel,
      temperature: state.apiModelTemperature * 2,
      user: state.userIdentifier,
    },
  }).then(([error, response, result]) => {
    if (!error) {
      result = result?.choices?.[0]?.message
    }
    return [error, response, result]
  })
}

const _getModels = callOnce(
  () => create({
    domain: 'https://api.deepseek.com',
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
