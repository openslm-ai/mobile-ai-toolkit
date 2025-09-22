// Mock TurboModuleRegistry for library tests
global.TurboModuleRegistry = {
  get: jest.fn((name) => {
    if (name === 'AIToolkit') {
      return {
        getDeviceCapabilities: jest.fn().mockResolvedValue({
          hasOnDeviceAI: true,
          models: ['text-analysis', 'vision'],
          features: {
            textAnalysis: true,
            vision: true,
            speech: false,
            translation: false,
            customModels: false,
          },
          platformInfo: {
            os: 'ios',
            version: '17.0',
            device: 'iPhone15,1',
          },
        }),
        analyzeText: jest.fn().mockResolvedValue({
          sentiment: { score: 0.8, label: 'positive' },
          entities: [],
          language: 'en',
          processingTime: 50,
          wasOnDevice: true,
        }),
        analyzeImage: jest.fn().mockResolvedValue({
          objects: [],
          text: '',
          faces: [],
          processingTime: 100,
          wasOnDevice: true,
        }),
        transcribeAudio: jest.fn(),
        synthesizeSpeech: jest.fn(),
        loadModel: jest.fn(),
        unloadModel: jest.fn(),
        runInference: jest.fn(),
        getModelInfo: jest.fn(),
        listAvailableModels: jest.fn(),
        clearCache: jest.fn(),
        updateCloudEndpoints: jest.fn(),
        setPrivateMode: jest.fn(),
      };
    }
    return null;
  }),
};

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
}));
