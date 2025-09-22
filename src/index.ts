/**
 * @openslm/mobile-ai-toolkit
 * Mobile-first AI toolkit with on-device capabilities for React Native 0.76+
 *
 * Features:
 * - On-device AI processing (iOS/Android)
 * - Cloud AI fallback
 * - Turbo Module performance
 * - Privacy-first architecture
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeModules, Platform } from 'react-native';

// Import native module
import NativeAIToolkit from './specs/NativeAIToolkitSpec';

// Re-export types
export type * from './specs/NativeAIToolkitSpec';

// Configuration interface
export interface AIConfig {
  // Cloud proxy settings
  proxyURL?: string;
  apiKey?: string;
  timeout?: number;

  // On-device preferences
  preferOnDevice?: boolean;
  enablePrivateMode?: boolean;

  // Caching
  cacheEnabled?: boolean;
  cacheTTL?: number;

  // Performance
  preloadModels?: string[];
  maxRetries?: number;
}

// Response interfaces
export interface ChatResponse {
  message: string;
  fromCache?: boolean;
  fromDevice?: boolean;
  model?: string;
  usage?: {
    tokens: number;
    cost: number;
  };
}

export interface AnalysisResponse {
  sentiment?: number;
  entities?: Array<{
    text: string;
    type: string;
    confidence: number;
  }>;
  summary?: string;
  language?: string;
  fromCache?: boolean;
  fromDevice?: boolean;
}

export interface VisionResponse {
  objects?: Array<{
    label: string;
    confidence: number;
    bounds?: { x: number; y: number; width: number; height: number };
  }>;
  text?: string;
  faces?: Array<{
    bounds: { x: number; y: number; width: number; height: number };
    emotions?: Record<string, number>;
  }>;
  fromCache?: boolean;
  fromDevice?: boolean;
}

export interface VoiceResponse {
  transcript: string;
  confidence: number;
  language?: string;
  words?: Array<{
    text: string;
    confidence: number;
    startTime: number;
    endTime: number;
  }>;
  fromCache?: boolean;
  fromDevice?: boolean;
}

export interface UsageStats {
  totalRequests: number;
  onDeviceRequests: number;
  cloudRequests: number;
  cacheHits: number;
  costs: number;
  lastUsed: string;
}

/**
 * Main AI class - Hybrid on-device + cloud processing
 */
export class AI {
  private static config: AIConfig = {
    proxyURL: 'https://api.openslm.ai',
    timeout: 15000,
    preferOnDevice: true,
    enablePrivateMode: false,
    cacheEnabled: true,
    cacheTTL: 3600000, // 1 hour
    maxRetries: 2,
    preloadModels: ['text', 'vision'],
  };

  private static deviceCapabilities: any = null;
  private static initialized = false;

  /**
   * Configure the AI toolkit
   */
  static configure(config: AIConfig): void {
    AI.config = { ...AI.config, ...config };
  }

  /**
   * Initialize the toolkit (call once at app start)
   */
  static async initialize(): Promise<void> {
    if (AI.initialized) return;

    try {
      // Get device capabilities
      if (NativeAIToolkit) {
        AI.deviceCapabilities = await NativeAIToolkit.getDeviceCapabilities();

        // Set private mode
        if (AI.config.enablePrivateMode) {
          NativeAIToolkit.enablePrivateMode(true);
        }

        // Preload models
        if (AI.config.preloadModels && AI.config.preloadModels.length > 0) {
          await NativeAIToolkit.preloadModels(AI.config.preloadModels);
        }
      }

      AI.initialized = true;
    } catch (error) {
      console.warn('Failed to initialize native AI capabilities:', error);
      // Continue without native features
      AI.initialized = true;
    }
  }

  /**
   * Check if on-device AI is available
   */
  static isOnDeviceAvailable(): boolean {
    return AI.deviceCapabilities !== null && NativeAIToolkit !== null;
  }

  /**
   * Get device AI capabilities
   */
  static getDeviceCapabilities() {
    return AI.deviceCapabilities;
  }

  /**
   * Chat with AI - Smart routing (on-device or cloud)
   */
  static async chat(
    message: string,
    options?: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
      forceCloud?: boolean;
    }
  ): Promise<ChatResponse> {
    await AI.initialize();

    const cacheKey = `chat:${AI.hashString(message + JSON.stringify(options))}`;

    // Check cache first
    if (AI.config.cacheEnabled) {
      const cached = await AI.getFromCache(cacheKey);
      if (cached) {
        return { ...cached, fromCache: true };
      }
    }

    // Determine processing method
    const useOnDevice = AI.shouldUseOnDevice(options?.forceCloud);

    try {
      let result: ChatResponse;

      if (useOnDevice && AI.canProcessOnDevice('chat')) {
        // Use Apple Intelligence or similar on-device chat
        const enhancedText = await NativeAIToolkit.enhanceText(message, 'professional');
        result = {
          message: enhancedText,
          fromDevice: true,
          model: 'on-device',
        };
      } else {
        // Fall back to cloud processing
        result = await AI.processInCloud('chat', { message, ...options });
      }

      // Cache the result
      if (AI.config.cacheEnabled) {
        await AI.saveToCache(cacheKey, result);
      }

      await AI.updateUsageStats(result.fromDevice ? 'device' : 'cloud');
      return result;
    } catch (error) {
      throw new Error(`Chat failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Analyze text - On-device when possible
   */
  static async analyze(
    text: string,
    options?: {
      includeSentiment?: boolean;
      includeEntities?: boolean;
      includeSummary?: boolean;
      language?: string;
      forceCloud?: boolean;
    }
  ): Promise<AnalysisResponse> {
    await AI.initialize();

    if (!text || text.trim().length === 0) {
      throw new Error('Text is required for analysis');
    }

    const cacheKey = `analyze:${AI.hashString(text + JSON.stringify(options))}`;

    // Check cache first
    if (AI.config.cacheEnabled) {
      const cached = await AI.getFromCache(cacheKey);
      if (cached) {
        return { ...cached, fromCache: true };
      }
    }

    const useOnDevice = AI.shouldUseOnDevice(options?.forceCloud);

    try {
      let result: AnalysisResponse;

      if (useOnDevice && AI.canProcessOnDevice('text')) {
        // Use on-device text analysis
        const analysis = await NativeAIToolkit.analyzeText(text, {
          includeSentiment: options?.includeSentiment !== false,
          includeEntities: options?.includeEntities !== false,
          includeSummary: options?.includeSummary || false,
          language: options?.language || 'auto',
        });

        result = {
          sentiment: analysis.sentiment,
          entities: analysis.entities,
          language: analysis.language,
          summary: analysis.summary,
          fromDevice: true,
        };
      } else {
        // Fall back to cloud processing
        result = await AI.processInCloud('analyze', { text, ...options });
      }

      // Cache the result
      if (AI.config.cacheEnabled) {
        await AI.saveToCache(cacheKey, result);
      }

      await AI.updateUsageStats(result.fromDevice ? 'device' : 'cloud');
      return result;
    } catch (error) {
      throw new Error(
        `Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Understand images - On-device Vision processing
   */
  static async understand(
    imageBase64: string,
    options?: {
      detectObjects?: boolean;
      extractText?: boolean;
      detectFaces?: boolean;
      forceCloud?: boolean;
    }
  ): Promise<VisionResponse> {
    await AI.initialize();

    if (!imageBase64) {
      throw new Error('Image data is required');
    }

    const cacheKey = `vision:${AI.hashString(imageBase64.substring(0, 100))}`;

    // Check cache first
    if (AI.config.cacheEnabled) {
      const cached = await AI.getFromCache(cacheKey);
      if (cached) {
        return { ...cached, fromCache: true };
      }
    }

    const useOnDevice = AI.shouldUseOnDevice(options?.forceCloud);

    try {
      let result: VisionResponse;

      if (useOnDevice && AI.canProcessOnDevice('vision')) {
        // Use on-device Vision framework
        const analysis = await NativeAIToolkit.analyzeImage(imageBase64, {
          detectObjects: options?.detectObjects !== false,
          extractText: options?.extractText !== false,
          detectFaces: options?.detectFaces !== false,
        });

        result = {
          objects: analysis.objects,
          text: analysis.text,
          faces: analysis.faces,
          fromDevice: true,
        };
      } else {
        // Fall back to cloud processing
        result = await AI.processInCloud('vision', { image: imageBase64, ...options });
      }

      // Cache the result
      if (AI.config.cacheEnabled) {
        await AI.saveToCache(cacheKey, result);
      }

      await AI.updateUsageStats(result.fromDevice ? 'device' : 'cloud');
      return result;
    } catch (error) {
      throw new Error(
        `Vision analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Transcribe voice - On-device Speech processing
   */
  static async transcribe(
    audioBase64: string,
    options?: {
      language?: string;
      forceCloud?: boolean;
    }
  ): Promise<VoiceResponse> {
    await AI.initialize();

    if (!audioBase64) {
      throw new Error('Audio data is required');
    }

    const useOnDevice = AI.shouldUseOnDevice(options?.forceCloud);

    try {
      let result: VoiceResponse;

      if (useOnDevice && AI.canProcessOnDevice('voice')) {
        // Use on-device speech recognition
        const analysis = await NativeAIToolkit.transcribeAudio(audioBase64, {
          language: options?.language || 'auto',
        });

        result = {
          transcript: analysis.transcript,
          confidence: analysis.confidence,
          language: analysis.language,
          words: analysis.words,
          fromDevice: true,
        };
      } else {
        // Fall back to cloud processing
        result = await AI.processInCloud('transcribe', { audio: audioBase64, ...options });
      }

      await AI.updateUsageStats(result.fromDevice ? 'device' : 'cloud');
      return result;
    } catch (error) {
      throw new Error(
        `Transcription failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Generate smart replies - Uses on-device intelligence
   */
  static async smartReply(message: string, context?: string): Promise<string[]> {
    await AI.initialize();

    if (AI.isOnDeviceAvailable()) {
      try {
        const replies = await NativeAIToolkit.generateSmartReplies(message, context);
        return replies;
      } catch (error) {
        console.warn('On-device smart reply failed, using fallback:', error);
      }
    }

    // Fallback replies
    return ['Thanks!', 'Got it', 'Let me check'];
  }

  /**
   * Writing Tools integration (iOS 18.1+)
   */
  static async enhanceText(
    text: string,
    style: 'friendly' | 'professional' | 'concise' | 'creative'
  ): Promise<string> {
    await AI.initialize();

    if (AI.isOnDeviceAvailable()) {
      try {
        return await NativeAIToolkit.enhanceText(text, style);
      } catch (error) {
        console.warn('Text enhancement failed:', error);
      }
    }

    // Fallback - return original text
    return text;
  }

  /**
   * Proofread text using on-device capabilities
   */
  static async proofread(text: string): Promise<{ correctedText: string; corrections: any[] }> {
    await AI.initialize();

    if (AI.isOnDeviceAvailable()) {
      try {
        return await NativeAIToolkit.proofreadText(text);
      } catch (error) {
        console.warn('Proofreading failed:', error);
      }
    }

    // Fallback
    return {
      correctedText: text,
      corrections: [],
    };
  }

  /**
   * Get usage statistics
   */
  static async getUsage(): Promise<UsageStats> {
    try {
      const stats = await AsyncStorage.getItem('openslm_usage_stats');
      return stats
        ? JSON.parse(stats)
        : {
            totalRequests: 0,
            onDeviceRequests: 0,
            cloudRequests: 0,
            cacheHits: 0,
            costs: 0,
            lastUsed: new Date().toISOString(),
          };
    } catch {
      return {
        totalRequests: 0,
        onDeviceRequests: 0,
        cloudRequests: 0,
        cacheHits: 0,
        costs: 0,
        lastUsed: new Date().toISOString(),
      };
    }
  }

  // Private helper methods
  private static shouldUseOnDevice(forceCloud?: boolean): boolean {
    if (forceCloud) return false;
    if (!AI.config.preferOnDevice) return false;
    return AI.isOnDeviceAvailable();
  }

  private static canProcessOnDevice(type: string): boolean {
    if (!AI.deviceCapabilities) return false;

    switch (type) {
      case 'text':
        return Platform.OS === 'ios' || AI.deviceCapabilities.hasMLKit;
      case 'vision':
        return AI.deviceCapabilities.hasCoreML || AI.deviceCapabilities.hasMLKit;
      case 'voice':
        return Platform.OS === 'ios' || Platform.OS === 'android';
      case 'chat':
        return AI.deviceCapabilities.hasAppleIntelligence || AI.deviceCapabilities.hasGeminiNano;
      default:
        return false;
    }
  }

  private static async processInCloud(endpoint: string, payload: any): Promise<any> {
    // This would be the same cloud processing as before
    const url = `${AI.config.proxyURL}/${endpoint}`;

    for (let attempt = 0; attempt <= (AI.config.maxRetries || 2); attempt++) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: AI.config.apiKey ? `Bearer ${AI.config.apiKey}` : '',
            'User-Agent': `@openslm/mobile-ai-toolkit/1.0.0 (${Platform.OS})`,
          },
          body: JSON.stringify({ ...payload, mobile: true, platform: Platform.OS }),
          // @ts-expect-error
          timeout: AI.config.timeout,
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`HTTP ${response.status}: ${error}`);
        }

        const result = await response.json();
        return { ...result, fromDevice: false };
      } catch (error) {
        if (attempt === (AI.config.maxRetries || 2)) {
          throw error;
        }
        await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
  }

  private static async getFromCache(key: string): Promise<any> {
    try {
      const cached = await AsyncStorage.getItem(`openslm_cache_${key}`);
      if (!cached) return null;

      const data = JSON.parse(cached);
      if (Date.now() - data.timestamp > (AI.config.cacheTTL || 3600000)) {
        await AsyncStorage.removeItem(`openslm_cache_${key}`);
        return null;
      }

      // Update cache hit stats
      const stats = await AI.getUsage();
      stats.cacheHits += 1;
      await AsyncStorage.setItem('openslm_usage_stats', JSON.stringify(stats));

      return data.result;
    } catch {
      return null;
    }
  }

  private static async saveToCache(key: string, result: any): Promise<void> {
    try {
      const data = {
        result,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(`openslm_cache_${key}`, JSON.stringify(data));
    } catch {
      // Silently fail on cache save errors
    }
  }

  private static async updateUsageStats(type: 'device' | 'cloud'): Promise<void> {
    try {
      const stats = await AI.getUsage();
      stats.totalRequests += 1;
      if (type === 'device') {
        stats.onDeviceRequests += 1;
      } else {
        stats.cloudRequests += 1;
        stats.costs += 0.001; // Rough estimate
      }
      stats.lastUsed = new Date().toISOString();

      await AsyncStorage.setItem('openslm_usage_stats', JSON.stringify(stats));
    } catch {
      // Silently fail on stats update errors
    }
  }

  private static hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }
}

// Default export
export default AI;
