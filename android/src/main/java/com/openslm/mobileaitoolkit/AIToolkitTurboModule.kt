package com.openslm.mobileaitoolkit

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.util.Base64
import com.facebook.react.bridge.*
import com.facebook.react.module.annotations.ReactModule
import com.google.mlkit.common.model.DownloadConditions
import com.google.mlkit.nl.languageid.LanguageIdentification
import com.google.mlkit.nl.translate.TranslateLanguage
import com.google.mlkit.nl.translate.Translation
import com.google.mlkit.nl.translate.TranslatorOptions
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.face.FaceDetection
import com.google.mlkit.vision.face.FaceDetectorOptions
import com.google.mlkit.vision.objects.ObjectDetection
import com.google.mlkit.vision.objects.defaults.ObjectDetectorOptions
import com.google.mlkit.vision.text.TextRecognition
import com.google.mlkit.vision.text.latin.TextRecognizerOptions
import java.io.ByteArrayOutputStream

@ReactModule(name = AIToolkitTurboModule.NAME)
class AIToolkitTurboModule(private val reactContext: ReactApplicationContext) :
    NativeAIToolkitSpec(reactContext) {

    companion object {
        const val NAME = "AIToolkitTurboModule"
    }

    override fun getName(): String = NAME

    private var privateMode = false

    override fun getDeviceCapabilities(promise: Promise) {
        val capabilities = WritableNativeMap().apply {
            putBoolean("hasNeuralEngine", false) // Android doesn't have Neural Engine
            putBoolean("hasAppleIntelligence", false) // iOS only
            putBoolean("hasGeminiNano", checkGeminiNanoAvailability())
            putBoolean("hasMLKit", true)
            putBoolean("hasCoreML", false) // iOS only

            val supportedLanguages = WritableNativeArray().apply {
                // Add common languages supported by ML Kit
                pushString("en")
                pushString("es")
                pushString("fr")
                pushString("de")
                pushString("it")
                pushString("pt")
                pushString("ru")
                pushString("ja")
                pushString("ko")
                pushString("zh")
                pushString("ar")
                pushString("hi")
            }
            putArray("supportedLanguages", supportedLanguages)

            val modelVersions = WritableNativeMap().apply {
                putString("MLKit", "Android ML Kit")
                putString("TextRecognition", "16.0.0")
                putString("ObjectDetection", "17.0.1")
                putString("FaceDetection", "16.1.5")
            }
            putMap("modelVersions", modelVersions)
        }

        promise.resolve(capabilities)
    }

    override fun analyzeText(text: String, options: ReadableMap, promise: Promise) {
        try {
            val result = WritableNativeMap()

            // Language identification
            val languageIdentifier = LanguageIdentification.getClient()
            languageIdentifier.identifyLanguage(text)
                .addOnSuccessListener { languageCode ->
                    result.putString("language", if (languageCode == "und") "unknown" else languageCode)

                    // Simple sentiment analysis (placeholder)
                    val sentiment = calculateSimpleSentiment(text)
                    result.putDouble("sentiment", sentiment)

                    // Basic entity extraction (placeholder)
                    val entities = extractBasicEntities(text)
                    result.putArray("entities", entities)

                    result.putDouble("confidence", 0.85)

                    promise.resolve(result)
                }
                .addOnFailureListener { exception ->
                    promise.reject("LANGUAGE_ID_ERROR", exception.message, exception)
                }
        } catch (e: Exception) {
            promise.reject("TEXT_ANALYSIS_ERROR", e.message, e)
        }
    }

    override fun enhanceText(text: String, style: String, promise: Promise) {
        // Placeholder implementation - would integrate with Gemini Nano when available
        val enhancedText = when (style) {
            "professional" -> "Dear colleague, $text. Best regards."
            "friendly" -> "Hey! $text 😊"
            "concise" -> text.split(" ").take(10).joinToString(" ")
            "creative" -> "✨ $text ✨"
            else -> text
        }
        promise.resolve(enhancedText)
    }

    override fun proofreadText(text: String, promise: Promise) {
        // Basic proofreading implementation
        val result = WritableNativeMap().apply {
            putString("correctedText", text) // Placeholder
            putArray("corrections", WritableNativeArray()) // Empty for now
        }
        promise.resolve(result)
    }

    override fun summarizeText(text: String, format: String, promise: Promise) {
        // Simple summarization (placeholder)
        val summary = when (format) {
            "bullets" -> "• " + text.split(".").take(3).joinToString("\n• ")
            "key-points" -> "Key points: " + text.split(" ").take(20).joinToString(" ")
            else -> text.split(" ").take(30).joinToString(" ") + "..."
        }
        promise.resolve(summary)
    }

    override fun analyzeImage(imageBase64: String, options: ReadableMap, promise: Promise) {
        try {
            val imageBytes = Base64.decode(imageBase64, Base64.DEFAULT)
            val bitmap = BitmapFactory.decodeByteArray(imageBytes, 0, imageBytes.size)
            val image = InputImage.fromBitmap(bitmap, 0)

            val result = WritableNativeMap()
            val detectObjects = options.getBoolean("detectObjects")
            val extractText = options.getBoolean("extractText")
            val detectFaces = options.getBoolean("detectFaces")

            var tasksCompleted = 0
            val totalTasks = listOf(detectObjects, extractText, detectFaces).count { it }

            fun checkComplete() {
                tasksCompleted++
                if (tasksCompleted >= totalTasks) {
                    result.putDouble("confidence", 0.9)
                    promise.resolve(result)
                }
            }

            // Object detection
            if (detectObjects) {
                val objectDetector = ObjectDetection.getClient(
                    ObjectDetectorOptions.Builder()
                        .setDetectorMode(ObjectDetectorOptions.SINGLE_IMAGE_MODE)
                        .enableMultipleObjects()
                        .build()
                )

                objectDetector.process(image)
                    .addOnSuccessListener { detectedObjects ->
                        val objectsArray = WritableNativeArray()
                        detectedObjects.forEach { obj ->
                            val objectMap = WritableNativeMap().apply {
                                putString("label", "object") // ML Kit provides labels
                                putDouble("confidence", 0.8)
                                val bounds = WritableNativeMap().apply {
                                    putDouble("x", obj.boundingBox.left.toDouble())
                                    putDouble("y", obj.boundingBox.top.toDouble())
                                    putDouble("width", obj.boundingBox.width().toDouble())
                                    putDouble("height", obj.boundingBox.height().toDouble())
                                }
                                putMap("bounds", bounds)
                            }
                            objectsArray.pushMap(objectMap)
                        }
                        result.putArray("objects", objectsArray)
                        checkComplete()
                    }
                    .addOnFailureListener {
                        result.putArray("objects", WritableNativeArray())
                        checkComplete()
                    }
            }

            // Text recognition (OCR)
            if (extractText) {
                val recognizer = TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS)
                recognizer.process(image)
                    .addOnSuccessListener { visionText ->
                        result.putString("text", visionText.text)
                        checkComplete()
                    }
                    .addOnFailureListener {
                        result.putString("text", "")
                        checkComplete()
                    }
            }

            // Face detection
            if (detectFaces) {
                val options = FaceDetectorOptions.Builder()
                    .setPerformanceMode(FaceDetectorOptions.PERFORMANCE_MODE_FAST)
                    .build()

                val detector = FaceDetection.getClient(options)
                detector.process(image)
                    .addOnSuccessListener { faces ->
                        val facesArray = WritableNativeArray()
                        faces.forEach { face ->
                            val faceMap = WritableNativeMap().apply {
                                val bounds = WritableNativeMap().apply {
                                    putDouble("x", face.boundingBox.left.toDouble())
                                    putDouble("y", face.boundingBox.top.toDouble())
                                    putDouble("width", face.boundingBox.width().toDouble())
                                    putDouble("height", face.boundingBox.height().toDouble())
                                }
                                putMap("bounds", bounds)
                            }
                            facesArray.pushMap(faceMap)
                        }
                        result.putArray("faces", facesArray)
                        checkComplete()
                    }
                    .addOnFailureListener {
                        result.putArray("faces", WritableNativeArray())
                        checkComplete()
                    }
            }

            if (totalTasks == 0) {
                promise.resolve(result)
            }

        } catch (e: Exception) {
            promise.reject("IMAGE_ANALYSIS_ERROR", e.message, e)
        }
    }

    override fun transcribeAudio(audioBase64: String, options: ReadableMap, promise: Promise) {
        // Placeholder - would implement with Speech Recognition API
        val result = WritableNativeMap().apply {
            putString("transcript", "Audio transcription not implemented in demo")
            putDouble("confidence", 0.0)
            putString("language", "en-US")
            putArray("words", WritableNativeArray())
        }
        promise.resolve(result)
    }

    override fun generateSmartReplies(message: String, context: String?, promise: Promise) {
        // Mock smart replies
        val replies = WritableNativeArray().apply {
            pushString("Thanks!")
            pushString("Got it")
            pushString("Sounds good")
        }
        promise.resolve(replies)
    }

    override fun classifyIntent(text: String, promise: Promise) {
        // Simple intent classification
        val result = WritableNativeMap().apply {
            putString("intent", "general")
            putDouble("confidence", 0.7)
            putMap("parameters", WritableNativeMap())
        }
        promise.resolve(result)
    }

    override fun enablePrivateMode(enabled: Boolean) {
        privateMode = enabled
    }

    override fun isPrivateModeEnabled(): Boolean {
        return privateMode
    }

    override fun preloadModels(modelTypes: ReadableArray, promise: Promise) {
        // Mock preloading
        promise.resolve(true)
    }

    override fun getModelStatus(promise: Promise) {
        val status = WritableNativeMap().apply {
            putString("vision", "loaded")
            putString("text", "loaded")
            putString("speech", "loaded")
        }
        promise.resolve(status)
    }

    // Helper methods
    private fun checkGeminiNanoAvailability(): Boolean {
        // Check for Gemini Nano via ML Kit GenAI APIs (Android 14+)
        // Stays vanilla - works on Pixel, Samsung, Xiaomi, OnePlus etc
        // Avoids vendor-specific APIs (Galaxy AI, HyperOS AI, etc)
        return android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.UPSIDE_DOWN_CAKE &&
               isMLKitGenAIAvailable()
    }

    private fun isMLKitGenAIAvailable(): Boolean {
        return try {
            // Check if ML Kit GenAI is available (vanilla Android)
            Class.forName("com.google.mlkit.genai.GenerativeModel")
            true
        } catch (e: ClassNotFoundException) {
            false
        }
    }

    private fun calculateSimpleSentiment(text: String): Double {
        // Very simple sentiment analysis based on keywords
        val positiveWords = listOf("good", "great", "awesome", "love", "excellent", "amazing", "wonderful")
        val negativeWords = listOf("bad", "terrible", "hate", "awful", "horrible", "worst", "disappointing")

        val words = text.lowercase().split(" ")
        val positiveCount = words.count { it in positiveWords }
        val negativeCount = words.count { it in negativeWords }

        return when {
            positiveCount > negativeCount -> 0.7
            negativeCount > positiveCount -> -0.7
            else -> 0.0
        }
    }

    private fun extractBasicEntities(text: String): WritableNativeArray {
        // Basic entity extraction (placeholder)
        val entities = WritableNativeArray()

        // Look for email patterns
        val emailRegex = Regex("[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}")
        emailRegex.findAll(text).forEach { match ->
            val entity = WritableNativeMap().apply {
                putString("text", match.value)
                putString("type", "email")
                putDouble("confidence", 0.9)
                val range = WritableNativeArray().apply {
                    pushInt(match.range.first)
                    pushInt(match.range.last + 1)
                }
                putArray("range", range)
            }
            entities.pushMap(entity)
        }

        return entities
    }
}