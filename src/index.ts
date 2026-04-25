/**
 * mobile-ai-toolkit
 *
 * Thin TurboModule wrapper over real on-device AI APIs:
 *  - iOS:     Vision, NaturalLanguage, Speech, UITextChecker
 *  - Android: ML Kit (text, vision, translate, smart reply, entity extraction)
 *             + ML Kit GenAI (summarize/rewrite/proofread, AICore devices only)
 *
 * Methods reject with `UNSUPPORTED_PLATFORM` or `FEATURE_UNAVAILABLE` when
 * the underlying capability is not present. Callers should always check
 * `getDeviceCapabilities()` first or guard with try/catch.
 */

import NativeAIToolkit from './specs/NativeAIToolkitSpec';

export type * from './specs/NativeAIToolkitSpec';

import type {
  Barcode,
  ChatMessage,
  DeviceCapabilities,
  Entity,
  GenerationOptions,
  ImageAnalysis,
  ImageAnalysisOptions,
  ImageLabel,
  PersonSegmentationResult,
  ProofreadResult,
  SmartReplyMessage,
  TextAnalysis,
  TextAnalysisOptions,
  Transcript,
  TranscriptionOptions,
} from './specs/NativeAIToolkitSpec';

export function getDeviceCapabilities(): Promise<DeviceCapabilities> {
  return NativeAIToolkit.getDeviceCapabilities();
}

export function analyzeText(
  text: string,
  options: TextAnalysisOptions = {}
): Promise<TextAnalysis> {
  return NativeAIToolkit.analyzeText(text, options);
}

export function extractEntities(text: string): Promise<Entity[]> {
  return NativeAIToolkit.extractEntities(text);
}

export function identifyLanguage(text: string): Promise<string> {
  return NativeAIToolkit.identifyLanguage(text);
}

export function embedText(text: string): Promise<number[]> {
  return NativeAIToolkit.embedText(text);
}

export function analyzeImage(
  imageBase64: string,
  options: ImageAnalysisOptions = {}
): Promise<ImageAnalysis> {
  return NativeAIToolkit.analyzeImage(imageBase64, options);
}

export function scanBarcodes(imageBase64: string): Promise<Barcode[]> {
  return NativeAIToolkit.scanBarcodes(imageBase64);
}

export function labelImage(imageBase64: string): Promise<ImageLabel[]> {
  return NativeAIToolkit.labelImage(imageBase64);
}

export function describeImage(imageBase64: string): Promise<string> {
  return NativeAIToolkit.describeImage(imageBase64);
}

export function segmentPerson(imageBase64: string): Promise<PersonSegmentationResult> {
  return NativeAIToolkit.segmentPerson(imageBase64);
}

export function proofreadText(text: string): Promise<ProofreadResult> {
  return NativeAIToolkit.proofreadText(text);
}

export type SummaryFormat = 'one-bullet' | 'bullets' | 'headline';

export function summarizeText(text: string, format: SummaryFormat = 'bullets'): Promise<string> {
  return NativeAIToolkit.summarizeText(text, format);
}

export type RewriteStyle =
  | 'rephrase'
  | 'professional'
  | 'friendly'
  | 'casual'
  | 'concise'
  | 'creative'
  | 'elaborate';

export function rewriteText(text: string, style: RewriteStyle): Promise<string> {
  return NativeAIToolkit.rewriteText(text, style);
}

export function generateText(prompt: string, options: GenerationOptions = {}): Promise<string> {
  return NativeAIToolkit.generateText(prompt, options);
}

export function chat(messages: ChatMessage[], options: GenerationOptions = {}): Promise<string> {
  return NativeAIToolkit.chat(messages, options);
}

export function smartReplies(messages: SmartReplyMessage[]): Promise<string[]> {
  return NativeAIToolkit.smartReplies(messages);
}

export function translateText(
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<string> {
  return NativeAIToolkit.translateText(text, sourceLang, targetLang);
}

export function transcribeAudioFile(
  filePath: string,
  options: TranscriptionOptions = {}
): Promise<Transcript> {
  return NativeAIToolkit.transcribeAudioFile(filePath, options);
}

export function enablePrivateMode(enabled: boolean): void {
  NativeAIToolkit.enablePrivateMode(enabled);
}

export function isPrivateModeEnabled(): boolean {
  return NativeAIToolkit.isPrivateModeEnabled();
}
