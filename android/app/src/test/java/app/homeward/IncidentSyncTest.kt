package app.homeward

import app.homeward.device.GeoPoint
import app.homeward.features.incident.IncidentState
import app.homeward.features.incident.Situation
import app.homeward.features.incident.contracts.ActivationMethod
import app.homeward.features.incident.contracts.IncidentInput
import app.homeward.features.incident.contracts.IncidentPhase
import app.homeward.features.incident.contracts.LocationFix
import app.homeward.features.safetypack.DemoRioPack
import app.homeward.features.sos.sending.MessageKind
import app.homeward.features.sync.FamilyLink
import app.homeward.features.sync.IncidentCloud
import app.homeward.features.sync.IncidentDocs
import app.homeward.features.sync.IncidentSync
import app.homeward.profile.UserProfile
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import org.junit.Assert.*
import org.junit.Test
import java.io.File
import java.util.Random

// Checks the Firestore documents match shared/schema/, and that nothing is written (and no link is
// promised) on a phone that has never signed in.
class IncidentSyncTest {
    private class FakeCloud(var uid: String?) : IncidentCloud {
        val writes = mutableListOf<Pair<String, Map<String, Any?>>>(); var signIns = 0
        override fun uid() = uid
        override fun signIn() { signIns++ }
        override fun set(path: String, data: Map<String, Any?>) { writes += path to data }
        override val status = MutableStateFlow(app.homeward.features.sync.SyncStatus())
    }
    private val fix = LocationFix(GeoPoint(-22.9095, -43.18421), 900, 8f)
    private val state = IncidentState(
        phase = IncidentPhase.SosActive, input = IncidentInput("incident-1", ActivationMethod.SosButton, true, "Being followed", emptyList(), fix, false, 1_000),
        description = "Being followed", situation = Situation.Followed, message = "Noa needs help.", alertSent = true, trail = listOf(fix),
    )
    private fun sync(cloud: FakeCloud) = IncidentSync(cloud, { "trip-1" }, { "a".repeat(32) }, { 500 })
    private fun required(schema: String): List<String> =
        Json.parseToJsonElement(File("../../shared/schema/$schema.schema.json").readText()).jsonObject.getValue("required").jsonArray.map { it.jsonPrimitive.content }

    @Test fun shareIdIs32HexAndTheLinkPointsAtHosting() {
        val id = FamilyLink.newShareId(Random(1))
        assertTrue(Regex("[0-9a-f]{32}").matches(id))
        assertEquals("https://homeward-6999c.web.app/f/$id", FamilyLink.of(id))
        assertNotEquals(id, FamilyLink.newShareId()) // really random by default
    }

    @Test fun documentsHaveEveryFieldTheSchemasRequire() {
        val noa = UserProfile("Noa"); val pack = DemoRioPack.pack
        assertTrue(IncidentDocs.trip("u", noa, pack, 1).keys.containsAll(required("trip")))
        assertTrue(IncidentDocs.share("u", "t", 1).keys.containsAll(required("share")))
        assertTrue(IncidentDocs.incident("u", "t", state, noa, pack, 2, alertSentAtMillis = 2).keys.containsAll(required("incident")))
        assertTrue(IncidentDocs.update("u", MessageKind.Update, fix, 80, 0, 3).keys.containsAll(required("location-update")))
        assertEquals("190", (IncidentDocs.incident("u", "t", state, noa, pack, 2)["emergency"] as Map<*, *>)["police"])
        assertNull("no fix stays no fix", IncidentDocs.update("u", MessageKind.Ended, null, null, 0, 3)["lat"])
    }

    @Test fun anAlertWritesTripShareIncidentAndUpdateInThatOrder() {
        val cloud = FakeCloud("u1")
        sync(cloud).record(MessageKind.Alert, state, fix, 0, 80, UserProfile("Noa"), DemoRioPack.pack, 2_000)
        assertEquals(listOf("trips/trip-1", "shares/${"a".repeat(32)}", "trips/trip-1/incidents/incident-1", "trips/trip-1/incidents/incident-1/updates/2000-alert"), cloud.writes.map { it.first })
        assertEquals(2_000L, cloud.writes[2].second["alertSentAtMillis"])
        assertEquals("u1", cloud.writes[3].second["ownerUid"]); assertEquals("alert", cloud.writes[3].second["kind"])
    }

    @Test fun laterWritesDoNotOverwriteWhenTheAlertWasSent() {
        val cloud = FakeCloud("u1")
        sync(cloud).record(MessageKind.Update, state, fix, 2, 80, UserProfile("Noa"), DemoRioPack.pack, 9_000)
        assertFalse(cloud.writes[2].second.containsKey("alertSentAtMillis"))
        assertEquals(2, cloud.writes[3].second["pointsHeld"])
    }

    @Test fun neverSignedInMeansNoLinkAndNoWrites() {
        val cloud = FakeCloud(uid = null); val sync = sync(cloud)
        assertNull(sync.familyLink())
        sync.record(MessageKind.Alert, state, fix, 0, 80, UserProfile("Noa"), DemoRioPack.pack, 2_000)
        assertTrue(cloud.writes.isEmpty()); assertEquals("it tries to sign in for next time", 1, cloud.signIns)
        cloud.uid = "u1"
        assertEquals("https://homeward-6999c.web.app/f/${"a".repeat(32)}", sync.familyLink())
    }
}
