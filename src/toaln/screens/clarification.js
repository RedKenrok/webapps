import {
  conditional as c,
  node as n,
} from '@doars/staark'

import { createMessage } from '../../shared/apis/apis.js'

import { getActiveProfile } from '../data/profile.js'
import { SCREENS } from '../data/screens.js'
import { translate as t } from '../data/translations.js'

import { setScreen } from '../utilities/screen.js'
import { onActivity } from '../utilities/streak.js'

const handleAsk = (
  _event,
  state,
) => {
  const profile = getActiveProfile(state)
  if (
    !profile.clarificationPending
    && profile.clarificationInput
    && profile.clarificationInput.trim().length > 0
  ) {
    profile.clarificationError = false
    profile.clarificationPending = true
    profile.clarificationMessages.push({
      role: 'user',
      content: profile.clarificationInput.trim(),
    })
    profile.clarificationInput = ''
    createMessage(
      state,
      profile.clarificationMessages,
      t(state, 'prompt-context'),
      t(state, 'prompt-clarification'),
    ).then(([error, _response, result]) => {
      profile.clarificationPending = false
      if (error) {
        profile.clarificationError = error.toString()
        const message = profile.clarificationMessages.pop()
        profile.clarificationInput = message.content
        return
      }
      profile.clarificationMessages.push(result)
      state.statisticClarificationActivity++
      onActivity(state)
    })
  }
}

const handleInput = (
  event,
  state
) => {
  const profile = getActiveProfile(state)
  profile.clarificationInput = event.target.value
}

const handleReset = (
  _event,
  state,
) => {
  const profile = getActiveProfile(state)
  profile.clarificationError = false
  profile.clarificationMessages = []
  profile.clarificationPending = false
  // TODO: Should reset the network requests properly.
}

const handleBack = (
  _event,
  state,
) => {
  setScreen(state, SCREENS.overview)
}

export const clarification = (
  state,
) => {
  const profile = getActiveProfile(state)
  return [
    n('p', [
      n('b', t(state, 'greeting')),
      n('br'),
      n('label', {
        for: 'input-question',
      }, t(state, 'clarification-intro')),
    ]),

    ...c(
      profile.clarificationMessages
      && profile.clarificationMessages.length > 0,
      n('div', {
        class: 'messages',
      }, profile.clarificationMessages.map(
        (message) => n('p', {
          class: 'message-' + message?.role
        }, message?.content?.split('\n')?.flatMap(
          (content, index, results) =>
            index === results.length - 1 ? [content] : [content, n('br')]
        )),
      )),
    ),

    ...c(
      profile.clarificationError,
      n('p', profile.clarificationError),
    ),

    ...c(
      profile.clarificationPending,
      n('p', {
        class: 'pending',
      }),
      n('textarea', {
        class: 'message-user',
        id: 'input-question',
        placeholder: t(state, 'clarification-placeholder'),
        keyup: handleInput,
      }, profile.clarificationInput),
    ),

    n('div', {
      class: 'row reverse',
    }, [
      n('button', {
        disabled: (
          profile.clarificationPending
          || !profile.clarificationInput
          || profile.clarificationInput.trim().length === 0
        ),
        type: 'button',
        click: handleAsk,
      }, t(state, 'button-ask')),

      ...c(
        profile.clarificationPending
        || (
          profile.clarificationMessages
          && profile.clarificationMessages.length > 0
        ),
        n('button', {
          type: 'button',
          click: handleReset,
        }, t(state, 'button-reset')),
      ),

      n('button', {
        type: 'button',
        click: handleBack,
      }, t(state, 'button-go_back')),
    ])
  ]
}
