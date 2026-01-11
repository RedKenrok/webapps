# Project overview

This is a collection of lightweight web applications for educational purposes, including language learning (Toaln). The project uses minimal dependencies and is built with Bun as the JavaScript runtime and bundler.

## Architecture

The codebase is structured as a mono-repository with individual apps in subdirectories under `src/`. Each app has its own entry points for JavaScript and CSS. Shared utilities are in `src/shared/`. The build system uses a custom bundler wrapper around Bun's build API, producing IIFE bundles. Apps are rendered using the staark framework (a tiny web app library) and handle network requests with vroagn.

- **src/home/**: Main landing page listing available apps.
- **src/toaln/**: Language practice app with LLM integration.
- **src/shared/**: Common utilities (APIs, reset styles, utilities).
- **docs/**: Built output directory served in production.
- **helpers/**: Build scripts and development server.

## Setup instructions

### Prerequisites
- Bun.

### Install dependencies
Run `bun install` to install dependencies listed in `bun.lock`.

### Build
Execute `bash run_build.sh` to bundle assets for production. This creates minified files in `docs/` with source maps.

### Run in development
Execute `bash run_develop.sh` to start development mode. This runs the bundler with file watching and serves `docs/` on localhost:3000 (default port). Access the development version at `localhost:3000/develop.html`.

### Test
No automated testing setup is present. Manual testing via browser interaction is required. This is done by the developer by running `bash run_develop.sh`.

## Key files and directories

- **config.bundle.js**: Bundling configuration specifying entry points, output formats, and watch directories.
- **helpers/bundle.js**: Custom bundler logic handling production minification, source maps, and file watching.
- **helpers/serve.js**: Lightweight HTTP server for development, with directory listing and security restrictions (blocks access to dotfiles and node_modules).
- **src/home/app.js**: Entry point for the app listing page, conditionally showing unpublished apps in development.
- **src/shared/apis/**: LLM API integrations (Anthropic, DeepSeek, Google, OpenAI, OpenRouter).
- **src/toaln/app.js**: Main logic for the Toaln language app, including screens and data handling.
- **package.json**: Project metadata, scripts, and dependencies.

## Important conventions and notes

- ES modules are used throughout; no CommonJS.
- Apps integrate with LLM providers for features like text generation; credentials are entered client-side and are therefore provided by the user themselves.
- The project follows a minimal dependency philosophy with staark and vroagn as core libraries.
