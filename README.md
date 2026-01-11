# Apps

- [Toaln](#toaln) - Language practice.

### Future ideas

- Story writing app;
- Mathematics practice app;

## Toaln

*Toaln* is a simple language learning app which utilities the power of Large Language Models to practice. Try the app out at [https://redkenrok.github.io/webapps/toaln/index.html](https://redkenrok.github.io/webapps/toaln/index.html). In order to use it you do need to specify [credentials for an LLM API](#llm-api-credentials).

### Future ideas

- Split translations up in separate CSV files so not all are added into the JS bundle.
- Have any more suggestions? Feel free to create a pull request.

### Scrapped ideas

| Idea                                                                                                                                                               | Reason                                                                                       |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| Generate a word and definition and the user has to write down an antonym or synonym.                                                                               | Too short and relies on the fact that the user already knows the antonym or synonym.         |
| Generate a paragraph and the user has to fill in a missing sentence in between.                                                                                    | User will probably draw a blank on what to respond.                                          |
| Generate a sentence with a mistake the user has to correct them.                                                                                                   | Nice role reversal, but the user might just not simply know enough to point out the mistake. |
| Generate a word and definition and the user has to play a game of word association where they answer with a thematically similar word and definition of their own. | Already have a similar option for practicing vocabulary. Perhaps this can be added later.    |

# LLM API credentials

LLM API credentials allow certain apps to be connected to the LLM provider of your choice. It is important to note that these credentials should be stored securely and not be provided to third-parties. These apps breaks that rule since you are entering it into an online website, which is of course not recommend. These apps however does not share the credentials outside of your browser, you can check this yourself by reading the source code. The following LLM providers are available *Anthropic*, *DeepSeek*, *Google*, *OpenAI* and *OpenRouter*. If you are up for using these apps you can read below on how you can obtain access to your API credentials.

## Google AI Studio

Google AI Studio offers limited monthly access to the Gemini API for free. You can get an API credentials using the steps below.

1. Create a Google Cloud Project (If you don't have one)
  - Go to the Google Cloud Console: Open your web browser and navigate to console.cloud.google.com.
  - Sign in: Log in with your Google account.
  - Create a new project
    - If you don't have an existing project, you'll see a prompt to create one.
    - Alternatively, click the project dropdown at the top of the page (it might show "Select a project" or your current project name).
    - Click "New Project."
    - Enter a descriptive Project name (e.g., "Gemini API Project").
    - (Optional) Choose an Organization and Location.
    - Click "Create."
    - Wait for the project to be created. Once created, ensure that the new project is selected in the project drop down at the top of the console.
2. Enable the Gemini API
  - Navigate to the API Library
    - In the Cloud Console, use the search bar at the top and type "API Library," then select it from the results.
    - Alternatively, use the navigation menu (the three horizontal lines) and go to "APIs & Services" -> "Library."
  - Search for the Gemini API
    - In the API Library search bar, type "Gemini API."
    - Select the "Gemini API" from the search results.
  - Enable the API
    - Click the "Enable" button.
3. Create API Credentials
  - Navigate to Credentials
    - In the Cloud Console, use the navigation menu and go to "APIs & Services" -> "Credentials."
  - Create Credentials
    - Click the "+ CREATE CREDENTIALS" button.
    - Select "API key."
  - Copy the API Key
    - A dialog box will appear displaying your newly created API key.
    - Important: Copy this key and store it securely. You won't be able to see it again after closing the dialog.
    - Click "Restrict Key" to add restrictions, or "Done" to close the dialog.
4. Restrict the API Key (Recommended)
  - Restricting your API key is crucial for security.
  - API Restrictions
    - Select "Restrict key."
    - Under "API restrictions," select "Restrict key."
    - Choose "Gemini API" from the list of APIs.
    - Click "Save."

# Developing

In order to build and use these apps you need to have `Node.JS` installed. You can then run `bash run_install.sh` and after that `bash run_develop.sh`. It will then tell you which port on localhost to go to in your browser to load the apps. Be sure to navigate to `localhost:<port>/develop.html` to view the not yet minified development version.

# Made with

- *[staark](https://github.com/doars/staark/tree/main/packages/staark#readme)* a teensy-tiny library for for building web apps.
- *[vroagn](https://github.com/doars/staark/tree/main/packages/vroagn#readme)* a teensy-tiny library for managing network requests.
