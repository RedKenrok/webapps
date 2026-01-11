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

const handleInput = (
  event,
  state,
) => {
  const profile = getActiveProfile(state)
  profile.comprehensionInput = event.target.value
}

const handleAnswer = (
  _event,
  state,
) => {
  const profile = getActiveProfile(state)
  if (
    !profile.comprehensionPending
    && profile.comprehensionInput
    && profile.comprehensionInput.trim().length > 0
  ) {
    profile.comprehensionError = false
    profile.comprehensionPending = true
    profile.comprehensionMessages.push({
      role: 'user',
      content: profile.comprehensionInput.trim(),
    })
    profile.comprehensionInput = ''
    createMessage(
      state,
      profile.comprehensionMessages,
      t(state, 'prompt-context'),
      t(state, 'prompt-comprehension-follow_up'),
    ).then(([error, _response, result]) => {
      profile.comprehensionPending = false
      if (error) {
        profile.comprehensionError = error.toString()
        const message = profile.comprehensionMessages.pop()
        profile.comprehensionInput = message.content
        return
      }
      profile.comprehensionMessages.push(result)
      state.statisticComprehensionActivity++
      onActivity(state)
    })
  }
}

const handleGenerate = (
  _event,
  state,
) => {
  const profile = getActiveProfile(state)
  if (!profile.comprehensionPending) {
    profile.comprehensionError = false
    profile.comprehensionMessages = []
    profile.comprehensionPending = true
    createMessage(
      state,
      [],
      t(state, 'prompt-context'),
      t(state, 'prompt-comprehension') + (
        randomBool(10)
          ? t(state, 'prompt-topic')
            .replace('{%topic%}', randomItem(
              profile.topicsOfInterest.filter(topic => topic)
            ))
          : ''
      ),
    ).then(([error, _response, result]) => {
      profile.comprehensionPending = false
      if (error) {
        profile.comprehensionError = error.toString()
        return
      }
      profile.comprehensionMessages.push(result)
    })
  }
}

const handleReset = (
  _event,
  state,
) => {
  const profile = getActiveProfile(state)
  profile.comprehensionError = false
  profile.comprehensionInput = ''
  profile.comprehensionMessages = []
  profile.comprehensionPending = false
}

const handleBack = (
  _event,
  state,
) => {
  setScreen(state, SCREENS.overview)
}

export const comprehension = (
  state,
) => {
  const profile = getActiveProfile(state)
  return [
    n('p', [
      n('b', t(state, 'greeting')),
      n('br'),
      t(state, 'comprehension-intro'),
    ]),

    ...c(
      profile.comprehensionMessages
      && profile.comprehensionMessages.length > 0,
      n('div', {
        class: 'messages',
      }, profile.comprehensionMessages.map(
        (message) => n('p', {
          class: 'message-' + message?.role,
        }, message?.content?.split('\n')
          ?.flatMap(
            (content, index, results) =>
              index === results.length - 1
                ? [content]
                : [content, n('br')]
          ),
        ),
      )),
    ),

    ...c(
      profile.comprehensionError,
      n('p', profile.comprehensionError),
    ),

    ...c(
      profile.comprehensionPending,
      n('p', {
        class: 'pending',
      }),
      c(
        profile.comprehensionMessages
        && profile.comprehensionMessages.length > 0
        && profile.comprehensionMessages.length < 3,
        n('textarea', {
          class: 'message-user',
          id: 'input-question',
          keyup: handleInput,
        }, profile.comprehensionInput),
      ),
    ),

    n('div', {
      class: 'row reverse',
    }, [
      ...c(
        profile.comprehensionMessages
        && profile.comprehensionMessages.length > 0
        && profile.comprehensionMessages.length < 3,
        n('button', {
          disabled: (
            profile.comprehensionPending
            || !profile.comprehensionInput
            || profile.comprehensionInput.trim().length === 0
          ),
          type: 'button',
          click: handleAnswer,
        }, t(state, 'button-answer')),
        n('button', {
          disabled: profile.comprehensionPending,
          type: 'button',
          click: handleGenerate,
        }, t(state, 'button-generate')),
      ),

      ...c(
        profile.comprehensionPending
        || (
          profile.comprehensionMessages
          && profile.comprehensionMessages.length > 0
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
