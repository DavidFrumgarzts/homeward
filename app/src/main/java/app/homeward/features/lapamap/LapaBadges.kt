package app.homeward.features.lapamap

import app.homeward.features.safetypack.SafePlace

// PURE LOGIC: where the drawn badges sit on the Lapa map's grid, and which badge stands for a saved place.
// The drawing isn't to scale, so a recommended police station or hospital is ringed on its badge, not at its GPS spot.
// Tested in LapaBadgesTest.
object LapaBadges {
    val POLICE = LapaMapProjection.Spot(249f, 298f)
    val HOSPITAL = LapaMapProjection.Spot(63f, 318f)

    fun spotFor(place: SafePlace): LapaMapProjection.Spot? = when (place.kind.lowercase()) {
        "police" -> POLICE
        "hospital" -> HOSPITAL
        else -> null
    }
}
