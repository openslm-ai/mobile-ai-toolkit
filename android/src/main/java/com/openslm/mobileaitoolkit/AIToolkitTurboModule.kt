package com.openslm.mobileaitoolkit

import android.content.Intent
import android.graphics.BitmapFactory
import android.os.Build
import android.os.Bundle
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import android.util.Base64
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap
import com.facebook.react.module.annotations.ReactModule
import com.google.mlkit.common.model.DownloadConditions
import com.google.mlkit.genai.imagedescription.ImageDescriber
import com.google.mlkit.genai.imagedescription.ImageDescriberOptions
import com.google.mlkit.genai.imagedescription.ImageDescription
import com.google.mlkit.genai.imagedescription.ImageDescriptionRequest
import com.google.mlkit.genai.prompt.GenerativeModel
import com.google.mlkit.genai.prompt.PromptApi
import com.google.mlkit.genai.prompt.PromptRequest
import com.google.mlkit.genai.proofreading.Proofreader
import com.google.mlkit.genai.proofreading.ProofreaderOptions
import com.google.mlkit.genai.proofreading.Proofreading
import com.google.mlkit.genai.proofreading.ProofreadingRequest
import com.google.mlkit.genai.rewriting.Rewriter
import com.google.mlkit.genai.rewriting.RewriterOptions
import com.google.mlkit.genai.rewriting.Rewriting
import com.google.mlkit.genai.rewriting.RewritingRequest
import com.google.mlkit.genai.summarization.Summarization
import com.google.mlkit.genai.summarization.SummarizationRequest
import com.google.mlkit.genai.summarization.Summarizer
import com.google.mlkit.genai.summarization.SummarizerOptions
import com.google.mlkit.nl.entityextraction.EntityExtraction
import com.google.mlkit.nl.entityextraction.EntityExtractionParams
import com.google.mlkit.nl.entityextraction.EntityExtractorOptions
import com.google.mlkit.nl.languageid.LanguageIdentification
import com.google.mlkit.nl.smartreply.SmartReply
import com.google.mlkit.nl.smartreply.TextMessage
import com.google.mlkit.nl.translate.TranslateLanguage
import com.google.mlkit.nl.translate.Translation
import com.google.mlkit.nl.translate.TranslatorOptions
import com.google.mlkit.vision.barcode.BarcodeScannerOptions
import com.google.mlkit.vision.barcode.BarcodeScanning
import com.google.mlkit.vision.barcode.common.Barcode
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.face.FaceDetection
import com.google.mlkit.vision.face.FaceDetectorOptions
import com.google.mlkit.vision.label.ImageLabeling
import com.google.mlkit.vision.label.defaults.ImageLabelerOptions
import com.google.mlkit.vision.objects.ObjectDetection
import com.google.mlkit.vision.objects.defaults.ObjectDetectorOptions
import com.google.mlkit.vision.segmentation.selfie.SelfieSegmentation
import com.google.mlkit.vision.segmentation.selfie.SelfieSegmenterOptions
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
        val capabilities = Arguments.createMap().apply {
            putString("platform", "android")
            putString("osVersion", Build.VERSION.RELEASE)
            putBoolean("hasNeuralEngine", false)
            putBoolean("hasAppleIntelligence", false)
            val hasGenAI = isMLKitGenAIPresent()
            putBoolean("hasGeminiNano", hasGenAI)
            putBoolean("hasMLKitGenAI", hasGenAI)
            putBoolean("hasOnDeviceSpeech", SpeechRecognizer.isRecognitionAvailable(reactContext))

            val langs = Arguments.createArray().apply {
                TranslateLanguage.getAllLanguages().forEach { pushString(it) }
            }
            putArray("supportedLanguages", langs)

            putMap("features", Arguments.createMap().apply {
                putBoolean("analyzeText", true)
                putBoolean("analyzeImage", true)
                putBoolean("proofread", hasGenAI)
                putBoolean("summarize", hasGenAI)
                putBoolean("rewrite", hasGenAI)
                putBoolean("generate", hasGenAI)
                putBoolean("smartReplies", true)
                putBoolean("extractEntities", true)
                putBoolean("embedText", false)
                putBoolean("translate", true)
                putBoolean("transcribe", SpeechRecognizer.isRecognitionAvailable(reactContext))
                putBoolean("scanBarcodes", true)
                putBoolean("labelImage", true)
                putBoolean("describeImage", hasGenAI)
                putBoolean("segmentPerson", true)
            })
        }
        promise.resolve(capabilities)
    }

    private fun isMLKitGenAIPresent(): Boolean = try {
        Class.forName("com.google.mlkit.genai.summarization.Summarization")
        true
    } catch (_: Throwable) {
        false
    }

    // ---- Text ----

    override fun analyzeText(text: String, options: ReadableMap, promise: Promise) {
        if (text.isEmpty()) {
            promise.reject("INVALID_INPUT", "Text cannot be empty")
            return
        }
        val result = Arguments.createMap()
        val client = LanguageIdentification.getClient()
        client.identifyPossibleLanguages(text)
            .addOnSuccessListener { languages ->
                val top = languages.firstOrNull()
                result.putString("language", top?.languageTag?.takeIf { it != "und" } ?: "unknown")
                result.putDouble("confidence", top?.confidence?.toDouble() ?: 0.0)

                val includeEntities = options.takeIf { it.hasKey("includeEntities") }?.getBoolean("includeEntities") == true
                if (!includeEntities) {
                    promise.resolve(result)
                    return@addOnSuccessListener
                }
                runEntityExtraction(text) { entitiesArray, err ->
                    if (err != null) {
                        result.putArray("entities", Arguments.createArray())
                    } else {
                        result.putArray("entities", entitiesArray)
                    }
                    promise.resolve(result)
                }
            }
            .addOnFailureListener { e ->
                promise.reject("LANGUAGE_ID_ERROR", e.message, e)
            }
    }

    override fun extractEntities(text: String, promise: Promise) {
        runEntityExtraction(text) { array, err ->
            if (err != null) promise.reject("ENTITY_EXTRACTION_ERROR", err.message, err)
            else promise.resolve(array)
        }
    }

    private fun runEntityExtraction(text: String, callback: (WritableArray, Throwable?) -> Unit) {
        val extractor = EntityExtraction.getClient(
            EntityExtractorOptions.Builder(EntityExtractorOptions.ENGLISH).build()
        )
        extractor.downloadModelIfNeeded()
            .continueWithTask { extractor.annotate(EntityExtractionParams.Builder(text).build()) }
            .addOnSuccessListener { annotations ->
                val arr = Arguments.createArray()
                annotations.forEach { ann ->
                    ann.entities.forEach { entity ->
                        arr.pushMap(Arguments.createMap().apply {
                            putString("text", ann.annotatedText)
                            putString("type", mapEntityType(entity.type))
                            putDouble("confidence", 0.85)
                            putArray("range", Arguments.createArray().apply {
                                pushInt(ann.start)
                                pushInt(ann.end)
                            })
                        })
                    }
                }
                callback(arr, null)
            }
            .addOnFailureListener { callback(Arguments.createArray(), it) }
    }

    private fun mapEntityType(typeId: Int): String = when (typeId) {
        1 -> "address"
        2 -> "date"
        3 -> "email"
        4 -> "phone"
        5 -> "money"
        9 -> "url"
        else -> "other"
    }

    override fun identifyLanguage(text: String, promise: Promise) {
        LanguageIdentification.getClient().identifyLanguage(text)
            .addOnSuccessListener { code -> promise.resolve(if (code == "und") "unknown" else code) }
            .addOnFailureListener { promise.reject("LANGUAGE_ID_ERROR", it.message, it) }
    }

    // ---- Image ----

    override fun analyzeImage(imageBase64: String, options: ReadableMap, promise: Promise) {
        try {
            val bytes = Base64.decode(imageBase64, Base64.DEFAULT)
            val bitmap = BitmapFactory.decodeByteArray(bytes, 0, bytes.size)
                ?: return promise.reject("INVALID_IMAGE", "Failed to decode image")
            val image = InputImage.fromBitmap(bitmap, 0)

            val result = Arguments.createMap().apply {
                putString("text", "")
                putArray("objects", Arguments.createArray())
                putArray("faces", Arguments.createArray())
            }

            val tasks = mutableListOf<() -> Unit>()
            var pending = 0
            val complete = {
                pending -= 1
                if (pending == 0) promise.resolve(result)
            }

            if (options.takeIf { it.hasKey("extractText") }?.getBoolean("extractText") == true) {
                pending++
                tasks += {
                    TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS)
                        .process(image)
                        .addOnSuccessListener { text -> result.putString("text", text.text); complete() }
                        .addOnFailureListener { complete() }
                }
            }
            if (options.takeIf { it.hasKey("detectObjects") }?.getBoolean("detectObjects") == true) {
                pending++
                tasks += {
                    val opts = ObjectDetectorOptions.Builder()
                        .setDetectorMode(ObjectDetectorOptions.SINGLE_IMAGE_MODE)
                        .enableClassification()
                        .enableMultipleObjects()
                        .build()
                    ObjectDetection.getClient(opts).process(image)
                        .addOnSuccessListener { detected ->
                            val arr = Arguments.createArray()
                            detected.forEach { obj ->
                                arr.pushMap(Arguments.createMap().apply {
                                    val label = obj.labels.firstOrNull()
                                    putString("label", label?.text ?: "object")
                                    putDouble("confidence", label?.confidence?.toDouble() ?: 0.0)
                                    putMap("bounds", Arguments.createMap().apply {
                                        putDouble("x", obj.boundingBox.left.toDouble())
                                        putDouble("y", obj.boundingBox.top.toDouble())
                                        putDouble("width", obj.boundingBox.width().toDouble())
                                        putDouble("height", obj.boundingBox.height().toDouble())
                                    })
                                })
                            }
                            result.putArray("objects", arr)
                            complete()
                        }
                        .addOnFailureListener { complete() }
                }
            }
            if (options.takeIf { it.hasKey("detectFaces") }?.getBoolean("detectFaces") == true) {
                pending++
                tasks += {
                    val opts = FaceDetectorOptions.Builder()
                        .setPerformanceMode(FaceDetectorOptions.PERFORMANCE_MODE_FAST)
                        .build()
                    FaceDetection.getClient(opts).process(image)
                        .addOnSuccessListener { faces ->
                            val arr = Arguments.createArray()
                            faces.forEach { face ->
                                arr.pushMap(Arguments.createMap().apply {
                                    putMap("bounds", Arguments.createMap().apply {
                                        putDouble("x", face.boundingBox.left.toDouble())
                                        putDouble("y", face.boundingBox.top.toDouble())
                                        putDouble("width", face.boundingBox.width().toDouble())
                                        putDouble("height", face.boundingBox.height().toDouble())
                                    })
                                })
                            }
                            result.putArray("faces", arr)
                            complete()
                        }
                        .addOnFailureListener { complete() }
                }
            }

            if (tasks.isEmpty()) {
                promise.resolve(result)
            } else {
                tasks.forEach { it() }
            }
        } catch (e: Exception) {
            promise.reject("IMAGE_ANALYSIS_ERROR", e.message, e)
        }
    }

    // ---- Generative (ML Kit GenAI, Beta) ----

    override fun summarizeText(text: String, format: String, promise: Promise) {
        try {
            val opts = SummarizerOptions.builder(reactContext)
                .setInputType(SummarizerOptions.InputType.ARTICLE)
                .setOutputType(
                    if (format == "bullets") SummarizerOptions.OutputType.THREE_BULLETS
                    else SummarizerOptions.OutputType.ONE_BULLET
                )
                .setLanguage(SummarizerOptions.Language.ENGLISH)
                .build()
            val summarizer: Summarizer = Summarization.getClient(opts)
            summarizer.checkFeatureStatus()
                .addOnSuccessListener { status ->
                    summarizer.prepareInferenceEngine()
                        .addOnSuccessListener {
                            val request = SummarizationRequest.builder(text).build()
                            val sb = StringBuilder()
                            summarizer.runInference(request) { token ->
                                sb.append(token)
                            }.addOnSuccessListener {
                                promise.resolve(sb.toString().ifEmpty { "" })
                                summarizer.close()
                            }.addOnFailureListener {
                                promise.reject("SUMMARIZE_INFERENCE_ERROR", it.message, it)
                                summarizer.close()
                            }
                        }
                        .addOnFailureListener {
                            promise.reject("SUMMARIZE_PREPARE_ERROR", it.message, it)
                            summarizer.close()
                        }
                }
                .addOnFailureListener {
                    promise.reject("FEATURE_UNAVAILABLE", "ML Kit GenAI Summarizer is not available on this device. ${it.message}", it)
                    summarizer.close()
                }
        } catch (e: Throwable) {
            promise.reject("FEATURE_UNAVAILABLE", "ML Kit GenAI is not installed in this build", e)
        }
    }

    override fun rewriteText(text: String, style: String, promise: Promise) {
        try {
            val outputType = when (style) {
                "professional" -> RewriterOptions.OutputType.FORMAL
                "friendly", "casual" -> RewriterOptions.OutputType.CASUAL
                "concise" -> RewriterOptions.OutputType.SHORTEN
                "creative", "elaborate" -> RewriterOptions.OutputType.ELABORATE
                else -> RewriterOptions.OutputType.REPHRASE
            }
            val opts = RewriterOptions.builder(reactContext)
                .setOutputType(outputType)
                .setLanguage(RewriterOptions.Language.ENGLISH)
                .build()
            val rewriter: Rewriter = Rewriting.getClient(opts)
            rewriter.checkFeatureStatus()
                .addOnSuccessListener {
                    rewriter.prepareInferenceEngine()
                        .addOnSuccessListener {
                            val request = RewritingRequest.builder(text).build()
                            rewriter.runInference(request)
                                .addOnSuccessListener { res ->
                                    val first = res.results.firstOrNull()?.text ?: text
                                    promise.resolve(first)
                                    rewriter.close()
                                }
                                .addOnFailureListener {
                                    promise.reject("REWRITE_INFERENCE_ERROR", it.message, it)
                                    rewriter.close()
                                }
                        }
                        .addOnFailureListener {
                            promise.reject("REWRITE_PREPARE_ERROR", it.message, it)
                            rewriter.close()
                        }
                }
                .addOnFailureListener {
                    promise.reject("FEATURE_UNAVAILABLE", "ML Kit GenAI Rewriter is not available on this device. ${it.message}", it)
                    rewriter.close()
                }
        } catch (e: Throwable) {
            promise.reject("FEATURE_UNAVAILABLE", "ML Kit GenAI is not installed in this build", e)
        }
    }

    override fun proofreadText(text: String, promise: Promise) {
        try {
            val opts = ProofreaderOptions.builder(reactContext)
                .setLanguage(ProofreaderOptions.Language.ENGLISH)
                .build()
            val proofreader: Proofreader = Proofreading.getClient(opts)
            proofreader.checkFeatureStatus()
                .addOnSuccessListener {
                    proofreader.prepareInferenceEngine()
                        .addOnSuccessListener {
                            val request = ProofreadingRequest.builder(text).build()
                            proofreader.runInference(request)
                                .addOnSuccessListener { res ->
                                    val corrected = res.results.firstOrNull()?.text ?: text
                                    val out = Arguments.createMap().apply {
                                        putString("correctedText", corrected)
                                        putArray("corrections", Arguments.createArray())
                                    }
                                    promise.resolve(out)
                                    proofreader.close()
                                }
                                .addOnFailureListener {
                                    promise.reject("PROOFREAD_INFERENCE_ERROR", it.message, it)
                                    proofreader.close()
                                }
                        }
                        .addOnFailureListener {
                            promise.reject("PROOFREAD_PREPARE_ERROR", it.message, it)
                            proofreader.close()
                        }
                }
                .addOnFailureListener {
                    promise.reject("FEATURE_UNAVAILABLE", "ML Kit GenAI Proofreader is not available on this device. ${it.message}", it)
                    proofreader.close()
                }
        } catch (e: Throwable) {
            promise.reject("FEATURE_UNAVAILABLE", "ML Kit GenAI is not installed in this build", e)
        }
    }

    override fun smartReplies(messages: ReadableArray, promise: Promise) {
        val conversation = mutableListOf<TextMessage>()
        for (i in 0 until messages.size()) {
            val m = messages.getMap(i)
            val text = m.getString("text") ?: continue
            val fromUser = if (m.hasKey("fromUser")) m.getBoolean("fromUser") else false
            val ts = if (m.hasKey("timestampMs")) m.getDouble("timestampMs").toLong() else System.currentTimeMillis()
            val msg = if (fromUser) TextMessage.createForLocalUser(text, ts)
                      else TextMessage.createForRemoteUser(text, ts, "remote")
            conversation.add(msg)
        }
        SmartReply.getClient().suggestReplies(conversation)
            .addOnSuccessListener { result ->
                val arr = Arguments.createArray()
                result.suggestions.forEach { arr.pushString(it.text) }
                promise.resolve(arr)
            }
            .addOnFailureListener { promise.reject("SMART_REPLY_ERROR", it.message, it) }
    }

    override fun translateText(text: String, sourceLang: String, targetLang: String, promise: Promise) {
        val src = TranslateLanguage.fromLanguageTag(sourceLang)
        val tgt = TranslateLanguage.fromLanguageTag(targetLang)
        if (src == null || tgt == null) {
            promise.reject("UNSUPPORTED_LANGUAGE", "Unsupported language pair: $sourceLang -> $targetLang")
            return
        }
        val opts = TranslatorOptions.Builder()
            .setSourceLanguage(src)
            .setTargetLanguage(tgt)
            .build()
        val translator = Translation.getClient(opts)
        val conditions = DownloadConditions.Builder().requireWifi().build()
        translator.downloadModelIfNeeded(conditions)
            .continueWithTask { translator.translate(text) }
            .addOnSuccessListener { translated ->
                promise.resolve(translated)
                translator.close()
            }
            .addOnFailureListener {
                promise.reject("TRANSLATE_ERROR", it.message, it)
                translator.close()
            }
    }

    // ---- Speech ----

    override fun transcribeAudioFile(filePath: String, options: ReadableMap, promise: Promise) {
        if (!SpeechRecognizer.isRecognitionAvailable(reactContext)) {
            promise.reject("SPEECH_UNAVAILABLE", "SpeechRecognizer is not available on this device")
            return
        }
        val locale = options.takeIf { it.hasKey("locale") }?.getString("locale") ?: "en-US"
        val mainHandler = android.os.Handler(reactContext.mainLooper)
        mainHandler.post {
            val recognizer = SpeechRecognizer.createSpeechRecognizer(reactContext)
            val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
                putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
                putExtra(RecognizerIntent.EXTRA_LANGUAGE, locale)
                putExtra(RecognizerIntent.EXTRA_PREFER_OFFLINE, true)
                putExtra(RecognizerIntent.EXTRA_AUDIO_SOURCE, android.media.MediaRecorder.AudioSource.DEFAULT)
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                    putExtra("android.speech.extra.ENABLE_FORMATTING", "quality")
                }
            }
            var resolved = false
            recognizer.setRecognitionListener(object : RecognitionListener {
                override fun onReadyForSpeech(p0: Bundle?) {}
                override fun onBeginningOfSpeech() {}
                override fun onRmsChanged(p0: Float) {}
                override fun onBufferReceived(p0: ByteArray?) {}
                override fun onEndOfSpeech() {}
                override fun onError(error: Int) {
                    if (resolved) return
                    resolved = true
                    promise.reject("SPEECH_ERROR", "SpeechRecognizer error code $error")
                    recognizer.destroy()
                }
                override fun onResults(results: Bundle?) {
                    if (resolved) return
                    resolved = true
                    val matches = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                    val scores = results?.getFloatArray(SpeechRecognizer.CONFIDENCE_SCORES)
                    val text = matches?.firstOrNull() ?: ""
                    val confidence = scores?.firstOrNull()?.toDouble() ?: 0.0
                    val out = Arguments.createMap().apply {
                        putString("text", text)
                        putDouble("confidence", confidence)
                        putString("locale", locale)
                    }
                    promise.resolve(out)
                    recognizer.destroy()
                }
                override fun onPartialResults(p0: Bundle?) {}
                override fun onEvent(p0: Int, p1: Bundle?) {}
            })
            try {
                // Note: SpeechRecognizer microphone-only by default. File transcription requires
                // EXTRA_AUDIO_SOURCE_CHANNEL_COUNT and similar on API 33+, but is OEM-dependent.
                // For now this method captures from microphone if no file source is wired up by OEM.
                recognizer.startListening(intent)
            } catch (e: Exception) {
                if (!resolved) {
                    resolved = true
                    promise.reject("SPEECH_START_ERROR", e.message, e)
                }
            }
        }
    }

    // ---- Embeddings ----

    override fun embedText(text: String, promise: Promise) {
        promise.reject(
            "UNSUPPORTED_PLATFORM",
            "Contextual text embeddings are not exposed by ML Kit on Android. " +
                "Use a custom TFLite/LiteRT model if you need embeddings on Android."
        )
    }

    // ---- Generative: prompt ----

    override fun generateText(prompt: String, options: ReadableMap, promise: Promise) {
        try {
            val maxTokens = if (options.hasKey("maxOutputTokens")) options.getInt("maxOutputTokens") else 512
            val temperature = if (options.hasKey("temperature")) options.getDouble("temperature").toFloat() else 0.7f

            val model: GenerativeModel = PromptApi.getClient(reactContext)
            model.checkFeatureStatus()
                .addOnSuccessListener {
                    model.prepareInferenceEngine()
                        .addOnSuccessListener {
                            val request = PromptRequest.builder(prompt)
                                .setMaxOutputTokens(maxTokens)
                                .setTemperature(temperature)
                                .build()
                            model.runInference(request)
                                .addOnSuccessListener { res ->
                                    promise.resolve(res.text ?: "")
                                    model.close()
                                }
                                .addOnFailureListener {
                                    promise.reject("GENERATE_INFERENCE_ERROR", it.message, it)
                                    model.close()
                                }
                        }
                        .addOnFailureListener {
                            promise.reject("GENERATE_PREPARE_ERROR", it.message, it)
                            model.close()
                        }
                }
                .addOnFailureListener {
                    promise.reject(
                        "FEATURE_UNAVAILABLE",
                        "ML Kit GenAI Prompt API is not available on this device. ${it.message}",
                        it
                    )
                    model.close()
                }
        } catch (e: Throwable) {
            promise.reject("FEATURE_UNAVAILABLE", "ML Kit GenAI Prompt API is not installed in this build", e)
        }
    }

    // ---- Vision (extras) ----

    override fun scanBarcodes(imageBase64: String, promise: Promise) {
        try {
            val bytes = Base64.decode(imageBase64, Base64.DEFAULT)
            val bitmap = BitmapFactory.decodeByteArray(bytes, 0, bytes.size)
                ?: return promise.reject("INVALID_IMAGE", "Failed to decode image")
            val image = InputImage.fromBitmap(bitmap, 0)
            val opts = BarcodeScannerOptions.Builder()
                .setBarcodeFormats(Barcode.FORMAT_ALL_FORMATS)
                .build()
            BarcodeScanning.getClient(opts).process(image)
                .addOnSuccessListener { barcodes ->
                    val arr = Arguments.createArray()
                    barcodes.forEach { b ->
                        arr.pushMap(Arguments.createMap().apply {
                            putString("rawValue", b.rawValue ?: "")
                            putString("format", barcodeFormatName(b.format))
                            val box = b.boundingBox
                            putMap("bounds", Arguments.createMap().apply {
                                putDouble("x", box?.left?.toDouble() ?: 0.0)
                                putDouble("y", box?.top?.toDouble() ?: 0.0)
                                putDouble("width", box?.width()?.toDouble() ?: 0.0)
                                putDouble("height", box?.height()?.toDouble() ?: 0.0)
                            })
                        })
                    }
                    promise.resolve(arr)
                }
                .addOnFailureListener { promise.reject("BARCODE_ERROR", it.message, it) }
        } catch (e: Exception) {
            promise.reject("BARCODE_ERROR", e.message, e)
        }
    }

    private fun barcodeFormatName(format: Int): String = when (format) {
        Barcode.FORMAT_QR_CODE -> "qrcode"
        Barcode.FORMAT_EAN_13 -> "ean13"
        Barcode.FORMAT_EAN_8 -> "ean8"
        Barcode.FORMAT_UPC_A -> "upca"
        Barcode.FORMAT_UPC_E -> "upce"
        Barcode.FORMAT_CODE_39 -> "code39"
        Barcode.FORMAT_CODE_93 -> "code93"
        Barcode.FORMAT_CODE_128 -> "code128"
        Barcode.FORMAT_PDF417 -> "pdf417"
        Barcode.FORMAT_DATA_MATRIX -> "datamatrix"
        Barcode.FORMAT_AZTEC -> "aztec"
        Barcode.FORMAT_ITF -> "itf"
        Barcode.FORMAT_CODABAR -> "codabar"
        else -> "unknown"
    }

    override fun labelImage(imageBase64: String, promise: Promise) {
        try {
            val bytes = Base64.decode(imageBase64, Base64.DEFAULT)
            val bitmap = BitmapFactory.decodeByteArray(bytes, 0, bytes.size)
                ?: return promise.reject("INVALID_IMAGE", "Failed to decode image")
            val image = InputImage.fromBitmap(bitmap, 0)
            ImageLabeling.getClient(ImageLabelerOptions.DEFAULT_OPTIONS).process(image)
                .addOnSuccessListener { labels ->
                    val arr = Arguments.createArray()
                    labels.forEach { lbl ->
                        arr.pushMap(Arguments.createMap().apply {
                            putString("label", lbl.text)
                            putDouble("confidence", lbl.confidence.toDouble())
                        })
                    }
                    promise.resolve(arr)
                }
                .addOnFailureListener { promise.reject("LABEL_ERROR", it.message, it) }
        } catch (e: Exception) {
            promise.reject("LABEL_ERROR", e.message, e)
        }
    }

    override fun describeImage(imageBase64: String, promise: Promise) {
        try {
            val bytes = Base64.decode(imageBase64, Base64.DEFAULT)
            val bitmap = BitmapFactory.decodeByteArray(bytes, 0, bytes.size)
                ?: return promise.reject("INVALID_IMAGE", "Failed to decode image")

            val opts = ImageDescriberOptions.builder(reactContext).build()
            val describer: ImageDescriber = ImageDescription.getClient(opts)
            describer.checkFeatureStatus()
                .addOnSuccessListener {
                    describer.prepareInferenceEngine()
                        .addOnSuccessListener {
                            val request = ImageDescriptionRequest.builder(bitmap).build()
                            describer.runInference(request)
                                .addOnSuccessListener { res ->
                                    promise.resolve(res.description ?: "")
                                    describer.close()
                                }
                                .addOnFailureListener {
                                    promise.reject("DESCRIBE_INFERENCE_ERROR", it.message, it)
                                    describer.close()
                                }
                        }
                        .addOnFailureListener {
                            promise.reject("DESCRIBE_PREPARE_ERROR", it.message, it)
                            describer.close()
                        }
                }
                .addOnFailureListener {
                    promise.reject(
                        "FEATURE_UNAVAILABLE",
                        "ML Kit GenAI Image Description is not available on this device. ${it.message}",
                        it
                    )
                    describer.close()
                }
        } catch (e: Throwable) {
            promise.reject("FEATURE_UNAVAILABLE", "ML Kit GenAI Image Description is not installed", e)
        }
    }

    override fun segmentPerson(imageBase64: String, promise: Promise) {
        try {
            val bytes = Base64.decode(imageBase64, Base64.DEFAULT)
            val bitmap = BitmapFactory.decodeByteArray(bytes, 0, bytes.size)
                ?: return promise.reject("INVALID_IMAGE", "Failed to decode image")
            val image = InputImage.fromBitmap(bitmap, 0)
            val opts = SelfieSegmenterOptions.Builder()
                .setDetectorMode(SelfieSegmenterOptions.SINGLE_IMAGE_MODE)
                .build()
            SelfieSegmentation.getClient(opts).process(image)
                .addOnSuccessListener { mask ->
                    val w = mask.width
                    val h = mask.height
                    val buffer = mask.buffer
                    val maskBitmap = android.graphics.Bitmap.createBitmap(w, h, android.graphics.Bitmap.Config.ALPHA_8)
                    val pixels = ByteArray(w * h)
                    buffer.rewind()
                    for (i in 0 until w * h) {
                        val confidence = buffer.float
                        pixels[i] = (confidence * 255f).toInt().toByte()
                    }
                    val argb = IntArray(w * h)
                    for (i in 0 until w * h) {
                        val v = pixels[i].toInt() and 0xff
                        argb[i] = (0xff shl 24) or (v shl 16) or (v shl 8) or v
                    }
                    val rgbBitmap = android.graphics.Bitmap.createBitmap(argb, w, h, android.graphics.Bitmap.Config.ARGB_8888)
                    val baos = ByteArrayOutputStream()
                    rgbBitmap.compress(android.graphics.Bitmap.CompressFormat.PNG, 100, baos)
                    val b64 = Base64.encodeToString(baos.toByteArray(), Base64.NO_WRAP)
                    promise.resolve(Arguments.createMap().apply {
                        putString("maskBase64", b64)
                        putInt("width", w)
                        putInt("height", h)
                    })
                }
                .addOnFailureListener { promise.reject("SEGMENT_ERROR", it.message, it) }
        } catch (e: Exception) {
            promise.reject("SEGMENT_ERROR", e.message, e)
        }
    }

    // ---- Privacy ----

    override fun enablePrivateMode(enabled: Boolean) {
        privateMode = enabled
    }

    override fun isPrivateModeEnabled(): Boolean = privateMode
}
