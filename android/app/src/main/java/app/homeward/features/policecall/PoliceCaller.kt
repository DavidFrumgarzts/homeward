package app.homeward.features.policecall

import android.content.Context
import android.content.Intent
import android.net.Uri

// Opens the phone dialer with the LOCAL police number from the safety pack (e.g. 190 in Brazil).
// One tap to call. Android always asks before calling an emergency number, which is what we want.
object PoliceCaller {
    fun dial(context: Context, number: String) {
        context.startActivity(Intent(Intent.ACTION_DIAL, Uri.parse("tel:$number")).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
    }
}
