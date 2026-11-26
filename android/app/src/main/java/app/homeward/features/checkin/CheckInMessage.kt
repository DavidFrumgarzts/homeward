package app.homeward.features.checkin

import app.homeward.device.GeoPoint
import app.homeward.device.MapsLink

// PURE LOGIC: the calm "I'm OK" text for family. Location is included only if she chose that
// in onboarding (LocationSharing). Tested in CheckInMessageTest.
object CheckInMessage {
    fun build(name: String, city: String, time: String, here: GeoPoint?, shareLocation: Boolean): String {
        val base = "$name is OK · $city · $time"
        return if (shareLocation && here != null) "$base\nWhere: ${MapsLink.of(here)}" else base
    }
}
