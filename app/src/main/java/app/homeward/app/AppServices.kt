package app.homeward.app

import android.content.Context
import app.homeward.contacts.TrustedContactsStore
import app.homeward.device.Haptics
import app.homeward.device.LocationReader
import app.homeward.device.LocationUpdates
import app.homeward.device.NetworkChecker
import app.homeward.features.safetyphoto.OutboxSender
import app.homeward.features.safetyphoto.PhotoOutbox
import app.homeward.features.safetypack.SafetyPackBuilder
import app.homeward.features.safetypack.SafetyPackStore
import app.homeward.features.sos.SosMessageWriter
import app.homeward.features.sos.sending.PushSender
import app.homeward.features.sos.sending.SmsSender
import app.homeward.features.sos.sending.SosDispatcher

// One place that creates the app's shared objects. Screens ask AppServices for what they need,
// so to find "where does X come from?" you only ever look here.
object AppServices {
    private lateinit var appContext: Context
    fun init(context: Context) { appContext = context.applicationContext }

    val contacts by lazy { TrustedContactsStore(appContext) }
    val location by lazy { LocationReader(appContext) }
    val locationUpdates by lazy { LocationUpdates(appContext) }
    val haptics by lazy { Haptics(appContext) }
    val network by lazy { NetworkChecker(appContext) }
    val packStore by lazy { SafetyPackStore(appContext) }
    val packBuilder by lazy { SafetyPackBuilder(packStore) }
    val sosWriter by lazy { SosMessageWriter() }
    val sosDispatcher by lazy { SosDispatcher(network, SmsSender(appContext), PushSender()) }
    val photoOutbox by lazy { PhotoOutbox(appContext) }
    val outboxSender by lazy { OutboxSender(photoOutbox, { contacts.all() }, { phone, text -> SmsSender(appContext).send(phone, text) }) }

    // Demo user name. Replace with a real profile screen later.
    const val USER_NAME = "Noa"
    const val USER_NATIONALITY = "Israeli"
}
