jest.mock('../specs/NativeAIToolkitSpec', () => ({
  __esModule: true,
  default: {
    getDeviceCapabilities: jest.fn(async () => ({
      platform: 'ios',
      osVersion: '18.0',
      hasNeuralEngine: true,
      hasAppleIntelligence: false,
      hasGeminiNano: false,
      hasMLKitGenAI: false,
      hasOnDeviceSpeech: true,
      supportedLanguages: ['en', 'es'],
      features: {
        analyzeText: true,
        analyzeImage: true,
        proofread: true,
        summarize: false,
        rewrite: false,
        smartReplies: false,
        extractEntities: true,
        translate: false,
        transcribe: true,
      },
    })),
    analyzeText: jest.fn(async (_text: string) => ({
      language: 'en',
      sentiment: 0.5,
      confidence: 0.9,
    })),
    extractEntities: jest.fn(async () => []),
    identifyLanguage: jest.fn(async () => 'en'),
    analyzeImage: jest.fn(async () => ({ text: '', objects: [], faces: [] })),
    proofreadText: jest.fn(async (text: string) => ({
      correctedText: text,
      corrections: [],
    })),
    summarizeText: jest.fn(async () => {
      throw new Error('UNSUPPORTED_PLATFORM');
    }),
    rewriteText: jest.fn(async () => {
      throw new Error('UNSUPPORTED_PLATFORM');
    }),
    smartReplies: jest.fn(async () => []),
    translateText: jest.fn(async () => {
      throw new Error('UNSUPPORTED_PLATFORM');
    }),
    transcribeAudioFile: jest.fn(async () => ({
      text: 'hello',
      confidence: 0.9,
      locale: 'en-US',
    })),
    enablePrivateMode: jest.fn(),
    isPrivateModeEnabled: jest.fn(() => false),
  },
}));

import {
  analyzeImage,
  analyzeText,
  enablePrivateMode,
  extractEntities,
  getDeviceCapabilities,
  identifyLanguage,
  isPrivateModeEnabled,
  proofreadText,
  rewriteText,
  smartReplies,
  summarizeText,
  transcribeAudioFile,
  translateText,
} from '../index';

describe('mobile-ai-toolkit', () => {
  test('exports a function-based API (no AI class)', () => {
    expect(typeof getDeviceCapabilities).toBe('function');
    expect(typeof analyzeText).toBe('function');
    expect(typeof analyzeImage).toBe('function');
    expect(typeof proofreadText).toBe('function');
    expect(typeof transcribeAudioFile).toBe('function');
  });

  test('getDeviceCapabilities returns shape with features map', async () => {
    const caps = await getDeviceCapabilities();
    expect(caps.platform).toBeDefined();
    expect(caps.features).toBeDefined();
    expect(typeof caps.features.analyzeText).toBe('boolean');
    expect(typeof caps.features.summarize).toBe('boolean');
    expect(Array.isArray(caps.supportedLanguages)).toBe(true);
  });

  test('analyzeText returns language + optional sentiment', async () => {
    const result = await analyzeText('I love this', { includeSentiment: true });
    expect(result.language).toBe('en');
    expect(result.sentiment).toBeGreaterThanOrEqual(-1);
    expect(result.sentiment as number).toBeLessThanOrEqual(1);
  });

  test('extractEntities and identifyLanguage are callable', async () => {
    await expect(extractEntities('hello')).resolves.toEqual([]);
    await expect(identifyLanguage('hello')).resolves.toBe('en');
  });

  test('analyzeImage returns text/objects/faces shape', async () => {
    const result = await analyzeImage('AAAA', { extractText: true });
    expect(result).toHaveProperty('text');
    expect(result).toHaveProperty('objects');
    expect(result).toHaveProperty('faces');
  });

  test('proofread iOS path returns correctedText', async () => {
    const result = await proofreadText('helo wrld');
    expect(result.correctedText).toBeDefined();
    expect(Array.isArray(result.corrections)).toBe(true);
  });

  test('summarize/rewrite/translate reject UNSUPPORTED_PLATFORM on iOS mock', async () => {
    await expect(summarizeText('long text', 'bullets')).rejects.toThrow();
    await expect(rewriteText('hello', 'professional')).rejects.toThrow();
    await expect(translateText('hello', 'en', 'es')).rejects.toThrow();
  });

  test('smartReplies returns array', async () => {
    const replies = await smartReplies([
      { text: 'how are you?', fromUser: false, timestampMs: Date.now() },
    ]);
    expect(Array.isArray(replies)).toBe(true);
  });

  test('private mode toggles', () => {
    enablePrivateMode(true);
    expect(typeof isPrivateModeEnabled()).toBe('boolean');
  });
});
