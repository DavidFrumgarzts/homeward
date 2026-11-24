package app.homeward.device

import android.content.Context
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import java.util.Locale

// Reads text out loud with the phone's own voice (Android text-to-speech). It works with no signal,
// which is why Beacon uses it instead of a cloud voice. `onState(true)` when it starts talking, `false` when it stops.
class Speaker(context: Context) {
    private var ready = false
    private var onState: (Boolean) -> Unit = {}
    private val tts: TextToSpeech = TextToSpeech(context.applicationContext) { status -> ready = status == TextToSpeech.SUCCESS }

    init {
        tts.setOnUtteranceProgressListener(object : UtteranceProgressListener() {
            override fun onStart(id: String?) = onState(true)
            override fun onDone(id: String?) = onState(false)
            @Deprecated("Deprecated in Java") override fun onError(id: String?) = onState(false)
        })
    }

    val isSpeaking: Boolean get() = tts.isSpeaking

    // Returns false if the phone has no voice installed, so the screen can stay quiet instead of failing.
    fun speak(text: String, onState: (Boolean) -> Unit): Boolean {
        if (!ready) return false
        this.onState = onState
        tts.language = Locale.US
        return tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, "beacon") == TextToSpeech.SUCCESS
    }

    fun stop() { tts.stop(); onState(false) }
    fun release() { tts.stop(); tts.shutdown() }
}
