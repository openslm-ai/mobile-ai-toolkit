#import <Foundation/Foundation.h>

#ifdef RCT_NEW_ARCH_ENABLED
#import <AIToolkitTurboModuleSpec/AIToolkitTurboModuleSpec.h>

@interface AIToolkitTurboModule : NSObject <NativeAIToolkitSpec>
#else
#import <React/RCTBridgeModule.h>

@interface AIToolkitTurboModule : NSObject <RCTBridgeModule>
#endif

@end