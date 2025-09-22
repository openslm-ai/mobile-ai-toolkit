// Mock React Native Platform module
module.exports = {
  Platform: {
    OS: 'ios',
    Version: '17.0',
    select: (obj) => obj.ios || obj.default,
  },
  NativeModules: {},
};
