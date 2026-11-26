package app.homeward.features.sync

import android.util.Log
import com.google.firebase.Firebase
import com.google.firebase.auth.auth
import com.google.firebase.firestore.SetOptions
import com.google.firebase.firestore.firestore
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow

// The only file that touches Firebase Auth and Firestore.
// Sign-in is anonymous: no account, no email. Firestore keeps writes on the phone while there is no
// connection (offline persistence is on by default on Android) and sends them when it is back.
class FirestoreCloud : IncidentCloud {
    private val state = MutableStateFlow(SyncStatus())
    override val status: StateFlow<SyncStatus> = state

    override fun uid(): String? = Firebase.auth.currentUser?.uid

    override fun signIn() {
        if (Firebase.auth.currentUser != null) return
        Firebase.auth.signInAnonymously().addOnFailureListener { Log.w(TAG, "Anonymous sign-in failed (offline, or not enabled in the console): ${it.message}") }
    }

    override fun set(path: String, data: Map<String, Any?>) {
        state.value = state.value.copy(pending = state.value.pending + 1)
        Firebase.firestore.document(path).set(data, SetOptions.merge())
            .addOnSuccessListener { state.value = state.value.copy(pending = state.value.pending - 1) }
            .addOnFailureListener { state.value = SyncStatus(state.value.pending - 1, refused = true); Log.w(TAG, "Write to $path was refused: ${it.message}") }
    }

    private companion object {
        const val TAG = "FirestoreCloud"
    }
}
