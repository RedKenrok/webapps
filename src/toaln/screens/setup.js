import {
  conditional as c,
  node as n,
} from '@doars/staark'

import {
  APIS,
  getModels,
  isReady as apiIsReady,
} from '../../shared/apis/apis.js'

import {
  getLanguageFromLocale,
  LOCALE_CODES,
  PROFICIENCY_LEVEL_CODES,
  setLangAttribute,
} from '../data/locales.js'
import { SCREENS } from '../data/screens.js'
import {
  translate as t,
  TRANSLATABLE_CODES,
} from '../data/translations.js'
import {
  PROFILE_TEMPLATE,
} from '../data/profile.js'

import {
  convertTemperature,
} from '../utilities/parameters.js'
import { setScreen } from '../utilities/screen.js'
import { createIdentifier } from '../../shared/utilities/identifiers.js'
import { cloneRecursive } from '../../shared/utilities/clone.js'

const ensureProfileExists = (
  state,
) => {
  if (state.profiles.length === 0) {
    const newProfileId = createIdentifier()
    const newProfile = cloneRecursive(PROFILE_TEMPLATE)
    newProfile.id = newProfileId
    state.profiles.push(newProfile)
    state.activeProfileId = newProfileId
  }
}

const isReady = (
  state,
) => {
  return (
    apiIsReady(state)
    && state.profiles.length > 0
    && state.activeProfileId
  )
}

const handleSourceLanguage = (
  event,
  state,
) => {
  if (state.sourceLocale !== event.target.selectedOptions[0].value) {
    state.sourceLocale = event.target.selectedOptions[0].value
    state.sourceLanguage = getLanguageFromLocale(state.sourceLocale)
    setLangAttribute(state)
  }
}

const handleTargetLanguage = (
  event,
  state,
) => {
  ensureProfileExists(state)
  const value = event.target.selectedOptions[0].value
  if (!state.profiles[0].targetLanguage !== value) {
    state.profiles[0].targetLanguage = value
  }
}

const handleProficiencyLevel = (
  event,
  state,
) => {
  ensureProfileExists(state)
  const value = event.target.selectedOptions[0].value
  if (state.profiles[0].proficiencyLevel !== value) {
    state.profiles[0].proficiencyLevel = value
  }
}

const handleNewTopic = (
  event,
  state,
) => {
  ensureProfileExists(state)
  if (event.target.value) {
    state.profiles[0].topicsOfInterest.push(event.target.value)
  }
}

const handleUpdateTopic = (
  event,
  state,
) => {
  ensureProfileExists(state)
  const index = Number.parseInt(
    event.target.getAttribute('data-index'),
  )
  if (!event.target.value) {
    state.profiles[0].topicsOfInterest.splice(index, 1)
  } else {
    state.profiles[0].topicsOfInterest[index] = event.target.value
  }
}

const handleApiProvider = (
  event,
  state,
) => {
  if (state.apiProvider !== event.target.selectedOptions[0].value) {
    state.apiProvider = event.target.selectedOptions[0].value
    state.apiCredentialsTested = false
    state.apiModels = null
  }
}

const handleApiCredentials = (
  event,
  state,
) => {
  if (state.apiCredentials !== event.target.value) {
    state.apiCredentials = event.target.value
  }
}

const handleApiCredentialsTest = (
  _event,
  state,
) => {
  state.apiCredentialsPending = true
  getModels(state)
    .then(([error, _response, result]) => {
      state.apiCredentialsPending = false

      if (error) {
        state.apiCredentialsTested = false
        state.apiCredentialsError = error.toString()
        state.apiModels = null
      } else {
        state.apiCredentialsTested = true
        state.apiCredentialsError = false
        state.apiModels = result
        state.apiModel ??= result?.data.length > 0 ? result.data[0].id : null
      }
    })
}

const handleApiModel = (
  event,
  state,
) => {
  if (state.apiModel !== event.target.selectedOptions[0].value) {
    state.apiModel = event.target.selectedOptions[0].value
  }
}

const handleApiModelTemperature = (
  event,
  state,
) => {
  if (state.apiModelTemperature !== event.target.value) {
    state.apiModelTemperature = Number.parseFloat(event.target.value)
  }
}

const handleNext = (
  _event,
  state,
) => {
  if (isReady(state)) {
    setScreen(state, SCREENS.overview)
  }
}

export const setup = (
  state,
) => [
    n('b', t(state, 'greeting')),

    n('label', {
      for: 'select_source_language',
    }, t(state, 'setup-source_language')),
    n('select', {
      id: 'select_source_language',
      change: handleSourceLanguage,
    }, TRANSLATABLE_CODES.map(
      localeCode => n('option', {
        selected: (
          state.sourceLocale === localeCode
            ? 'selected'
            : false
        ),
        value: localeCode,
      }, t(state, localeCode, localeCode))
    )),

    n('label', {
      for: 'select_target_language',
    }, t(state, 'setup-target_language')),
    n('select', {
      id: 'select_target_language',
      change: handleTargetLanguage,
    }, LOCALE_CODES.map(
      localeCode => n('option', {
        selected: (
          (state.profiles[0]?.targetLanguage || 'eng') === localeCode
            ? 'selected'
            : false
        ),
        value: localeCode,
      }, t(state, localeCode))
    )),

    n('label', {
      for: 'select_proficiency_level',
    }, t(state, 'setup-proficiency_level')),
    n('select', {
      id: 'select_proficiency_level',
      change: handleProficiencyLevel,
    }, PROFICIENCY_LEVEL_CODES.map(
      proficiencyLevel => n('option', {
        selected: (
          (state.profiles[0]?.proficiencyLevel || 'a1') === proficiencyLevel
            ? 'selected'
            : false
        ),
        value: proficiencyLevel,
      }, t(state, 'proficiency_name-' + proficiencyLevel))
    )),

    n('ul',
      t(state, 'proficiency_description-' + (state.profiles[0]?.proficiencyLevel || 'a1'))
        .map(text => n('li', text))
    ),
    n('blockquote',
      n('p', c(
        TRANSLATABLE_CODES.includes(state.profiles[0]?.targetLanguage || 'eng'),
        t(state, 'proficiency_example-' + (state.profiles[0]?.proficiencyLevel || 'a1'), state.profiles[0]?.targetLanguage),
        t(state, 'proficiency_example-' + (state.profiles[0]?.proficiencyLevel || 'a1')),
      )),
    ),

    n('label', {
      for: 'input_topics_of_interest',
    }, t(state, 'setup-topics_of_interest')),
    ...(state.profiles[0]?.topicsOfInterest || [])
      .map(
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

    n('label', {
      for: 'select_api_provider',
    }, t(state, 'setup-api_provider')),
    n('select', {
      id: 'select_api_provider',
      change: handleApiProvider,
    }, Object.keys(APIS).map(
      apiProvider => n('option', {
        selected: (
          state.apiProvider === apiProvider
            ? 'selected'
            : false
        ),
        value: apiProvider,
      }, APIS[apiProvider].name),
    )),

    ...c(
      APIS[state.apiProvider]?.requireCredentials,
      [
        n('label', {
          for: 'input-api_credentials',
        }, t(state, 'setup-api_credentials')),
        n('input', {
          id: 'input-api_credentials',
          keyup: handleApiCredentials,
          type: 'password',
          value: state.apiCredentials,
        }),
      ],
    ),

    n('button', {
      click: handleApiCredentialsTest,
      type: 'button',
    }, [
      t(state, 'setup-test_api_credentials'),
      n('span', {
        class: (
          state.apiCredentialsPending
            ? 'pending'
            : ''
        ),
      }),
    ]),

    ...c(
      state.apiCredentialsError,
      [n('p', state.apiCredentialsError),],
    ),

    ...c(
      !state.apiCredentialsTested,
      [n('p', t(state, 'setup-api_credentials_untested')),],
      [
        n('label', {
          for: 'select_api_model',
        }, t(state, 'setup-api_credentials_tested').replace('{%preferredModel%}', APIS[state.apiProvider]?.preferredModelName ?? APIS[state.apiProvider]?.preferredModel)),
        n('select', {
          id: 'select_api_model',
          change: handleApiModel,
        }, [
          n('option', {
            disabled: true,
            selected: (
              !apiIsReady(state)
                ? 'selected'
                : false
            ),
            value: null,
          }, t(state, 'select_an_option')),

          ...state.apiModels?.data
            ?.filter(APIS[state.apiProvider].modelOptionsFilter ?? (() => true))
            ?.sort((a, b) => a.id.localeCompare(b.id))
            ?.map(model => n('option', {
              selected: (
                (state.apiModel ?? APIS[state.apiProvider].preferredModel) === model.id
                  ? 'selected'
                  : false
              ),
              value: model.id,
            }, model.name ?? model.id))
          ?? []
        ]),

        ...c(
          apiIsReady(state),
          [
            n('details', [
              n('summary', t(state, 'setup-api_model_advanced_settings')),

              n('label', {
                for: 'input-api_model_temperature',
              }, t(state, 'setup-api_model_temperature-select')),
              n('input', {
                id: 'input-api_model_temperature',
                input: handleApiModelTemperature,
                type: 'range',
                min: 0,
                max: 1,
                step: 0.01,
                value: state.apiModelTemperature,
              }),
              n('span', {
                role: 'note',
              }, convertTemperature(state)),
            ]),
          ],
        ),
      ],
    ),

    ...c(
      isReady(state),
      [n('p', t(state, 'setup-outro')),],
    ),

    n('button', {
      click: handleNext,
      disabled: !isReady(state),
      type: 'button',
    }, t(state, 'setup-next'))
  ]
