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

const handleInput = (
  event,
  state,
) => {
  const profile = getActiveProfile(state)
  profile.rewriteInput = event.target.value
}

const handleRewrite = (
  _event,
  state,
) => {
  const profile = getActiveProfile(state)
  if (!profile.rewritePending) {
    profile.rewriteError = false
    profile.rewriteMessages = [{
      role: 'user',
      content: profile.rewriteInput.trim(),
    }]
    profile.rewritePending = true

    createMessage(
      state,
      profile.rewriteMessages,
      t(state, 'prompt-context'),
      t(state, 'prompt-rewrite'),
    ).then(([error, _response, result]) => {
      profile.rewritePending = false
      if (error) {
        profile.rewriteError = error.toString()
        return
      }
      profile.rewriteMessages.push(result)
      state.statisticRewriteActivity++
      onActivity(state)
    })
  }
}

const handleReset = (
  _event,
  state,
) => {
  const profile = getActiveProfile(state)
  profile.rewriteError = false
  profile.rewriteInput = ''
  profile.rewriteMessages = []
  profile.rewritePending = false
  // TODO: Reset network requests if needed.
}

const handleBack = (
  _event,
  state,
) => {
  setScreen(state, SCREENS.overview)
}

export const rewrite = (
  state,
) => {
  const profile = getActiveProfile(state)
  return [
    n('p', [
      n('b', t(state, 'greeting')),
      n('br'),
      n('label', {
        for: 'input-text',
      }, t(state, 'rewrite-intro')),
    ]),

    n('div', {
      class: 'messages',
    }, [
      ...c(
        profile.rewriteMessages
        && profile.rewriteMessages.length > 0,
        profile.rewriteMessages.map((message) =>
          n('p', {
            class: 'message-' + message.role,
          }, message.content.split('\n')
            .flatMap((content, index, results) =>
              index === results.length - 1
                ? [content]
                : [content, n('br')]
            )
          )
        ),
        n('textarea', {
          class: 'message-user',
          disabled:
            profile.rewriteMessages
            && profile.rewriteMessages.length > 0,
          id: 'input-text',
          input: handleInput,
          placeholder: t(state, 'rewrite-placeholder'),
        }, profile.rewriteInput),
      ),
    ]),

    ...c(
      profile.rewriteError,
      n('p', profile.rewriteError),
    ),

    ...c(
      profile.rewritePending,
      n('p', {
        class: 'pending',
      }),
    ),

    n('div', {
      class: 'row reverse',
    }, [
      ...c(
        profile.rewritePending
        || (
          profile.rewriteMessages
          && profile.rewriteMessages.length === 0
        ),
        n('button', {
          click: handleRewrite,
          disabled: (
            profile.rewritePending
            || profile.rewriteInput.trim().length === 0
          ),
          type: 'button',
        }, t(state, 'button-rewrite')),
      ),

      ...c(
        profile.rewritePending
        || (
          profile.rewriteMessages
          && profile.rewriteMessages.length > 0
        ),
        n('button', {
          type: 'button',
          click: handleReset,
        }, t(state, 'button-reset')),
      ),

      n('button', {
        click: handleBack,
        type: 'button',
      }, t(state, 'button-go_back')),
    ]),
  ]
}
