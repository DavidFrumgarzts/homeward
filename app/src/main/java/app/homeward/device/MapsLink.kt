package app.homeward.device

// A link anyone can tap to see a spot on a map (opens Google Maps or the browser).
// Added to SOS and "I'm OK" texts so family doesn't have to copy coordinates.
object MapsLink {
    fun of(p: GeoPoint): String = "https://maps.google.com/?q=%.5f,%.5f".format(p.lat, p.lng)
}
