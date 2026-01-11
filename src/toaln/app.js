import {
  mount,
  match as m,
  node as n,
} from '@doars/staark'

import { APIS } from '../shared/apis/apis.js'
import {
  apiSettings as apiSettingsGoogle,
} from '../shared/apis/google.js'

import {
  getPreferredLocale,
  getLanguageFromLocale,
  setLangAttribute,
} from './data/locales.js'
import { SCREENS } from './data/screens.js'
import { STORAGE_KEY } from './data/state.js'

import { contextMenu } from './screens/sections/context-menu.js'
import { popupModal } from './screens/sections/popup-modal.js'
import { updateBanner } from './screens/sections/update-banner.js'
import { migrate } from './screens/migrate.js'
import { options } from './screens/options.js'
import { overview } from './screens/overview.js'
import { setup } from './screens/setup.js'

import { conversation } from './screens/conversation.js'
import { clarification } from './screens/clarification.js'
import { comprehension } from './screens/comprehension.js'
import { reading } from './screens/reading.js'
import { rewrite } from './screens/rewrite.js'
import { story } from './screens/story.js'
import { vocabulary } from './screens/vocabulary.js'
import { profile } from './screens/profile.js'
import { typing } from './screens/typing.js'

import { createIdentifier } from '../shared/utilities/identifiers.js'
import { handleContextMenu } from './utilities/context-menu.js'
import { handleHistory } from './utilities/screen.js'
import { handleStartup } from './utilities/manifest.js'
import { handleUpdates } from '../shared/utilities/sw.js'

const initialize = () => {
  const preferredLocale = getPreferredLocale()

  const [_update, _unmount, state] = mount(
    document.body.appendChild(
      document.createElement('div'),
    ),
    (state) => {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(state),
      )

      return n('div', {
        class: 'screen',
      }, [
        ...updateBanner(state),
        ...m(state.screen, {
          [SCREENS.clarification]: () => clarification(state),
          [SCREENS.comprehension]: () => comprehension(state),
          [SCREENS.conversation]: () => conversation(state),
          [SCREENS.reading]: () => reading(state),
          [SCREENS.rewrite]: () => rewrite(state),
          [SCREENS.story]: () => story(state),
          [SCREENS.vocabulary]: () => vocabulary(state),
          [SCREENS.typing]: () => typing(state),

          [SCREENS.overview]: () => overview(state),
          [SCREENS.options]: () => options(state),
          [SCREENS.migrate]: () => migrate(state),
          [SCREENS.profile]: () => profile(state),
        }, () => setup(state)),
        ...popupModal(state),
        ...contextMenu(state),
      ])
    },
    Object.assign({
      screen: SCREENS.setup,
      userIdentifier: createIdentifier(),

      appUpdateAvailable: false,
      contextMenu: null,
      selection: null,
      popupModal: null,

      sourceLocale: preferredLocale,
      sourceLanguage: getLanguageFromLocale(preferredLocale),
      apiProvider: APIS.google.code,
      apiModels: null,
      apiModel: apiSettingsGoogle.preferredModel,
      apiModelTemprature: 0.5,
      apiCredentials: null,
      apiCredentialsError: false,
      apiCredentialsPending: false,
      apiCredentialsTested: false,

      profiles: [],
      activeProfileId: null,

      statisticCurrentActivityStreak: 0,
      statisticLastActivityOn: null,
      statisticLongestActivityStreak: 0,
      // Exercise statistics.
      statisticClarificationActivity: 0,
      statisticComprehensionActivity: 0,
      statisticConversationActivity: 0,
      statisticReadingActivity: 0,
      statisticRewriteActivity: 0,
      statisticStoryActivity: 0,
      statisticTypingActivity: 0,
      statisticVocabularyActivity: 0,

      migrateImportError: false,
      migrateReset: false,
    }, (
      window.localStorage.getItem(STORAGE_KEY)
        ? JSON.parse(
          window.localStorage.getItem(STORAGE_KEY)
        )
        : {}
    ), {
      // Ensure files updated is always reset after a full page refresh.
      appUpdateAvailable: false,
      apiCredentialsPending: false,
    })
  )

  setLangAttribute(state)

  handleContextMenu(state)
  handleHistory(state)
  handleStartup(state)
  handleUpdates(state)
}

// Check if dom content loaded event has already fired.
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize)
} else {
  initialize()
}
