package app.homeward.device

import java.util.Locale

// A link anyone can tap to see a spot on a map (opens Google Maps or the browser).
// Added to SOS and "I'm OK" texts so family doesn't have to copy coordinates.
// Locale.US keeps the decimal point a dot on every phone; a comma would break the link.
object MapsLink {
    fun of(p: GeoPoint): String = String.format(Locale.US, "https://maps.google.com/?q=%.5f,%.5f", p.lat, p.lng)
}
