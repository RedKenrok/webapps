import {
  node as n,
} from '@doars/staark'

import {
  LOCALE_CODES,
  PROFICIENCY_LEVEL_CODES,
} from '../data/locales.js'
import { SCREENS } from '../data/screens.js'
import {
  translate as t,
} from '../data/translations.js'
import { getActiveProfile } from '../data/profile.js'

import { setScreen } from '../utilities/screen.js'

const handleTargetLanguage = (
  event,
  state,
) => {
  const profile = getActiveProfile(state)
  if (profile) {
    profile.targetLanguage = event.target.selectedOptions[0].value
  }
}

const handleProficiencyLevel = (
  event,
  state,
) => {
  const profile = getActiveProfile(state)
  if (profile) {
    profile.proficiencyLevel = event.target.selectedOptions[0].value
  }
}

const handleNewTopic = (
  event,
  state,
) => {
  const profile = getActiveProfile(state)
  if (
    profile
    && event.target.value
  ) {
    profile.topicsOfInterest.push(event.target.value)
  }
}

const handleUpdateTopic = (
  event,
  state,
) => {
  const index = Number.parseInt(
    event.target.getAttribute('data-index'),
  )
  const currentProfile = getActiveProfile(state)
  if (!event.target.value) {
    currentProfile.topicsOfInterest.splice(index, 1)
  } else {
    currentProfile.topicsOfInterest[index] = event.target.value
  }
}

const handleGoBack = (
  _event,
  state,
) => {
  setScreen(state, SCREENS.options)
}

export const profile = (
  state,
) => {
  const currentProfile = getActiveProfile(state)

  return [
    n('b', t(state, 'greeting')),

    n('label', {
      for: 'select_target_language',
    }, t(state, 'profile-target_language')),
    n('select', {
      id: 'select_target_language',
      change: handleTargetLanguage,
    }, LOCALE_CODES.map(
      localeCode => n('option', {
        selected: (
          currentProfile?.targetLanguage === localeCode
            ? 'selected'
            : false
        ),
        value: localeCode,
      }, t(state, localeCode))
    )),

    n('label', {
      for: 'select_proficiency_level',
    }, t(state, 'profile-proficiency_level')),
    n('select', {
      id: 'select_proficiency_level',
      change: handleProficiencyLevel,
    }, PROFICIENCY_LEVEL_CODES.map(
      proficiencyLevel => n('option', {
        selected: (
          currentProfile?.proficiencyLevel === proficiencyLevel
            ? 'selected'
            : false
        ),
        value: proficiencyLevel,
      }, t(state, 'proficiency_name-' + proficiencyLevel))
    )),

    n('ul',
      t(state, 'proficiency_description-' + currentProfile?.proficiencyLevel)
        .map(text => n('li', text))
    ),

    n('label', {
      for: 'input_topics_of_interest',
    }, t(state, 'profile-topics_of_interest')),
    ...currentProfile?.topicsOfInterest?.map(
      (topic, index) => n('input', {
        'data-index': String(index),
        keyup: handleUpdateTopic,
        value: topic,
      })
    ),
    n('input', {
      keyup: handleNewTopic,
      id: 'input_topics_of_interest',
    }),

    n('button', {
      click: handleGoBack,
      type: 'button',
    }, t(state, 'button-go_back'))
  ]
}
