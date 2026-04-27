# Mobile AI Toolkit Example

Demonstrates the on-device AI surface in `@anivar/mobile-ai-toolkit`:

- **Sentiment analysis** — `analyzeText()` (on-device via NaturalLanguage / ML Kit)
- **Smart replies** — `smartReplies()` (on-device via ML Kit Smart Reply)
- **Chat** — `chat()` (Apple Foundation Models on iOS 26+, ML Kit GenAI on Pixel 9+, otherwise rejects)
- **Capabilities probe** — `getDeviceCapabilities()`

Source lives under [`src/App.tsx`](./src/App.tsx).

## Run it

This package is a code reference, wired up to consume the parent library via `file:..`. To run on a device:

```bash
cd example
npm install
npx react-native start
# in another shell
npx react-native run-android   # or run-ios
```

iOS additionally needs a one-off pod install before first run:

```bash
cd ios && pod install
```

The example is a standard React Native 0.80 / React 19 project. Native folders (`ios/`, `android/`) are not committed — generate them via `npx @react-native-community/cli init` if you want a runnable host, then drop `src/App.tsx` and the existing `index.js` / `app.json` over the generated entries.
