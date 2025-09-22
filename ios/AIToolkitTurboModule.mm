#import "AIToolkitTurboModule.h"
#import <Vision/Vision.h>
#import <NaturalLanguage/NaturalLanguage.h>
#import <Speech/Speech.h>
#import <CoreML/CoreML.h>

#ifdef RCT_NEW_ARCH_ENABLED
#import <React/RCTConversions.h>
#import "AIToolkitTurboModuleSpec.h"
#endif

@implementation AIToolkitTurboModule

#ifdef RCT_NEW_ARCH_ENABLED
RCT_EXPORT_MODULE()

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
    return std::make_shared<facebook::react::NativeAIToolkitSpecJSI>(params);
}
#else
RCT_EXPORT_MODULE()
#endif

#pragma mark - Device Capabilities

RCT_EXPORT_METHOD(getDeviceCapabilities:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
    NSMutableDictionary *capabilities = [[NSMutableDictionary alloc] init];

    // Check for Neural Engine (iOS 11+)
    BOOL hasNeuralEngine = NO;
    if (@available(iOS 11.0, *)) {
        MLModelConfiguration *config = [[MLModelConfiguration alloc] init];
        config.computeUnits = MLComputeUnitsNeuralEngine;
        hasNeuralEngine = YES; // Assume available on modern devices
    }
    capabilities[@"hasNeuralEngine"] = @(hasNeuralEngine);

    // Check for Apple Intelligence (iOS 18.1+)
    BOOL hasAppleIntelligence = NO;
    if (@available(iOS 18.1, *)) {
        // Check if WritingTools framework is available
        hasAppleIntelligence = NSClassFromString(@"WTWritingToolsManager") != nil;
    }
    capabilities[@"hasAppleIntelligence"] = @(hasAppleIntelligence);

    // Always false for iOS
    capabilities[@"hasGeminiNano"] = @NO;

    // Check for ML Kit (always available)
    capabilities[@"hasMLKit"] = @YES;

    // Check for Core ML (iOS 11+)
    BOOL hasCoreML = NO;
    if (@available(iOS 11.0, *)) {
        hasCoreML = YES;
    }
    capabilities[@"hasCoreML"] = @(hasCoreML);

    // Supported languages
    NSArray *supportedLanguages = [NLLanguageRecognizer supportedLanguages];
    capabilities[@"supportedLanguages"] = supportedLanguages;

    // Model versions
    NSMutableDictionary *modelVersions = [[NSMutableDictionary alloc] init];
    if (@available(iOS 13.0, *)) {
        modelVersions[@"NaturalLanguage"] = @"iOS 13+";
    }
    if (@available(iOS 11.0, *)) {
        modelVersions[@"Vision"] = @"iOS 11+";
        modelVersions[@"CoreML"] = @"iOS 11+";
    }
    capabilities[@"modelVersions"] = modelVersions;

    resolve(capabilities);
}

#pragma mark - Text Analysis

RCT_EXPORT_METHOD(analyzeText:(NSString *)text
                 options:(NSDictionary *)options
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
    if (@available(iOS 13.0, *)) {
        NSMutableDictionary *result = [[NSMutableDictionary alloc] init];

        // Sentiment analysis
        BOOL includeSentiment = [options[@"includeSentiment"] boolValue];
        if (includeSentiment) {
            NLTagger *tagger = [[NLTagger alloc] initWithTagSchemes:@[NLTagSchemeSentimentScore]];
            tagger.string = text;

            NSRange range = NSMakeRange(0, text.length);
            NLTag sentimentTag = [tagger tagAtIndex:0 unit:NLTokenUnitDocument scheme:NLTagSchemeSentimentScore tokenRange:nil];

            double sentiment = 0.0;
            if (sentimentTag) {
                sentiment = [sentimentTag doubleValue];
            }
            result[@"sentiment"] = @(sentiment);
        }

        // Entity recognition
        BOOL includeEntities = [options[@"includeEntities"] boolValue];
        if (includeEntities) {
            NLTagger *tagger = [[NLTagger alloc] initWithTagSchemes:@[NLTagSchemeNameType]];
            tagger.string = text;

            NSMutableArray *entities = [[NSMutableArray alloc] init];
            NSRange range = NSMakeRange(0, text.length);

            [tagger enumerateTagsInRange:range
                                    unit:NLTokenUnitWord
                                  scheme:NLTagSchemeNameType
                                 options:NLTaggerOptionsOmitWhitespace | NLTaggerOptionsOmitPunctuation
                              usingBlock:^BOOL(NLTag _Nullable tag, NSRange tokenRange, BOOL * _Nonnull stop) {
                if (tag) {
                    NSString *entityText = [text substringWithRange:tokenRange];
                    NSDictionary *entity = @{
                        @"text": entityText,
                        @"type": tag,
                        @"confidence": @(0.8), // Placeholder confidence
                        @"range": @[@(tokenRange.location), @(tokenRange.location + tokenRange.length)]
                    };
                    [entities addObject:entity];
                }
                return YES;
            }];

            result[@"entities"] = entities;
        }

        // Language detection
        NLLanguageRecognizer *languageRecognizer = [[NLLanguageRecognizer alloc] init];
        [languageRecognizer processString:text];
        NLLanguage dominantLanguage = [languageRecognizer dominantLanguage];
        result[@"language"] = dominantLanguage ?: @"unknown";

        result[@"confidence"] = @(0.9);

        resolve(result);
    } else {
        reject(@"unsupported_ios_version", @"Text analysis requires iOS 13.0 or later", nil);
    }
}

#pragma mark - Writing Tools (iOS 18.1+)

RCT_EXPORT_METHOD(enhanceText:(NSString *)text
                 style:(NSString *)style
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
    if (@available(iOS 18.1, *)) {
        // Use Writing Tools API when available
        // This is a placeholder - actual implementation would use WritingTools framework
        NSString *enhancedText = [NSString stringWithFormat:@"Enhanced (%@): %@", style, text];
        resolve(enhancedText);
    } else {
        // Fallback for older iOS versions
        NSString *enhancedText = [NSString stringWithFormat:@"Enhanced: %@", text];
        resolve(enhancedText);
    }
}

RCT_EXPORT_METHOD(proofreadText:(NSString *)text
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
    if (@available(iOS 13.0, *)) {
        // Use NSSpellChecker for basic proofreading
        NSSpellChecker *spellChecker = [NSSpellChecker sharedSpellChecker];
        NSMutableArray *corrections = [[NSMutableArray alloc] init];
        NSString *correctedText = [text copy];

        NSRange searchRange = NSMakeRange(0, text.length);
        NSRange misspelledRange = [spellChecker rangeOfMisspelledWordInString:text
                                                                        range:searchRange
                                                                   startingAt:0
                                                                         wrap:NO
                                                                     language:@"en"];

        while (misspelledRange.location != NSNotFound) {
            NSString *misspelledWord = [text substringWithRange:misspelledRange];
            NSArray *suggestions = [spellChecker guessesForWordRange:misspelledRange
                                                            inString:text
                                                            language:@"en"
                                                  inSpellDocumentTag:0];

            if (suggestions.count > 0) {
                NSString *correction = suggestions[0];
                NSDictionary *correctionInfo = @{
                    @"original": misspelledWord,
                    @"corrected": correction,
                    @"type": @"spelling",
                    @"position": @[@(misspelledRange.location), @(misspelledRange.location + misspelledRange.length)]
                };
                [corrections addObject:correctionInfo];

                // Apply correction
                correctedText = [correctedText stringByReplacingCharactersInRange:misspelledRange withString:correction];
            }

            // Find next misspelled word
            searchRange = NSMakeRange(misspelledRange.location + misspelledRange.length,
                                    text.length - (misspelledRange.location + misspelledRange.length));
            if (searchRange.length == 0) break;

            misspelledRange = [spellChecker rangeOfMisspelledWordInString:text
                                                                    range:searchRange
                                                               startingAt:searchRange.location
                                                                     wrap:NO
                                                                 language:@"en"];
        }

        NSDictionary *result = @{
            @"correctedText": correctedText,
            @"corrections": corrections
        };

        resolve(result);
    } else {
        reject(@"unsupported_ios_version", @"Proofreading requires iOS 13.0 or later", nil);
    }
}

#pragma mark - Vision Analysis

RCT_EXPORT_METHOD(analyzeImage:(NSString *)imageBase64
                 options:(NSDictionary *)options
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
    if (@available(iOS 11.0, *)) {
        // Decode base64 image
        NSData *imageData = [[NSData alloc] initWithBase64EncodedString:imageBase64 options:0];
        UIImage *image = [UIImage imageWithData:imageData];

        if (!image) {
            reject(@"invalid_image", @"Failed to decode image", nil);
            return;
        }

        CIImage *ciImage = [CIImage imageWithCGImage:image.CGImage];
        NSMutableDictionary *result = [[NSMutableDictionary alloc] init];

        dispatch_group_t group = dispatch_group_create();

        // Object detection
        BOOL detectObjects = [options[@"detectObjects"] boolValue];
        if (detectObjects) {
            dispatch_group_enter(group);

            VNRecognizeObjectsRequest *objectRequest = [[VNRecognizeObjectsRequest alloc]
                initWithCompletionHandler:^(VNRequest * _Nonnull request, NSError * _Nullable error) {
                    if (!error && request.results.count > 0) {
                        NSMutableArray *objects = [[NSMutableArray alloc] init];

                        for (VNRecognizedObjectObservation *observation in request.results) {
                            NSDictionary *object = @{
                                @"label": observation.labels.firstObject.identifier ?: @"unknown",
                                @"confidence": @(observation.confidence),
                                @"bounds": @{
                                    @"x": @(observation.boundingBox.origin.x * image.size.width),
                                    @"y": @(observation.boundingBox.origin.y * image.size.height),
                                    @"width": @(observation.boundingBox.size.width * image.size.width),
                                    @"height": @(observation.boundingBox.size.height * image.size.height)
                                }
                            };
                            [objects addObject:object];
                        }

                        result[@"objects"] = objects;
                    }
                    dispatch_group_leave(group);
                }];

            VNImageRequestHandler *handler = [[VNImageRequestHandler alloc] initWithCIImage:ciImage options:@{}];
            [handler performRequests:@[objectRequest] error:nil];
        }

        // Text detection (OCR)
        BOOL extractText = [options[@"extractText"] boolValue];
        if (extractText) {
            dispatch_group_enter(group);

            VNRecognizeTextRequest *textRequest = [[VNRecognizeTextRequest alloc]
                initWithCompletionHandler:^(VNRequest * _Nonnull request, NSError * _Nullable error) {
                    if (!error && request.results.count > 0) {
                        NSMutableString *extractedText = [[NSMutableString alloc] init];

                        for (VNRecognizedTextObservation *observation in request.results) {
                            VNRecognizedText *recognizedText = [observation topCandidates:1].firstObject;
                            if (recognizedText) {
                                [extractedText appendString:recognizedText.string];
                                [extractedText appendString:@" "];
                            }
                        }

                        result[@"text"] = [extractedText stringByTrimmingCharactersInSet:
                                         [NSCharacterSet whitespaceCharacterSet]];
                    }
                    dispatch_group_leave(group);
                }];

            if (@available(iOS 13.0, *)) {
                textRequest.recognitionLevel = VNRequestTextRecognitionLevelAccurate;
            }

            VNImageRequestHandler *handler = [[VNImageRequestHandler alloc] initWithCIImage:ciImage options:@{}];
            [handler performRequests:@[textRequest] error:nil];
        }

        // Wait for all vision requests to complete
        dispatch_group_notify(group, dispatch_get_main_queue(), ^{
            result[@"confidence"] = @(0.9);
            result[@"faces"] = @[]; // Placeholder
            resolve(result);
        });

    } else {
        reject(@"unsupported_ios_version", @"Vision analysis requires iOS 11.0 or later", nil);
    }
}

#pragma mark - Voice Processing

RCT_EXPORT_METHOD(transcribeAudio:(NSString *)audioBase64
                 options:(NSDictionary *)options
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
    if (@available(iOS 10.0, *)) {
        // This is a simplified implementation
        // Real implementation would use SFSpeechRecognizer
        NSDictionary *result = @{
            @"transcript": @"Transcription not implemented in this demo",
            @"confidence": @(0.0),
            @"language": @"en-US",
            @"words": @[]
        };

        resolve(result);
    } else {
        reject(@"unsupported_ios_version", @"Speech recognition requires iOS 10.0 or later", nil);
    }
}

#pragma mark - Smart Features

RCT_EXPORT_METHOD(generateSmartReplies:(NSString *)message
                 context:(NSString *)context
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
    // Mock smart replies for now
    NSArray *replies = @[@"Thanks!", @"Got it", @"Sounds good"];
    resolve(replies);
}

RCT_EXPORT_METHOD(classifyIntent:(NSString *)text
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
    // Simple intent classification placeholder
    NSDictionary *result = @{
        @"intent": @"general",
        @"confidence": @(0.7),
        @"parameters": @{}
    };

    resolve(result);
}

#pragma mark - Privacy & Performance

static BOOL privateMode = NO;

RCT_EXPORT_METHOD(enablePrivateMode:(BOOL)enabled)
{
    privateMode = enabled;
}

RCT_EXPORT_METHOD(isPrivateModeEnabled:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
    resolve(@(privateMode));
}

RCT_EXPORT_METHOD(preloadModels:(NSArray *)modelTypes
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
    // Mock preloading
    resolve(@YES);
}

RCT_EXPORT_METHOD(getModelStatus:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
    NSDictionary *status = @{
        @"vision": @"loaded",
        @"text": @"loaded",
        @"speech": @"loaded"
    };

    resolve(status);
}

#ifdef RCT_NEW_ARCH_ENABLED
- (facebook::react::ModuleConstants<JS::NativeAIToolkit::Constants>)constantsToExport
{
    return [self getConstants];
}

- (facebook::react::ModuleConstants<JS::NativeAIToolkit::Constants>)getConstants
{
    return facebook::react::typedConstants<JS::NativeAIToolkit::Constants>({
        .SUPPORTED_PLATFORMS = @[@"ios"]
    });
}
#endif

@end