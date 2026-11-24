package app.beacon.app

import android.content.Context
import app.beacon.contacts.TrustedContactsStore
import app.beacon.device.LocationReader
import app.beacon.device.NetworkChecker
import app.beacon.features.safetyphoto.PhotoOutbox
import app.beacon.features.safetypack.SafetyPackBuilder
import app.beacon.features.safetypack.SafetyPackStore
import app.beacon.features.sos.SosMessageWriter
import app.beacon.features.sos.sending.PushSender
import app.beacon.features.sos.sending.SmsSender
import app.beacon.features.sos.sending.SosDispatcher

// One place that creates the app's shared objects. Screens ask AppServices for what they need,
// so to find "where does X come from?" you only ever look here.
object AppServices {
    private lateinit var appContext: Context
    fun init(context: Context) { appContext = context.applicationContext }

    val contacts by lazy { TrustedContactsStore(appContext) }
    val location by lazy { LocationReader(appContext) }
    val network by lazy { NetworkChecker(appContext) }
    val packStore by lazy { SafetyPackStore(appContext) }
    val packBuilder by lazy { SafetyPackBuilder(packStore) }
    val sosWriter by lazy { SosMessageWriter() }
    val sosDispatcher by lazy { SosDispatcher(network, SmsSender(appContext), PushSender()) }
    val photoOutbox by lazy { PhotoOutbox(appContext) }

    // Demo user name. Replace with a real profile screen later.
    const val USER_NAME = "Noa"
    const val USER_NATIONALITY = "Israeli"
}
