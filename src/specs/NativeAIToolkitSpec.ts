/**
 * Codegen spec for Native AI Toolkit Turbo Module
 * This file is used by React Native Codegen to generate native interfaces
 */

import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

// Codegen types
export interface DeviceCapabilities {
  hasNeuralEngine: boolean;
  hasAppleIntelligence: boolean;
  hasGeminiNano: boolean;
  hasMLKit: boolean;
  hasCoreML: boolean;
  supportedLanguages: string[];
  modelVersions: { [key: string]: string };
}

export interface TextAnalysisOptions {
  includeSentiment?: boolean;
  includeEntities?: boolean;
  includeSummary?: boolean;
  language?: string;
}

export interface OnDeviceTextAnalysis {
  sentiment: number;
  entities: Array<{
    text: string;
    type: string;
    confidence: number;
    range: [number, number];
  }>;
  language: string;
  summary?: string;
  confidence: number;
}

export interface VisionAnalysisOptions {
  detectObjects?: boolean;
  detectFaces?: boolean;
  extractText?: boolean;
  detectLandmarks?: boolean;
  detectBarcode?: boolean;
}

export interface OnDeviceVisionAnalysis {
  objects: Array<{
    label: string;
    confidence: number;
    bounds: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  }>;
  faces: Array<{
    bounds: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    emotions?: { [key: string]: number };
    age?: number;
  }>;
  text: string;
  landmarks?: Array<{
    name: string;
    confidence: number;
  }>;
  barcode?: string;
  confidence: number;
}

export interface VoiceAnalysisOptions {
  language?: string;
  enablePunctuation?: boolean;
  enableWordTimestamps?: boolean;
}

export interface OnDeviceVoiceAnalysis {
  transcript: string;
  confidence: number;
  language: string;
  words: Array<{
    text: string;
    confidence: number;
    startTime: number;
    endTime: number;
  }>;
  intent?: string;
  entities?: Array<{
    text: string;
    type: string;
    confidence: number;
  }>;
}

export interface ProofreadResult {
  correctedText: string;
  corrections: Array<{
    original: string;
    corrected: string;
    type: string;
    position: [number, number];
  }>;
}

export interface IntentClassification {
  intent: string;
  confidence: number;
  parameters: { [key: string]: any };
}

/**
 * Native AI Toolkit Turbo Module Spec
 */
export interface Spec extends TurboModule {
  // Device capabilities
  getDeviceCapabilities(): Promise<DeviceCapabilities>;

  // Text processing (on-device)
  analyzeText(text: string, options: TextAnalysisOptions): Promise<OnDeviceTextAnalysis>;

  // Writing assistance (iOS 18.1+ / Android 15+)
  enhanceText(text: string, style: string): Promise<string>;

  proofreadText(text: string): Promise<ProofreadResult>;

  summarizeText(text: string, format: string): Promise<string>;

  // Vision processing (on-device)
  analyzeImage(
    imageBase64: string,
    options: VisionAnalysisOptions
  ): Promise<OnDeviceVisionAnalysis>;

  // Voice processing (on-device)
  transcribeAudio(
    audioBase64: string,
    options: VoiceAnalysisOptions
  ): Promise<OnDeviceVoiceAnalysis>;

  // Smart features
  generateSmartReplies(message: string, context?: string): Promise<string[]>;

  classifyIntent(text: string): Promise<IntentClassification>;

  // Privacy & security
  enablePrivateMode(enabled: boolean): void;
  isPrivateModeEnabled(): boolean;

  // Performance
  preloadModels(modelTypes: string[]): Promise<boolean>;
  getModelStatus(): Promise<{ [key: string]: string }>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('AIToolkitTurboModule');
