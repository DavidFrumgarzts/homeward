package app.homeward.shared

import app.homeward.device.GeoPoint
import app.homeward.device.MapsLink
import app.homeward.features.incident.*
import app.homeward.features.incident.contracts.ContactDelivery
import app.homeward.features.incident.contracts.LocationFix
import app.homeward.features.safeplace.SafePlacePicker
import app.homeward.features.safetymap.ApproachDetector
import app.homeward.features.safetymap.ZoneChecker
import app.homeward.features.safetypack.Phrase
import app.homeward.features.safetypack.SafePlace
import app.homeward.features.safetypack.SafetyZone
import app.homeward.features.safetypack.ZoneLevel
import app.homeward.features.sos.DeliveryWording
import app.homeward.profile.UserProfile
import app.homeward.shared.SharedVectors.read
import app.homeward.shared.SharedVectors.readOrNull
import kotlinx.serialization.json.*
import org.junit.Test

// The shared cases for everything except the state machine (IncidentMachineVectorsTest).
class SharedVectorsTest {
    private fun zone(polygon: List<List<Double>>, from: Int = 0, to: Int = 24) = SafetyZone("z", ZoneLevel.Avoid, polygon, from, to, emptyList())
    private fun text(value: String?): JsonElement = value?.let(::JsonPrimitive) ?: JsonNull

    @Test fun zones() = SharedVectors.run("zones.json") { fn, i ->
        when (fn) {
            "isInside" -> JsonPrimitive(ZoneChecker.isInside(i.read<GeoPoint>("point"), i.read("polygon")))
            "isRiskyAt" -> JsonPrimitive(ZoneChecker.isRiskyAt(zone(emptyList(), i.read("riskyFromHour"), i.read("riskyToHour")), i.read("hour")))
            "distanceToZone" -> JsonPrimitive(ZoneChecker.distanceToZone(i.read("point"), zone(i.read("polygon"))))
            "redZoneAhead" -> text(ZoneChecker.redZoneAhead(i.read("point"), i.read<List<SafetyZone>>("zones"), i.read("hour"), i.read("withinMeters"))?.name)
            else -> error(fn)
        }
    }

    @Test fun placePicker() = SharedVectors.run("place-picker.json") { fn, i ->
        when (fn) {
            "isOpen" -> JsonPrimitive(SafePlacePicker.isOpen(i.read<SafePlace>("place"), i.read("hour")))
            "pick" -> SafePlacePicker.pick(i.read("here"), i.read<List<SafePlace>>("places"), i.read("hour"))
                ?.let { buildJsonObject { put("name", it.place.name); put("meters", it.meters); put("reason", it.reason) } } ?: JsonNull
            else -> error(fn)
        }
    }

    @Test fun approachDetector() = SharedVectors.run("approach-detector.json") { _, i ->
        val detector = ApproachDetector(i.read("warnWithinMeters"), i.read("quietMinutes"))
        val zones = i.read<List<SafetyZone>>("zones")
        JsonArray(i.getValue("steps").jsonArray.map { it.jsonObject }.map { s -> text(detector.update(s.read("point"), zones, s.read("hour"), s.read("nowMillis"))?.name) })
    }

    @Test fun situation() = SharedVectors.run("situation.json") { fn, i ->
        when (fn) {
            "pick" -> JsonPrimitive(SituationPicker.pick(i.read("description")).key)
            "checklist" -> SharedVectors.write(ActionChecklist.stepsFor(Situation.fromKey(i.read("situation"))!!))
            else -> error(fn)
        }
    }

    @Test fun phrasePicker() = SharedVectors.run("phrase-picker.json") { _, i ->
        PhrasePicker.pick(i.read("description"), Situation.fromKey(i.read("situation"))!!, i.read<List<Phrase>>("phrases"))?.let { SharedVectors.write(it) } ?: JsonNull
    }

    @Test fun updateThrottle() = SharedVectors.run("update-throttle.json") { _, i ->
        val decision = UpdateThrottle.decide(i.readOrNull<LocationFix>("lastSentFix"), i.read("lastSentAtMillis"), i.read("fix"), i.read("nowMillis"), i.read("canSend"), i.read("pointsHeld"))
        buildJsonObject {
            when (decision) {
                is UpdateThrottle.Decision.Send -> { put("decision", "send"); put("pointsHeld", decision.pointsHeld) }
                UpdateThrottle.Decision.Hold -> put("decision", "hold")
                UpdateThrottle.Decision.Nothing -> put("decision", "nothing")
            }
        }
    }

    @Test fun messageTemplates() = SharedVectors.run("message-templates.json") { fn, i ->
        val profile = i.readOrNull<UserProfile>("profile") ?: UserProfile()
        val fix = i.readOrNull<LocationFix>("fix"); val fixTime = i.readOrNull<String>("fixTime"); val link = i.readOrNull<String>("familyLink")
        JsonPrimitive(when (fn) {
            "short" -> i.read<GeoPoint>("point").short()
            "mapsLink" -> MapsLink.of(i.read("point"))
            "plainSentence" -> IncidentMessages.plainSentence(profile, i.read("description"))
            "alert" -> IncidentMessages.alert(profile, i.read("sentence"), fix, fixTime, i.read("police"), link)
            "autoAlert" -> IncidentMessages.autoAlert(profile, i.read("checkTime"), fix, fixTime, i.read("reasons"), i.read("police"), link)
            "update" -> IncidentMessages.update(profile, fix!!, fixTime!!, i.read("pointsHeld"))
            "batteryLow" -> IncidentMessages.batteryLow(profile, fix, fixTime)
            "ended" -> IncidentMessages.ended(profile, i.read("time"))
            else -> error(fn)
        })
    }

    @Test fun deliveryWording() = SharedVectors.run("delivery-wording.json") { _, i ->
        val summary = DeliveryWording.summarize(i.read<List<ContactDelivery>>("deliveries"))
        buildJsonObject { put("headline", summary.headline); put("lines", SharedVectors.write(summary.lines)); put("anyDelivered", summary.anyDelivered) }
    }
}
