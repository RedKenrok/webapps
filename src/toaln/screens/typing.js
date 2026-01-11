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
  profile.typingInput = event.target.value
}

const handleLengthChange = (
  event,
  state,
) => {
  const profile = getActiveProfile(state)
  profile.typingLength = event.target.value
}

const handleGenerate = (
  _event,
  state,
) => {
  const profile = getActiveProfile(state)
  if (!profile.typingPending) {
    profile.typingError = false
    profile.typingMessage = null
    profile.typingPending = true
    profile.typingCurrentIndex = 0
    profile.typingMistakes = 0
    profile.typingStartTime = null

    const messages = []
    if (
      profile.typingInput
      && profile.typingInput.trim().length > 0
    ) {
      messages.push({
        role: 'user',
        content: profile.typingInput.trim(),
      })
    }

    createMessage(
      state,
      messages,
      t(state, 'prompt-context'),
      t(state, 'prompt-typing')
        .replace('{%typingLength%}', t(state, 'typing-length_' + profile.typingLength)),
    ).then(([error, _response, result]) => {
      profile.typingPending = false
      if (error) {
        profile.typingError = error.toString()
        return
      }
      profile.typingMessage = result.content
      profile.typingCurrentIndex = 0
      profile.typingMistakes = 0
      profile.typingStartTime = null
      profile.typingEndTime = null

      handleTypingClick()
      requestAnimationFrame(
        () => scrollToCurrentCharacter(state),
      )
    })
  }
}

const handleReset = (
  _event,
  state,
) => {
  const profile = getActiveProfile(state)
  profile.typingError = false
  profile.typingInput = ''
  profile.typingMessage = null
  profile.typingPending = false
  profile.typingCurrentIndex = 0
  profile.typingMistakes = 0
  profile.typingStartTime = null
  profile.typingEndTime = null
}

const handleBack = (
  _event,
  state,
) => {
  setScreen(state, SCREENS.overview)
}

const handleRestart = (
  _event,
  state,
) => {
  const profile = getActiveProfile(state)
  if (profile.typingMessage) {
    profile.typingCurrentIndex = 0
    profile.typingMistakes = 0
    profile.typingStartTime = null
    profile.typingEndTime = null
    profile.typingComposing = null
  }
}

const handleKeyDown = (
  event,
  state,
) => {
  const profile = getActiveProfile(state)
  const text = profile.typingMessage
  if (
    event.altKey
    || event.isComposing
    || !text
    || profile.typingEndTime
    || profile.typingPending
  ) {
    return
  }

  const key = event.key
  if (key.length !== 1) {
    return
  }

  if (!profile.typingStartTime) {
    profile.typingStartTime = Date.now()
  }

  const currentCharacter = text[profile.typingCurrentIndex]
  if (key === currentCharacter) {
    profile.typingCurrentIndex++
    if (profile.typingCurrentIndex >= text.length) {
      profile.typingEndTime = Date.now()
      state.statisticTypingActivity++
      onActivity(state)
    }

    requestAnimationFrame(
      () => scrollToCurrentCharacter(state),
    )
  } else {
    profile.typingMistakes++
  }
}

const handleCompositionEnd = (
  event,
  state,
) => {
  const profile = getActiveProfile(state)
  const text = profile.typingMessage
  if (
    !text
    || profile.typingEndTime
    || profile.typingPending
  ) {
    return
  }

  if (!profile.typingStartTime) {
    profile.typingStartTime = Date.now()
  }

  const composedCharacter = event.data
  const currentCharacter = text[profile.typingCurrentIndex]
  if (composedCharacter === currentCharacter) {
    profile.typingCurrentIndex++
    if (profile.typingCurrentIndex >= text.length) {
      profile.typingEndTime = Date.now()
      state.statisticTypingActivity++
      onActivity(state)
    }

    requestAnimationFrame(
      () => scrollToCurrentCharacter(state),
    )
  } else {
    profile.typingMistakes++
  }
}

const handleTypingClick = (
) => {
  document.querySelector('.typing-input-hidden')?.focus()
}

const scrollToCurrentCharacter = (
  state,
) => {
  const profile = getActiveProfile(state)
  if (
    !profile.typingMessage
    || profile.typingCurrentIndex < 0
  ) {
    return
  }

  const container = document.querySelector('.typing-text-container')
  const currentElement = document.querySelector('.typing-text .current')
  const containerRect = container.getBoundingClientRect()
  const elementRect = currentElement.getBoundingClientRect()

  const elementCenter = elementRect.top - containerRect.top + (elementRect.height / 2)
  const containerCenter = containerRect.height / 2

  container.scrollTop += elementCenter - containerCenter
}

const formatResultsSummary = (
  state,
) => {
  const profile = getActiveProfile(state)
  if (!profile.typingMessage) {
    return ''
  }

  const text = profile.typingMessage
  const words = text.split(/[\s.,!?;:]+/).filter(word => word.length > 0).length

  const elapsed = (profile.typingEndTime ?? Date.now()) - profile.typingStartTime
  const wordsPerMinute = Math.round(words / (elapsed / 60000))
  const accuracy = Math.round((
    profile.typingCurrentIndex / (
      profile.typingCurrentIndex + profile.typingMistakes
    )
  ) * 100)

  return t(state, 'typing-results-summary')
    .replace('{%accuracy%}', accuracy)
    .replace('{%characters%}', text.length)
    .replace('{%minutes%}', Math.floor(elapsed / 60000))
    .replace('{%mistakes%}', profile.typingMistakes)
    .replace('{%seconds%}', Math.floor((elapsed % 60000) / 1000))
    .replace('{%words%}', words)
    .replace('{%wpm%}', wordsPerMinute)
}

export const typing = (
  state,
) => {
  const profile = getActiveProfile(state)
  console.log(profile)

  return [
    n('p', [
      n('b', t(state, 'greeting')),
      n('br'),
      t(state, 'typing-intro'),
    ]),

    n('div', [
      ...c(
        profile.typingPending,
        n('p', {
          class: 'pending',
        }),
      ),

      n('div', {
        class: 'messages',
      }, [

        ...c(
          !profile.typingPending
          && !profile.typingMessage,
          [
            n('textarea', {
              class: 'message-user',
              id: 'input-topic',
              input: handleInput,
              placeholder: t(state, 'typing-placeholder'),
            }, profile.typingInput || ''),

            n('label', {
              for: 'typing-input_length',
              class: 'sr-only',
            }, t(state, 'typing-length_select')),
            n('select', {
              id: 'typing-input_length',
              change: handleLengthChange,
            }, ['short', 'medium', 'long', 'extra_long']
              .map(length =>
                n('option', {
                  value: length,
                  selected: profile.typingLength === length,
                }, t(state, 'typing-length_' + length)),
              ),
            ),
          ],
        ),

        ...c(profile.typingMessage, [
          n('input', {
            type: 'text',
            class: 'typing-input-hidden',
            keydown: handleKeyDown,
            compositionend: handleCompositionEnd,
            autocapitalize: 'off',
            autocorrect: 'off',
            autocomplete: 'off',
            spellcheck: false,
          }),

          n('p', {
            class: 'message-user typing-text-container',
            click: handleTypingClick,
          }, [
            n('code', {
              class: 'typing-text',
            },
              (profile.typingMessage ?? '').split('')
                .map((character, index) => {
                  let characterClass = 'remaining'
                  if (index < profile.typingCurrentIndex) {
                    characterClass = 'completed'
                  } else if (index === profile.typingCurrentIndex) {
                    characterClass = 'current'
                  }
                  if (character === ' ') {
                    character = '\u00a0\u200B'
                  }
                  return n('span', {
                    class: characterClass,
                  }, character)
                })
            ),
          ]),

          ...c(
            profile.typingEndTime,
            n('p', {
              class: 'message-assistant',
            }, [
              n('p', t(state, 'typing-completed')),
              n('p', formatResultsSummary(state)),
            ]),
          ),
        ]),
      ]),
    ]),

    ...c(
      profile.typingError,
      n('p', profile.typingError),
    ),

    n('div', {
      class: 'row reverse',
    }, [
      ...c(
        !profile.typingPending
        && !profile.typingMessage,
        n('button', {
          click: handleGenerate,
          disabled: profile.typingPending,
          type: 'button',
        }, t(state, 'button-generate')),
      ),

      ...c(
        profile.typingEndTime,
        n('button', {
          type: 'button',
          click: handleRestart,
        }, t(state, 'typing-restart')),
      ),

      ...c(
        !profile.typingPending
        && profile.typingMessage,
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
