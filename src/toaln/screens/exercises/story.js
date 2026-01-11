import {
  conditional as c,
  node as n,
} from '@doars/staark'

import { createMessage } from '../../../shared/apis/apis.js'

import { getActiveProfile } from '../../data/profile.js'
import { SCREENS } from '../../data/screens.js'
import { translate as t } from '../../data/translations.js'

import {
  randomBool,
  randomItem,
} from '../../../shared/utilities/random.js'
import { setScreen } from '../../utilities/screen.js'
import { onActivity } from '../../utilities/streak.js'

const handleInput = (
  event,
  state,
) => {
  const profile = getActiveProfile(state)
  profile.storyInput = event.target.value
}

const handleReply = (
  _event,
  state,
) => {
  const profile = getActiveProfile(state)
  if (
    !profile.storyPending
    && profile.storyInput
    && profile.storyInput.trim().length > 0
  ) {
    profile.storyError = false
    profile.storyPending = true
    profile.storyMessages.push({
      role: 'user',
      content: profile.storyInput.trim(),
    })
    profile.storyInput = ''

    createMessage(
      state,
      profile.storyMessages,
      t(state, 'prompt-context'),
      t(state, 'prompt-story-follow_up'),
    ).then(([error, _response, result]) => {
      profile.storyPending = false
      if (error) {
        profile.storyError = error.toString()
        const message = profile.storyMessages.pop()
        profile.storyInput = message.content
        return
      }
      if (result.content.endsWith('STOP')) {
        profile.storyStopped = true
      }
      profile.storyMessages.push(result)
      state.statisticStoryActivity++
      onActivity(state)
    })
  }
}

const handleGenerate = (
  _event,
  state,
) => {
  const profile = getActiveProfile(state)
  if (!profile.storyPending) {
    profile.storyError = false
    profile.storyMessages = []
    profile.storyPending = true

    createMessage(
      state,
      [],
      t(state, 'prompt-context'),
      t(state, 'prompt-story') + (
        randomBool(10)
          ? t(state, 'prompt-topic')
            .replace('{%topic%}', randomItem(
              profile.topicsOfInterest.filter(topic => topic)
            ))
          : ''
      ),
    ).then(([error, _response, result]) => {
      profile.storyPending = false
      if (error) {
        profile.storyError = error.toString()
        return
      }
      profile.storyMessages.push(result)
    })
  }
}

const handleReset = (
  _event,
  state,
) => {
  const profile = getActiveProfile(state)
  profile.storyError = false
  profile.storyMessages = []
  profile.storyPending = false
  profile.storyStopped = false
  // TODO: Should reset the network requests properly.
}

const handleBack = (
  _event,
  state,
) => {
  setScreen(state, SCREENS.overview)
}

export const story = (
  state,
) => {
  const profile = getActiveProfile(state)
  return [
    n('p', [
      n('b', t(state, 'greeting')),
      n('br'),
      t(state, 'story-intro'),
    ]),

    ...c(
      profile.storyMessages
      && profile.storyMessages.length > 0,
      n('div', {
        class: 'messages',
      }, profile.storyMessages.map(
        (message) => n('p', {
          class: 'message-' + message?.role,
        }, message?.content?.split('\n')
          ?.flatMap(
            (content, index, results) =>
              index === results.length - 1
                ? [content]
                : [content, n('br')]
          ))
      ))
    ),

    ...c(
      profile.storyError,
      n('p', profile.storyError)
    ),

    ...c(
      profile.storyPending,
      n('p', {
        class: 'pending',
      }),
      c(
        profile.storyMessages
        && profile.storyMessages.length > 0,
        n('textarea', {
          class: 'message-user',
          id: 'input-question',
          keyup: handleInput,
        }, profile.storyInput)
      )
    ),

    n('div', {
      class: 'row reverse',
    }, [
      ...c(
        profile.storyMessages
        && profile.storyMessages.length > 0
        && !profile.storyStopped,
        n('button', {
          disabled: (
            profile.storyPending
            || !profile.storyInput
            || profile.storyInput.trim().length === 0
          ),
          type: 'button',
          click: handleReply,
        }, t(state, 'button-reply')),
        n('button', {
          disabled: profile.storyPending,
          type: 'button',
          click: handleGenerate,
        }, t(state, 'button-generate')),
      ),

      ...c(
        profile.storyPending
        || (
          profile.storyMessages
          && profile.storyMessages.length > 0
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
    ])
  ]
}
