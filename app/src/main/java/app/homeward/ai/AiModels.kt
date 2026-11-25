package app.homeward.ai

import com.google.firebase.Firebase
import com.google.firebase.ai.GenerativeModel
import com.google.firebase.ai.InferenceMode
import com.google.firebase.ai.OnDeviceConfig
import com.google.firebase.ai.ai
import com.google.firebase.ai.type.GenerativeBackend
import com.google.firebase.ai.type.PublicPreviewAPI
import com.google.firebase.ai.type.Tool

// The two AI models the whole app uses. Every AI call in Homeward goes through one of these.
//
// 1. hybrid        -> runs ON THE PHONE (Gemini Nano) when it can, falls back to the cloud.
//                     Used for everything that must work with no signal: SOS message,
//                     reading safety photos, explaining red zones, picking a safe place.
// 2. cloudResearch -> CLOUD ONLY, with Google Search. Used once when you land to build the
//                     country safety pack (numbers, embassy, safe places, zones).
//                     The phone model can't search the web, so this part needs the cloud.
@OptIn(PublicPreviewAPI::class)
object AiModels {
    // Cloud model name. Check the Firebase console's model list if this name is rejected.
    const val CLOUD_MODEL = "gemini-3.5-flash-lite"

    // The cloud goes through the Agent Platform (Vertex AI) Gemini API, billed to the Google Cloud
    // account. The Gemini Developer API (googleAI) stopped answering on the Blaze plan (429: it wants
    // prepaid AI Studio credit). "global" is the only location that has this model.
    private val backend = GenerativeBackend.agentPlatform("global")

    val hybrid: GenerativeModel by lazy {
        Firebase.ai(backend = backend).generativeModel(
            modelName = CLOUD_MODEL,
            onDeviceConfig = OnDeviceConfig(mode = InferenceMode.PREFER_ON_DEVICE, maxOutputTokens = 300),
        )
    }

    val cloudResearch: GenerativeModel by lazy {
        Firebase.ai(backend = backend).generativeModel(
            modelName = CLOUD_MODEL,
            tools = listOf(Tool.googleSearch()),
        )
    }
}
