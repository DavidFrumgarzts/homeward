package app.homeward.testmode

import android.content.Context
import app.homeward.features.sos.sending.SmsGateway
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow

// RELEASE BUILDS: there is no test mode. Texts always go through the real SmsSender.
// (Debug builds compile app/src/debug/.../TestMode.kt instead, which can swap in a fake.)
object TestMode {
    const val AVAILABLE = false
    val log: StateFlow<List<String>> = MutableStateFlow(emptyList())

    @Suppress("UNUSED_PARAMETER") fun fakeSms(context: Context): Boolean = false
    @Suppress("UNUSED_PARAMETER") fun smsGateway(context: Context): SmsGateway? = null
}
