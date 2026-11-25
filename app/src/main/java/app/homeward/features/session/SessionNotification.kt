package app.homeward.features.session

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import androidx.core.app.NotificationCompat
import app.homeward.app.MainActivity

// The notification shown while a safety session runs. It is also what shows on the lock screen,
// so the wording is neutral on purpose: "Beacon is on", nothing alarming. Tapping it opens the app.
object SessionNotification {
    const val ID = 41
    private const val CHANNEL = "session"

    fun build(context: Context): Notification {
        val manager = context.getSystemService(NotificationManager::class.java)
        manager.createNotificationChannel(NotificationChannel(CHANNEL, "Beacon is on", NotificationManager.IMPORTANCE_LOW).apply {
            description = "Shown while Beacon is keeping watch during an SOS or a Safe Walk."
        })
        val open = PendingIntent.getActivity(context, 0, Intent(context, MainActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP), PendingIntent.FLAG_IMMUTABLE)
        return NotificationCompat.Builder(context, CHANNEL)
            .setSmallIcon(android.R.drawable.ic_menu_mylocation)
            .setContentTitle("Beacon is on")
            .setContentText("Tap to open.")
            .setOngoing(true)
            .setContentIntent(open)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC) // safe to show on the lock screen: it says nothing private
            .build()
    }
}
