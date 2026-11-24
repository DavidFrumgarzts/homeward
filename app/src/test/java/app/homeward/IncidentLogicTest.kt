package app.homeward

import app.homeward.device.GeoPoint
import app.homeward.features.incident.*
import app.homeward.features.incident.contracts.ContactDelivery
import app.homeward.features.incident.contracts.DeliveryStatus
import app.homeward.features.incident.contracts.IncidentPhase
import app.homeward.features.incident.contracts.LocationFix
import app.homeward.features.safetypack.DemoRioPack
import app.homeward.features.sos.DeliveryWording
import app.homeward.features.sos.SessionWording
import app.homeward.features.sos.sending.SendChannel
import app.homeward.profile.Pronoun
import app.homeward.profile.UserProfile
import org.junit.Assert.*
import org.junit.Test

// Checks the small pure pieces around the state machine: situation, checklist, phrase, throttle,
// messages, the view mapper and the wording on the sent screen. (The same logic is also run against
// shared/test-vectors/ in SharedVectorsTest.)
class IncidentLogicTest {
    private val pack = DemoRioPack.pack
    private val noa = UserProfile("Noa")
    private val bar = LocationFix(GeoPoint(-22.9095, -43.18421), 1_000, 8f)

    @Test fun situationFromKeyWordsAndUrgentOneWins() {
        assertEquals(Situation.Followed, SituationPicker.pick("Lost and someone is following me"))
        assertEquals(Situation.Vehicle, SituationPicker.pick("In a vehicle"))
        assertEquals(Situation.Other, SituationPicker.pick("Feel unsafe"))
    }

    @Test fun everyChecklistHasThreeToFiveStepsAndNoNumbers() = Situation.entries.forEach { s ->
        val steps = ActionChecklist.stepsFor(s)
        assertTrue(steps.size in 3..5)
        assertFalse("steps must not contain phone numbers", steps.any { step -> step.any(Char::isDigit) })
    }

    @Test fun phraseAlwaysComesFromThePack() {
        val phrase = PhrasePicker.pick("Being followed", Situation.Followed, pack.localPhrases)
        assertEquals("Estou sendo seguida", phrase?.local); assertTrue(phrase in pack.localPhrases)
        assertNull(PhrasePicker.pick("x", Situation.Other, emptyList()))
    }

    @Test fun updatesWaitTwoMinutesThenNeedDistanceOrFiveMinutes() {
        val far = bar.copy(point = GeoPoint(-22.9120, -43.18421))
        assertEquals(UpdateThrottle.Decision.Nothing, UpdateThrottle.decide(bar, 0, far, 119_999, true, 0))
        assertEquals(UpdateThrottle.Decision.Send(0), UpdateThrottle.decide(bar, 0, far, 120_000, true, 0))
        assertEquals(UpdateThrottle.Decision.Nothing, UpdateThrottle.decide(bar, 0, bar, 299_999, true, 0))
        assertEquals(UpdateThrottle.Decision.Send(0), UpdateThrottle.decide(bar, 0, bar, 300_000, true, 0))
        assertEquals(UpdateThrottle.Decision.Hold, UpdateThrottle.decide(bar, 0, far, 300_000, false, 4))
        assertEquals(UpdateThrottle.Decision.Send(4), UpdateThrottle.decide(bar, 0, bar, 300_000, true, 4))
    }

    @Test fun alertCarriesWordsPlaceTimeLinkAndWhatToDo() {
        val text = IncidentMessages.alert(noa, "Noa needs help: being followed.", bar, "1:56 AM", "190")
        assertEquals("Noa needs help: being followed.\nLocation: -22.9095, -43.1842 at 1:56 AM\nMap: https://maps.google.com/?q=-22.90950,-43.18421\nCall Noa now. If there is no answer, call 190 (police).", text)
        assertTrue(IncidentMessages.alert(UserProfile("Noa", Pronoun.She), "x", null, null, "190").contains("Location: unknown (no GPS fix yet).\nCall her now."))
    }

    @Test fun automaticAlertNeverSaysACrimeIsHappening() {
        val text = IncidentMessages.autoAlert(noa, "1:58 AM", bar, "1:55 AM", listOf("left planned route"), "190")
        assertTrue(text.startsWith("Beacon safety check: Noa did not respond to a safety check at 1:58 AM."))
        assertTrue(text.contains("Why Beacon asked: left planned route."))
        listOf("attack", "crime", "danger", "kidnap", "assault").forEach { assertFalse(text.lowercase().contains(it)) }
    }

    @Test fun viewShowsTheThreeCardsFromThePack() {
        val state = IncidentState(phase = IncidentPhase.SosActive, description = "Hurt", situation = Situation.Medical, message = "m", trail = listOf(bar))
        val view = IncidentViewStateMapper.map(state, pack, hour = 1, nowMillis = 2_000)
        assertEquals(ActionChecklist.stepsFor(Situation.Medical), view.forMe)
        assertEquals("192", view.emergencyNumber); assertEquals("ambulance", view.emergencyLabel)
        assertEquals("Hospital Cruz Vermelha", view.suggestedPlace?.place?.name)
        assertEquals("Preciso de um hospital", view.showNearby?.local)
        assertNull("no fix, no suggested place", IncidentViewStateMapper.map(state.copy(trail = emptyList()), pack, 1, 2_000).suggestedPlace)
    }

    @Test fun safetyCheckCountsDownInWholeSeconds() {
        val state = IncidentState(phase = IncidentPhase.SafetyCheckRequested, check = SafetyCheck(urgent = true, deadlineMillis = 30_000))
        assertEquals(30, IncidentViewStateMapper.map(state, pack, 1, 0).safetyCheckSecondsLeft)
        assertEquals(1, IncidentViewStateMapper.map(state, pack, 1, 29_500).safetyCheckSecondsLeft)
        assertEquals(0, IncidentViewStateMapper.map(state, pack, 1, 31_000).safetyCheckSecondsLeft)
    }

    @Test fun knowsIsOnlySaidForDeliveredMessages() {
        fun d(name: String, status: DeliveryStatus) = ContactDelivery(name, SendChannel.Sms, status, 0)
        val sent = DeliveryWording.summarize(listOf(d("Mom", DeliveryStatus.Sent), d("Dad", DeliveryStatus.Sent)))
        assertEquals("Sent to Mom and Dad", sent.headline); assertFalse(sent.anyDelivered)
        val saved = DeliveryWording.summarize(listOf(d("Mom", DeliveryStatus.SavedOnPhone)))
        assertEquals("Saved on your phone", saved.headline); assertEquals(listOf("It sends when you have signal."), saved.lines)
        val mixed = DeliveryWording.summarize(listOf(d("Mom", DeliveryStatus.Delivered), d("Dad", DeliveryStatus.Sent)))
        assertEquals("Mom knows", mixed.headline); assertEquals(listOf("Sent to Dad, waiting for delivery."), mixed.lines); assertTrue(mixed.anyDelivered)
    }

    @Test fun locationLineOnlyClaimsWhatHappened() {
        assertTrue(SessionWording.locationLine(false, null, null, 0).startsWith("No GPS fix yet"))
        assertTrue(SessionWording.locationLine(true, 0, null, 3).startsWith("3 location points saved on your phone"))
        assertTrue(SessionWording.locationLine(true, 0, "1:59 AM", 0).startsWith("Last location update sent at 1:59 AM"))
        assertFalse(SessionWording.locationLine(true, 0, null, 0).contains("sent at"))
    }
}
