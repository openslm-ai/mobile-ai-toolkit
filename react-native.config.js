module.exports = {
  dependency: {
    platforms: {
      android: {
        sourceDir: '../android',
        packageImportPath: 'import com.openslm.mobileaitoolkit.AIToolkitTurboModule;',
      },
      ios: {
        project: 'ios/AIToolkitTurboModule.xcodeproj',
      },
    },
  },
};
