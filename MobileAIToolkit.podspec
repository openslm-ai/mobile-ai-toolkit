require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "MobileAIToolkit"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = package["author"]

  s.platforms    = { :ios => "14.0" }
  s.source       = { :git => "https://github.com/openslm-ai/mobile-ai-toolkit.git", :tag => "#{s.version}" }

  s.source_files = [
    "ios/**/*.{h,m,mm,swift}",
    "src/specs/*.ts"
  ]

  # New Architecture support
  s.pod_target_xcconfig = {
    "HEADER_SEARCH_PATHS" => "\"$(PODS_ROOT)/boost\"",
    "CLANG_CXX_LANGUAGE_STANDARD" => "c++17"
  }

  if ENV['RCT_NEW_ARCH_ENABLED'] == '1'
    s.compiler_flags = folly_compiler_flags + ' -DRCT_NEW_ARCH_ENABLED=1'
    s.pod_target_xcconfig['OTHER_CPLUSPLUSFLAGS'] = '-DRCT_NEW_ARCH_ENABLED=1'

    s.dependency "React-Codegen"
    s.dependency "RCT-Folly"
    s.dependency "RCTRequired"
    s.dependency "RCTTypeSafety"
    s.dependency "ReactCommon/turbomodule/core"
  else
    # Old Architecture fallback
    s.dependency "React-Core"
  end

  # iOS AI frameworks
  s.frameworks = [
    "Foundation",
    "Vision",
    "VisionKit",
    "NaturalLanguage",
    "Speech",
    "AVFoundation",
    "CoreML",
    "CreateML"
  ]

  # iOS 18.1+ Apple Intelligence (optional)
  # FoundationModels is iOS 26+; weak-link so older iOS still loads the dylib.
  s.weak_frameworks = [
    "WritingTools",      # iOS 18.1+
    "AppIntents",        # iOS 18.1+
    "FoundationModels"   # iOS 26+
  ]

  s.dependency "React"

  # Don't install the dependencies when we run `pod install` in the old architecture.
  if ENV['RCT_NEW_ARCH_ENABLED'] == '1'
    s.dependency "React-Codegen"
    s.dependency "RCT-Folly"
    s.dependency "RCTRequired"
    s.dependency "RCTTypeSafety"
    s.dependency "ReactCommon/turbomodule/core"
  end
end