package app.homeward.device

import android.content.Context
import android.net.ConnectivityManager
import android.net.Network

// Calls `onBackOnline` every time the phone gets a connection again.
// Used to send things that were saved while offline (safety photos).
class ConnectivityWatcher(private val context: Context) {
    fun start(onBackOnline: () -> Unit) {
        val cm = context.getSystemService(ConnectivityManager::class.java)
        cm.registerDefaultNetworkCallback(object : ConnectivityManager.NetworkCallback() {
            override fun onAvailable(network: Network) = onBackOnline()
        })
    }
}
