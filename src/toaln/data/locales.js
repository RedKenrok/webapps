export const LOCALES = Object.freeze({
  dan: 'dan', // Danish
  deu: 'deu', // German
  eng: 'eng', // English
  epo: 'epo', // Esperanto
  fra: 'fra', // French
  fry: 'fry', // Frisian (West)
  isl: 'isl', // Icelandic
  ita: 'ita', // Italian
  nld: 'nld', // Dutch
  nno: 'nno', // Norwegian (Nynorsk)
  nob: 'nob', // Norwegian (Bokmål)
  por: 'por', // Portuguese
  spa: 'spa', // Spanish
  swe: 'swe', // Swedish
  vls: 'vls', // Flemish
})

export const LOCALE_CODES = Object.keys(LOCALES)

export const getLanguageFromLocale = (
  localeCode
) => (localeCode ?? '').split('_')[0].split('-')[0]

export const getPreferredLocale = (
) => (
  window.navigator.languages
    .map(
      (languageCode) =>
        languageCode.split('-').filter(
          (_segment, index) => index < 2
        ).join('-').replace('-', '_').toLowerCase())
    .reduce((preferredLanguage, languageCode) => {
      if (preferredLanguage) {
        return preferredLanguage
      }
      for (let i = 0; i < LOCALE_CODES.length; i++) {
        const possibleLanguage = LOCALE_CODES[i]
        if (languageCode === possibleLanguage) {
          return possibleLanguage
        }
        if (possibleLanguage.startsWith(languageCode + '_')) {
          return possibleLanguage
        }
      }
      return preferredLanguage
    }, null)
) ?? LOCALES.eng

export const setLangAttribute = (
  state,
) => {
  document.documentElement.setAttribute(
    'lang',
    state.sourceLocale,
  )
}

export const PROFICIENCY_LEVELS = Object.freeze({
  a1: 'a1',
  a2: 'a2',
  b1: 'b1',
  b2: 'b2',
  c1: 'c1',
  c2: 'c2',
})

export const PROFICIENCY_LEVEL_CODES = Object.keys(PROFICIENCY_LEVELS)
