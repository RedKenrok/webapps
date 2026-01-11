import { create } from '@doars/vroagn'
import { cloneRecursive } from '../utilities/clone.js'
import { callOnce } from '../utilities/singleton.js'

export const apiSettings = Object.freeze({
  code: 'google',
  name: 'Google AI',
  preferredModel: 'gemini-3-flash-preview',
  preferredModelName: 'Gemini 3 Pro Preview',
  requireCredentials: true,
  modelOptionsFilter: model =>
    ![
      'aqa',
      'audio',
      'banana',
      'bison',
      'embedding',
      'image',
      'learnlm',
      'tts',
      'veo',
      'vision',
      '1.0',
      '1.5',
    ].some(keyword => model.id.toLowerCase().includes(keyword))
    && !model.id.match(/-(?:\d){3,4}$/)
    && !model.id.match(/-(?:\d){2}-(?:\d){2}$/)
})

const getModelData = (
  state,
) => {
  if (state.apiModels?.data?.length > 0) {
    return state.apiModels.data.find(modelData => modelData.id === state.apiModel)
  }
  return null
}

const _createMessage = callOnce(
  () => create({
    domain: 'https://generativelanguage.googleapis.com',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    method: 'post',
  }),
)
export const createMessage = (
  state,
  messages,
  context = null,
  instructions = null,
) => {
  messages = cloneRecursive(messages)

  const modelData = getModelData(state)

  return _createMessage()({
    path: '/v1beta/models/' + (state.apiModel ?? apiSettings.preferredModel) + ':generateContent?key=' + state.apiCredentials,
    body: {
      contents: (
        messages.length > 0
          ? messages.map(message => ({
            parts: [{
              text: message.content,
            }],
            role: (
              message.role === 'assistant'
                ? 'model'
                : 'user'
            ),
          }))
          : { parts: { text: '' } }
      ),
      system_instruction: (
        (context || instructions)
          ? {
            parts: [context, instructions]
              .filter(text => text)
              .map(text => ({
                text: text,
              })),
          } : undefined
      ),
      generationConfig: {
        temperature: state.apiModelTemperature * modelData.maxTemperature,
      },
    },
  }).then(([error, response, result]) => {
    if (!error) {
      result = {
        content: (
          result?.candidates?.[0]?.content?.parts
            ?.map(part => part.text).join(' ')
        ),
        role: 'assistant',
      }
    }
    return [error, response, result]
  })
}

const _getModels = callOnce(
  () => create({
    domain: 'https://generativelanguage.googleapis.com',
    headers: {
      'Accept': 'application/json',
    },
  }),
)
export const getModels = (
  state,
) => _getModels()({
  path: '/v1beta/models?pageSize=1000&key=' + state.apiCredentials,
})
  .then(([error, response, result]) => {
    if (!error) {
      result = {
        data: result.models.map(model => ({
          ...model,
          id: model.name.split('/').pop(),
          name: model.displayName,
        })),
      }
    }
    return [error, response, result]
  })
