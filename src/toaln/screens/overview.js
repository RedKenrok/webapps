import {
  conditional as c,
  node as n,
} from '@doars/staark'

import { SCREENS } from '../data/screens.js'
import { translate as t } from '../data/translations.js'
import { generateProfileName } from '../data/profile.js'

import { setScreen } from '../utilities/screen.js'

const handleSwitchProfile = (
  event,
  state,
) => {
  state.activeProfileId = event.target.value
}

const handleClarification = (
  _event,
  state,
) => {
  setScreen(state, SCREENS.clarification)
}

const handleComprehension = (
  _event,
  state,
) => {
  setScreen(state, SCREENS.comprehension)
}

const handleConversation = (
  _event,
  state,
) => {
  setScreen(state, SCREENS.conversation)
}

const handleReading = (
  _event,
  state,
) => {
  setScreen(state, SCREENS.reading)
}

const handleRewrite = (
  _event,
  state,
) => {
  setScreen(state, SCREENS.rewrite)
}

const handleStory = (
  _event,
  state,
) => {
  setScreen(state, SCREENS.story)
}

const handleTyping = (
  _event,
  state,
) => {
  setScreen(state, SCREENS.typing)
}

const handleVocabulary = (
  _event,
  state,
) => {
  setScreen(state, SCREENS.vocabulary)
}

const handleOptions = (
  _event,
  state,
) => {
  setScreen(state, SCREENS.options)
}

const handleMigrate = (
  _event,
  state,
) => {
  setScreen(state, SCREENS.migrate)
}

export const overview = (
  state,
) => [
    n('p', [
      n('b', t(state, 'greeting')),
      n('br'),
      ...c(
        state.statisticLastActivityOn,
        t(state, 'statistics-activity_per_category'),
        t(state, 'statistics-no_activity'),
      ),
    ]),
    n('p', [
      ...c(
        state.statisticCurrentActivityStreak > 1
        && (
          (new Date(state.statisticLastActivityOn)).toISOString().slice(0, 10) === (new Date()).toISOString().slice(0, 10)
          || (new Date(state.statisticLastActivityOn)).toISOString().slice(0, 10) === (new Date(new Date().setDate(new Date().getDate() - 1))).toISOString().slice(0, 10)
        ),
        [
          ...c(
            (new Date(state.statisticLastActivityOn)).toISOString().slice(0, 10) === (new Date()).toISOString().slice(0, 10),
            t(state, 'statistics-extended_activity_streak'),
            t(state, 'statistics-current_activity_streak'),
          ),
          ...c(
            state.statisticLongestActivityStreak > state.statisticCurrentActivityStreak,
            ' ' + t(state, 'statistics-longest_activity_streak'),
          ),
        ],
        [
          t(state, 'statistics-no_activity_streak'),
          ...c(
            state.statisticLongestActivityStreak > 1,
            ' ' + t(state, 'statistics-longest_activity_streak'),
          ),
        ]
      ),
      ' ' + t(state, 'overview-intro'),
    ]),

    ...c(
      state.profiles.length > 1,
      [
        n('p'), // Added space between paragraph and label.
        n('label', {
          for: 'overview-select_profile',
        }, t(state, 'overview-current_profile')),
        n('select', {
          id: 'overview-select_profile',
          change: handleSwitchProfile,
        }, state.profiles.map(profile =>
          n('option', {
            selected: state.activeProfileId === profile.id ? 'selected' : false,
            value: profile.id,
          }, generateProfileName(state, profile, 60))
        )),
      ],
    ),

    n('p', t(state, 'overview-intro')),
    n('div', {
      class: 'vertical-layout',
    }, [
      n('button', {
        class: 'card',
        click: handleReading,
        type: 'button',
      }, [
        n('span', {
          class: 'icon',
        }, '📖'),
        n('b', t(state, 'overview-reading-title')),
        n('br'),
        t(state, 'overview-reading-description'),
      ]),

      n('button', {
        class: 'card',
        click: handleRewrite,
        type: 'button',
      }, [
        n('span', {
          class: 'icon',
        }, '🤖'),
        n('b', t(state, 'overview-rewrite-title')),
        n('br'),
        t(state, 'overview-rewrite-description'),
      ]),

      n('button', {
        class: 'card',
        click: handleTyping,
        type: 'button',
      }, [
        n('span', {
          class: 'icon',
        }, '⌨️'),
        n('b', t(state, 'overview-typing-title')),
        n('br'),
        t(state, 'overview-typing-description'),
      ]),

      n('button', {
        class: 'card',
        click: handleVocabulary,
        type: 'button',
      }, [
        n('span', {
          class: 'icon',
        }, '🔎'),
        n('b', t(state, 'overview-vocabulary-title')),
        n('br'),
        t(state, 'overview-vocabulary-description'),
      ]),

      n('button', {
        class: 'card',
        click: handleComprehension,
        type: 'button',
      }, [
        n('span', {
          class: 'icon',
        }, '🖊️'),
        n('b', t(state, 'overview-comprehension-title')),
        n('br'),
        t(state, 'overview-comprehension-description'),
      ]),

      n('button', {
        class: 'card',
        click: handleConversation,
        type: 'button',
      }, [
        n('span', {
          class: 'icon',
        }, '💬'),
        n('b', t(state, 'overview-conversation-title')),
        n('br'),
        t(state, 'overview-conversation-description'),
      ]),

      n('button', {
        class: 'card',
        click: handleStory,
        type: 'button',
      }, [
        n('span', {
          class: 'icon',
        }, '🎭'),
        n('b', t(state, 'overview-story-title')),
        n('br'),
        t(state, 'overview-story-description'),
      ]),

      n('button', {
        class: 'card',
        click: handleClarification,
        type: 'button',
      }, [
        n('span', {
          class: 'icon',
        }, '🙋'),
        n('b', t(state, 'overview-clarification-title')),
        n('br'),
        t(state, 'overview-clarification-description'),
      ]),

      n('div', {
        class: 'margin',
      }),

      n('button', {
        class: 'card',
        click: handleOptions,
        type: 'button',
      }, [
        n('span', {
          class: 'icon',
        }, '⚙️'),
        n('b', t(state, 'overview-options-title')),
        n('br'),
        t(state, 'overview-options-description'),
      ]),

      n('button', {
        class: 'card',
        click: handleMigrate,
        type: 'button',
      }, [
        n('span', {
          class: 'icon',
        }, '💾'),
        n('b', t(state, 'overview-migrate-title')),
        n('br'),
        t(state, 'overview-migrate-description'),
      ]),
    ]),

    n('p', {
      class: 'text-right',
    }, n('a', {
      href: 'https://rondekker.com/',
      target: '_blank',
      rel: 'noopener me',
    }, t(state, 'credits-link').replace('{%name%}', 'Ron Dekker')))
  ]
