package app.homeward.app

import android.content.Context
import app.homeward.contacts.TrustedContactsStore
import app.homeward.device.BatteryReader
import app.homeward.device.Haptics
import app.homeward.device.LocationReader
import app.homeward.device.LocationUpdates
import app.homeward.device.NetworkChecker
import app.homeward.device.SignalChecker
import app.homeward.features.checkin.LocationSharing
import app.homeward.features.incident.AndroidIncidentDeps
import app.homeward.features.incident.IncidentEngine
import app.homeward.features.onboarding.OnboardingStore
import app.homeward.features.safetyphoto.OutboxSender
import app.homeward.features.safetyphoto.PhotoOutbox
import app.homeward.features.safetypack.SafetyPackBuilder
import app.homeward.features.safetypack.SafetyPackStore
import app.homeward.features.sos.SosMessageWriter
import app.homeward.features.sos.sending.OutboxFlusher
import app.homeward.features.sos.sending.PushSender
import app.homeward.features.sos.sending.SmsGateway
import app.homeward.features.sos.sending.SmsSender
import app.homeward.features.sos.sending.SosDispatcher
import app.homeward.features.sos.sending.SosOutbox
import app.homeward.features.sos.sending.handOff
import app.homeward.profile.UserProfileStore
import app.homeward.testmode.TestMode
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import java.io.File

// One place that creates the app's shared objects. Screens ask AppServices for what they need,
// so to find "where does X come from?" you only ever look here.
object AppServices {
    private lateinit var appContext: Context
    fun init(context: Context) { appContext = context.applicationContext }

    // Lives as long as the app process: an SOS must outlive the screen that started it.
    private val appScope = CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate)

    val contacts by lazy { TrustedContactsStore(appContext) }
    val profile by lazy { UserProfileStore(appContext) }
    val location by lazy { LocationReader(appContext) }
    val locationUpdates by lazy { LocationUpdates(appContext) }
    val haptics by lazy { Haptics(appContext) }
    val network by lazy { NetworkChecker(appContext) }
    val signal by lazy { SignalChecker(appContext) }
    val battery by lazy { BatteryReader(appContext) }
    val packStore by lazy { SafetyPackStore(appContext) }
    val packBuilder by lazy { SafetyPackBuilder(packStore) }
    val sosWriter by lazy { SosMessageWriter() }
    val photoOutbox by lazy { PhotoOutbox(appContext) }
    val onboarding by lazy { OnboardingStore(appContext) }
    val locationSharing by lazy { LocationSharing(appContext) }

    // Texts: the real radio, unless a debug build is in "Test mode: no real SMS" (never in release).
    private val realSms by lazy { SmsSender(appContext) }
    val sms: SmsGateway get() = TestMode.smsGateway(appContext) ?: realSms

    // SOS texts wait in the outbox until the radio has taken them; the flusher reports back to the engine.
    val sosOutbox by lazy { SosOutbox(File(appContext.filesDir, "sos_outbox.json")) }
    private val sosFlusher by lazy {
        OutboxFlusher(sosOutbox, gateway = { sms }, canSend = { signal.canSendSms() }).also { flusher ->
            flusher.onChange = { entry -> incident.onOutboxChange(entry) }
        }
    }
    val sosDispatcher by lazy { SosDispatcher(sosOutbox, sosFlusher, PushSender(), hasInternet = { network.hasInternet() }) }

    // The incident engine: the state machine behind every SOS.
    val incident by lazy { IncidentEngine(appScope, AndroidIncidentDeps(appContext)) }

    val outboxSender by lazy { OutboxSender(photoOutbox, { contacts.all() }, { phone, text -> sms.handOff(phone, text) }) }
}
