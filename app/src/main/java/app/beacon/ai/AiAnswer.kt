package app.beacon.ai

import android.graphics.Bitmap
import com.google.firebase.ai.GenerativeModel
import com.google.firebase.ai.type.content

// What every AI call returns: the text, and whether it ran on the phone or in the cloud.
// `ranOnDevice` drives the small "on device / cloud" proof we show judges in the demo.
data class AiAnswer(val text: String, val ranOnDevice: Boolean)

// Ask a model a text-only question.
suspend fun GenerativeModel.ask(prompt: String): AiAnswer {
    val response = generateContent(prompt)
    return AiAnswer(response.text.orEmpty().trim(), response.isOnDevice())
}

// Ask a model about a photo (on-device needs a Bitmap, JPEG/PNG source).
suspend fun GenerativeModel.askAboutImage(image: Bitmap, prompt: String): AiAnswer {
    val response = generateContent(content { image(image); text(prompt) })
    return AiAnswer(response.text.orEmpty().trim(), response.isOnDevice())
}

// inferenceSource is ON_DEVICE or IN_CLOUD. Compared as text so it keeps working
// if the enum's package moves between SDK betas.
private fun com.google.firebase.ai.type.GenerateContentResponse.isOnDevice(): Boolean =
    inferenceSource.toString() == "ON_DEVICE"
