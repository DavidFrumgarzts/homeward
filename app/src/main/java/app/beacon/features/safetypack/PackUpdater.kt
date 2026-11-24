package app.beacon.features.safetypack

import android.content.Context
import android.location.Geocoder
import app.beacon.app.AppServices
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.util.Locale

// Decides WHEN to build a new safety pack: you're online and in a city we don't have a pack for
// (e.g. you just landed). Finds the city from GPS, then asks SafetyPackBuilder (cloud) to build it.
object PackUpdater {
    suspend fun updateIfNeeded(context: Context) = withContext(Dispatchers.IO) {
        if (!AppServices.network.hasInternet()) return@withContext
        val here = AppServices.location.lastKnown() ?: return@withContext
        @Suppress("DEPRECATION") // simple blocking call is fine on the IO thread
        val place = Geocoder(context, Locale.ENGLISH).getFromLocation(here.lat, here.lng, 1)?.firstOrNull() ?: return@withContext
        val city = place.locality ?: place.subAdminArea ?: return@withContext
        val country = place.countryName ?: return@withContext
        val current = AppServices.packStore.load()
        if (AppServices.packStore.hasRealPack() && current.city == city) return@withContext
        runCatching { AppServices.packBuilder.build(city, country, AppServices.USER_NATIONALITY) }
    }
}
