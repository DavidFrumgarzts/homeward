package app.homeward.features.checkin

import android.content.Context

// Her choice from onboarding: may "I'm OK" check-ins include where she is?
// (An SOS always includes her location; that's the point of an SOS.) Off by default.
class LocationSharing(context: Context) {
    private val prefs = context.getSharedPreferences("location_sharing", Context.MODE_PRIVATE)
    var onCheckIn: Boolean
        get() = prefs.getBoolean("check_in", false)
        set(v) = prefs.edit().putBoolean("check_in", v).apply()
}
