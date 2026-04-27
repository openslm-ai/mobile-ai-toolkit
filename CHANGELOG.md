# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.0-rc.3] - 2026-04-27

### Added
- Podspec declares `FoundationModels` as a `weak_framework` so the package builds on Xcode versions where the framework is unavailable; runtime calls are still gated by `@available(iOS 26.0, *)` and `SystemLanguageModel.default.availability`.
- `example/tsconfig.json` so the example app actually typechecks against the package's real exports (`getDeviceCapabilities`, `analyzeText`, `smartReplies`, `chat`, `enablePrivateMode`).

### Changed
- `example/App.tsx` rewritten against the real public API. The previous version called `AI.configure`/`AI.analyze`/`AI.smartReply`/`AI.chat` — none of which exist. It now consumes the actual `DeviceCapabilities` shape (`platform`, `osVersion`, `hasAppleIntelligence`, `hasGeminiNano`, `features.*`), the real `SmartReplyMessage` (`{ text, fromUser, timestampMs }`), and the real `ChatMessage` (`{ role, content }`).
- iOS: `isPrivateModeEnabled` is now a `RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD` so the JS side gets a real boolean instead of a Promise that never resolved through the bridge.
- Android: `transcribeAudioFile` rejects with `FILE_TRANSCRIPTION_UNSUPPORTED` instead of silently failing — stock `SpeechRecognizer` is microphone-only; file transcription needs OEM-specific APIs or a TFLite model.
- Brand: README, podspec-adjacent native sources, and Android module carry the OpenSLM project mark.

### Fixed
- Android: removed unused `Intent`, `Bundle`, `RecognitionListener`, `RecognizerIntent` imports.
