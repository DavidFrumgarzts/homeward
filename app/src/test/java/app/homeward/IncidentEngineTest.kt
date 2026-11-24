package app.homeward

import app.homeward.device.GeoPoint
import app.homeward.features.incident.IncidentDeps
import app.homeward.features.incident.IncidentEffects
import app.homeward.features.incident.IncidentEngine
import app.homeward.features.incident.contracts.ActivationMethod
import app.homeward.features.incident.contracts.IncidentPhase
import app.homeward.features.incident.contracts.LocationFix
import app.homeward.features.safetypack.DemoRioPack
import app.homeward.features.sos.SosMessageWriter
import app.homeward.features.sos.sending.MessageKind
import app.homeward.profile.UserProfile
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.advanceTimeBy
import kotlinx.coroutines.test.runTest
import org.junit.Assert.*
import org.junit.Test

// Runs the whole engine with a fake phone: hold for SOS -> describe -> AI rewrite -> send -> updates -> end.
@OptIn(ExperimentalCoroutinesApi::class)
class IncidentEngineTest {
    private class FakePhone(var aiFails: Boolean = false) : IncidentDeps {
        var clock = 1_000_000L; var fix: LocationFix? = LocationFix(GeoPoint(-22.9095, -43.18421), 999_000, 8f)
        val sent = mutableListOf<Pair<MessageKind, String>>(); var sessions = 0; var aiCalls = 0
        override fun now() = clock
        override fun hour() = 1
        override fun timeText(millis: Long) = "t${millis / 1000}"
        override fun pack() = DemoRioPack.pack
        override fun profile() = UserProfile("Noa")
        override fun lastFix() = fix
        override fun online() = false
        override fun canSendSms() = true
        override fun batteryPercent() = 80
        override fun testMode() = false
        override fun familyLink(incidentId: String): String? = null
        override suspend fun rewrite(profile: UserProfile, description: String): SosMessageWriter.Sentence {
            aiCalls++
            return if (aiFails) SosMessageWriter.Sentence("Noa needs help: $description.", null) else SosMessageWriter.Sentence("Noa says: $description.", true)
        }
        override fun send(incidentId: String, kind: MessageKind, text: String) { sent += kind to text }
        override fun flushOutbox() = Unit
        override fun startSession() { sessions++ }
        override fun stopSession() { sessions-- }
        override fun askSafetyCheck(urgent: Boolean) = Unit
        override fun clearSafetyCheck() = Unit
        override fun dial(number: String) = Unit
    }

    private fun TestScope.engine(phone: FakePhone) = IncidentEngine(backgroundScope, phone)

    @Test fun messageIsUsableAtOnceThenRewrittenAfterAPause() = runTest {
        val phone = FakePhone(); val engine = engine(phone)
        engine.startSos(ActivationMethod.SosButton)
        assertEquals(IncidentPhase.SosActive, engine.view.value.phase); assertEquals(1, phone.sessions)
        assertTrue(engine.view.value.contactMessage.startsWith("Noa needs help.\nLocation: -22.9095, -43.1842 at t999"))

        engine.describe("Being"); engine.describe("Being followed") // typing: one AI call after the pause, not two
        assertTrue(engine.view.value.writingMessage); assertNull(engine.view.value.contactMessageRanOnDevice)
        advanceTimeBy(IncidentEffects.WRITE_PAUSE_MILLIS + 50)
        assertEquals(1, phone.aiCalls)
        assertTrue(engine.view.value.contactMessage.startsWith("Noa says: Being followed.\nLocation:"))
        assertEquals(true, engine.view.value.contactMessageRanOnDevice)
        assertTrue(phone.sent.isEmpty()) // nothing leaves the phone before Send
    }

    @Test fun sendUsesHerNewestLocationAndEndTellsContacts() = runTest {
        val phone = FakePhone(aiFails = true); val engine = engine(phone)
        engine.startSos(ActivationMethod.SosButton, "Lost")
        advanceTimeBy(IncidentEffects.WRITE_PAUSE_MILLIS + 50)
        assertNull("the plain template is not AI", engine.view.value.contactMessageRanOnDevice)
        engine.onLocation(LocationFix(GeoPoint(-22.9120, -43.18421), 1_005_000, 5f))
        engine.send()
        assertEquals(MessageKind.Alert, phone.sent.single().first)
        assertTrue(phone.sent.single().second.contains("Location: -22.9120, -43.1842 at t1005"))
        assertTrue(engine.view.value.alertSent)

        phone.clock += 3 * 60_000
        engine.onLocation(LocationFix(GeoPoint(-22.9150, -43.18421), phone.clock, 5f)) // 330 m on, 3 minutes later
        assertEquals(MessageKind.Update, phone.sent.last().first)

        engine.imOk()
        assertEquals(IncidentPhase.Resolved, engine.view.value.phase)
        assertEquals(MessageKind.Ended, phone.sent.last().first); assertEquals(0, phone.sessions)
    }

    @Test fun herOwnEditIsWhatGetsSent() = runTest {
        val phone = FakePhone(); val engine = engine(phone)
        engine.startSos(ActivationMethod.SosButton, "Lost")
        engine.editMessage("Call me, I'm near the arches")
        advanceTimeBy(IncidentEffects.WRITE_PAUSE_MILLIS + 50)
        engine.send()
        assertEquals("Call me, I'm near the arches", phone.sent.single().second)
    }

    @Test fun cancelBeforeSendingLeavesNothingBehind() = runTest {
        val phone = FakePhone(); val engine = engine(phone)
        engine.startSos(ActivationMethod.SosButton); engine.cancel()
        assertEquals(IncidentPhase.Inactive, engine.view.value.phase); assertEquals(0, phone.sessions); assertTrue(phone.sent.isEmpty())
    }
}
