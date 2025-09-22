/**
 * Native AI Toolkit Turbo Module
 * Leverages on-device AI capabilities for RN 0.76+ New Architecture
 */

import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

// On-device AI result types
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
    emotions?: Record<string, number>;
    age?: number;
  }>;
  text: string; // OCR
  landmarks?: Array<{
    name: string;
    confidence: number;
  }>;
  barcode?: string;
  confidence: number;
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

export interface DeviceCapabilities {
  hasNeuralEngine: boolean;
  hasAppleIntelligence: boolean; // iOS 18.1+
  hasGeminiNano: boolean; // Android 15+
  hasMLKit: boolean;
  hasCoreML: boolean;
  supportedLanguages: string[];
  modelVersions: Record<string, string>;
}

/**
 * Native AI Toolkit Turbo Module Interface
 */
export interface Spec extends TurboModule {
  // Device capabilities
  getDeviceCapabilities(): Promise<DeviceCapabilities>;

  // Text processing (on-device)
  analyzeText(
    text: string,
    options: {
      includeSentiment?: boolean;
      includeEntities?: boolean;
      includeSummary?: boolean;
      language?: string;
    }
  ): Promise<OnDeviceTextAnalysis>;

  // Writing assistance (iOS 18.1+ / Android 15+)
  enhanceText(
    text: string,
    style: 'friendly' | 'professional' | 'concise' | 'creative'
  ): Promise<string>;

  proofreadText(text: string): Promise<{
    correctedText: string;
    corrections: Array<{
      original: string;
      corrected: string;
      type: 'spelling' | 'grammar' | 'style';
      position: [number, number];
    }>;
  }>;

  summarizeText(text: string, format: 'paragraph' | 'bullets' | 'key-points'): Promise<string>;

  // Vision processing (on-device)
  analyzeImage(
    imageBase64: string,
    options: {
      detectObjects?: boolean;
      detectFaces?: boolean;
      extractText?: boolean;
      detectLandmarks?: boolean;
      detectBarcode?: boolean;
    }
  ): Promise<OnDeviceVisionAnalysis>;

  // Voice processing (on-device)
  transcribeAudio(
    audioBase64: string,
    options: {
      language?: string;
      enablePunctuation?: boolean;
      enableWordTimestamps?: boolean;
    }
  ): Promise<OnDeviceVoiceAnalysis>;

  // Smart features
  generateSmartReplies(message: string, context?: string): Promise<string[]>;

  classifyIntent(text: string): Promise<{
    intent: string;
    confidence: number;
    parameters: Record<string, any>;
  }>;

  // Privacy & security
  enablePrivateMode(enabled: boolean): void;
  isPrivateModeEnabled(): boolean;

  // Performance
  preloadModels(modelTypes: string[]): Promise<boolean>;
  getModelStatus(): Promise<Record<string, 'loaded' | 'loading' | 'error'>>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('AIToolkitTurboModule');
