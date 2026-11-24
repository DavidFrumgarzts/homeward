package app.beacon.ai

import android.util.Log
// If Android Studio can't find these, use Alt+Enter to auto-import from firebase-ai-ondevice.
import com.google.firebase.ai.ondevice.DownloadStatus
import com.google.firebase.ai.ondevice.FirebaseAIOnDevice
import com.google.firebase.ai.ondevice.OnDeviceModelStatus

// Makes sure Gemini Nano is on the phone BEFORE anyone needs an SOS.
// The SDK does not download it on demand, and with no signal there is no cloud fallback,
// so we call this on first launch (from MainActivity) while the user still has wifi.
object OnDeviceModelSetup {
    private const val TAG = "OnDeviceModelSetup"

    enum class State { Ready, Downloading, NotSupported }

    suspend fun ensureDownloaded(onState: (State) -> Unit) {
        when (FirebaseAIOnDevice.checkStatus()) {
            OnDeviceModelStatus.AVAILABLE -> onState(State.Ready)
            OnDeviceModelStatus.DOWNLOADING -> onState(State.Downloading)
            OnDeviceModelStatus.UNAVAILABLE -> onState(State.NotSupported) // older phone: cloud only
            OnDeviceModelStatus.DOWNLOADABLE -> {
                onState(State.Downloading)
                FirebaseAIOnDevice.download().collect { status ->
                    when (status) {
                        is DownloadStatus.DownloadCompleted -> onState(State.Ready)
                        is DownloadStatus.DownloadFailed -> Log.e(TAG, "Download failed: $status")
                        else -> Unit
                    }
                }
            }
        }
    }
}
