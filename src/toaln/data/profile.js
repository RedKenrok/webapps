import {
  translate as t,
} from './translations.js'

export const PROFILE_TEMPLATE = {
  id: null,
  targetLanguage: 'eng',
  proficiencyLevel: 'a1',
  topicsOfInterest: [],

  clarificationInput: '',
  clarificationError: false,
  clarificationPending: false,
  clarificationMessages: [],

  comprehensionInput: '',
  comprehensionReviewed: false,
  comprehensionError: false,
  comprehensionPending: false,
  comprehensionMessages: [],

  conversationInput: '',
  conversationStopped: false,
  conversationError: false,
  conversationPending: false,
  conversationMessages: [],

  readingInput: '',
  readingError: false,
  readingPending: false,
  readingMessages: [],

  rewriteInput: '',
  rewriteError: false,
  rewritePending: false,
  rewriteMessages: [],

  storyInput: '',
  storyReviewed: false,
  storyError: false,
  storyPending: false,
  storyMessages: [],

  typingCurrentIndex: 0,
  typingEndTime: null,
  typingError: false,
  typingInput: '',
  typingLength: 'medium',
  typingMessage: '',
  typingMistakes: 0,
  typingPending: false,
  typingStartTime: null,

  vocabularyInput: '',
  vocabularyReviewed: false,
  vocabularyError: false,
  vocabularyPending: false,
  vocabularyMessages: [],
}

export const generateProfileName = (
  state,
  profile,
  maxLength = Infinity
) => {
  const languageName = t(state, profile.targetLanguage)
  let name = languageName + ' ' + profile.proficiencyLevel.toUpperCase()
  if (profile.topicsOfInterest?.length > 0) {
    name += ' (' + profile.topicsOfInterest.join(', ') + ')'
  }
  if (
    maxLength !== Infinity
    && name.length > maxLength
  ) {
    name = name.substring(0, maxLength) + '…'
  }
  return name
}

export const getActiveProfile = (
  state,
) => {
  let profile = state.profiles.find(
    profile => profile.id === state.activeProfileId,
  )
  if (!profile) {
    if (state.profiles.length > 0) {
      profile = state.profiles[0]
    } else {
      const profileId = createIdentifier()
      profile = cloneRecursive(PROFILE_TEMPLATE)
      profile.id = profileId

      // Migrate old profile data over if it exists.
      if (state.targetLanguage) {
        profile.targetLanguage = state.targetLanguage
      }
      if (state.proficiencyLevel) {
        profile.proficiencyLevel = state.proficiencyLevel
      }
      if (state.topicsOfInterest) {
        profile.topicsOfInterest = state.topicsOfInterest
      }

      state.profiles.push(profile)
      state.activeProfileId = profileId
    }
  }
  return profile
}
