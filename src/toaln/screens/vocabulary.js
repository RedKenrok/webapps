import {
  conditional as c,
  node as n,
} from '@doars/staark'

import { createMessage } from '../../shared/apis/apis.js'

import { getActiveProfile } from '../data/profile.js'
import { SCREENS } from '../data/screens.js'
import { translate as t } from '../data/translations.js'

import { onActivity } from '../utilities/streak.js'
import { setScreen } from '../utilities/screen.js'

const handleInput = (
  event,
  state,
) => {
  const profile = getActiveProfile(state)
  profile.vocabularyInput = event.target.value
}

const handleAnswer = (
  _event,
  state,
) => {
  const profile = getActiveProfile(state)
  if (
    !profile.vocabularyPending
    && profile.vocabularyInput
    && profile.vocabularyInput.trim().length > 0
  ) {
    profile.vocabularyError = false
    profile.vocabularyPending = true
    profile.vocabularyMessages.push({
      role: 'user',
      content: profile.vocabularyInput.trim(),
    })
    profile.vocabularyInput = ''
    createMessage(
      state,
      profile.vocabularyMessages,
      t(state, 'prompt-context'),
      t(state, 'prompt-vocabulary-follow_up'),
    ).then(([error, _response, result]) => {
      profile.vocabularyPending = false
      if (error) {
        profile.vocabularyError = error.toString()
        const message = profile.vocabularyMessages.pop()
        profile.vocabularyInput = message.content
        return
      }
      profile.vocabularyMessages.push(result)
      state.statisticVocabularyActivity++
      onActivity(state)
    })
  }
}

const handleGenerate = (
  _event,
  state,
) => {
  const profile = getActiveProfile(state)
  if (!profile.vocabularyPending) {
    profile.vocabularyError = false
    profile.vocabularyMessages = []
    profile.vocabularyPending = true
    createMessage(
      state,
      [],
      t(state, 'prompt-context'),
      t(state, 'prompt-vocabulary'),
    ).then(([error, _response, result]) => {
      profile.vocabularyPending = false
      if (error) {
        profile.vocabularyError = error.toString()
        return
      }
      profile.vocabularyMessages.push(result)
    })
  }
}

const handleReset = (
  _event,
  state,
) => {
  const profile = getActiveProfile(state)
  profile.vocabularyError = false
  profile.vocabularyMessages = []
  profile.vocabularyPending = false
  // TODO: Should reset the network requests properly.
}

const handleBack = (
  _event,
  state,
) => {
  setScreen(state, SCREENS.overview)
}

export const vocabulary = (
  state,
) => {
  const profile = getActiveProfile(state)
  return [
    n('p', [
      n('b', t(state, 'greeting')),
      n('br'),
      t(state, 'vocabulary-intro'),
    ]),

    ...c(
      profile.vocabularyMessages
      && profile.vocabularyMessages.length > 0,
      n('div', {
        class: 'messages'
      }, profile.vocabularyMessages.map((message) =>
        n('p', {
          class: 'message-' + message?.role
        }, message?.content?.split('\n')
          ?.flatMap((content, index, results) =>
            index === results.length - 1
              ? [content]
              : [content, n('br')]
          ),
        ),
      )),
    ),

    ...c(
      profile.vocabularyError,
      n('p', profile.vocabularyError),
    ),

    ...c(
      profile.vocabularyPending,
      n('p', {
        class: 'pending',
      }),
      c(
        profile.vocabularyMessages
        && profile.vocabularyMessages.length > 0
        && profile.vocabularyMessages.length < 3,
        n(
          'textarea',
          {
            class: 'message-user',
            id: 'input-question',
            keyup: handleInput,
          },
          profile.vocabularyInput
        )
      )
    ),

    n('div', {
      class: 'row reverse',
    }, [
      ...c(
        profile.vocabularyMessages
        && profile.vocabularyMessages.length > 0
        && profile.vocabularyMessages.length < 3,
        n('button', {
          disabled:
            profile.vocabularyPending
            || !profile.vocabularyInput
            || profile.vocabularyInput.trim().length === 0,
          type: 'button',
          click: handleAnswer,
        }, t(state, 'button-answer')),
        n('button', {
          disabled: profile.vocabularyPending,
          type: 'button',
          click: handleGenerate,
        }, t(state, 'button-generate'))
      ),

      ...c(
        profile.vocabularyPending
        || (
          profile.vocabularyMessages
          && profile.vocabularyMessages.length > 0
        ),
        n('button', {
          click: handleReset,
          type: 'button',
        }, t(state, 'button-reset'))
      ),

      n('button', {
        click: handleBack,
        type: 'button',
      }, t(state, 'button-go_back')),
    ]),
  ]
}
