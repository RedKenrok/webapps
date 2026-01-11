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
  setLangAttribute,
} from '../data/locales.js'
import { SCREENS } from '../data/screens.js'
import {
  translate as t,
  TRANSLATABLE_CODES,
} from '../data/translations.js'
import {
  generateProfileName,
  PROFILE_TEMPLATE,
} from '../data/profile.js'

import { cloneRecursive } from '../../shared/utilities/clone.js'
import { createIdentifier } from '../../shared/utilities/identifiers.js'
import {
  convertTemperature,
} from '../utilities/parameters.js'
import { setScreen } from '../utilities/screen.js'

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

const handleUpdateProfile = (
  event,
  state,
) => {
  const profileId = event.target.getAttribute('data-profile-id')
  state.activeProfileId = profileId
  setScreen(state, SCREENS.profile)
}

const handleDeleteProfile = (
  event,
  state,
) => {
  if (state.profiles.length > 1) {
    const profileId = event.target.getAttribute('data-profile-id')
    const index = state.profiles.findIndex(p => p.id === profileId)
    if (index !== -1) {
      state.profiles.splice(index, 1)
      if (state.activeProfileId === profileId) {
        state.activeProfileId = state.profiles[0].id
      }
    }
  }
}

const handleSwitchProfile = (
  event,
  state,
) => {
  if (state.activeProfileId !== event.target.selectedOptions[0].value) {
    state.activeProfileId = event.target.selectedOptions[0].value
  }
}

const handleAddProfile = (
  _event,
  state,
) => {
  const newProfileId = createIdentifier()
  const newProfile = cloneRecursive(PROFILE_TEMPLATE)
  newProfile.id = newProfileId
  state.profiles.push(newProfile)
  state.activeProfileId = newProfileId
  setScreen(state, SCREENS.profile)
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

const handleGoBack = (
  _event,
  state,
) => {
  if (isReady(state)) {
    setScreen(state, SCREENS.overview)
  }
}

export const options = (
  state,
) => [
    n('b', t(state, 'greeting')),

    n('label', {
      for: 'select_source_language',
    }, t(state, 'options-source_language')),
    n('select', {
      id: 'select_source_language',
      change: handleSourceLanguage,
    }, TRANSLATABLE_CODES.map(
      localeCode => n('option', {
        selected: (state.sourceLocale === localeCode ? 'selected' : false),
        value: localeCode,
      }, t(state, localeCode, localeCode))
    )),

    n('p', t(state, 'options-profile_management')),
    ...c(
      state.profiles.length > 0,
      [
        ...state.profiles.map(profile =>
          n('div', {
            class: 'profile-item',
          }, [
            n('span', generateProfileName(state, profile, 60)),
            n('button', {
              'data-profile-id': profile.id,
              click: handleUpdateProfile,
              type: 'button',
            }, t(state, 'options-profile_update')),
            ...c(
              state.profiles.length > 1,
              n('button', {
                'data-profile-id': profile.id,
                click: handleDeleteProfile,
                type: 'button',
              }, t(state, 'options-profile_delete'))
            ),
          ])
        ),
      ]
    ),
    n('button', {
      click: handleAddProfile,
      type: 'button',
    }, t(state, 'options-profile_add')),

    ...c(
      state.profiles.length > 1,
      [
        n('label', t(state, 'options-select_profile')),
        n('select', {
          change: (event) => handleSwitchProfile(event, state, event.target.value),
        }, state.profiles.map(profile =>
          n('option', {
            selected: state.activeProfileId === profile.id ? 'selected' : false,
            value: profile.id,
          }, generateProfileName(state, profile, 60))
        )),
      ],
    ),

    n('label', {
      for: 'select_api_provider',
    }, t(state, 'options-api_provider')),
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
      }, APIS[apiProvider].name)
    )),

    ...c(
      APIS[state.apiProvider]?.requireCredentials,
      [
        n('label', {
          for: 'input-api_credentials',
        }, t(state, 'options-api_credentials')),
        n('input', {
          id: 'input-api_credentials',
          keyup: handleApiCredentials,
          type: 'password',
          value: state.apiCredentials,
        }),
      ]
    ),

    n('button', {
      click: handleApiCredentialsTest,
      type: 'button',
    }, [
      t(state, 'options-test_api_credentials'),
      n('span', {
        class: (
          state.apiCredentialsPending
            ? 'pending'
            : ''
        )
      }),
    ]),

    ...c(
      state.apiCredentialsError,
      [n('p', state.apiCredentialsError)]
    ),

    ...c(
      !state.apiCredentialsTested,
      [n('p', t(state, 'options-api_credentials_untested'))],
      [
        n('label', {
          for: 'select_api_model',
        }, t(state, 'options-api_credentials_tested').replace('{%preferredModel%}', APIS[state.apiProvider]?.preferredModelName ?? APIS[state.apiProvider]?.preferredModel)),
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
              selected: ((state.apiModel ?? APIS[state.apiProvider].preferredModel) === model.id ? 'selected' : false),
              value: model.id,
            }, model.name ?? model.id)) ?? []
        ]),

        ...c(
          apiIsReady(state),
          [
            n('details', [
              n('summary', t(state, 'options-api_model_advanced_settings')),

              n('label', {
                for: 'input-api_model_temperature',
              }, t(state, 'options-api_model_temperature-select')),
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

    n('button', {
      click: handleGoBack,
      disabled: !isReady(state),
      type: 'button',
    }, t(state, 'button-go_back'))
  ]
