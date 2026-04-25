# @anivar/mobile-ai-toolkit

On-device AI for React Native. One unified TypeScript API; each method is a thin TurboModule binding to a documented platform framework — Apple Vision / NaturalLanguage / Speech on iOS, Google ML Kit (incl. ML Kit GenAI on AICore-enabled devices) on Android. Nothing leaves the device, nothing is mocked.

[![npm version](https://img.shields.io/npm/v/@anivar/mobile-ai-toolkit.svg?style=flat-square)](https://www.npmjs.com/package/@anivar/mobile-ai-toolkit)
[![CI](https://img.shields.io/github/actions/workflow/status/openslm-ai/mobile-ai-toolkit/ci.yml?branch=main&style=flat-square&label=CI)](https://github.com/openslm-ai/mobile-ai-toolkit/actions/workflows/ci.yml)
[![Provenance](https://img.shields.io/badge/npm-provenance-success?style=flat-square&logo=npm)](https://docs.npmjs.com/generating-provenance-statements)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

## Why

A unified surface that hides the iOS/Android split *without* lying about it. Where one platform has a real API and the other doesn't, the call resolves on one side and rejects with `UNSUPPORTED_PLATFORM` / `FEATURE_UNAVAILABLE` on the other — never a polyfill, never a placeholder string. You probe `getDeviceCapabilities()` once, gate UI on the returned feature flags, and write the call site once.

## Install

```bash
npm install @anivar/mobile-ai-toolkit
cd ios && pod install
```

Requires React Native 0.80+ (new architecture / TurboModules), react 19+. Minimum iOS 13, Android API 26.

## Capability matrix

Every method below maps to a real platform call. ✅ = on-device. ⚠️ = on-device when supported by OEM/locale. ❌ = not implemented on that platform; the call rejects with `UNSUPPORTED_PLATFORM`.

| Method | iOS | Android |
|---|---|---|
| `getDeviceCapabilities()` | ✅ — feature probe | ✅ — feature probe |
| `analyzeText(text, opts)` | ✅ NaturalLanguage — sentiment + entities | ✅ ML Kit Language ID + Entity Extraction |
| `extractEntities(text)` | ✅ `NLTagSchemeNameType` | ✅ ML Kit `EntityExtraction` |
| `identifyLanguage(text)` | ✅ `NLLanguageRecognizer` | ✅ ML Kit `LanguageIdentification` |
| `embedText(text)` | ✅ `NLContextualEmbedding` (iOS 17+) | ❌ |
| `analyzeImage(b64, opts)` | ✅ Vision OCR + face rects + iOS 17 foreground mask | ✅ ML Kit text + objects + faces |
| `scanBarcodes(b64)` | ✅ `VNDetectBarcodesRequest` | ✅ ML Kit `BarcodeScanning` |
| `labelImage(b64)` | ✅ `VNClassifyImageRequest` | ✅ ML Kit `ImageLabeling` |
| `describeImage(b64)` | ❌ | ✅ ML Kit GenAI `ImageDescription` *(Beta, AICore)* |
| `segmentPerson(b64)` | ✅ `VNGeneratePersonSegmentationRequest` (iOS 15+) | ✅ ML Kit `SelfieSegmentation` |
| `proofreadText(text)` | ✅ `UITextChecker` *(spelling only)* | ✅ ML Kit GenAI `Proofreader` *(Beta, AICore)* |
| `summarizeText(text, fmt)` | ❌ — Foundation Models bridge in v2.1 | ✅ ML Kit GenAI `Summarizer` *(Beta, AICore)* |
| `rewriteText(text, style)` | ❌ — Foundation Models bridge in v2.1 | ✅ ML Kit GenAI `Rewriter` *(Beta, AICore)* |
| `generateText(prompt, opts)` | ❌ — Foundation Models bridge in v2.1 | ✅ ML Kit GenAI `Prompt` API *(Beta, Gemini Nano / Gemma 4 via AICore)* |
| `smartReplies(messages)` | ❌ — no public iOS equivalent | ✅ ML Kit `SmartReply` (GA) |
| `translateText(text, src, tgt)` | ❌ — Translation framework bridge in v2.1 | ✅ ML Kit `Translator` (GA, downloads language pack on first use) |
| `transcribeAudioFile(path, opts)` | ✅ `SFSpeechRecognizer` with `requiresOnDeviceRecognition = true` | ⚠️ `SpeechRecognizer` with `EXTRA_PREFER_OFFLINE` (OEM-dependent) |

`getDeviceCapabilities().features` returns a `Record<MethodName, boolean>` map so you can show or hide UI without try/catch.

## Quick start

```ts
import {
  getDeviceCapabilities,
  analyzeText,
  analyzeImage,
  scanBarcodes,
  labelImage,
  segmentPerson,
  summarizeText,
  rewriteText,
  generateText,
  smartReplies,
  translateText,
  transcribeAudioFile,
} from '@anivar/mobile-ai-toolkit';

// 1. Probe once at startup, gate UI on the feature map.
const caps = await getDeviceCapabilities();

// 2. Universal text + image — works on every iOS/Android device.
const analysis = await analyzeText('I really like this app', {
  includeSentiment: true,
  includeEntities: true,
});
// → { language: 'en', sentiment: 0.6, entities: [...], confidence: 0.9 }

const img = await analyzeImage(base64png, { extractText: true, detectFaces: true });
const codes = await scanBarcodes(base64png);
const labels = await labelImage(base64png);
const { maskBase64, width, height } = await segmentPerson(base64png);

// 3. Generative — gate on the feature map.
if (caps.features.summarize) {
  const tldr = await summarizeText(longArticle, 'bullets');
}
if (caps.features.generate) {
  const reply = await generateText('Write a polite decline.', { maxOutputTokens: 80 });
}

// 4. Platform-specific calls reject cleanly when unsupported.
try {
  const replies = await smartReplies([
    { text: 'Want to grab lunch?', fromUser: false, timestampMs: Date.now() },
  ]);
} catch (e) {
  // iOS: { code: 'UNSUPPORTED_PLATFORM' }
}

// 5. On-device transcription.
const t = await transcribeAudioFile('/path/to/clip.m4a', { locale: 'en-US' });
```

### Privacy-mode flag

A boolean stored in the native module. It does not enforce anything by itself — read it from your app code before triggering methods that fetch model assets (e.g. `translateText` downloads a language pack on first use, ML Kit GenAI APIs may pull a model via AICore).

```ts
import { enablePrivateMode, isPrivateModeEnabled } from '@anivar/mobile-ai-toolkit';
enablePrivateMode(true);
```

## Device-class gotchas

- **ML Kit GenAI** (`summarizeText`, `rewriteText`, `proofreadText`, `describeImage`, `generateText` on Android) runs only on AICore-enabled devices: Pixel 9+, Samsung S25+, and select 2024–2026 flagships from Xiaomi / OPPO / Honor with locked bootloaders. Pixel 10+ uses Gemma 4 via AICore. On unsupported devices these methods reject with `FEATURE_UNAVAILABLE` — always check `caps.features.<method>` first.
- **iOS on-device speech** (`SFSpeechRecognizer.supportsOnDeviceRecognition`) returns true on most modern devices but can be false for locales whose speech model isn't installed.
- **iOS proofread** uses `UITextChecker` and is spelling-only; the Apple Intelligence Writing Tools rewrite UI has no programmatic invocation API.
- **iOS embeddings** require iOS 17+ and a model loaded for the script of the input (Latin / CJK / Cyrillic / etc.); unsupported scripts reject with `FEATURE_UNAVAILABLE`.

## What's NOT in this package

- **No multi-turn `chat()` session.** ML Kit GenAI's Prompt API does not expose persistent sessions across the JNI boundary in a stable form yet; Apple Foundation Models is Swift-only and needs a bridging layer. `generateText()` is single-shot for now.
- **No iOS generative methods.** `summarizeText` / `rewriteText` / `generateText` reject `UNSUPPORTED_PLATFORM` on iOS until the v2.1 Foundation Models bridge lands.
- **No intent classification.** No public on-device intent-classifier API on either platform that beats a hardcoded keyword matcher.
- **No iOS Writing Tools rewrite.** The system UI can be attached to a `UITextView`, but it has no programmatic API.
- **No cloud fallback.** Out of scope; call your own backend from JS if you need it.

## Roadmap

- **v2.1** — Swift bridging layer for **Apple Foundation Models** (iOS 26+, A17 Pro+) backing `summarizeText`, `rewriteText`, `generateText`, plus a new multi-turn `chat()`.
- **v2.1** — **Apple Translation** framework bridge for `translateText` on iOS 17.4+.
- **v2.2** — Streaming variants of `generateText` / `summarizeText` / `rewriteText` (token callbacks) on Android via the Prompt API streaming surface.

## License

MIT © Anivar Aravind
