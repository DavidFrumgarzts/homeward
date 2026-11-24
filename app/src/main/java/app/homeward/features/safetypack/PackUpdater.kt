package app.homeward.features.safetypack

import android.content.Context
import android.location.Geocoder
import app.homeward.app.AppServices
import app.homeward.features.offlinemap.OfflineMapSaver
import app.homeward.features.osmplaces.PlacesEnricher
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.util.Locale

// Decides WHEN to build a new safety pack: you're online and in a city we don't have a pack for
// (e.g. you just landed). Finds the city from GPS, asks SafetyPackBuilder (cloud) to build it,
// swaps in REAL safe places from OpenStreetMap, and saves the city map. All while there's wifi.
object PackUpdater {
    suspend fun updateIfNeeded(context: Context) = withContext(Dispatchers.IO) {
        if (!AppServices.network.hasInternet()) return@withContext
        val saved = AppServices.packStore.load()
        OfflineMapSaver.saveCityOnce(context, saved) // e.g. the Rio demo pack
        if (!saved.placesFromOsm) AppServices.packStore.save(PlacesEnricher.withOsmPlaces(saved))
        val here = AppServices.location.lastKnown() ?: return@withContext
        @Suppress("DEPRECATION") // simple blocking call is fine on the IO thread
        val place = Geocoder(context, Locale.ENGLISH).getFromLocation(here.lat, here.lng, 1)?.firstOrNull() ?: return@withContext
        val city = place.locality ?: place.subAdminArea ?: return@withContext
        val country = place.countryName ?: return@withContext
        val current = AppServices.packStore.load()
        if (AppServices.packStore.hasRealPack() && current.city == city) return@withContext
        runCatching { AppServices.packBuilder.build(city, country, AppServices.USER_NATIONALITY) }
            .onSuccess { pack ->
                AppServices.packStore.save(PlacesEnricher.withOsmPlaces(pack)) // real places, not AI guesses
                OfflineMapSaver.saveCityOnce(context, pack) // save the map too
            }
    }
}
