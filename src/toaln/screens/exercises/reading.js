import {
  conditional as c,
  node as n,
} from '@doars/staark'

import { createMessage } from '../../../shared/apis/apis.js'

import { getActiveProfile } from '../../data/profile.js'
import { SCREENS } from '../../data/screens.js'
import { translate as t } from '../../data/translations.js'

import { setScreen } from '../../utilities/screen.js'
import { onActivity } from '../../utilities/streak.js'

const handleInput = (
  event,
  state,
) => {
  const profile = getActiveProfile(state)
  profile.readingInput = event.target.value
}

const handleGenerate = (
  _event,
  state,
) => {
  const profile = getActiveProfile(state)
  if (!profile.readingPending) {
    profile.readingError = false
    profile.readingMessages = []
    profile.readingPending = true

    let instructions = t(state, 'prompt-reading')
    if (
      profile.readingInput &&
      profile.readingInput.trim().length > 0
    ) {
      profile.readingMessages.push({
        role: 'user',
        content: profile.readingInput.trim(),
      })
      instructions += ' ' + t(state, 'prompt-reading-topic')
    }

    createMessage(
      state,
      profile.readingMessages,
      t(state, 'prompt-context'),
      instructions,
    ).then(([error, _response, result]) => {
      profile.readingPending = false
      if (error) {
        profile.readingError = error.toString()
        return
      }
      profile.readingMessages.push(result)
      state.statisticReadingActivity++
      onActivity(state)
    })
  }
}

const handleReset = (
  _event,
  state,
) => {
  const profile = getActiveProfile(state)
  profile.readingError = false
  profile.readingInput = ''
  profile.readingMessages = []
  profile.readingPending = false
  // TODO: Should reset the network requests properly.
}

const handleBack = (
  _event,
  state,
) => {
  setScreen(state, SCREENS.overview)
}

export const reading = (
  state,
) => {
  const profile = getActiveProfile(state)
  return [
    n('p', [
      n('b', t(state, 'greeting')),
      n('br'),
      n('label', {
        for: 'input-topic',
      }, t(state, 'reading-intro')),
    ]),

    n('div', {
      class: 'messages',
    }, [
      ...c(
        profile.readingMessages
        && profile.readingMessages?.length > 0,
        profile.readingMessages?.map(
          (message) => n('p', {
            class: 'message-' + message?.role,
          }, message?.content?.split('\n')
            ?.flatMap(
              (content, index, results) =>
                index === results.length - 1
                  ? [content]
                  : [content, n('br')]
            ),
          )
        ),
        n('textarea', {
          class: 'message-user',
          disabled: profile.readingMessages?.length > 0,
          id: 'input-topic',
          input: handleInput,
          placeholder: t(state, 'reading-placeholder'),
        }, profile.readingInput || ''),
      ),
    ]),

    ...c(
      profile.readingError,
      n('p', profile.readingError),
    ),

    ...c(
      profile.readingPending,
      n('p', {
        class: 'pending',
      }),
    ),

    n('div', {
      class: 'row reverse',
    }, [
      ...c(
        profile.readingPending
        || (
          profile.readingMessages
          && profile.readingMessages?.length === 0
        ),
        n('button', {
          click: handleGenerate,
          disabled: profile.readingPending,
          type: 'button',
        }, t(state, 'button-generate')),
      ),

      ...c(
        profile.readingPending
        || (
          profile.readingMessages
          && profile.readingMessages?.length > 0
        ),
        n('button', {
          type: 'button',
          click: handleReset,
        }, t(state, 'button-reset')),
      ),

      n('button', {
        click: handleBack,
        type: 'button'
      }, t(state, 'button-go_back'))
    ])
  ]
}
