package app.beacon.device

import android.content.Context
import android.net.ConnectivityManager
import android.net.NetworkCapabilities

// Answers one question: does the phone have working internet right now?
// Used to choose push (needs data) vs SMS (works without data) for the SOS.
class NetworkChecker(private val context: Context) {
    fun hasInternet(): Boolean {
        val cm = context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        val caps = cm.getNetworkCapabilities(cm.activeNetwork) ?: return false
        return caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED)
    }
}
