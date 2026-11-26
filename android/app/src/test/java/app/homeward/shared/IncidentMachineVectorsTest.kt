package app.homeward.shared

import app.homeward.features.incident.IncidentEffect
import app.homeward.features.incident.IncidentEvent
import app.homeward.features.incident.IncidentReducer
import app.homeward.features.incident.IncidentState
import app.homeward.shared.SharedVectors.read
import app.homeward.shared.SharedVectors.readOrNull
import kotlinx.serialization.json.*
import org.junit.Test

// Runs shared/test-vectors/incident-machine.json: each case starts Inactive, feeds events in order,
// and compares a snapshot of the state and the effects after every step.
class IncidentMachineVectorsTest {
    @Test fun incidentMachine() = SharedVectors.run("incident-machine.json") { _, input ->
        var state = IncidentState()
        JsonArray(input.getValue("steps").jsonArray.map { it.jsonObject }.map { step ->
            val result = IncidentReducer.reduce(state, event(step.getValue("event").jsonObject), step.read("now"))
            state = result.state
            snapshot(state, result.effects)
        })
    }

    private fun event(e: JsonObject): IncidentEvent = when (val type = e.read<String>("type")) {
        "StartSos" -> IncidentEvent.StartSos(e.read("input"))
        "RaiseSafetyCheck" -> IncidentEvent.RaiseSafetyCheck(e.read("input"), e.read("urgent"))
        "AnswerSafetyCheck" -> IncidentEvent.AnswerSafetyCheck(e.read("ok"))
        "Tick" -> IncidentEvent.Tick
        "Describe" -> IncidentEvent.Describe(e.read("text"), e.read("plainMessage"))
        "MessageWritten" -> IncidentEvent.MessageWritten(e.read("forDescription"), e.read("message"), e.readOrNull("ranOnDevice"))
        "EditMessage" -> IncidentEvent.EditMessage(e.read("text"))
        "Send" -> IncidentEvent.Send(e.read("message"))
        "Delivery" -> IncidentEvent.Delivery(e.read("delivery"))
        "UpdateConfirmed" -> IncidentEvent.UpdateConfirmed(e.read("atMillis"))
        "Location" -> IncidentEvent.Location(e.read("fix"))
        "Signal" -> IncidentEvent.Signal(e.read("canSend"))
        "Battery" -> IncidentEvent.Battery(e.read("percent"))
        "ImOk" -> IncidentEvent.ImOk
        "Cancel" -> IncidentEvent.Cancel
        "Reset" -> IncidentEvent.Reset
        else -> error("Unknown event $type")
    }

    private fun snapshot(s: IncidentState, effects: List<IncidentEffect>) = buildJsonObject {
        put("phase", s.phase.name)
        put("effects", JsonArray(effects.map(::effect)))
        put("method", s.input?.method?.name)
        put("userConfirmed", s.input?.userConfirmed)
        put("description", s.description)
        put("situation", s.situation.key)
        put("message", s.message)
        put("messageRanOnDevice", s.messageRanOnDevice)
        put("writing", s.writing)
        put("alertSent", s.alertSent)
        put("deliveries", JsonArray(s.deliveries.map { JsonPrimitive("${it.contactName}:${it.status}") }))
        put("trail", s.trail.size)
        put("pointsHeld", s.pointsHeld)
        put("canSend", s.canSend)
        put("lastSentAtMillis", s.lastSentAtMillis)
        put("lastUpdateConfirmedAtMillis", s.lastUpdateConfirmedAtMillis)
        put("batteryLowSent", s.batteryLowSent)
        put("check", s.check?.let { buildJsonObject { put("urgent", it.urgent); put("deadlineMillis", it.deadlineMillis); put("repeated", it.repeated) } } ?: JsonNull)
        put("endedAtMillis", s.endedAtMillis)
    }

    private fun effect(e: IncidentEffect) = buildJsonObject {
        put("type", e::class.simpleName)
        when (e) {
            is IncidentEffect.WriteMessage -> put("description", e.description)
            is IncidentEffect.SendAlert -> put("message", e.message)
            is IncidentEffect.SendUpdate -> { put("pointsHeld", e.pointsHeld); put("takenAtMillis", e.fix.takenAtMillis) }
            is IncidentEffect.SendBatteryLow -> put("hasFix", e.fix != null)
            is IncidentEffect.AskSafetyCheck -> put("urgent", e.urgent)
            else -> Unit
        }
    }
}
