package app.homeward.features.incident.contracts

import kotlinx.serialization.Serializable

// How a safety session was started. Saved with every incident, so family and tests can see what raised it.
@Serializable
enum class ActivationMethod { SosButton, Widget, TalkTile, AskBeacon, VoiceShortcut, SafePhrase, SafetyCheckEscalation, SafeWalkMissedArrival }
