package app.homeward.features.sos

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import app.homeward.app.AppServices
import app.homeward.device.MapsLink
import app.homeward.features.sos.sending.SendResult
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

// Holds the SOS flow's state: what she typed -> AI draft -> who it was sent to.
// Screens only read these values and call these functions; all work happens here.
class SosViewModel : ViewModel() {
    var note by mutableStateOf("")
    var draft by mutableStateOf("")
    var isWriting by mutableStateOf(false)
    var results by mutableStateOf<List<SendResult>>(emptyList())

    private val pack get() = AppServices.packStore.load()

    // Tapping a quick pick ("Being followed") adds it to the note.
    fun addQuickPick(text: String) {
        note = if (note.isBlank()) text else "$note, ${text.lowercase()}"
    }

    // On-device AI writes the message. Falls back to a template inside SosMessageWriter.
    fun writeDraft() = viewModelScope.launch {
        isWriting = true
        val here = AppServices.location.lastKnown()
        val written = AppServices.sosWriter.write(AppServices.USER_NAME, note, "${pack.city}", here, pack.police)
        // Add a tappable map link so family can open her exact spot (an SOS always shares location).
        draft = if (here != null) "$written\nMap: ${MapsLink.of(here)}" else written
        isWriting = false
    }

    fun send(onDone: () -> Unit) = viewModelScope.launch {
        results = withContext(Dispatchers.IO) { AppServices.sosDispatcher.sendToAll(AppServices.contacts.all(), draft) }
        onDone()
    }

    val policeNumber: String get() = pack.police
}
