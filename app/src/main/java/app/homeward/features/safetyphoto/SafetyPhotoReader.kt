package app.homeward.features.safetyphoto

import android.graphics.Bitmap
import app.homeward.ai.AiModels
import app.homeward.ai.askAboutImage

// ON-DEVICE AI: reads a safety photo (taxi plate, car, hostel sign, meeting spot) offline
// and writes one line family can act on, e.g. "Taxi, plate DL 1C 4821, white Maruti".
object SafetyPhotoReader {
    private const val PROMPT =
        "Describe this photo in one line for a safety log. If there is a vehicle, give the plate, " +
            "color and model. If there is a sign, give the name. Only state what is visible. Max 20 words."

    suspend fun read(photo: Bitmap): String =
        runCatching { AiModels.hybrid.askAboutImage(photo, PROMPT).text }.getOrDefault("Photo saved")
}
