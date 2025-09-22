import { AI } from '../index';

describe('AI Toolkit', () => {
  beforeAll(async () => {
    await AI.initialize();
  });

  test('should initialize successfully', async () => {
    const capabilities = AI.getDeviceCapabilities();
    expect(capabilities).toBeDefined();
    expect(capabilities).toHaveProperty('hasCoreML');
    expect(capabilities).toHaveProperty('hasMLKit');
  });

  test('should analyze text sentiment', async () => {
    const result = await AI.analyze('I love this app!');
    expect(result).toBeDefined();
    expect(result).toHaveProperty('sentiment');
    expect(result).toHaveProperty('language');
    expect(result.sentiment).toBeGreaterThanOrEqual(-1);
    expect(result.sentiment).toBeLessThanOrEqual(1);
  });

  test('should handle image analysis', async () => {
    const mockBase64 =
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const result = await AI.understand(mockBase64);
    expect(result).toBeDefined();
    expect(result).toHaveProperty('objects');
    expect(result).toHaveProperty('text');
    expect(result).toHaveProperty('faces');
  });

  test('should get device capabilities', () => {
    const capabilities = AI.getDeviceCapabilities();
    expect(capabilities).toBeDefined();
    expect(typeof capabilities.hasCoreML).toBe('boolean');
    expect(typeof capabilities.hasMLKit).toBe('boolean');
    expect(Array.isArray(capabilities.supportedLanguages)).toBe(true);
  });

  test('should handle configuration', () => {
    AI.configure({
      preferOnDevice: true,
      enablePrivateMode: false,
      cacheEnabled: true,
    });

    // Configuration is stored internally, so just test that configure doesn't throw
    expect(() => AI.configure({ preferOnDevice: false })).not.toThrow();
  });

  test('should support private mode', () => {
    // Private mode is handled through configuration
    expect(() => AI.configure({ enablePrivateMode: true })).not.toThrow();
    expect(() => AI.configure({ enablePrivateMode: false })).not.toThrow();
  });
});
