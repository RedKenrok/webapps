import {
  conditional as c,
  node as n,
} from '@doars/staark'

import { createMessage } from '../../shared/apis/apis.js'

import { getActiveProfile } from '../data/profile.js'
import { SCREENS } from '../data/screens.js'
import { translate as t } from '../data/translations.js'

import {
  randomBool,
  randomItem,
} from '../../shared/utilities/random.js'
import { setScreen } from '../utilities/screen.js'
import { onActivity } from '../utilities/streak.js'

const handleReply = (
  _event,
  state,
) => {
  const profile = getActiveProfile(state)
  if (
    !profile.conversationPending
    && profile.conversationInput
    && profile.conversationInput.trim().length > 0
  ) {
    profile.conversationError = false
    profile.conversationPending = true
    profile.conversationMessages.push({
      role: 'user',
      content: profile.conversationInput.trim(),
    })
    profile.conversationInput = ''
    createMessage(
      state,
      profile.conversationMessages,
      t(state, 'prompt-context'),
      t(state, 'prompt-conversation-follow_up'),
    ).then(([error, _response, result]) => {
      profile.conversationPending = false
      if (error) {
        profile.conversationError = error.toString()
        const message = profile.conversationMessages.pop()
        profile.conversationInput = message.content
        return
      }
      if (result.content.trim().endsWith('STOP')) {
        profile.conversationStopped = true
      }
      profile.conversationMessages.push(result)
      state.statisticConversationActivity++
      onActivity(state)
    })
  }
}

const handleGenerate = (
  _event,
  state,
) => {
  const profile = getActiveProfile(state)
  if (!profile.conversationPending) {
    profile.conversationError = false
    profile.conversationMessages = []
    profile.conversationPending = true
    createMessage(
      state,
      [],
      t(state, 'prompt-context'),
      t(state, 'prompt-conversation') + (
        randomBool(10)
          ? t(state, 'prompt-topic')
            .replace('{%topic%}', randomItem(
              profile.topicsOfInterest.filter(topic => topic)
            ))
          : ''
      ),
    ).then(([error, _response, result]) => {
      profile.conversationPending = false
      if (error) {
        profile.conversationError = error.toString()
        return
      }
      profile.conversationMessages.push(result)
    })
  }
}

const handleReset = (
  _event,
  state,
) => {
  const profile = getActiveProfile(state)
  profile.conversationError = false
  profile.conversationMessages = []
  profile.conversationPending = false
  profile.conversationStopped = false
  // TODO: Should reset the network requests properly.
}

const handleBack = (
  _event,
  state,
) => {
  setScreen(state, SCREENS.overview)
}

const handleInput = (
  event,
  state
) => {
  const profile = getActiveProfile(state)
  profile.conversationInput = event.target.value
}

export const conversation = (
  state,
) => {
  const profile = getActiveProfile(state)
  return [
    n('p', [
      n('b', t(state, 'greeting')),
      n('br'),
      t(state, 'conversation-intro'),
    ]),

    ...c(
      profile.conversationMessages
      && profile.conversationMessages.length > 0,
      n('div', {
        class: 'messages',
      }, profile.conversationMessages.map(
        (message) => n('p', {
          class: 'message-' + message?.role
        }, message?.content?.split('\n')?.flatMap(
          (content, index, results) =>
            index === results.length - 1 ? [content] : [content, n('br')]
        )),
      )),
    ),

    ...c(
      profile.conversationError,
      n('p', profile.conversationError),
    ),

    ...c(
      profile.conversationPending,
      n('p', {
        class: 'pending',
      }),
      c(
        profile.conversationMessages
        && profile.conversationMessages.length > 0,
        n('textarea', {
          class: 'message-user',
          id: 'input-question',
          keyup: handleInput,
        }, profile.conversationInput),
      ),
    ),

    n('div', {
      class: 'row reverse',
    }, [
      ...c(
        profile.conversationMessages
        && profile.conversationMessages.length > 0
        && !profile.conversationStopped,
        n('button', {
          disabled: (
            profile.conversationPending
            || !profile.conversationInput
            || profile.conversationInput.trim().length === 0
          ),
          type: 'button',
          click: handleReply,
        }, t(state, 'button-reply')),
        n('button', {
          disabled: profile.conversationPending,
          type: 'button',
          click: handleGenerate,
        }, t(state, 'button-generate')),
      ),

      ...c(
        profile.conversationPending
        || (
          profile.conversationMessages
          && profile.conversationMessages.length > 0
        ),
        n('button', {
          click: handleReset,
          type: 'button',
        }, t(state, 'button-reset')),
      ),

      n('button', {
        click: handleBack,
        type: 'button',
      }, t(state, 'button-go_back')),
    ]),
  ]
}
