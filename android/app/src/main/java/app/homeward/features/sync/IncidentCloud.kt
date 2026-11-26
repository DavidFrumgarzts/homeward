package app.homeward.features.sync

import kotlinx.coroutines.flow.StateFlow

// The little that IncidentSync needs from the cloud. FirestoreCloud is the real one; tests use a fake.
interface IncidentCloud {
    // The anonymous user's id, or null if this phone has never been able to sign in.
    fun uid(): String?
    // Signs in anonymously if needed. Safe to call any time; does nothing useful while offline.
    fun signIn()
    // Writes (merges) one document. With no connection the write is kept on the phone and synced later.
    fun set(path: String, data: Map<String, Any?>)
    // Whether what contacts see in the browser matches the phone.
    val status: StateFlow<SyncStatus>
}

// `pending` writes are still only on this phone. `refused` means the server turned a write down, so the
// family view is NOT showing this incident properly, whatever else is true.
data class SyncStatus(val pending: Int = 0, val refused: Boolean = false)
