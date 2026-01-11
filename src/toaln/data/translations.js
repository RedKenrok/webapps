import { LOCALES } from './locales.js'

import { getActiveProfile } from './profile.js'

export const translate = (
  state,
  key,
  locale = null,
) => {
  locale ??= state.sourceLocale
  if (!(locale in TRANSLATIONS)) {
    console.warn('There are no translations available for the language "' + locale + '".')
    return key
  }
  if (!(key in TRANSLATIONS[locale])) {
    console.warn('There are no translations available for the language "' + locale + '" with the key "' + key + '".')
    return key
  }

  /**
   * Replaces parts of a text surrounded by {% and %} with values from the state or other translations. Use {%s:%} to look something up in the state, and use {%t:text_here%} to look something up in the translations.
   * @param {string} text Text to replace parts of.
   * @returns {string} Replaced text.
   */
  const replace = (text) => {
    if (!text) {
      return text
    }
    if (Array.isArray(text)) {
      return text.map(item => replace(item))
    }

    return text
      .replace(
        '{%s:proficiencyLevel%}',
        () => {
          const profile = getActiveProfile(state)
          return profile.proficiencyLevel
        }
      )
      .replace(
        '{%s:targetLanguage%}',
        () => {
          const profile = getActiveProfile(state)
          return profile.targetLanguage
        }
      )
      .replace(
        /{%s:([^%]+)%}/g,
        (match, key) => {
          let value = key.split('.').reduce(
            (innerState, keySegment) => innerState?.[keySegment],
            state
          )
          if (
            value !== undefined
            && value !== null
          ) {
            if (Array.isArray(value)) {
              return value.join(' ')
            }
            return value.toString()
          }
          return match
        })
      .replace(
        /{%t:([^%]+)%}/g,
        (match, key) => {
          if (key in TRANSLATIONS[locale]) {
            let value = TRANSLATIONS[locale][key]
            if (
              value !== undefined
              && value !== null
            ) {
              if (Array.isArray(value)) {
                return value.join(' ')
              }
              return value.toString()
            }
          }
          return match
        })
  }
  return replace(TRANSLATIONS[locale][key])
}

export const TRANSLATIONS = Object.freeze({
  [LOCALES.eng]: {
    [LOCALES.dan]: 'Danish',
    [LOCALES.deu]: 'German',
    [LOCALES.eng]: 'English (UK)',
    [LOCALES.epo]: 'Esperanto',
    [LOCALES.fra]: 'French',
    [LOCALES.fry]: 'Frisian (West)',
    [LOCALES.isl]: 'Icelandic',
    [LOCALES.nld]: 'Dutch',
    [LOCALES.nno]: 'Norwegian (Nynorsk)',
    [LOCALES.nob]: 'Norwegian (Bokmål)',
    [LOCALES.por]: 'Portuguese',
    [LOCALES.spa]: 'Spanish',
    [LOCALES.swe]: 'Swedish',
    [LOCALES.ita]: 'Italian',
    [LOCALES.vls]: 'Flamish',

    'proficiency_name-a1': 'A1: Beginner',
    'proficiency_description-a1': [
      // 'Spoken interaction: You can interact in a simple way provided the other person is prepared to repeat or rephrase things at a slower rate of speech and help me formulate what you are trying to say. You can ask and answer simple questions in areas of immediate need or on very familiar topics.',
      // 'Spoken production: You can use simple phrases and sentences to describe where you live and people you know.',
      // 'Listening: You can recognise familiar words and very basic phrases concerning yourself, your family and immediate concrete surroundings when people speak slowly and clearly.',
      'Reading: You can understand familiar names, words and very simple sentences, for example on notices and posters or in catalogues.',
      'Writing: You can write a short, simple postcard, for example sending holiday greetings. You can fill in forms with personal details, for example entering my name, nationality and address on a hotel registration form.',
    ],
    'proficiency_example-a1': '"Hello! My name is Maria. I live in a small house in London with my family. I have one brother and one sister. I like to eat apples and pears. What is your favourite fruit?"',
    'proficiency_name-a2': 'A2: Pre-intermediate',
    'proficiency_description-a2': [
      // 'Spoken interaction: You can communicate in simple and routine tasks requiring a simple and direct exchange of information on familiar topics and activities. You can handle very short social exchanges, even though I can\'t usually understand enough to keep the conversation going yourself.',
      // 'Spoken production: You can use a series of phrases and sentences to describe in simple terms your family and other people, living conditions, your educational background and your present or most recent job.',
      // 'Listening: You can understand phrases and the highest frequency vocabulary related to areas of most immediate personal relevance (e.g. very basic personal and family information, shopping, local area, employment). You can catch the main point in short, clear, simple messages and announcements.',
      'Reading: You can read very short, simple texts. You can find specific, predictable information in simple everyday material such as advertisements, prospectuses, menus and timetables and you can understand short simple personal letters.',
      'Writing: You can write short, simple notes and messages relating to matters in areas of immediate needs. You can write a very simple personal letter, for example thanking someone for something.',
    ],
    'proficiency_example-a2': '"Last weekend, I went to the park with my friends. We had a picnic with sandwiches and juice. The weather was sunny, and we played football. After that, we went to a café and had some ice cream. It was a fun day!"',
    'proficiency_name-b1': 'B1: Intermediate',
    'proficiency_description-b1': [
      // 'Spoken interaction: You can deal with most situations likely to arise whilst travelling in an area where the language is spoken. You can enter unprepared into conversation on topics that are familiar, of personal interest or pertinent to everyday life (e.g. family, hobbies, work, travel and current events).',
      // 'Spoken production: You can connect phrases in a simple way in order to describe experiences and events, your dreams, hopes and ambitions. You can briefly give reasons and explanations for opinions and plans. You can narrate a story or relate the plot of a book or film and describe your reactions.',
      // 'Listening: You can understand the main points of clear standard speech on familiar matters regularly encountered in work, school, leisure, etc. You can understand the main point of many radio or TV programmes on current affairs or topics of personal or professional interest when the delivery is relatively slow and clear.',
      'Reading: You can understand texts that consist mainly of high frequency every day or job-related language. You can understand the description of events, feelings and wishes in personal letters.',
      'Writing: You can write simple connected text on topics which are familiar or of personal interest. You can write personal letters describing experiences and impressions.',
    ],
    'proficiency_example-b1': '"I enjoy reading books, especially mystery novels. Recently, I finished a story about a detective who solved a difficult case. It was very interesting, and I couldn\'t stop reading. I like mysteries because they make me think and try to guess the ending."',
    'proficiency_name-b2': 'B2: Upper-intermediate',
    'proficiency_description-b2': [
      // 'Spoken interaction: You can interact with a degree of fluency and spontaneity that makes regular interaction with native speakers quite possible. You can take an active part in discussion in familiar contexts, accounting for and sustaining your views.',
      // 'Spoken production: You can present clear, detailed descriptions on a wide range of subjects related to your field of interest. You can explain a viewpoint on a topical issue giving the advantages and disadvantages of various options.',
      // 'Listening: You can understand extended speech and lectures and follow even complex lines of argument provided the topic is reasonably familiar. You can understand most TV news and current affairs programmes. You can understand the majority of films in standard dialect.',
      'Reading: You can read articles and reports concerned with contemporary problems in which the writers adopt particular attitudes or viewpoints. You can understand contemporary literary prose.',
      'Writing: You can write clear, detailed text on a wide range of subjects related to my interests. You can write an essay or report, passing on information or giving reasons in support of or against a particular point of view. You can write letters highlighting the personal significance of events and experiences.',
    ],
    'proficiency_example-b2': '"The concept of remote work has become increasingly popular in recent years. It offers flexibility and convenience for employees, allowing them to work from anywhere. However, it also presents challenges, such as maintaining productivity and communication with colleagues. Overall, I think the benefits outweigh the drawbacks."',
    'proficiency_name-c1': 'C1: Advanced',
    'proficiency_description-c1': [
      // 'Spoken interaction: You can express yourself fluently and spontaneously without much obvious searching for expressions. You can use language flexibly and effectively for social and professional purposes. You can formulate ideas and opinions with precision and relate your contribution skilfully to those of other speakers.',
      // 'Spoken production: You can present clear, detailed descriptions of complex subjects integrating sub-themes, developing particular points and rounding off with an appropriate conclusion.',
      // 'Listening: You can understand extended speech even when it is not clearly structured and when relationships are only implied and not signalled explicitly. You can understand television programmes and films without too much effort.',
      'Reading: You can understand long and complex factual and literary texts, appreciating distinctions of style. You can understand specialised articles and longer technical instructions, even when they do not relate to your field.',
      'Writing: You can express yourself in clear, well-structured text, expressing points of view at some length. You can write about complex subjects in a letter, an essay or a report, underlining what you consider to be the salient issues. You can select style appropriate to the reader in mind.',
    ],
    'proficiency_example-c1': '"Climate change is one of the most pressing issues of our time. While renewable energy sources such as wind and solar power are growing in importance, transitioning away from fossil fuels remains a significant challenge. Governments must collaborate with industries and communities to create sustainable policies that balance economic growth with environmental conservation."',
    'proficiency_name-c2': 'C2: Proficient',
    'proficiency_description-c2': [
      // 'Spoken interaction: You can take part effortlessly in any conversation or discussion and have a good familiarity with idiomatic expressions and colloquialisms. You can express yourself fluently and convey finer shades of meaning precisely. If you do have a problem you can backtrack and restructure around the difficulty so smoothly that other people are hardly aware of it.',
      // 'Spoken production: You can present a clear, smoothly-flowing description or argument in a style appropriate to the context and with an effective logical structure which helps the recipient to notice and remember significant points.',
      // 'Listening: You have no difficulty in understanding any kind of spoken language, whether live or broadcast, even when delivered at fast native speed, provided. You have some time to get familiar with the accent.',
      'Reading: You can read with ease virtually all forms of the written language, including abstract, structurally or linguistically complex texts such as manuals, specialised articles and literary works.',
      'Writing: You can write clear, smoothly-flowing text in an appropriate style. You can write complex letters, reports or articles which present a case with an effective logical structure which helps the recipient to notice and remember significant points. You can write summaries and reviews of professional or literary works.',
    ],
    'proficiency_example-c2': '"The nuances of linguistic evolution reveal much about cultural and societal shifts over time. For instance, the adoption of loanwords often signals a period of cultural exchange or influence. Analysing such patterns not only enhances our understanding of language development but also offers profound insights into historical relationships between civilizations. This dynamic interplay underscores the complexity and interconnectedness of human communication."',

    'prompt-context': 'You are an expert in and teacher of {%t:{%s:targetLanguage%}%}. The user is studying {%t:{%s:targetLanguage%}%}. The user already masters the language at CEFR level {%s:proficiencyLevel%}. This means that the user already has the following skills: "{%t:proficiency_description-{%s:proficiencyLevel%}%}". However, the user wants to improve their proficiency further.',
    'prompt-comprehension': 'Write a reading and writing exercise where the user receives a text in {%t:{%s:targetLanguage%}%} along with a question in {%t:{%s:sourceLocale%}%} about the text, to which the user must respond in {%t:{%s:targetLanguage%}%}. Do not provide any further instructions, explanations, or answers to the user. Always write in plain text without any formatting, labels, headings, or lists.',
    'prompt-comprehension-follow_up': 'Provide feedback on the reading and writing exercise given. Offer concise feedback on the {%t:{%s:targetLanguage%}%} with in-depth analysis that is clear enough for the user\'s level of knowledge. Write the feedback in {%t:{%s:sourceLocale%}%}. Focus exclusively on linguistic aspects and ignore content-related evaluations or interpretations of the message. Always write in plain text without any formatting, labels, headings, or lists.',
    'prompt-conversation': 'You will simulate a conversation with the user in {%t:{%s:targetLanguage%}%}. Do not provide any further instructions or explanations to the user. Always write in plain text without any formatting, labels, headings, or lists. Write the first message in the conversation, immediately introducing a topic to discuss.',
    'prompt-conversation-follow_up': 'You are simulating a conversation with the user in {%t:{%s:targetLanguage%}%}. First, provide brief, in-depth feedback on the message in {%t:{%s:sourceLocale%}%}, focusing solely on linguistic aspects and ignoring any content-related evaluations or interpretations. Then, respond to the message in {%t:{%s:targetLanguage%}%}. Do not provide any further instructions or explanations to the user. Always write in plain text without any formatting, labels, headings, or lists.',
    'prompt-clarification': 'The user has a question below, answer it concisely with in-depth feedback, appropriate to the user\'s proficiency level. Answer the question {%t:{%s:sourceLocale%}%} and provide examples in {%t:{%s:targetLanguage%}%} where appropriate. Always write in plain text without any formatting, labels, headings, or lists. Do not answer the question if it is not language-related.',
    'prompt-reading': 'Write a text in {%t:{%s:targetLanguage%}%}, but for every paragraph written write the same paragraph below in {%t:{%s:sourceLocale%}%} as well. Don\'t output any content in regards to the users learning journey, focus on creating a enjoyable text to practise reading. Always write in plain text without any formatting, labels, headings, or lists.',
    'prompt-reading-topic': 'The generate text should be about the following topic:',
    'prompt-rewrite': 'Rewrite the user provided text into {%t:{%s:targetLanguage%}%} at the users CEFR level of {%s:proficiencyLevel%}. Ensure no information is lost when translating. Always write in plain text without any additional commentary.',
    'prompt-story': 'You and the user will collaboratively write a story by taking turns adding sections. Begin by writing the first section of the story in {%t:{%s:targetLanguage%}%}, introducing an engaging theme or setting. Focus on having fun and practising the language. Do not include any additional instructions, explanations, formatting, labels, or headings.',
    'prompt-story-follow_up': 'You are continuing the collaborative story-writing session with the user. First, provide concise, in-depth feedback in {%t:{%s:sourceLocale%}%} on the user\'s latest section, focusing solely on linguistic aspects and suggesting improvements. Avoid any comments about the story\'s plot, logic, or content. Then, add your next section of the story in {%t:{%s:targetLanguage%}%}. Write your response in plain text without any formatting, labels, or headings.',
    'prompt-topic': ' Incorporate the following topic into your message "{%topic%}".',
    'prompt-vocabulary': 'Write a word in {%t:{%s:targetLanguage%}%} along with its definition in {%t:{%s:sourceLocale%}%}. The user will then write a sentence in {%t:{%s:targetLanguage%}%} in which this word must be used. Take into account the user\'s skill and language level. Do not provide any additional instructions, explanations, or the answer to the user. Always write in plain text without any formatting, labels, headings, or lists.',
    'prompt-vocabulary-follow_up': 'Provide feedback on the sentence in which the user has answered. Check whether the word has been used correctly in the sentence. Provide concise feedback on the {%t:{%s:targetLanguage%}%} with considerable depth that is clear enough for the user\'s level of knowledge. Write the feedback in {%t:{%s:sourceLocale%}%}. Focus exclusively on linguistic aspects and ignore content-related evaluations or interpretations of the message. Always write in plain text without any formatting, labels, headings, or lists.',
    'prompt-typing': 'Write a text in {%t:{%s:targetLanguage%}%}. The text should be suitable for typing practice. Use common words appropriate for the user\'s skill and language level. Avoid special characters. The text should be {%typingLength%} in length. Always write in plain text without any formatting, labels, headings, or lists.',

    'prompt-translate': 'The user has requested a translation of the selected text. Translate all the {%t:{%s:sourceLocale%}%} into {%t:{%s:targetLanguage%}%} and {%t:{%s:targetLanguage%}%} into {%t:{%s:sourceLocale%}%}. Do not provide any further instructions or explanations to the user. Always write in plain text without any formatting, labels, headings, or lists.',
    'prompt-translate-user': 'Translate the selected text in {%t:{%s:sourceLocale%}%}. The user has selected the following text: "{%s:selection.text%}".',
    'prompt-translate-context': 'It was selected from the context: "{%s:selection.context%}". Translate only the selected text and not the entire context.',
    'prompt-explain': 'The users has requested an explanation of the text. Delve into all the details of the text and provide a clear and concise explanation. Provide additional examples if it fits the explanation. Always write in plain text without any formatting, labels, headings, or lists.',
    'prompt-explain-user': 'Explain the selected text in {%t:{%s:sourceLocale%}%}. The user has selected the following text: "{%s:selection.text%}".',
    'prompt-explain-context': 'It was selected from the context: "{%s:selection.context%}". Explain only the selected text and not the entire context.',

    'greeting': 'Hi!',
    'credits-link': 'Made by {%name%}',

    'button-answer': 'Answer',
    'button-ask': 'Ask',
    'button-close': 'Close',
    'button-generate': 'Generate',
    'button-go_back': 'Go back',
    'button-reload': 'Reload',
    'button-reply': 'Reply',
    'button-reset': 'Reset',
    'button-rewrite': 'Rewrite',
    'context-translate': 'Translate selection',
    'context-explain': 'Explain selection',
    'context-copy': 'Copy selection',
    'select_an_option': 'Select an option',

    'api_model-temperature_none': 'None',
    'api_model-temperature_low': 'Low',
    'api_model-temperature_medium': 'Average',
    'api_model-temperature_high': 'High',

    'banner-update_now': 'There is an update available, click here to update now!',

    'popup-explain': 'Explain the text below:',
    'popup-translate': 'Translate the text below:',

    'setup-source_language': 'So, you want to improve your proficiency in a language? Let this app help you practise. We need to start by choosing a language you already know.',
    'setup-target_language': 'Now the next step, which language would you like to learn?',
    'setup-proficiency_level': 'How proficient would you say you already are in the language? See the explanation below along with an example text to get an idea of what kind of texts to expect.',
    'setup-topics_of_interest': 'It\'s much more enjoyable if the exercises sometimes feature a topic you find interesting. Therefore, fill in a few topics below that can regularly appear. Think mainly of any hobbies or other interests. The more, the better!',
    'setup-api_provider': 'This app uses a "Large Language Model" to generate and assess exercises. You may have heard about it, everyone in the tech sector keeps talking about developments in artificial intelligence. The app uses an LLM, but doesn\'t come with one, so we need to link it to an LLM provider. Which provider would you like to use?',
    'setup-api_credentials': 'Now, the important question is the key. You can get it from the developer\'s dashboard. It probably states that you shouldn\'t share it with third parties. Fortunately, this app never sends the key elsewhere. Still not convinced? Check out the app\'s source code or wait for a version that no longer requires this.',
    'setup-test_api_credentials': 'Test key',
    'setup-api_credentials_untested': 'Test the credentials before proceeding.',
    'setup-api_credentials_tested': 'The provided key works. Now you can choose which "Large Language Model" to use. Not sure what the differences are? No problem, we recommend selecting "{%preferredModel%}". That should be fine.',
    'setup-outro': 'Good luck and have fun!',
    'setup-next': 'Start practising',

    'overview-current_profile': 'With which profile would you like to practise?',
    'overview-intro': 'What would you like to do?',
    'overview-clarification-description': 'Get explanations about {%t:{%s:targetLanguage%}%}, such as a grammar rule like conjugations or cases.',
    'overview-clarification-title': 'Ask for clarification',
    'overview-comprehension-description': 'You\'ll receive a short text along with a question to answer.',
    'overview-comprehension-title': 'Answer questions',
    'overview-conversation-description': 'A short conversation will be simulated, for example about ordering food or discussing a hobby.',
    'overview-conversation-title': 'Practise conversations',
    'overview-migrate-description': 'Export, import or reset your data.',
    'overview-migrate-title': 'Manage data',
    'overview-options-description': 'Change the language you want to learn, the topics you find interesting, or the LLM used.',
    'overview-options-title': 'Change settings',
    'overview-reading-description': 'You can generate a text where each paragraph is available in both languages.',
    'overview-reading-title': 'Read texts',
    'overview-rewrite-description': 'You can let the LLM rewrite a text into {%t:{%s:targetLanguage%}%} at your proficiency level.',
    'overview-rewrite-title': 'Rewrite texts',
    'overview-story-description': 'You\'ll take turns writing a story piece by piece.',
    'overview-story-title': 'Write a story',
    'overview-vocabulary-description': 'You\'ll receive a word together with its definition, you then respond with a with a sentence using that word.',
    'overview-vocabulary-title': 'Learn words',

    'options-source_language': 'Which language do you already know?',
    'options-profile_management': 'Below you can see a list of profiles. With the edit and delete buttons you can manage these.',
    'options-select_profile': 'With which profile would you like to practise?',
    'options-profile_delete': 'Delete',
    'options-profile_update': 'Edit',
    'options-profile_add': 'Add new profile',
    'options-api_provider': 'This app uses a "Large Language Model" to generate and assess exercises. Which provider would you like to link?',
    'options-api_credentials': 'Enter the key from the developer\'s dashboard.',
    'options-test_api_credentials': 'Test key',
    'options-api_credentials_untested': 'Test the credentials before proceeding.',
    'options-api_credentials_tested': 'The provided key works. Choose a "Large Language Model" to use, we recommend "{%preferredModel%}".',
    'options-api_model_advanced_settings': 'Advanced model settings',
    'options-api_model_temperature-select': 'What should the text variability be? Increasing the variability creates more creative and diverse output, but setting it too high can result in gibberish. The default value is 0.5.',

    'profile-target_language': 'Which language would you like to learn?',
    'profile-proficiency_level': 'How proficient are you in the language? See the explanation below along with an example text to get an idea of what kind of texts to expect.',
    'profile-topics_of_interest': 'Fill in a few topics below that can regularly appear in the exercises.',

    'migrate-export': 'Export the data the app has stored. It is important to note the export does not contain the API key used to access an LLM provider. When importing data this will need to be applied again.',
    'migrate-export_button': 'Download your data',
    'migrate-import': 'Import previously exported data. When an import has been done it cannot be undone, so be careful! It is recommended to export your existing data before overwriting it with a new import. After the import has been successful you will be brought back to the setup screen with the import applied.',
    'migrate-import_button': 'Upload your data',
    'migrate-reset': 'Remove all the data and reset the app. Once performed this action can not be undone.',
    'migrate-reset_button': 'Reset',
    'migrate-reset_button-confirmation': 'I confirm that I am absolutely certain I want to reset!',

    'statistics-activity_per_category': 'You have already read {%s:statisticReadingActivity%} texts, let {%s:statisticRewriteActivity%} texts be rewritten, answered {%s:statisticComprehensionActivity%} questions, {%s:statisticVocabularyActivity%} words practised, typed out {$s:statisticTypingActivity$} texts, sent {%s:statisticConversationActivity%} messages, told {%s:statisticStoryActivity%} stories, and asked {%s:statisticClarificationActivity%} questions.',
    'statistics-no_activity': 'Unfortunately, you haven\'t completed enough activities yet to display here. Go to the overview and choose an exercise to start. Your progress will be tracked in the background.',
    'statistics-no_activity_streak': 'Currently you have no ongoing activity streak. You can build one by completing at least one exercise on consecutive days.',
    'statistics-current_activity_streak': 'Your current activity streak is {%s:statisticCurrentActivityStreak%} days long. Don\'t loose it and practise before midnight to extend it!',
    'statistics-extended_activity_streak': 'Good job, you extended your streak for today! Your current activity streak is {%s:statisticCurrentActivityStreak%} days long.',
    'statistics-longest_activity_streak': 'Your longest activity streak ever was {%s:statisticLongestActivityStreak%} days long.',

    'clarification-intro': 'What would you like more information about?',
    'clarification-placeholder': 'I\'m wondering about...',
    'comprehension-intro': 'In a moment you\'ll read a text in {%t:{%s:targetLanguage%}%} along with a question about it. Answer the question in {%t:{%s:targetLanguage%}%}. You\'ll then receive some feedback regarding your answer.',
    'conversation-intro': 'In a moment you\'ll simulate a conversation in {%t:{%s:targetLanguage%}%}, so always respond in {%t:{%s:targetLanguage%}%}. You may receive feedback along the way.',
    'reading-intro': 'You will be reading a text where each paragraph is written in both {%t:{%s:targetLanguage%}%} and {%t:{%s:sourceLanguage%}%} allowing you to practise your reading. You can optionally provide a topic for the text to be about.',
    'reading-placeholder': 'I want to read about...',
    'rewrite-intro': 'You can enter in a text below. The LLM will ensure the text is in {%t:{%s:sourceLanguage%}%} at your selected proficiency level.',
    'rewrite-placeholder': 'I want to let rewrite...',
    'story-intro': 'You\'re about to write a story in {%t:{%s:targetLanguage%}%} where, in turns, you add a piece. Don\'t worry about whether the story is good, logical, or well-founded; just make sure you practice the language. Therefore, always respond in {%t:{%s:targetLanguage%}%}. In between, you might receive some feedback on your writing.',
    'vocabulary-intro': 'In a moment you\'ll read a word together with its definition in {%t:{%s:targetLanguage%}%}. Answer with a scentence that uses the word in {%t:{%s:targetLanguage%}%}. You\'ll then receive some feedback regarding your answer.',

    'typing-intro': 'You\'re about to retype a text in in {%t:{%s:targetLanguage%}%} below. The cursor will advance as you type each character correctly. You can specify a topic for as well as the length of the text below.',
    'typing-completed': 'Exercise completed!',
    'typing-placeholder': 'I want to type about...',
    'typing-results-summary': 'The text consists of {%words%} words and {%characters%} characters. You typed the text in {%minutes%} minutes and {%seconds%} seconds, which means you typed at an average of {%wpm%} words per minute. You made {%mistakes%} mistakes, resulting in an accuracy of {%accuracy%}%.',
    'typing-restart': 'Restart',
    'typing-length-select': 'Text length',
    'typing-length-short': 'Short (≈50 words)',
    'typing-length-medium': 'Medium (≈100 words)',
    'typing-length-long': 'Long (≈200 words)',
    'typing-length-extra_long': 'Extra long (≈400 words)',
    'overview-typing-title': 'Practise typing',
    'overview-typing-description': 'Improve your typing speed and accuracy in {%t:{%s:targetLanguage%}%}.',
  },
  [LOCALES.nld]: {
    [LOCALES.dan]: 'Deens',
    [LOCALES.deu]: 'Duits',
    [LOCALES.eng]: 'Engels (VK)',
    [LOCALES.epo]: 'Esperanto',
    [LOCALES.fra]: 'Frans',
    [LOCALES.fry]: 'Fries (West)',
    [LOCALES.isl]: 'IJslands',
    [LOCALES.ita]: 'Italiaans',
    [LOCALES.nld]: 'Nederlands',
    [LOCALES.nno]: 'Noors (Nynorsk)',
    [LOCALES.nob]: 'Noors (Bokmål)',
    [LOCALES.por]: 'Portugees',
    [LOCALES.spa]: 'Spaans',
    [LOCALES.swe]: 'Zweeds',
    [LOCALES.vls]: 'Vlaams',

    'proficiency_name-a1': 'A1: Beginner',
    'proficiency_description-a1': [
      'Lezen: Je kunt vertrouwde namen, woorden en zeer eenvoudige zinnen begrijpen, bijvoorbeeld op aankondigingen en posters of in catalogi.',
      'Schrijven: Je kunt een korte, eenvoudige ansichtkaart schrijven, bijvoorbeeld om vakantiegroeten te sturen. Je kunt formulieren invullen met persoonlijke gegevens, zoals je naam, nationaliteit en adres op een hotelregistratieformulier.',
    ],
    'proficiency_example-a1': '"Hallo! Ik heet Maria. Ik woon in een klein huis in Amsterdam met mijn familie. Ik heb een broer en een zus. Ik hou van appels en peren. Wat is jouw favoriete fruit?"',
    'proficiency_name-a2': 'A2: Pre-intermediair',
    'proficiency_description-a2': [
      'Lezen: Je kunt zeer korte, eenvoudige teksten lezen. Je kunt specifieke, voorspelbare informatie vinden in eenvoudig alledaags materiaal zoals advertenties, folders, menu\'s en dienstregelingen, en je kunt korte eenvoudige persoonlijke brieven begrijpen.',
      'Schrijven: Je kunt korte, eenvoudige notities en berichten schrijven die betrekking hebben op zaken van directe noodzaak. Je kunt een heel eenvoudige persoonlijke brief schrijven, bijvoorbeeld om iemand te bedanken.',
    ],
    'proficiency_example-a2': '"Afgelopen weekend ging ik met mijn vrienden naar het park. We hadden een picknick met broodjes en sap. Het weer was zonnig, en we speelden voetbal. Daarna gingen we naar een café en aten we ijs. Het was een leuke dag!"',
    'proficiency_name-b1': 'B1: Intermediair',
    'proficiency_description-b1': [
      'Lezen: Je kunt teksten begrijpen die voornamelijk bestaan uit alledaagse of werkgerelateerde taal met een hoge frequentie. Je kunt de beschrijving van gebeurtenissen, gevoelens en wensen begrijpen in persoonlijke brieven.',
      'Schrijven: Je kunt eenvoudige, samenhangende teksten schrijven over onderwerpen die vertrouwd of van persoonlijk belang zijn. Je kunt persoonlijke brieven schrijven waarin je ervaringen en indrukken beschrijft.',
    ],
    'proficiency_example-b1': '"Ik lees graag boeken, vooral detectiveverhalen. Onlangs heb ik een verhaal gelezen over een rechercheur die een moeilijk mysterie oploste. Het was erg interessant, en ik kon niet stoppen met lezen. Ik hou van dit genre omdat het me aan het denken zet en ik probeer het einde te raden."',
    'proficiency_name-b2': 'B2: Upper-intermediair',
    'proficiency_description-b2': [
      'Lezen: Je kunt artikelen en rapporten lezen die gaan over actuele problemen waarin de schrijvers specifieke houdingen of standpunten innemen. Je kunt eigentijdse literaire proza begrijpen.',
      'Schrijven: Je kunt duidelijke, gedetailleerde teksten schrijven over een breed scala aan onderwerpen die verband houden met je interesses. Je kunt een essay of rapport schrijven waarin je informatie doorgeeft of redenen geeft ter ondersteuning of afwijzing van een bepaald standpunt. Je kunt brieven schrijven waarin je de persoonlijke betekenis van gebeurtenissen en ervaringen benadrukt.',
    ],
    'proficiency_example-b2': '"Het concept van thuiswerken is de laatste jaren steeds populairder geworden. Het biedt flexibiliteit en gemak voor werknemers, waardoor ze overal kunnen werken. Maar het brengt ook uitdagingen met zich mee, zoals het behouden van productiviteit en communicatie met collega\'s. Over het algemeen denk ik dat de voordelen groter zijn dan de nadelen."',
    'proficiency_name-c1': 'C1: Gevorderd',
    'proficiency_description-c1': [
      'Lezen: Je kunt lange en complexe feitelijke en literaire teksten begrijpen en waarderen, waarbij je onderscheid maakt in stijl. Je kunt gespecialiseerde artikelen en langere technische instructies begrijpen, zelfs wanneer deze niet in je vakgebied liggen.',
      'Schrijven: Je kunt jezelf duidelijk en goed gestructureerd uitdrukken in tekst, waarbij je standpunten uitvoerig uiteenzet. Je kunt schrijven over complexe onderwerpen in een brief, essay of rapport, en daarbij benadrukken wat je als de belangrijkste kwesties beschouwt. Je kunt een stijl kiezen die geschikt is voor de beoogde lezer.',
    ],
    'proficiency_example-c1': '"Klimaatverandering is een van de meest urgente problemen van deze tijd. Hoewel hernieuwbare energiebronnen zoals wind- en zonne-energie steeds belangrijker worden, blijft de overgang van fossiele brandstoffen een grote uitdaging. Overheden moeten samenwerken met industrieën en gemeenschappen om duurzame beleidsmaatregelen te creëren die economische groei en milieubescherming in balans brengen."',
    'proficiency_name-c2': 'C2: Proficient',
    'proficiency_description-c2': [
      'Lezen: Je kunt vrijwel alle vormen van geschreven taal met gemak lezen, inclusief abstracte, structureel of taalkundig complexe teksten zoals handleidingen, gespecialiseerde artikelen en literaire werken.',
      'Schrijven: Je kunt heldere, vloeiende teksten schrijven in een passende stijl. Je kunt complexe brieven, rapporten of artikelen schrijven die een zaak presenteren met een effectieve logische structuur die de ontvanger helpt belangrijke punten op te merken en te onthouden. Je kunt samenvattingen en recensies schrijven van professionele of literaire werken.',
    ],
    'proficiency_example-c2': '"De nuances van taalontwikkeling onthullen veel over culturele en maatschappelijke veranderingen door de tijd heen. Zo duidt de opname van leenwoorden vaak op een periode van culturele uitwisseling of invloed. Het analyseren van dergelijke patronen verrijkt niet alleen ons begrip van taalontwikkeling, maar biedt ook waardevolle inzichten in historische relaties tussen beschavingen. Deze dynamiek benadrukt de complexiteit en verbondenheid van menselijke communicatie."',

    'prompt-context': 'Je bent een expert in en docent van het {%t:{%s:targetLanguage%}%}. De gebruiker is {%t:{%s:targetLanguage%}%} aan het studeren. De gebruiker beheerst de taal al tot CEFR niveau {%s:proficiencyLevel%}. Dit betekend dat de gebruiker al de volgende vaardigheden beheerst: "{%t:proficiency_description-{%s:proficiencyLevel%}%}" Maar de gebruiker wil de taal nog beter leren beheersen.',
    'prompt-comprehension': 'Schrijf een lees en schrijfvaardigheidsoefening waarbij de gebruiker een tekst in het {%t:{%s:targetLanguage%}%} krijgt samen met een vraag in het {%t:{%s:sourceLocale%}%} over de tekst waarop de gebruiker moet antwoorden in het {%t:{%s:targetLanguage%}%}. Geef geen verdere instructies, uitleg of het antwoord aan de gebruiker. Schrijf altijd in platte tekst zonder enige opmaak, labels, kopteksten of lijsten.',
    'prompt-comprehension-follow_up': 'Geef feedback op de lees en schrijfvaardigheidsoefening die gesteld is. Geef beknopt feedback over het {%t:{%s:targetLanguage%}%} met veel diepgang dat duidelijk genoeg is voor het kennis niveau van de gebruiker. Schrijf de feedback in het {%t:{%s:sourceLocale%}%}. Richt je hierbij uitsluitend op taalkundige aspecten en negeer inhoudelijke evaluaties of interpretaties van het bericht. Schrijf altijd in platte tekst zonder enige opmaak, labels, kopteksten of lijsten.',
    'prompt-conversation': 'Je gaat met de gebruiker een gesprek simuleren in het {%t:{%s:targetLanguage%}%}. Geef geen verdere instructies of uitleg aan de gebruiker. Schrijf altijd in platte tekst zonder enige opmaak, labels, kopteksten of lijsten. Schrijf het eerste bericht in een gesprek dat al gelijk een onderwerp introduceert om het over te hebben.',
    'prompt-conversation-follow_up': 'Je bent met de gebruiker een gesprek aan het simuleren in het {%t:{%s:targetLanguage%}%}. Geef als antwoord op een bericht eerst beknopt feedback met veel diepgang dat duidelijk genoeg is voor het kennis niveau van de gebruiker in het {%t:{%s:sourceLocale%}%}. Richt je hierbij uitsluitend op taalkundige aspecten en negeer inhoudelijke evaluaties of interpretaties van het bericht. Ga daarna verder met het antwoorden op het bericht in het {%t:{%s:targetLanguage%}%}. Geef geen verdere instructies of uitleg aan de gebruiker. Schrijf altijd in platte tekst zonder enige opmaak, labels, kopteksten of lijsten.',
    'prompt-clarification': 'De gebruiker heeft onderstaande vraag, beantwoord de vraag beknopt met veel diepgang dat duidelijk genoeg is voor het kennis niveau van de gebruiker. Beantwoord de vraag in het {%t:{%s:sourceLocale%}%} geef voorbeelden in het {%t:{%s:targetLanguage%}%} waar nodig. Schrijf altijd in platte tekst zonder enige opmaak, labels, kopteksten of lijsten. Beantwoord de vraag niet als het absoluut niet taal gerelateerd is.',
    'prompt-reading': 'Schrijf een tekst in {%t:{%s:targetLanguage%}%}, maar schrijf na elke geschreven alinea dezelfde alinea eronder in {%t:{%s:sourceLocale%}%}. Geef geen inhoud weer die betrekking heeft op het leerproces van de gebruiker. Zorg voor het maken van een leuke tekst om het lezen mee te oefenen. Schrijf altijd in platte tekst zonder opmaak, labels of kopjes.',
    'prompt-reading-topic': 'De gegenereerde tekst moet over het volgende onderwerp gaan:',
    'prompt-rewrite': 'Herschrijf de door de gebruiker verstrekte tekst in {%t:{%s:targetLanguage%}%} op het CEFR-niveau {%s:proficiencyLevel%}. Zorg ervoor dat er geen informatie verloren gaat tijdens het vertalen. Schrijf altijd in platte tekst zonder extra commentaar.',
    'prompt-story': 'Jij en de gebruiker gaan samen een verhaal schrijven door om de beurt een gedeelte toe te voegen. Begin met het schrijven van de eerste sectie van het verhaal in {%t:{%s:targetLanguage%}%}, waarin je een boeiend thema of een interessante setting introduceert. Richt je op plezier hebben en het oefenen van de taal. Voeg geen extra instructies, uitleg, opmaak, labels of koppen toe.',
    'prompt-story-follow_up': 'Je zet de gezamenlijke sessie voor het schrijven van een verhaal met de gebruiker voort. Geef eerst korte, diepgaande feedback in {%t:{%s:sourceLocale%}%} op de laatste bijdrage van de gebruiker, waarbij je je uitsluitend richt op taalkundige aspecten en suggesties voor verbetering geeft. Maak geen opmerkingen over de plot, logica of inhoud van het verhaal. Voeg daarna jouw volgende gedeelte van het verhaal toe in {%t:{%s:targetLanguage%}%}. Schrijf je antwoord in platte tekst zonder opmaak, labels of koppen.',
    'prompt-topic': ' Verwerk het volgende onderwerp in jouw bericht "{%topic%}".',
    'prompt-vocabulary': 'Schrijf een woord in het {%t:{%s:targetLanguage%}%} samen met de definitie in het {%t:{%s:sourceLocale%}%}. De gebruiker zal vervolgens een zin in het {%t:{%s:targetLanguage%}%} schrijven waarin dit woord verwerkt moeten worden. Hou hierbij rekening met de vaardigheid en taalniveau van de gebruiker. Geef geen verdere instructies, uitleg of het antwoord aan de gebruiker. Schrijf altijd in platte tekst zonder enige opmaak, labels, kopteksten of lijsten.',
    'prompt-vocabulary-follow_up': 'Geef feedback op de zin waarmee de gebruik antwoord heeft gegeven. Controleer of de woord juist gebruikt is in de zin. Geef beknopt feedback over het {%t:{%s:targetLanguage%}%} met veel diepgang dat duidelijk genoeg is voor het kennis niveau van de gebruiker. Schrijf de feedback in het {%t:{%s:sourceLocale%}%}. Richt je hierbij uitsluitend op taalkundige aspecten en negeer inhoudelijke evaluaties of interpretaties van het bericht. Schrijf altijd in platte tekst zonder enige opmaak, labels, kopteksten of lijsten.',
    'prompt-typing': 'Schrijf een tekst in het {%t:{%s:targetLanguage%}%}. De tekst moet geschikt zijn voor type oefening. Gebruik veelvoorkomende woorden die passend zijn bij het vaardigheid en taalniveau van de gebruiker. Vermijd speciale tekens. De tekst moet {%typingLength%} zijn in lengte. Schrijf altijd in platte tekst zonder enige opmaak, labels, kopteksten of lijsten.',

    'prompt-translate': 'De gebruiker heeft een vertaling van de geselecteerde tekst aangevraagd. Vertaal alle {%t:{%s:sourceLocale%}%} naar {%t:{%s:targetLanguage%}%} en {%t:{%s:targetLanguage%}%} naar {%t:{%s:sourceLocale%}%}. Geef de gebruiker geen verdere instructies of uitleg. Schrijf altijd in platte tekst zonder opmaak, labels, kopjes of lijsten.',
    'prompt-translate-user': 'Vertaal de geselecteerde tekst in {%t:{%s:sourceLocale%}%}. De gebruiker heeft de volgende tekst geselecteerd: "{%s:selection.text%}".',
    'prompt-translate-context': 'Deze is geselecteerd uit de context: "{%s:selection.context%}". Let op vertaal niet de context, maar alleen de selectie.',
    'prompt-explain': 'De gebruiker heeft een uitleg van de tekst aangevraagd. Ga diep in op alle details van de tekst en geef een duidelijke en beknopte uitleg. Geef aanvullende voorbeelden als dit past bij de uitleg. Schrijf altijd in platte tekst zonder opmaak, labels, kopjes of lijsten.',
    'prompt-explain-user': 'Leg de geselecteerde tekst uit in {%t:{%s:sourceLocale%}%}. De gebruiker heeft de volgende tekst geselecteerd: "{%s:selection.text%}".',
    'prompt-explain-context': 'Deze is geselecteerd uit de context: "{%s:selection.context%}". Let op leg niet niet de context uit, maar alleen de selectie.',

    'greeting': 'Hoi!',
    'credits-link': 'Gemaakt door {%name%}',

    'button-answer': 'Antwoorden',
    'button-ask': 'Vragen',
    'button-close': 'Sluiten',
    'button-generate': 'Genereren',
    'button-go_back': 'Ga terug',
    'button-reload': 'Herladen',
    'button-reply': 'Antwoorden',
    'button-reset': 'Resetten',
    'button-rewrite': 'Herschrijven',
    'context-translate': 'Vertaal selectie',
    'context-explain': 'Leg selectie uit',
    'context-copy': 'Kopieer selectie',
    'select_an_option': 'Selecteer een optie',

    'api_model-temperature_none': 'Geen',
    'api_model-temperature_low': 'Laag',
    'api_model-temperature_medium': 'Gemiddeld',
    'api_model-temperature_high': 'Hoog',

    'banner-update_now': 'Er is een update beschikbaar, klik hier om te updaten!',

    'popup-explain': 'Leg de text hieronder uit:',
    'popup-translate': 'Vertaal de text hieronder:',

    'setup-source_language': 'Dus jij wilt een taal beter beheersen? Laat deze app je helpen met oefenen. We moeten beginnen met een taal te kiezen die je al kent.',
    'setup-target_language': 'Nu het volgende probleem, welke taal wil je leren?',
    'setup-proficiency_level': 'Hoe goed zou jij zeggen dat je al in de taal bent? Zie de uitleg hieronder samen met een voorbeeld tekst om een idee te geven wat voor teksten je kan verwachten.',
    'setup-topics_of_interest': 'Het is natuurlijk veel leuker als er af en toe een onderwerp voorbij komt wat je interessant vind. Vul daarom hieronder een aantal onderwerpen in die regelmatig terug kunnen komen. Denk hierbij vooral aan enige hobbies of andere interesses. Des te meer des te beter!',
    'setup-api_provider': 'Om te oefenen wordt gebruik gemaakt van een "Large Language Model". Je hebt er vast wel van gehoord, iedereen in de technologie sector houdt maar niet op over de ontwikkelingen in kunstmatige intelligentie. De app maakt dus gebruik van een LLM om de oefening te maken en te beoordelen. Helaas komt de app niet zelf met een eentje, dus moeten we een koppeling maken met een LLM. Met welke aanbieder wil je een koppeling maken?',
    'setup-api_credentials': 'Nu is de grote vraag nog de sleutel. Deze kun je bij het ontwikkelaars paneel. Er staat waarschijnlijk al bij vermeld dat je deze niet met derden moet delen. Gelukkig stuurt deze app nooit de sleutel door. Vertrouw je het toch niet? Bekijk dan de brondcode van deze app, of wacht wellicht tot er een variant gemaakt is waarbij dat niet meer nodig is.',
    'setup-test_api_credentials': 'Sleutel testen',
    'setup-api_credentials_untested': 'Test de gegevens eerst voordat je verder gaat.',
    'setup-api_credentials_tested': 'De opgegeven sleutel werkt, nu kan je nog kiezen uit welke "Large Language Model" je wilt gebruiken. Heb je geen idee wat de verschillen zijn? Geen probleem, we raden aan dat je "{%preferredModel%}" selecteert, daarmee komt het vast wel goed.',
    'setup-outro': 'Heel veel succes en plezier!',
    'setup-next': 'Begin met oefenen',

    'overview-current_profile': 'Met welk profiel wil je oefenen?',
    'overview-intro': 'Wat wil je gaan doen?',
    'overview-clarification-description': 'Krijg verduidelijk over het {%t:{%s:targetLanguage%}%}, bijvoorbeeld een grammatica regel zoals vervoegingen en naamvallen.',
    'overview-clarification-title': 'Vraag om uitleg',
    'overview-comprehension-description': 'Je krijgt een korte tekst samen met een vraag die je kan beantwoorden.',
    'overview-comprehension-title': 'Beantwoord vragen',
    'overview-conversation-description': 'Er zal een kort gesprekje gespeeld worden over bijvoorbeeld het bestellen van eten of over een hobby.',
    'overview-conversation-title': 'Oefen gesprekken',
    'overview-migrate-description': 'Exporteer, importeer of reset uw gegevens.',
    'overview-migrate-title': 'Gegevens beheren',
    'overview-options-description': 'Pas aan welke taal je wilt leren, welke onderwerpen je interessant vind of welke LLM gebruikt wordt.',
    'overview-options-title': 'Pas instellingen aan',
    'overview-reading-description': 'Je kunt een tekst genereren waarbij elke alinea in beide talen beschikbaar is.',
    'overview-reading-title': 'Lees teksten',
    'overview-rewrite-description': 'Je kunt de LLM een tekst laten herschrijven in {%t:{%s:targetLanguage%}%} op jouw vaardigheidsniveau.',
    'overview-rewrite-title': 'Teksten herschrijven',
    'overview-story-description': 'Je gaat omste beurten stukje voor stukje een verhaal schrijven.',
    'overview-story-title': 'Schrijf een verhaal',
    'overview-vocabulary-description': 'Je krijgt een woord samen met de definitie ervan vervolgens schrijf je een zin dat dit woord gebruikt.',
    'overview-vocabulary-title': 'Leer woorden',

    'options-source_language': 'Welke taal ken je al?',
    'options-profile_management': 'Hieronder zie je een lijst aan profielen. Met de bewerk en verwijder knoppen kun je deze beheren.',
    'options-select_profile': 'Met welke profiel wil je oefenen?',
    'options-profile_delete': 'Verwijder',
    'options-profile_update': 'Bewerk',
    'options-profile_add': 'Nieuw profiel toevoegen',
    'options-api_provider': 'Om te oefenen wordt gebruik gemaakt van een "Large Language Model" om de oefening te maken en te beoordelen. Met welke aanbieder wil je een koppeling maken?',
    'options-api_credentials': 'Voer de sleutel uit het ontwikkelaars paneel in.',
    'options-test_api_credentials': 'Sleutel testen',
    'options-api_credentials_untested': 'Test de gegevens eerst voordat je verder gaat.',
    'options-api_credentials_tested': 'De opgegeven sleutel werkt. Kies een "Large Language Model" dat je wilt gebruiken, wij raden "{%preferredModel%}" aan.',
    'options-api_model_advanced_settings': 'Geadvanceerde model instellingen',
    'options-api_model_temperature-select': 'Wat moet de variabiliteit zijn? Door de variabiliteit te verhogen, vergroot je de creativiteit en variatie in de gegenereerde teksten, maar als deze te hoog staat kan het resulteren in onzin. De standaardwaarde is 0.5.',

    'profile-target_language': 'Welke taal wil je leren?',
    'profile-proficiency_level': 'Hoe vaardig ben je al in de taal? Zie de uitleg hieronder samen met een voorbeeld tekst om een idee te geven wat voor teksten je kan verwachten.',
    'profile-topics_of_interest': 'Vul hieronder een aantal onderwerpen in die regelmatig terug kunnen komen in de oefening.',

    'migrate-export': 'Exporteer de gegevens die de app heeft opgeslagen. Het is belangrijk op te merken dat de export niet de API-sleutel bevat die wordt gebruikt om toegang te krijgen tot een LLM-provider. Bij het importeren van gegevens moet deze opnieuw worden toegepast.',
    'migrate-export_button': 'Download uw gegevens',
    'migrate-import': 'Importeer eerder geëxporteerde gegevens. Eenmaal geïmporteerd, kan het niet ongedaan worden gemaakt, dus wees voorzichtig! Het wordt aanbevolen om uw bestaande gegevens te exporteren voordat u ze overschrijft met een nieuwe import. Na een succesvolle import wordt u teruggebracht naar het instellingenscherm met de toegepaste import.',
    'migrate-import_button': 'Upload uw gegevens',
    'migrate-reset': 'Verwijder alle gegevens en reset de app. Eenmaal uitgevoerd kan deze actie niet ongedaan worden gemaakt.',
    'migrate-reset_button': 'Reset',
    'migrate-reset_button-confirmation': 'Ik bevestig dat ik absoluut zeker ben dat ik wil resetten!',

    'statistics-activity_per_category': ' Je hebt al {%s:statisticReadingActivity%} teksten gelezen, {%s:statisticRewriteActivity%} teksten laten herschrijven, {%s:statisticComprehensionActivity%} vragen beantwoord, {%s:statisticVocabularyActivity%} woorden geoefened, {%s:statisticTypingActivity%} teksten getypt, {%s:statisticConversationActivity%} berichten verstuurd, {%s:statisticStoryActivity%} verhalen verteld en {%s:statisticClarificationActivity%} vragen gesteld.',
    'statistics-no_activity': 'Je hebt helaas nog niet genoeg activiteiten gedaan om hier weer te geven. Ga naar het overzicht en kies een oefening om te beginnen, op de achtergrond zal bijgehouden worden hoeveel je er al voltooid hebt.',
    'statistics-no_activity_streak': 'Op dit moment heb je geen lopende activiteitenreeks opgebouwd. Deze krijg je door op meerdere dagen op een rij minimaal één oefening te doen.',
    'statistics-current_activity_streak': 'Op dit moment is jouw activiteitenreeks {%s:statisticCurrentActivityStreak%} dagen lang. Verlies het niet en zorg ervoor dat je voor middernacht oefend!',
    'statistics-extended_activity_streak': 'Goed gedaan, je hebt jouw reeks voor vandaag verlengt! Op dit moment is jouw activiteitenreeks {%s:statisticCurrentActivityStreak%} dagen lang.',
    'statistics-longest_activity_streak': ' Jouw langste activiteitenreeks ooit was {%s:statisticLongestActivityStreak%} dagen lang.',

    'clarification-intro': 'Waar wil je meer over weten?',
    'clarification-placeholder': 'Ik vraag mij af...',
    'comprehension-intro': 'Je leest straks een tekst in het {%t:{%s:targetLanguage%}%} samen met een vraag erover, beantwoord de vraag in het {%t:{%s:targetLanguage%}%}. Vervolgens zal je enige verbeterpunten krijgen over jouw antwoord.',
    'conversation-intro': 'Je gaat straks een gesprek simuleren in het {%t:{%s:targetLanguage%}%} zorg daarom dat je ook altijd in het {%t:{%s:targetLanguage%}%} antwoord. Tussendoor zal je enige verbeterpunten kunnen ontvangen.',
    'reading-intro': 'Je zult een tekst lezen waarbij elke alinea zowel in {%t:{%s:targetLanguage%}%} als in {%t:{%s:sourceLanguage%}%} is geschreven, waardoor je je leesvaardigheid kunt oefenen. Je kunt optioneel een onderwerp opgeven waar de tekst over moet gaan.',
    'reading-placeholder': 'Ik wil lezen over...',
    'rewrite-intro': 'Je kunt hieronder een tekst invoeren. De LLM zorgt ervoor dat de tekst in {%t:{%s:sourceLanguage%}%} is op jouw geselecteerde vaardigheidsniveau.',
    'rewrite-placeholder': 'Ik wil laten herschrijven...',
    'story-intro': 'Je gaat straks een verhaal schrijven in het {%t:{%s:targetLanguage%}%} waarbij je omste beurten een stuk toevoegd. Maak je geen zorgen of het verhaal een goed, logisch en gegrond verhaal is, maar zorg vooral dat je de taal oefened. Zorg daarom dat je ook altijd in het {%t:{%s:targetLanguage%}%} antwoord. Tussendoor zal je enige verbeterpunten kunnen ontvangen.',
    'vocabulary-intro': 'Je leest straks een woord samen met de definitie ervan in het {%t:{%s:targetLanguage%}%}. Antwoord met een zin waar het woord ingebruikt wordt in het {%t:{%s:targetLanguage%}%}. Vervolgens zal je enige verbeterpunten krijgen over jouw antwoord.',

    'typing-intro': 'Je gaat straks een tekst overtypen in het {%t:{%s:targetLanguage%}%}. De cursor gaat verder als je elk teken correct typt. Je kunt hieronder een onderwerp opgeven waar je wilt dat de tekst over gaat samen met hoe lang de tekst moet zijn.',
    'typing-placeholder': 'Ik wil typen over...',
    'typing-completed': 'Oefening voltooid!',
    'typing-results-summary': 'De tekst bestaat uit {%words%} woorden en {%characters%} letters. Je hebt de tekst getypt in {%minutes%} minuten en {%seconds%} seconden dit betekend dat je gemiddeld {%wpm%} woorden per minuut hebt getypt. Je hebt {%mistakes%} fouten gemaakt en hebt daarmee een nauwkeurigheid van {%accuracy%}%.',
    'typing-restart': 'Herstarten',
    'typing-length_select': 'Tekstlengte',
    'typing-length_short': 'Kort (≈50 woorden)',
    'typing-length_medium': 'Medium (≈100 woorden)',
    'typing-length_long': 'Lang (≈200 woorden)',
    'typing-length_extra_long': 'Extra lang (≈400 woorden)',
    'overview-typing-title': 'Oefen typen',
    'overview-typing-description': 'Verbeter je typingsnelheid en nauwkeurigheid in het {%t:{%s:targetLanguage%}%}.',
  },
})

export const TRANSLATABLE_CODES = Object.keys(TRANSLATIONS)
